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
  webhookId?: string;
  webhookUrl?: string;
  active?: boolean;
  triggerCount?: number;
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
  sourceHandle?: string;
  targetHandle?: string;
  animated?: boolean;
  style?: Record<string, unknown>;
};


export type ConditionOperator =
  | 'eq' | 'neq'
  | 'gt' | 'gte'
  | 'lt' | 'lte'
  | 'contains' | 'not_contains'
  | 'exists' | 'not_exists'

export type ConditionData = {
  label: string
  sourcePath: string        // JSONPath: $.status
  operator: ConditionOperator
  compareValue: string      // value to compare against
  status: NodeStatus
  sourceNodeId?: string     // which node's response to check
  trueLabel?: string        // label for YES handle
  falseLabel?: string       // label for NO handle
  conditionResult?: boolean // result of condition evaluation
  conditionLabel?: string   // 'YES' or 'NO' after evaluation
}