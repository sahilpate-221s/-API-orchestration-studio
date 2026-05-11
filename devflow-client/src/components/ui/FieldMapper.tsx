import { useFlowStore } from '../../store/flowStore'
import type { FieldMapping } from '../../types'

type Props = {
  nodeId: string
}

const labelStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 700,
  color: 'rgba(255,255,255,0.25)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
}

const controlStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  padding: '8px 10px',
  fontSize: '11px',
  color: 'rgba(255,255,255,0.9)',
  outline: 'none',
  transition: 'all 0.15s ease',
}

const focusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
}

const blurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
}

export default function FieldMapper({ nodeId }: Props) {
  const { nodes, edges, updateNodeData } = useFlowStore()
  const currentNode = nodes.find((n) => n.id === nodeId)

  const upstreamIds = new Set<string>()
  const visitUpstream = (targetId: string) => {
    for (const edge of edges.filter((e) => e.target === targetId)) {
      if (upstreamIds.has(edge.source)) continue
      upstreamIds.add(edge.source)
      visitUpstream(edge.source)
    }
  }

  visitUpstream(nodeId)
  const sourceNodes = nodes.filter((n) => upstreamIds.has(n.id))

  const mappings: FieldMapping[] = currentNode?.data.fieldMappings ?? []

  const addMapping = () => {
    const newMapping: FieldMapping = {
      id: `map-${Date.now()}`,
      sourceNodeId: sourceNodes[0]?.id ?? '',
      sourcePath: '$.data',
      targetField: 'body',
      targetPath: 'id',
    }
    updateNodeData(nodeId, {
      fieldMappings: [...mappings, newMapping],
    })
  }

  const updateMapping = (id: string, changes: Partial<FieldMapping>) => {
    updateNodeData(nodeId, {
      fieldMappings: mappings.map((m) => m.id === id ? { ...m, ...changes } : m),
    })
  }

  const removeMapping = (id: string) => {
    updateNodeData(nodeId, {
      fieldMappings: mappings.filter((m) => m.id !== id),
    })
  }

  if (sourceNodes.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.22)', fontStyle: 'italic', lineHeight: 1.5 }}>
        Connect another node first to map its fields here.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {mappings.map((mapping) => (
        <div
          key={mapping.id}
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>From node</label>
              <select
                value={mapping.sourceNodeId}
                onChange={(e) => updateMapping(mapping.id, { sourceNodeId: e.target.value })}
                onFocus={focusBorder}
                onBlur={blurBorder}
                style={controlStyle}
              >
                {sourceNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.data.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>JSONPath</label>
              <input
                value={mapping.sourcePath}
                onChange={(e) => updateMapping(mapping.id, { sourcePath: e.target.value })}
                onFocus={focusBorder}
                onBlur={blurBorder}
                placeholder="$.data.id"
                style={{ ...controlStyle, fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.24)' }}>Inject into</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Target</label>
              <select
                value={mapping.targetField}
                onChange={(e) => updateMapping(mapping.id, {
                  targetField: e.target.value as FieldMapping['targetField'],
                })}
                onFocus={focusBorder}
                onBlur={blurBorder}
                style={controlStyle}
              >
                <option value="url">URL</option>
                <option value="body">Body field</option>
                <option value="header">Header</option>
              </select>
            </div>

            {mapping.targetField === 'body' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Body key</label>
                <input
                  value={mapping.targetPath ?? ''}
                  onChange={(e) => updateMapping(mapping.id, { targetPath: e.target.value })}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                  placeholder="userId"
                  style={{ ...controlStyle, fontFamily: 'monospace' }}
                />
              </div>
            )}

            {mapping.targetField === 'header' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Header key</label>
                <input
                  value={mapping.targetKey ?? ''}
                  onChange={(e) => updateMapping(mapping.id, { targetKey: e.target.value })}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                  placeholder="Authorization"
                  style={{ ...controlStyle, fontFamily: 'monospace' }}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => removeMapping(mapping.id)}
            style={{
              alignSelf: 'flex-end',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.28)',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 0',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}
          >
            Remove mapping
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addMapping}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.03)',
          border: '1px dashed rgba(255,255,255,0.10)',
          borderRadius: '10px',
          padding: '9px',
          color: 'rgba(255,255,255,0.34)',
          fontSize: '11px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.58)'
          e.currentTarget.style.borderStyle = 'solid'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.34)'
          e.currentTarget.style.borderStyle = 'dashed'
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add field mapping
      </button>
    </div>
  )
}
