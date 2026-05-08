export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type NodeStatus = 'idle' | 'running' | 'success' | 'error';

export type FieldMapping = {
  id: string;
  sourceNodeId: string;
  sourcePath: string;       // JSONPath e.g. $.data.token
  targetField: 'url' | 'body' | 'header';
  targetKey?: string;       // for headers: the header key name
  targetPath?: string;      // for body: which field to inject into
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
