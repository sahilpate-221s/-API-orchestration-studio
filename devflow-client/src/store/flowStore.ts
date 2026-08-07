import { create } from 'zustand'
import { addEdge, applyNodeChanges, applyEdgeChanges, type NodeChange, type EdgeChange } from 'reactflow'
import type { Connection } from 'reactflow'
import type { FlowNode, FlowEdge, NodeData, HttpMethod } from '../types'

type HistoryState = {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

type FlowStore = {
  nodes: FlowNode[]
  edges: FlowEdge[]
  past: HistoryState[]
  future: HistoryState[]
  selectedNodeId: string | null
  workflowId: string | null
  workflowName: string
  workspace: string
  
  undo: () => void
  redo: () => void
  saveHistory: () => void
  
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (method: HttpMethod, position: { x: number; y: number }) => void
  addConditionNode: (position: { x: number; y: number }) => void
  addWebhookNode: (position: { x: number; y: number }) => void
  updateNodeData: (id: string, data: Partial<NodeData>) => void
  setSelectedNode: (id: string | null) => void
  setWorkflowMeta: (id: string, name: string, workspace: string) => void
  setFlow: (nodes: FlowNode[], edges: FlowEdge[]) => void
  exportWorkflow: () => string
  importWorkflow: (json: string) => void
  mergeTemplate: (nodes: FlowNode[], edges: FlowEdge[]) => void
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

/** Extract protocol + host from a URL, e.g. "https://api.example.com/users" → "https://api.example.com" */
function getBaseUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.origin  // e.g. "https://api.example.com"
  } catch {
    return ''
  }
}

export const useFlowStore = create<FlowStore>((set, get) => ({
  nodes: [],
  edges: [],
  past: [],
  future: [],
  selectedNodeId: null,
  workflowId: null,
  workflowName: 'My First Workflow',
  workspace: 'My Workspace',

  undo: () => {
    const { past, future, nodes, edges } = get()
    if (past.length === 0) return
    const previous = past[past.length - 1]
    const newPast = past.slice(0, past.length - 1)
    set({
      past: newPast,
      future: [{ nodes, edges }, ...future],
      nodes: previous.nodes,
      edges: previous.edges,
      selectedNodeId: null
    })
  },

  redo: () => {
    const { past, future, nodes, edges } = get()
    if (future.length === 0) return
    const next = future[0]
    const newFuture = future.slice(1)
    set({
      past: [...past, { nodes, edges }],
      future: newFuture,
      nodes: next.nodes,
      edges: next.edges,
      selectedNodeId: null
    })
  },

  saveHistory: () => {
    set((state) => {
      // Don't save history if we haven't actually made a change from the last history state
      // This is a simple deep-ish check just by comparing length or stringify for safety,
      // but simpler to just push if there are any nodes/edges.
      // To keep it simple, we just push the current state to past and clear future.
      return {
        past: [...state.past, { nodes: state.nodes, edges: state.edges }].slice(-50), // keep last 50
        future: [],
      }
    })
  },

  onNodesChange: (changes) => {
    const isMeaningful = changes.some((c) => c.type === 'remove' || c.type === 'add')
    if (isMeaningful) get().saveHistory()
    set({ nodes: applyNodeChanges(changes, get().nodes) as FlowNode[] })
  },

  onEdgesChange: (changes) => {
    const isMeaningful = changes.some((c) => c.type === 'remove' || c.type === 'add')
    if (isMeaningful) get().saveHistory()
    set({ edges: applyEdgeChanges(changes, get().edges) as FlowEdge[] })
  },

  onConnect: (connection) => {
    const { nodes, edges } = get()
    const source = connection.source
    const target = connection.target

    if (!source || !target || source === target) return
    if (!nodes.some((node) => node.id === source) || !nodes.some((node) => node.id === target)) return
    // Check duplicate — also consider sourceHandle so condition nodes can connect both handles to same target
    if (edges.some((edge) => edge.source === source && edge.target === target && edge.sourceHandle === (connection.sourceHandle ?? null))) return
    if (wouldCreateCycle(edges, source, target)) return

    const sourceNode = nodes.find((n) => n.id === source)
    const targetNode = nodes.find((n) => n.id === target)

    get().saveHistory()

    // --- Auto-propagate source data to target (only for apiNode → apiNode connections) ---
    if (sourceNode && targetNode && sourceNode.type === 'apiNode' && targetNode.type === 'apiNode') {
      const srcData = sourceNode.data
      const tgtData = targetNode.data
      const patch: Partial<NodeData> = {}

      // 1. Merge headers — add source keys the target doesn't already have
      const srcHeaders = srcData.headers ?? {}
      const tgtHeaders = tgtData.headers ?? {}
      if (Object.keys(srcHeaders).length > 0) {
        const merged = { ...tgtHeaders }
        let changed = false
        for (const [key, val] of Object.entries(srcHeaders)) {
          if (!(key in merged)) {
            merged[key] = val
            changed = true
          }
        }
        if (changed) patch.headers = merged
      }

      // 2. Copy auth config if target is 'none' (default)
      const srcAuth = srcData.authConfig
      const tgtAuth = tgtData.authConfig
      if (srcAuth && srcAuth.type !== 'none' && (!tgtAuth || tgtAuth.type === 'none')) {
        patch.authConfig = { ...srcAuth }
      }

      // 3. Pre-fill base URL if target URL is empty
      if (!tgtData.url && srcData.url) {
        const base = getBaseUrl(srcData.url)
        if (base) patch.url = base
      }

      // 4. Copy bodyType if target hasn't set one (or is still default)
      if (srcData.bodyType && srcData.bodyType !== 'none' && (!tgtData.bodyType || tgtData.bodyType === 'none')) {
        patch.bodyType = srcData.bodyType
      }

      // Apply the propagated data to the target node
      if (Object.keys(patch).length > 0) {
        set({
          nodes: nodes.map((n) =>
            n.id === target ? { ...n, data: { ...n.data, ...patch } } : n
          ),
          edges: addEdge(
            { ...connection, animated: true, style: { stroke: '#ffffff', strokeWidth: 1.5, strokeOpacity: 0.6 } },
            edges
          ) as FlowEdge[],
        })
        return
      }
    }

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
    get().saveHistory()
    set({ nodes: [...get().nodes, newNode], selectedNodeId: id })
  },

  addConditionNode: (position) => {
    const id = `condition-${Date.now()}`
    const newNode: any = {
      id,
      type: 'conditionNode',
      position,
      data: {
        label: 'Check Condition',
        sourcePath: '$.status',
        operator: 'eq' as const,
        compareValue: '',
        status: 'idle' as const,
        sourceNodeId: '',
        trueLabel: 'YES',
        falseLabel: 'NO',
      },
    }
    get().saveHistory()
    set({ nodes: [...get().nodes, newNode], selectedNodeId: id })
  },

  addWebhookNode: (position) => {
    const id = `webhook-${Date.now()}`
    const newNode: any = {
      id,
      type: 'webhookNode',
      position,
      data: {
        label: 'Webhook Trigger',
        webhookId: undefined,
        webhookUrl: undefined,
        active: false,
        triggerCount: 0,
        status: 'idle' as const,
      },
    }
    get().saveHistory()
    set({ nodes: [...get().nodes, newNode], selectedNodeId: id })
  },

  updateNodeData: (id, data) => {
    get().saveHistory()
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    })
  },

  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setWorkflowMeta: (id, name, workspace) => set({ workflowId: id, workflowName: name, workspace: workspace || 'My Workspace' }),
  setFlow: (nodes, edges) => {
    get().saveHistory()
    set({ nodes, edges })
  },
  exportWorkflow: () => {
    const { nodes, edges, workflowName } = get()
    return JSON.stringify({ name: workflowName, nodes, edges }, null, 2)
  },
  importWorkflow: (json: string | object) => {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json
      get().saveHistory()
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

  mergeTemplate: (templateNodes: FlowNode[], templateEdges: FlowEdge[]) => {
    const { nodes: existingNodes, edges: existingEdges } = get()

    // Calculate the bounding box of existing nodes to place template below them
    let offsetY = 200 // default start if canvas is empty
    let offsetX = 100
    if (existingNodes.length > 0) {
      let maxY = -Infinity
      let minX = Infinity
      for (const n of existingNodes) {
        const bottomY = n.position.y + 120 // approximate node height
        if (bottomY > maxY) maxY = bottomY
        if (n.position.x < minX) minX = n.position.x
      }
      offsetY = maxY + 80 // 80px gap below existing nodes
      offsetX = minX
    }

    // Calculate template's own origin so we can rebase positions
    let tMinX = Infinity
    let tMinY = Infinity
    for (const n of templateNodes) {
      if (n.position.x < tMinX) tMinX = n.position.x
      if (n.position.y < tMinY) tMinY = n.position.y
    }

    const suffix = `-${Date.now()}`
    const idMap = new Map<string, string>()

    const newNodes: FlowNode[] = templateNodes.map((n) => {
      const newId = `${n.id}${suffix}`
      idMap.set(n.id, newId)
      return {
        ...n,
        id: newId,
        position: {
          x: (n.position.x - tMinX) + offsetX,
          y: (n.position.y - tMinY) + offsetY,
        },
        data: { ...n.data, status: 'idle', response: undefined, error: undefined, statusCode: undefined, responseHeaders: undefined, executionTime: undefined },
      }
    })

    const newEdges: FlowEdge[] = templateEdges.map((e) => ({
      ...e,
      id: `${e.id}${suffix}`,
      source: idMap.get(e.source) ?? e.source,
      target: idMap.get(e.target) ?? e.target,
    }))

    get().saveHistory()
    set({
      nodes: [...existingNodes, ...newNodes],
      edges: [...existingEdges, ...newEdges],
      selectedNodeId: null,
    })
  },
}))
