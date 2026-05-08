export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export type NodeStatus = 'idle' | 'running' | 'success' | 'error'

export type FieldMapping = {
  id: string
  sourceNodeId: string
  sourcePath: string       // JSONPath e.g. $.data.token
  targetField: 'url' | 'body' | 'header'
  targetKey?: string       // for headers: the header key name
  targetPath?: string      // for body: which field to inject into
}

export interface INodeData {
  label: string
  method: HttpMethod
  url: string
  status: NodeStatus
  headers?: Record<string, string>
  body?: string
  response?: unknown
  error?: string
  executionTime?: number
  fromCache?: boolean
  fieldMappings?: FieldMapping[]
}

export interface IFlowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: INodeData
}

export interface IFlowEdge {
  id: string
  source: string
  target: string
  animated?: boolean
  style?: Record<string, unknown>
}

export interface AuthRequest extends Express.Request {
  user?: { id: string; email: string }
}