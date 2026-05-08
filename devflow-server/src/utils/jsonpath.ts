import jsonpath from 'jsonpath'

export function extractValue(data: unknown, path: string): unknown {
  try {
    if (!path.startsWith('$')) return undefined
    const results = jsonpath.query(data as object, path)
    return results.length > 0 ? results[0] : undefined
  } catch {
    return undefined
  }
}

export function resolveTemplate(
  template: string,
  context: Record<string, unknown>
): string {
  // Replace {{node-id.$.path.to.field}} with actual values.
  // React Flow generated node ids commonly contain hyphens.
  return template.replace(/\{\{([^.\s{}]+)\.(\$[^}]+)\}\}/g, (_, nodeId, path) => {
    const nodeData = context[nodeId]
    if (!nodeData) return ''
    const value = extractValue(nodeData, path)
    return value !== undefined ? String(value) : ''
  })
}
