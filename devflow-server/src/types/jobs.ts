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

export type LoadTestJobData = {
  loadTestId: string
  userId: string
  workflowId: string
  targetUrl: string
  method: string
  headers: Record<string, string>
  body?: string
  batchIndex: number
  batchSize: number
  totalUsers: number
  rampUpSeconds: number
}

export type LoadTestStats = {
  loadTestId: string
  totalRequests: number
  completed: number
  successful: number
  failed: number
  totalLatency: number
  latencies: number[]
  errors: Record<string, number>
  startTime: number
  rps: number[]
  activeUsers: number
}