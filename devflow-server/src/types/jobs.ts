import { IFlowNode, IFlowEdge } from './index'

export type WorkflowJobData = {
  workflowId: string
  userId: string
  nodes: IFlowNode[]
  edges: IFlowEdge[]
  executionId: string
  idempotencyKey: string
}

export type JobProgress = {
  nodeId: string
  status: 'running' | 'success' | 'error'
  response?: unknown
  error?: string
  executionTime?: number
  fromCache?: boolean
}