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
  PATCH: { color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.22)', glow: 'rgba(167,139,250,0.12)' },
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
        width: '200px',
        borderRadius: '10px',
        background: '#111111',
        border: `1px solid ${selected ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: selected
          ? `0 0 0 3px rgba(99,102,241,0.15), 0 12px 32px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.3)`
          : '0 4px 20px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
        cursor: 'default',
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
          borderRadius: '10px 0 0 10px',
          opacity: 0.85,
        }}
      />

      {/* Left handle (target) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: '9px',
          height: '9px',
          background: '#1a1a1a',
          border: `2px solid ${m.color}`,
          borderRadius: '50%',
          left: '-5px',
          transition: 'all 0.15s ease',
          boxShadow: `0 0 8px ${m.glow}`,
        }}
        onMouseEnter={(e) => {
          ; (e.currentTarget as HTMLElement).style.transform = 'scale(1.2)'
            ; (e.currentTarget as HTMLElement).style.background = m.color
        }}
        onMouseLeave={(e) => {
          ; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
            ; (e.currentTarget as HTMLElement).style.background = '#1a1a1a'
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px 8px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          {/* Method badge */}
          <div
            style={{
              padding: '1.5px 5px',
              borderRadius: '4px',
              background: m.bg,
              border: `1px solid ${m.border}`,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: '8px',
                fontWeight: 800,
                letterSpacing: '0.06em',
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
              fontSize: '11px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.88)',
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
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: s.color,
            flexShrink: 0,
            boxShadow: s.pulse ? `0 0 6px ${s.color}` : 'none',
          }}
        />
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 10px 0 14px' }} />

      {/* URL row */}
      <div style={{ padding: '6px 10px 6px 14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: '5px',
            padding: '4px 6px',
          }}
        >
          {/* Globe icon */}
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10A15.3 15.3 0 0 1 8 12a15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span
            style={{
              fontSize: '9px',
              fontFamily: 'monospace',
              color: 'rgba(255,255,255,0.3)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}
          >
            {url}
          </span>
        </div>
      </div>

      {/* Footer (only when there's execution data) */}
      {/* Footer */}
      {(executionTime !== undefined || status === 'error' || status === 'success') && (
        <>
          <div className="mx-4 h-px bg-white/[0.06]" />
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {executionTime !== undefined && (
                <span className="text-[11px] text-zinc-500">
                  {fromCache ? (
                    <span className="text-indigo-400/80">⚡ cached</span>
                  ) : (
                    <><span className="text-zinc-300 font-medium">{executionTime}</span>ms</>
                  )}
                </span>
              )}
            </div>
            {status === 'error' && (
              <span className="text-[11px] text-red-400/80">Failed</span>
            )}
            {status === 'success' && (
              <span className="text-[11px] text-emerald-400/80">✓ Success</span>
            )}
          </div>
        </>
      )}

      {/* Right handle (source) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: '9px',
          height: '9px',
          background: '#1a1a1a',
          border: `2px solid ${m.color}`,
          borderRadius: '50%',
          right: '-5px',
          transition: 'all 0.15s ease',
          boxShadow: `0 0 8px ${m.glow}`,
        }}
        onMouseEnter={(e) => {
          ; (e.currentTarget as HTMLElement).style.transform = 'scale(1.2)'
            ; (e.currentTarget as HTMLElement).style.background = m.color
        }}
        onMouseLeave={(e) => {
          ; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
            ; (e.currentTarget as HTMLElement).style.background = '#1a1a1a'
        }}
      />
    </div>
  )
}

export const nodeTypes = { apiNode: ApiNode }