import { useState } from 'react'

const nodeLibrary = [
  {
    method: 'GET',
    label: 'Get Request',
    desc: 'Retrieve a resource',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.10)',
    border: 'rgba(52,211,153,0.18)',
    glow: 'rgba(52,211,153,0.20)',
  },
  {
    method: 'POST',
    label: 'Post Request',
    desc: 'Create a resource',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.10)',
    border: 'rgba(96,165,250,0.18)',
    glow: 'rgba(96,165,250,0.20)',
  },
  {
    method: 'PUT',
    label: 'Put Request',
    desc: 'Replace a resource',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.10)',
    border: 'rgba(251,191,36,0.18)',
    glow: 'rgba(251,191,36,0.20)',
  },
  {
    method: 'DELETE',
    label: 'Delete Request',
    desc: 'Remove a resource',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.10)',
    border: 'rgba(248,113,113,0.18)',
    glow: 'rgba(248,113,113,0.20)',
  },
  {
    method: 'PATCH',
    label: 'Patch Request',
    desc: 'Partially update',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.10)',
    border: 'rgba(167,139,250,0.18)',
    glow: 'rgba(167,139,250,0.20)',
  },
]

export default function Sidebar() {
  const [expanded, setExpanded] = useState(true)
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null)

  const onDragStart = (e: React.DragEvent, method: string) => {
    e.dataTransfer.setData('application/reactflow-method', method)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      style={{
        width: expanded ? '200px' : '56px',
        height: '100%',
        background: '#0c0c0c',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
        zIndex: 5,
      }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setExpanded((p) => !p)}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          width: '22px',
          height: '22px',
          borderRadius: '5px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'background 0.15s ease, border-color 0.15s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)'
          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.13)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'
        }}
        title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Top section label */}
      <div
        style={{
          padding: expanded ? '12px 14px 0 14px' : '12px 0 0 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '10px',
          flexShrink: 0,
          justifyContent: expanded ? 'flex-start' : 'center',
        }}
      >
        <span
          style={{
            fontSize: '8px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.20)',
            textTransform: 'uppercase',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {expanded ? 'Node Library' : 'API'}
        </span>
      </div>

      {/* Node items */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          padding: expanded ? '0 10px' : '0 8px',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
        }}
      >
        {nodeLibrary.map((node) => {
          const isHovered = hoveredMethod === node.method
          return (
            <div
              key={node.method}
              draggable
              onDragStart={(e) => onDragStart(e, node.method)}
              onMouseEnter={() => setHoveredMethod(node.method)}
              onMouseLeave={() => setHoveredMethod(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: expanded ? '7px 8px' : '6px 0',
                borderRadius: '8px',
                background: isHovered ? node.bg : 'transparent',
                border: `1px solid ${isHovered ? node.border : 'transparent'}`,
                cursor: 'grab',
                transition: 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                boxShadow: isHovered ? `0 0 14px ${node.glow}` : 'none',
                userSelect: 'none',
                justifyContent: expanded ? 'flex-start' : 'center',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              {/* Method badge */}
              <div
                style={{
                  minWidth: expanded ? '38px' : '40px',
                  height: '24px',
                  borderRadius: '5px',
                  background: node.bg,
                  border: `1px solid ${node.border}`,
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
                    letterSpacing: '0.06em',
                    color: node.color,
                    lineHeight: 1,
                  }}
                >
                  {node.method}
                </span>
              </div>

              {/* Label + desc — only when expanded */}
              {expanded && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px',
                    overflow: 'hidden',
                    opacity: expanded ? 1 : 0,
                    transition: 'opacity 0.2s ease 0.05s',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: isHovered ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.65)',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.15s ease',
                      lineHeight: 1.2,
                    }}
                  >
                    {node.label}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'rgba(255,255,255,0.28)',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.2,
                    }}
                  >
                    {node.desc}
                  </span>
                </div>
              )}

              {/* Tooltip for collapsed state */}
              {!expanded && isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    left: 'calc(100% + 10px)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#1c1c1c',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    padding: '5px 9px',
                    whiteSpace: 'nowrap',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.75)',
                    pointerEvents: 'none',
                    zIndex: 50,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                  }}
                >
                  {node.label}
                  <span
                    style={{
                      position: 'absolute',
                      right: '100%',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      borderTop: '4px solid transparent',
                      borderBottom: '4px solid transparent',
                      borderRight: '4px solid rgba(255,255,255,0.08)',
                      display: 'block',
                      width: 0,
                      height: 0,
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: expanded ? '10px 10px 12px' : '10px 8px 12px',
          flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          marginTop: '4px',
        }}
      >
        <div
          style={{
            borderRadius: '7px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: expanded ? '7px 10px' : '7px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#6366f1',
              boxShadow: '0 0 6px rgba(99,102,241,0.6)',
              flexShrink: 0,
              animation: 'pulse 2s infinite',
            }}
          />
          {expanded && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.30)',
                whiteSpace: 'nowrap',
              }}
            >
              Drag onto canvas
            </span>
          )}
        </div>
      </div>
    </div>
  )
}