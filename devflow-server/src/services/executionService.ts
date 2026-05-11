import axios from 'axios'
import { Job } from 'bullmq'
import { v4 as uuidv4 } from 'uuid'

import { io } from '../socket'
import { IFlowNode, IFlowEdge, FieldMapping } from '../types'
import { checkRateLimit } from './rateLimiter'
import { getCachedResult, setCachedResult, hashNode } from './executionCache'
import { extractValue, resolveTemplate } from '../utils/jsonpath'
import { WorkflowJobData, JobProgress } from '../types/jobs'
import Execution, { NodeExecutionResult } from '../models/Execution'


function getExecutionOrder(nodes: IFlowNode[], edges: IFlowEdge[]): IFlowNode[] {
  const nodeIds = new Set(nodes.map((node) => node.id))
  const inDegree: Record<string, number> = {}
  const adjacency: Record<string, string[]> = {}

  for (const node of nodes) {
    inDegree[node.id] = 0
    adjacency[node.id] = []
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue
    adjacency[edge.source].push(edge.target)
    inDegree[edge.target] = (inDegree[edge.target] ?? 0) + 1
  }

  const queue = nodes.filter((n) => inDegree[n.id] === 0)
  const result: IFlowNode[] = []

  while (queue.length > 0) {
    const node = queue.shift()!
    result.push(node)
    for (const neighborId of adjacency[node.id]) {
      inDegree[neighborId]--
      if (inDegree[neighborId] === 0) {
        const neighbor = nodes.find((n) => n.id === neighborId)
        if (neighbor) queue.push(neighbor)
      }
    }
  }

  return result
}

// Topological sort returning levels for parallel execution
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
    adjacency[edge.source].push(edge.target)
    inDegree[edge.target] = (inDegree[edge.target] ?? 0) + 1
  }

  const levels: IFlowNode[][] = []
  let currentLevel = nodes.filter((n) => inDegree[n.id] === 0)

  while (currentLevel.length > 0) {
    levels.push(currentLevel)
    const nextLevel: IFlowNode[] = []

    for (const node of currentLevel) {
      for (const neighborId of adjacency[node.id]) {
        inDegree[neighborId]--
        if (inDegree[neighborId] === 0) {
          const neighbor = nodes.find((n) => n.id === neighborId)
          if (neighbor) nextLevel.push(neighbor)
        }
      }
    }

    currentLevel = nextLevel
  }

  return levels
}

function getIncomingEdges(nodes: IFlowNode[], edges: IFlowEdge[]): Record<string, string[]> {
  const nodeIds = new Set(nodes.map((node) => node.id))
  const incoming = Object.fromEntries(nodes.map((node) => [node.id, [] as string[]]))

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue
    incoming[edge.target].push(edge.source)
  }

  return incoming
}

function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers)
      .map(([key, value]) => [key.trim(), String(value)])
      .filter(([key]) => key.length > 0)
  )
}

function setNestedValue(target: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.replace(/^\$\.?/, '').split('.').map((key) => key.trim()).filter(Boolean)
  if (!keys.length) return

  let current: Record<string, unknown> = target
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (typeof current[key] !== 'object' || current[key] === null || Array.isArray(current[key])) {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  current[keys[keys.length - 1]] = value
}

function resolveNodeInputs(
  node: IFlowNode,
  results: Record<string, unknown>
): { url: string; headers: Record<string, string>; body: string | undefined } {
  let url = resolveTemplate(node.data.url, results as Record<string, unknown>)
  let headers = { ...(node.data.headers ?? {}) }
  let body = node.data.body

  const mappings: FieldMapping[] = node.data.fieldMappings ?? []

  for (const mapping of mappings) {
    const sourceData = results[mapping.sourceNodeId]
    if (!sourceData) continue

    const value = extractValue(sourceData, mapping.sourcePath)
    if (value === undefined) continue

    if (mapping.targetField === 'url') {
      url = url.includes('{{value}}')
        ? url.split('{{value}}').join(encodeURIComponent(String(value)))
        : resolveTemplate(url, results as Record<string, unknown>)
    }

    if (mapping.targetField === 'header' && mapping.targetKey) {
      headers[mapping.targetKey.trim()] = String(value)
    }

    if (mapping.targetField === 'body' && mapping.targetPath) {
      try {
        const parsed = body?.trim() ? JSON.parse(body) : {}
        setNestedValue(parsed, mapping.targetPath, value)
        body = JSON.stringify(parsed)
      } catch {
        // body wasn't valid JSON — skip
      }
    }
  }

  return { url, headers: sanitizeHeaders(headers), body }
}

async function executeNode(
  node: IFlowNode,
  results: Record<string, unknown>,
  workflowId: string,
  retryConfig: { maxRetries: number; timeout: number }
): Promise<NodeExecutionResult> {
  const { method } = node.data
  const { url, headers, body } = resolveNodeInputs(node, results)
  const startedAt = new Date()
  let retryCount = 0

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
    })
    return result
  }

  const hash = hashNode({ url, method, headers, body })
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
    })
    return result
  }

  // Retry loop
  while (retryCount <= retryConfig.maxRetries) {
    io.to(workflowId).emit('node_update', {
      nodeId: node.id,
      status: 'running',
      retryCount,
    })

    const start = Date.now()

    try {
      const response = await axios({
        method: method.toLowerCase(),
        url,
        headers,
        data: body ? JSON.parse(body) : undefined,
        timeout: retryConfig.timeout,
      })

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
      })

      return result

    } catch (err: unknown) {
      const executionTime = Date.now() - start
      retryCount++

      const message = axios.isAxiosError(err)
        ? err.response?.data?.message ?? err.message
        : 'Unknown error'

      if (retryCount > retryConfig.maxRetries) {
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
          retryCount: retryCount - 1,
        })

        return result
      }

      // Exponential backoff before retry
      const delay = Math.pow(2, retryCount) * 1000
      io.to(workflowId).emit('node_update', {
        nodeId: node.id,
        status: 'running',
        retryCount,
        retryDelay: delay,
      })
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  // Should never reach here
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

export async function executeWorkflow(
  workflowId: string,
  userId: string,
  nodes: IFlowNode[],
  edges: IFlowEdge[]
): Promise<void> {
  const order = getExecutionOrder(nodes, edges)
  if (order.length !== nodes.length) {
    io.to(workflowId).emit('execution_error', {
      message: 'Workflow has a cycle or invalid connection. Remove the loop before running.',
    })
    return
  }

  // Check rate limit first
  const rateLimit = await checkRateLimit(userId)

  if (!rateLimit.allowed) {
    io.to(workflowId).emit('execution_error', {
      message: `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetIn / 60)} minutes.`,
      remaining: rateLimit.remaining,
      resetIn: rateLimit.resetIn,
    })
    return
  }

  // Tell frontend how many executions remain
  io.to(workflowId).emit('execution_start', {
    workflowId,
    remaining: rateLimit.remaining,
  })

  const incoming = getIncomingEdges(nodes, edges)
  const results: Record<string, unknown> = {}
  const nodeStatus: Record<string, 'success' | 'error'> = {}

  for (const node of order) {
    const blockedBy = incoming[node.id].filter((sourceId) => nodeStatus[sourceId] !== 'success')
    if (blockedBy.length > 0) {
      nodeStatus[node.id] = 'error'
      io.to(workflowId).emit('node_update', {
        nodeId: node.id,
        status: 'error',
        error: 'Skipped because an upstream node did not complete successfully',
        executionTime: 0,
      })
      continue
    }

    const resolved = resolveNodeInputs(node, results)
    const url = resolved.url
    const headers = resolved.headers
    const body = resolved.body
    const method = node.data.method

    if (!url) {
      nodeStatus[node.id] = 'error'
      io.to(workflowId).emit('node_update', {
        nodeId: node.id,
        status: 'error',
        error: 'URL is empty',
        executionTime: 0,
      })
      continue
    }

    if (url.includes('{{') || url.includes('}}')) {
      nodeStatus[node.id] = 'error'
      io.to(workflowId).emit('node_update', {
        nodeId: node.id,
        status: 'error',
        error: 'URL contains unresolved template values',
        executionTime: 0,
      })
      continue
    }

    let requestBody: unknown
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        requestBody = JSON.parse(body)
      } catch {
        nodeStatus[node.id] = 'error'
        io.to(workflowId).emit('node_update', {
          nodeId: node.id,
          status: 'error',
          error: 'Request body must be valid JSON',
          executionTime: 0,
        })
        continue
      }
    }

    // Check cache
    const hash = hashNode({ url, method, headers, body })
    const cached = await getCachedResult(hash)

    if (cached !== null) {
      results[node.id] = cached
      nodeStatus[node.id] = 'success'

      io.to(workflowId).emit('node_update', {
        nodeId: node.id,
        status: 'success',
        response: cached,
        executionTime: 0,
        fromCache: true,
      })
      continue
    }

    // Not cached — run the real request
    io.to(workflowId).emit('node_update', {
      nodeId: node.id,
      status: 'running',
    })

    const start = Date.now()

    try {
      const response = await axios({
        method: method.toLowerCase(),
        url,
        headers: headers ?? {},
        data: requestBody,
        timeout: 10000,
      })

      const executionTime = Date.now() - start
      results[node.id] = response.data
      nodeStatus[node.id] = 'success'

      // Cache the result
      await setCachedResult(hash, response.data)

      io.to(workflowId).emit('node_update', {
        nodeId: node.id,
        status: 'success',
        response: response.data,
        executionTime,
        fromCache: false,
      })

    } catch (err: unknown) {
      const executionTime = Date.now() - start
      nodeStatus[node.id] = 'error'
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message ?? err.message
        : 'Unknown error'

      io.to(workflowId).emit('node_update', {
        nodeId: node.id,
        status: 'error',
        error: message,
        executionTime,
      })
    }
  }

  io.to(workflowId).emit('execution_complete', { workflowId })
}

export async function executeWorkflowJob(job: Job<WorkflowJobData>): Promise<void> {
  const { workflowId, userId, nodes, edges, executionId } = job.data
  const startTime = Date.now()

  // Update execution status to running
  await Execution.findOneAndUpdate(
    { executionId },
    { status: 'running', jobId: job.id }
  )

  io.to(workflowId).emit('execution_start', {
    workflowId,
    executionId,
  })

  const levels = getParallelExecutionLevels(nodes, edges)
  const results: Record<string, unknown> = {}
  const allNodeResults: NodeExecutionResult[] = []
  let overallStatus: 'success' | 'error' = 'success'

  for (const level of levels) {
    // Run all nodes in this level in PARALLEL
    const levelResults = await Promise.all(
      level.map((node) =>
        executeNode(node, results, workflowId, {
          maxRetries: 2,
          timeout: 10000,
        })
      )
    )

    for (const result of levelResults) {
      allNodeResults.push(result)
      if (result.status === 'error') overallStatus = 'error'
    }
  }

  const totalTime = Date.now() - startTime

  // Save execution results
  await Execution.findOneAndUpdate(
    { executionId },
    {
      status: overallStatus,
      nodes: allNodeResults,
      totalTime,
      completedAt: new Date(),
    }
  )

  io.to(workflowId).emit('execution_complete', {
    workflowId,
    executionId,
    status: overallStatus,
    totalTime,
  })

}
