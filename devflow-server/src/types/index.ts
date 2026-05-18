import { Request } from 'express'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
export type NodeStatus = 'idle' | 'running' | 'success' | 'error'
export type BodyType = 'none' | 'json' | 'formdata' | 'file'

export type FieldMapping = {
  id: string
  sourceNodeId: string
  sourcePath: string
  targetField: 'url' | 'body' | 'header'
  targetKey?: string
  targetPath?: string
}

export type AuthConfig = {
  type: 'none' | 'bearer' | 'basic' | 'apikey'
  token?: string
  username?: string
  password?: string
  apiKeyName?: string
  apiKeyValue?: string
  apiKeyIn?: 'header' | 'query'
}

export type QueryParam = {
  id: string
  key: string
  value: string
  enabled: boolean
}

export type FormField = {
  id: string
  key: string
  value: string
}

export type FileData = {
  name: string
  base64: string
  mimeType: string
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
  statusCode?: number
  statusText?: string
  responseHeaders?: Record<string, string>
  retryCount?: number
  queryParams?: QueryParam[]
  authConfig?: AuthConfig
  bodyType?: BodyType
  formFields?: FormField[]
  fileData?: FileData
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

export interface AuthRequest extends Request {
  user?: { id: string; email: string }
}