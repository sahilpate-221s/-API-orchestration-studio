import { useCallback, useEffect, useState, useRef } from 'react'
import { useFlowStore } from '../store/flowStore'
import { saveWorkflow, createWorkflow } from '../services/workflowService'
import { getSocket } from '../services/socketService'
import api from '../services/api'
import { v4 as uuidv4 } from 'uuid'


export function useExecution() {
  const [remaining, setRemaining] = useState(100)
  const isRunningRef = useRef(false)


  const {
    nodes, edges,
    workflowId, workflowName, workspace,
    updateNodeData, setWorkflowMeta,
  } = useFlowStore()

  useEffect(() => {
    let cancelled = false

    api.get('/execution/usage')
      .then((res) => {
        if (!cancelled && typeof res.data.remaining === 'number') {
          setRemaining(res.data.remaining)
        }
      })
      .catch(() => {
        /* leave the default while offline or unauthenticated */
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!workflowId) return

    const socket = getSocket()
    socket.emit('join_workflow', workflowId)

    return () => {
      socket.emit('leave_workflow', workflowId)
    }
  }, [workflowId])

  // Listen for socket events
  useEffect(() => {
    const socket = getSocket()

    socket.on('node_update', (data: {
      nodeId: string
      status: string
      response?: unknown
      error?: string
      executionTime?: number
      fromCache?: boolean
      statusCode?: number
      statusText?: string
      responseHeaders?: Record<string, string>
      retryCount?: number

    }) => {
      updateNodeData(data.nodeId, {
        status: data.status as any,
        response: data.response,
        error: data.error,
        executionTime: data.executionTime,
        fromCache: data.fromCache,
        statusCode: data.statusCode,
        statusText: data.statusText,
        responseHeaders: data.responseHeaders,
        retryCount: data.retryCount,
      })
    })

    socket.on('execution_start', (data: { remaining?: number }) => {
      isRunningRef.current = true
      if (data && data.remaining !== undefined) {
        setRemaining(data.remaining)
      }
    })

    socket.on('execution_complete', () => {
      isRunningRef.current = false
    })

    socket.on('execution_error', (data: { message: string; remaining?: number }) => {
      isRunningRef.current = false
      if (typeof data.remaining === 'number') {
        setRemaining(data.remaining)
      }
      // Show a toast or alert — for now just log
      alert(data.message)
    })

    return () => {
      socket.off('node_update')
      socket.off('execution_start')
      socket.off('execution_complete')
      socket.off('execution_error')
    }
  }, [updateNodeData])

  const runWorkflow = useCallback(async () => {
    if (isRunningRef.current) return

    const socket = getSocket()

    // First save the workflow to get an ID
    let id = workflowId
    if (!id) {
      const wf = await createWorkflow(workflowName, workspace, nodes, edges)
      const createdId = wf._id || wf.id
      id = createdId
      setWorkflowMeta(createdId, wf.name, wf.workspace)
    } else {
      await saveWorkflow(id, workflowName, nodes, edges)
    }

    if (!id) return

    // Join the workflow room to receive updates
    socket.emit('join_workflow', id)

    // Reset all nodes to idle first
    for (const node of nodes) {
      updateNodeData(node.id, {
        status: 'idle',
        response: undefined,
        error: undefined,
        executionTime: undefined,
        fromCache: undefined,
      })
    }

    // Tell backend to start execution
    const idempotencyKey = uuidv4()
    await api.post(
      `/execution/${id}/run`,
      {},
      { headers: { 'x-idempotency-key': idempotencyKey } }
    )

  }, [nodes, edges, workflowId, workflowName, workspace, updateNodeData, setWorkflowMeta])

  const resetWorkflow = useCallback(() => {
    for (const node of nodes) {
      updateNodeData(node.id, {
        status: 'idle',
        response: undefined,
        error: undefined,
        executionTime: undefined,
        fromCache: undefined,
      })
    }
  }, [nodes, updateNodeData])

  return { runWorkflow, resetWorkflow, remaining }
}
