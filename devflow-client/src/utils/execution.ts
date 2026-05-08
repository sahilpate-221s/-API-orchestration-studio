import type { FlowNode, FlowEdge } from '../types'

// Topological sort — returns nodes in execution order
// This is Kahn's algorithm (BFS-based)
export function getExecutionOrder(
  nodes: FlowNode[],
  edges: FlowEdge[]
): FlowNode[] {
  // Build adjacency + in-degree map
  const nodeIds = new Set(nodes.map((node) => node.id))
  const inDegree: Record<string, number> = {}
  const adjacency: Record<string, string[]> = {}

  for (const node of nodes) {
    inDegree[node.id] = 0
    adjacency[node.id] = []
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue
    adjacency[edge.source].push(edge.target)
    inDegree[edge.target] = (inDegree[edge.target] ?? 0) + 1
  }

  // Start with nodes that have no dependencies
  const queue = nodes.filter((n) => inDegree[n.id] === 0)
  const result: FlowNode[] = []

  while (queue.length > 0) {
    const node = queue.shift()!
    result.push(node)

    for (const neighborId of adjacency[node.id]) {
      inDegree[neighborId]--
      if (inDegree[neighborId] === 0) {
        const neighbor = nodes.find((n) => n.id === neighborId)
        if (neighbor) queue.push(neighbor)
      }
    }
  }

  return result
}
