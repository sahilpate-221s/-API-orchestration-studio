import axios, { AxiosRequestConfig } from 'axios'
import FormData from 'form-data'
import { Job } from 'bullmq'
import { io } from '../socket'

import {
  IFlowNode, IFlowEdge, FieldMapping,
  AuthConfig, QueryParam, BodyType,
  IConditionData, ConditionOperator, INodeData
} from '../types'
import { WorkflowJobData } from '../types/jobs'
import { getCachedResult, setCachedResult, hashNode } from './executionCache'
import { extractValue } from '../utils/jsonpath'
import Execution, { NodeExecutionResult } from '../models/Execution'

function getParallelExecutionLevels(
  nodes: IFlowNode[],
  edges: IFlowEdge[]
): IFlowNode[][] {
  const inDegree: Record<string, number> = {}
  const adjacency: Record<string, string[]> = {}

  for (const node of nodes) {
    inDegree[node.id] = 0
    adjacency[node.id] = []
  }

  for (const edge of edges) {
    if (adjacency[edge.source]) {
      adjacency[edge.source].push(edge.target)
    }
    if (edge.target in inDegree) {
      inDegree[edge.target] = (inDegree[edge.target] ?? 0) + 1
    }
  }

  const levels: IFlowNode[][] = []
  const visited = new Set<string>()
  let currentLevel = nodes.filter((n) => inDegree[n.id] === 0)

  while (currentLevel.length > 0) {
    levels.push(currentLevel)
    for (const n of currentLevel) visited.add(n.id)

    const nextLevel: IFlowNode[] = []
    for (const node of currentLevel) {
      for (const neighborId of (adjacency[node.id] ?? [])) {
        if (inDegree[neighborId] !== undefined) {
          inDegree[neighborId]--
          if (inDegree[neighborId] === 0 && !visited.has(neighborId)) {
            const neighbor = nodes.find((n) => n.id === neighborId)
            if (neighbor && !nextLevel.some((n) => n.id === neighbor.id)) {
              nextLevel.push(neighbor)
            }
          }
        }
      }
    }
    currentLevel = nextLevel
  }

  // Pick up any leftover/unvisited nodes (e.g. if cycle exists or inDegree didn't reach 0)
  const unvisited = nodes.filter((n) => !visited.has(n.id))
  if (unvisited.length > 0) {
    levels.push(unvisited)
  }

  return levels
}

function buildUrlWithParams(
  baseUrl: string,
  queryParams: QueryParam[],
  authConfig?: AuthConfig
): string {
  const allParams = [...queryParams.filter((p) => p.enabled && p.key)]

  // API key in query string
  if (authConfig?.type === 'apikey' && authConfig.apiKeyIn === 'query') {
    allParams.push({
      id: 'auth',
      key: authConfig.apiKeyName ?? 'apikey',
      value: authConfig.apiKeyValue ?? '',
      enabled: true,
    })
  }

  if (!allParams.length) return baseUrl

  const qs = allParams
    .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join('&')

  return baseUrl.includes('?') ? `${baseUrl}&${qs}` : `${baseUrl}?${qs}`
}

function buildHeaders(
  baseHeaders: Record<string, string>,
  authConfig?: AuthConfig
): Record<string, string> {
  const headers = { ...baseHeaders }

  if (authConfig?.type === 'bearer' && authConfig.token) {
    headers['Authorization'] = `Bearer ${authConfig.token}`
  }

  if (authConfig?.type === 'basic' && authConfig.username) {
    const encoded = Buffer.from(`${authConfig.username}:${authConfig.password ?? ''}`).toString('base64')
    headers['Authorization'] = `Basic ${encoded}`
  }

  if (authConfig?.type === 'apikey' && authConfig.apiKeyIn === 'header' && authConfig.apiKeyName) {
    headers[authConfig.apiKeyName] = authConfig.apiKeyValue ?? ''
  }

  return headers
}

function resolveFieldMappings(
  node: IFlowNode,
  results: Record<string, unknown>
): { url: string; headers: Record<string, string>; body: string | undefined } {
  const data = node.data as INodeData
  let url = data.url
  let headers = { ...(data.headers ?? {}) }
  let body = data.body

  const mappings: FieldMapping[] = data.fieldMappings ?? []

  for (const mapping of mappings) {
    const sourceData = results[mapping.sourceNodeId]
    if (!sourceData) continue

    const value = extractValue(sourceData, mapping.sourcePath)
    if (value === undefined) continue

    if (mapping.targetField === 'header' && mapping.targetKey) {
      headers[mapping.targetKey] = String(value)
    }

    if (mapping.targetField === 'body' && mapping.targetPath && body) {
      try {
        const parsed = JSON.parse(body)
        const keys = mapping.targetPath.split('.')
        let obj = parsed
        for (let i = 0; i < keys.length - 1; i++) {
          obj = obj[keys[i]] ??= {}
        }
        obj[keys[keys.length - 1]] = value
        body = JSON.stringify(parsed)
      } catch { }
    }
  }

  return { url, headers, body }
}

async function buildRequestConfig(
  node: IFlowNode,
  resolvedUrl: string,
  resolvedHeaders: Record<string, string>,
  resolvedBody: string | undefined
): Promise<AxiosRequestConfig> {
  const nodeData = node.data as INodeData
  const { method, bodyType, formFields, fileData, authConfig, queryParams } = nodeData

  const finalUrl = buildUrlWithParams(resolvedUrl, queryParams ?? [], authConfig)
  const finalHeaders = buildHeaders(resolvedHeaders, authConfig)

  let data: unknown = undefined
  let extraHeaders: Record<string, string> = {}

  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    if (bodyType === 'json' && resolvedBody) {
      try {
        data = JSON.parse(resolvedBody)
        finalHeaders['Content-Type'] = 'application/json'
      } catch {
        data = resolvedBody
      }
    }

    if (bodyType === 'formdata' && formFields?.length) {
      const form = new FormData()
      for (const field of formFields) {
        if (field.key) form.append(field.key, field.value)
      }
      data = form
      extraHeaders = form.getHeaders()
    }

    if (bodyType === 'file' && fileData) {
      const form = new FormData()
      const buffer = Buffer.from(fileData.base64, 'base64')
      form.append('file', buffer, {
        filename: fileData.name,
        contentType: fileData.mimeType,
      })
      data = form
      extraHeaders = form.getHeaders()
    }
  }

  return {
    method: method.toLowerCase(),
    url: finalUrl,
    headers: { ...finalHeaders, ...extraHeaders },
    data,
    timeout: 15000,
    // Allow localhost
    proxy: false,
  }
}

async function executeNode(
  node: IFlowNode,
  results: Record<string, unknown>,
  workflowId: string,
  maxRetries: number = 2
): Promise<NodeExecutionResult> {
  const startedAt = new Date()
  let retryCount = 0

  const { url, headers, body } = resolveFieldMappings(node, results)

  if (!url) {
    const result: NodeExecutionResult = {
      nodeId: node.id,
      nodeLabel: node.data.label,
      status: 'error',
      error: 'URL is empty',
      executionTime: 0,
      fromCache: false,
      retryCount: 0,
      startedAt,
      completedAt: new Date(),
    }
    io.to(workflowId).emit('node_update', {
      nodeId: node.id,
      status: 'error',
      error: 'URL is empty',
      executionTime: 0,
      statusCode: 0,
    })
    return result
  }

  // Check cache
  const data = node.data as INodeData
  const hash = hashNode({
    url,
    method: data.method,
    headers,
    body,
  })

  const cached = await getCachedResult(hash)
  if (cached) {
    results[node.id] = cached
    const result: NodeExecutionResult = {
      nodeId: node.id,
      nodeLabel: node.data.label,
      status: 'success',
      response: cached,
      executionTime: 0,
      fromCache: true,
      retryCount: 0,
      startedAt,
      completedAt: new Date(),
    }
    io.to(workflowId).emit('node_update', {
      nodeId: node.id,
      status: 'success',
      response: cached,
      executionTime: 0,
      fromCache: true,
      statusCode: 200,
    })
    return result
  }

  // Retry loop
  while (retryCount <= maxRetries) {
    io.to(workflowId).emit('node_update', {
      nodeId: node.id,
      status: 'running',
      retryCount,
    })

    const start = Date.now()

    try {
      const config = await buildRequestConfig(node, url, headers, body)
      const response = await axios(config)

      const executionTime = Date.now() - start
      results[node.id] = response.data

      await setCachedResult(hash, response.data)

      const result: NodeExecutionResult = {
        nodeId: node.id,
        nodeLabel: node.data.label,
        status: 'success',
        response: response.data,
        executionTime,
        fromCache: false,
        retryCount,
        startedAt,
        completedAt: new Date(),
      }

      io.to(workflowId).emit('node_update', {
        nodeId: node.id,
        status: 'success',
        response: response.data,
        executionTime,
        fromCache: false,
        statusCode: response.status,
        statusText: response.statusText,
        responseHeaders: response.headers as Record<string, string>,
        retryCount,
      })

      return result

    } catch (err: unknown) {
      const executionTime = Date.now() - start
      retryCount++

      let message = 'Unknown error'
      let statusCode = 0
      let statusText = ''
      let responseHeaders: Record<string, string> = {}

      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message ?? err.response?.data?.error ?? err.message
        statusCode = err.response?.status ?? 0
        statusText = err.response?.statusText ?? ''
        responseHeaders = (err.response?.headers ?? {}) as Record<string, string>
      }

      if (retryCount > maxRetries) {
        const result: NodeExecutionResult = {
          nodeId: node.id,
          nodeLabel: node.data.label,
          status: 'error',
          error: message,
          executionTime,
          fromCache: false,
          retryCount: retryCount - 1,
          startedAt,
          completedAt: new Date(),
        }

        io.to(workflowId).emit('node_update', {
          nodeId: node.id,
          status: 'error',
          error: message,
          executionTime,
          statusCode,
          statusText,
          responseHeaders,
          retryCount: retryCount - 1,
        })

        return result
      }

      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 1000
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  return {
    nodeId: node.id,
    nodeLabel: node.data.label,
    status: 'error',
    error: 'Max retries exceeded',
    executionTime: 0,
    fromCache: false,
    retryCount,
    startedAt,
    completedAt: new Date(),
  }
}

function evaluateCondition(
  data: IConditionData,
  results: Record<string, unknown>,
  edges: IFlowEdge[],
  conditionNodeId: string
): boolean {
  const { sourcePath, operator, compareValue, sourceNodeId } = data

  // Get the source data — if sourceNodeId is set, use it directly.
  // Otherwise, find the upstream node by walking edges backward from this condition node.
  let sourceData: unknown
  if (sourceNodeId && sourceNodeId.trim() !== '') {
    sourceData = results[sourceNodeId]
  } else {
    // Find nodes that connect INTO this condition node (target === conditionNodeId)
    const incomingEdges = edges.filter(e => e.target === conditionNodeId)
    for (const edge of incomingEdges) {
      if (results[edge.source] !== undefined) {
        sourceData = results[edge.source]
        break
      }
    }
  }

  if (sourceData === undefined) return false

  // Extract value using JSONPath
  const extracted = extractValue(sourceData, sourcePath)

  // Handle exists/not_exists
  if (operator === 'exists') return extracted !== undefined && extracted !== null
  if (operator === 'not_exists') return extracted === undefined || extracted === null
  if (extracted === undefined) return false

  const actual = extracted
  // Auto-convert compareValue type
  let expected: unknown = compareValue
  if (compareValue === 'true') expected = true
  else if (compareValue === 'false') expected = false
  else if (!isNaN(Number(compareValue)) && compareValue !== '') expected = Number(compareValue)

  switch (operator) {
    case 'eq':  return actual == expected
    case 'neq': return actual != expected
    case 'gt':  return Number(actual) > Number(expected)
    case 'gte': return Number(actual) >= Number(expected)
    case 'lt':  return Number(actual) < Number(expected)
    case 'lte': return Number(actual) <= Number(expected)
    case 'contains':
      return String(actual).toLowerCase().includes(String(expected).toLowerCase())
    case 'not_contains':
      return !String(actual).toLowerCase().includes(String(expected).toLowerCase())
    default: return false
  }
}

function getAllDescendants(
  startIds: string[],
  edges: IFlowEdge[],
  nodes: IFlowNode[]
): Set<string> {
  const result = new Set<string>()
  const queue = [...startIds]

  while (queue.length > 0) {
    const id = queue.shift()!
    if (result.has(id)) continue
    result.add(id)
    const children = edges.filter(e => e.source === id).map(e => e.target)
    queue.push(...children)
  }

  return result
}

export async function executeWorkflowJob(job: Job<WorkflowJobData>): Promise<void> {
  const { workflowId, userId, nodes, edges, executionId } = job.data
  const startTime = Date.now()
  const results: Record<string, unknown> = {}
  const allNodeResults: NodeExecutionResult[] = []
  let overallStatus: 'success' | 'error' = 'success'

  await Execution.findOneAndUpdate(
    { executionId },
    { status: 'running', jobId: job.id }
  )

  io.to(workflowId).emit('execution_start', { workflowId, executionId })

  try {
    const levels = getParallelExecutionLevels(nodes, edges)

    // Track which nodes are "active" (should execute based on conditions)
    const activeNodeIds = new Set<string>(nodes.map(n => n.id))
    // Track condition results: nodeId → true/false
    const conditionResults: Record<string, boolean> = {}

    for (const level of levels) {
      // Filter out nodes deactivated by conditions
      const activeLevel = level.filter(n => activeNodeIds.has(n.id))
      const inactiveLevel = level.filter(n => !activeNodeIds.has(n.id))

      // Emit skipped status for inactive nodes so frontend doesn't hang
      for (const node of inactiveLevel) {
        io.to(workflowId).emit('node_update', {
          nodeId: node.id,
          status: 'idle',
          executionTime: 0,
        })
      }

      const levelResults = await Promise.all(
        activeLevel.map(async (node) => {
          try {
            // Handle condition node
            if (node.type === 'conditionNode') {
              const condData = node.data as IConditionData
              const result = evaluateCondition(condData, results, edges, node.id)
              conditionResults[node.id] = result

              // Emit condition result to frontend
              io.to(workflowId).emit('node_update', {
                nodeId: node.id,
                status: 'success',
                executionTime: 0,
                conditionResult: result,
                conditionLabel: result ? (condData.trueLabel || 'YES') : (condData.falseLabel || 'NO'),
              })

              // Deactivate nodes on the wrong branch
              const trueEdges = edges.filter(e => e.source === node.id && (e.sourceHandle === 'true' || !e.sourceHandle))
              const falseEdges = edges.filter(e => e.source === node.id && e.sourceHandle === 'false')

              if (result) {
                // Condition is TRUE — deactivate false branch descendants
                const toDeactivate = getAllDescendants(falseEdges.map(e => e.target), edges, nodes)
                toDeactivate.forEach(id => activeNodeIds.delete(id))
              } else {
                // Condition is FALSE — deactivate true branch descendants
                const toDeactivate = getAllDescendants(trueEdges.map(e => e.target), edges, nodes)
                toDeactivate.forEach(id => activeNodeIds.delete(id))
              }

              return {
                nodeId: node.id,
                nodeLabel: condData.label,
                status: 'success' as const,
                executionTime: 0,
                fromCache: false,
                retryCount: 0,
                startedAt: new Date(),
                completedAt: new Date(),
              }
            }

            // Regular API node
            return await executeNode(node as any, results, workflowId, 2)
          } catch (nodeErr: any) {
            console.error(`[Execution] Error on node ${node.id}:`, nodeErr)
            io.to(workflowId).emit('node_update', {
              nodeId: node.id,
              status: 'error',
              error: nodeErr?.message || 'Node execution failed',
              executionTime: 0,
            })
            return {
              nodeId: node.id,
              nodeLabel: node.data?.label || 'Node',
              status: 'error' as const,
              error: nodeErr?.message || 'Node execution failed',
              executionTime: 0,
              fromCache: false,
              retryCount: 0,
              startedAt: new Date(),
              completedAt: new Date(),
            }
          }
        })
      )

      for (const result of levelResults) {
        allNodeResults.push(result)
        if (result.status === 'error') overallStatus = 'error'
      }
    }

    const totalTime = Date.now() - startTime

    await Execution.findOneAndUpdate(
      { executionId },
      { status: overallStatus, nodes: allNodeResults, totalTime, completedAt: new Date() }
    )

    io.to(workflowId).emit('execution_complete', {
      workflowId,
      executionId,
      status: overallStatus,
      totalTime,
    })

  } catch (err: any) {
    console.error(`[Execution] Fatal error in job ${executionId}:`, err)
    const totalTime = Date.now() - startTime

    await Execution.findOneAndUpdate(
      { executionId },
      { status: 'error', nodes: allNodeResults, totalTime, completedAt: new Date() }
    ).catch(() => {})

    io.to(workflowId).emit('execution_error', {
      message: err?.message || 'Workflow execution failed',
    })

    io.to(workflowId).emit('execution_complete', {
      workflowId,
      executionId,
      status: 'error',
      totalTime,
    })
  }
}
