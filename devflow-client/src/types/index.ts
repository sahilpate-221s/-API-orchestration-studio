export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type NodeStatus = 'idle' | 'running' | 'success' | 'error';

export type FieldMapping = {
  id: string;
  sourceNodeId: string;
  sourcePath: string; // JSONPath e.g. $.data.token
  targetField: 'url' | 'body' | 'header';
  targetKey?: string; // for headers: the header key name
  targetPath?: string; // for body: which field to inject into
};

export type AuthConfig = {
  type: 'none' | 'bearer' | 'basic' | 'apikey';
  token?: string;
  username?: string;
  password?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyIn?: 'header' | 'query';
};

export type QueryParam = {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
};

export type BodyType = 'none' | 'json' | 'formdata' | 'file';

export type FormField = {
  id: string;
  key: string;
  value: string;
};

export type FileData = {
  name: string;
  base64: string;
  mimeType: string;
};

export type NodeData = {
  label: string;
  method: HttpMethod;
  url: string;
  status: NodeStatus;
  response?: unknown;
  error?: string;
  executionTime?: number;
  fromCache?: boolean;
  headers?: Record<string, string>;
  body?: string;
  fieldMappings?: FieldMapping[];
  statusCode?: number;
  statusText?: string;
  responseHeaders?: Record<string, string>;
  retryCount?: number;
  queryParams?: QueryParam[];
  authConfig?: AuthConfig;
  bodyType?: BodyType;
  formFields?: FormField[];
  fileData?: FileData;
};

export type FlowWorkflow = {
  id: string;
  name: string;
  workspace?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  updatedAt: string;
};

export type FlowNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: Record<string, unknown>;
};
