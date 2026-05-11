import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import type { NodeData } from '../../types'

const methodConfig: Record<string, {
  color: string
  bg: string
  border: string
  glow: string
}> = {
  GET: { color: '#34d399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.22)', glow: 'rgba(52,211,153,0.12)' },
  POST: { color: '#60a5fa', bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.22)', glow: 'rgba(96,165,250,0.12)' },
  PUT: { color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.22)', glow: 'rgba(251,191,36,0.12)' },
  DELETE: { color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.22)', glow: 'rgba(248,113,113,0.12)' },
  PATCH: { color: '#ffffff', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.15)', glow: 'rgba(255,255,255,0.10)' },
}

const statusDot: Record<string, { color: string; pulse: boolean; label: string }> = {
  idle: { color: '#3f3f46', pulse: false, label: '' },
  running: { color: '#60a5fa', pulse: true, label: 'Running…' },
  success: { color: '#34d399', pulse: false, label: '✓ Success' },
  error: { color: '#f87171', pulse: false, label: 'Failed' },
}

export default function ApiNode({ data, selected }: NodeProps<NodeData>) {
  const { label, method, url, status, executionTime, fromCache } = data
  const m = methodConfig[method] ?? methodConfig.GET
  const s = statusDot[status] ?? statusDot.idle

  return (
    <div
      style={{
        width: '180px',
        borderRadius: '8px',
        background: '#111111',
        border: `1px solid ${selected ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: selected
          ? `0 0 0 3px rgba(255,255,255,0.04), 0 12px 32px rgba(0,0,0,0.7)`
          : '0 4px 15px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* Colored left accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '2.5px',
          background: m.color,
          borderRadius: '8px 0 0 8px',
          opacity: 0.85,
        }}
      />

      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: '8px',
          height: '8px',
          background: '#0a0a0a',
          border: `2px solid ${m.color}`,
          borderRadius: '50%',
          left: '-4px',
          boxShadow: `0 0 8px ${m.glow}`,
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px 6px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {/* Method badge */}
          <div
            style={{
              height: '16px',
              minWidth: '32px',
              borderRadius: '4px',
              background: m.bg,
              border: `1px solid ${m.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: '7.5px',
                fontWeight: 800,
                letterSpacing: '0.05em',
                color: m.color,
                lineHeight: 1,
              }}
            >
              {method}
            </span>
          </div>

          {/* Label */}
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.92)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        </div>

        {/* Status dot */}
        <div
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: s.color,
            flexShrink: 0,
            boxShadow: s.pulse ? `0 0 8px ${s.color}` : 'none',
            animation: s.pulse ? 'pulse 2s infinite' : 'none',
          }}
        />
      </div>

      {/* URL row */}
      <div style={{ padding: '0 12px 8px 14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: '5px',
            padding: '3px 7px',
          }}
        >
          <span
            style={{
              fontSize: '8.5px',
              fontFamily: 'monospace',
              color: 'rgba(255,255,255,0.3)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}
          >
            {url || 'endpoint url...'}
          </span>
        </div>
      </div>

      {/* Footer */}
      {(executionTime !== undefined || status === 'error' || status === 'success') && (
        <div style={{ padding: '5px 14px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              {fromCache ? (
                <span style={{ color: '#60a5fa' }}>⚡ cached</span>
              ) : (
                <><span style={{ color: 'rgba(255,255,255,0.6)' }}>{executionTime}</span>ms</>
              )}
            </div>
            {status === 'error' && <span style={{ fontSize: '9px', color: '#f87171', fontWeight: 600 }}>Failed</span>}
            {status === 'success' && <span style={{ fontSize: '9px', color: '#34d399', fontWeight: 600 }}>✓ Success</span>}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: '8px',
          height: '8px',
          background: '#0a0a0a',
          border: `2px solid ${m.color}`,
          borderRadius: '50%',
          right: '-4px',
          boxShadow: `0 0 8px ${m.glow}`,
        }}
      />
    </div>
  )
}

export const nodeTypes = { apiNode: ApiNode }