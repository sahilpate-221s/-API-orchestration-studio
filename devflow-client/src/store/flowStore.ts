import { create } from 'zustand'
import { addEdge, applyNodeChanges, applyEdgeChanges, type NodeChange, type EdgeChange } from 'reactflow'
import type { Connection } from 'reactflow'
import type { FlowNode, FlowEdge, NodeData, HttpMethod } from '../types'

type FlowStore = {
  nodes: FlowNode[]
  edges: FlowEdge[]
  selectedNodeId: string | null
  workflowId: string | null
  workflowName: string
  workspace: string
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (method: HttpMethod, position: { x: number; y: number }) => void
  updateNodeData: (id: string, data: Partial<NodeData>) => void
  setSelectedNode: (id: string | null) => void
  setWorkflowMeta: (id: string, name: string, workspace: string) => void
  setFlow: (nodes: FlowNode[], edges: FlowEdge[]) => void
  exportWorkflow: () => string
  importWorkflow: (json: string) => void
}

function wouldCreateCycle(edges: FlowEdge[], source: string, target: string): boolean {
  const adjacency = new Map<string, string[]>()

  for (const edge of edges) {
    const next = adjacency.get(edge.source) ?? []
    next.push(edge.target)
    adjacency.set(edge.source, next)
  }

  const stack = [target]
  const visited = new Set<string>()

  while (stack.length > 0) {
    const current = stack.pop()!
    if (current === source) return true
    if (visited.has(current)) continue
    visited.add(current)
    stack.push(...(adjacency.get(current) ?? []))
  }

  return false
}

export const useFlowStore = create<FlowStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  workflowId: null,
  workflowName: 'My First Workflow',
  workspace: 'My Workspace',

  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) as FlowNode[] }),

  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) as FlowEdge[] }),

  onConnect: (connection) => {
    const { nodes, edges } = get()
    const source = connection.source
    const target = connection.target

    if (!source || !target || source === target) return
    if (!nodes.some((node) => node.id === source) || !nodes.some((node) => node.id === target)) return
    if (edges.some((edge) => edge.source === source && edge.target === target)) return
    if (wouldCreateCycle(edges, source, target)) return

    set({
      edges: addEdge(
        { ...connection, animated: true, style: { stroke: '#ffffff', strokeWidth: 1.5, strokeOpacity: 0.6 } },
        edges
      ) as FlowEdge[],
    })
  },

  addNode: (method, position) => {
    const id = `node-${Date.now()}`
    const labelMap: Record<string, string> = {
      GET: 'Fetch Data', POST: 'Send Data',
      PUT: 'Update Data', DELETE: 'Delete Record', PATCH: 'Patch Record',
    }
    const newNode: FlowNode = {
      id,
      type: 'apiNode',
      position,
      data: {
        label: labelMap[method] ?? 'API Call',
        method,
        url: '',
        status: 'idle',
      },
    }
    set({ nodes: [...get().nodes, newNode], selectedNodeId: id })
  },

  updateNodeData: (id, data) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }),

  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setWorkflowMeta: (id, name, workspace) => set({ workflowId: id, workflowName: name, workspace: workspace || 'My Workspace' }),
  setFlow: (nodes, edges) => set({ nodes, edges }),
  exportWorkflow: () => {
    const { nodes, edges, workflowName } = get()
    return JSON.stringify({ name: workflowName, nodes, edges }, null, 2)
  },
  importWorkflow: (json: string | object) => {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json
      set({
        nodes: data.nodes ?? [],
        edges: data.edges ?? [],
        workflowName: data.name ?? get().workflowName,
        // Preserve current workflowId so we don't get redirected by App.tsx
        workflowId: get().workflowId, 
        selectedNodeId: null,
      })
    } catch (err) {
      console.error('Workflow import failed:', err)
      alert('Invalid workflow data')
    }
  },
}))
