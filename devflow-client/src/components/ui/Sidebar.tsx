import { useState, useRef } from 'react'
import { useFlowStore } from '../../store/flowStore'

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
    color: '#ffffff',
    bg: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.15)',
    glow: 'rgba(255,255,255,0.10)',
  },
]

const templates = [
  {
    name: 'Auth Flow',
    description: 'Login then fetch profile',
    nodes: [
      {
        id: 't1', type: 'apiNode',
        position: { x: 100, y: 100 },
        data: { label: 'Login', method: 'POST', url: 'https://reqres.in/api/login', status: 'idle', body: '{"email":"eve.holt@reqres.in","password":"cityslicka"}' }
      },
      {
        id: 't2', type: 'apiNode',
        position: { x: 450, y: 100 },
        data: { label: 'Get Users', method: 'GET', url: 'https://reqres.in/api/users', status: 'idle' }
      },
    ],
    edges: [
      { id: 'te1', source: 't1', target: 't2', animated: true, style: { stroke: '#ffffff', strokeWidth: 1.5 } }
    ]
  },
  {
    name: 'Data Chain',
    description: 'Fetch → transform → post',
    nodes: [
      {
        id: 't1', type: 'apiNode',
        position: { x: 100, y: 100 },
        data: { label: 'Fetch Posts', method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts/1', status: 'idle' }
      },
      {
        id: 't2', type: 'apiNode',
        position: { x: 450, y: 100 },
        data: { label: 'Fetch Comments', method: 'GET', url: 'https://jsonplaceholder.typicode.com/comments?postId=1', status: 'idle' }
      },
      {
        id: 't3', type: 'apiNode',
        position: { x: 800, y: 100 },
        data: { label: 'Create Todo', method: 'POST', url: 'https://jsonplaceholder.typicode.com/todos', status: 'idle', body: '{"title":"review post","completed":false}' }
      },
    ],
    edges: [
      { id: 'te1', source: 't1', target: 't2', animated: true, style: { stroke: '#ffffff', strokeWidth: 1.5 } },
      { id: 'te2', source: 't2', target: 't3', animated: true, style: { stroke: '#ffffff', strokeWidth: 1.5 } },
    ]
  },
  {
    name: 'Parallel Fetch',
    description: 'Two independent API calls',
    nodes: [
      {
        id: 't1', type: 'apiNode',
        position: { x: 100, y: 200 },
        data: { label: 'Trigger', method: 'GET', url: 'https://jsonplaceholder.typicode.com/users/1', status: 'idle' }
      },
      {
        id: 't2', type: 'apiNode',
        position: { x: 450, y: 80 },
        data: { label: 'Fetch Posts', method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts', status: 'idle' }
      },
      {
        id: 't3', type: 'apiNode',
        position: { x: 450, y: 320 },
        data: { label: 'Fetch Albums', method: 'GET', url: 'https://jsonplaceholder.typicode.com/albums', status: 'idle' }
      },
    ],
    edges: [
      { id: 'te1', source: 't1', target: 't2', animated: true, style: { stroke: '#ffffff', strokeWidth: 1.5 } },
      { id: 'te2', source: 't1', target: 't3', animated: true, style: { stroke: '#ffffff', strokeWidth: 1.5 } },
    ]
  },
]

export default function Sidebar() {
  const { exportWorkflow, importWorkflow } = useFlowStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [expanded, setExpanded] = useState(true)
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null)

  const onDragStart = (e: React.DragEvent, method: string) => {
    e.dataTransfer.setData('application/reactflow-method', method)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleExport = () => {
    const json = exportWorkflow()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'workflow.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      importWorkflow(ev.target?.result as string)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div
      style={{
        width: expanded ? '180px' : '56px',
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
          const el = e.currentTarget as HTMLElement
          el.style.background = 'rgba(255,255,255,0.09)'
          el.style.borderColor = 'rgba(255,255,255,0.13)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'rgba(255,255,255,0.05)'
          el.style.borderColor = 'rgba(255,255,255,0.07)'
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
                transition: 'all 0.15s ease',
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
                  minWidth: expanded ? '34px' : '36px',
                  height: '20px',
                  borderRadius: '4px',
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

      {/* Templates Section */}
      {expanded && (
        <div
          style={{
            padding: '0 10px',
            marginTop: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              paddingLeft: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
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
              }}
            >
              Templates
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {templates.map((template) => (
              <button
                key={template.name}
                onClick={() => {
                  importWorkflow(
                    JSON.stringify({
                      name: template.name,
                      nodes: template.nodes,
                      edges: template.edges,
                    })
                  )
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(255, 255, 255, 0.08)'
                  el.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                  el.style.boxShadow = '0 0 14px rgba(255, 255, 255, 0.05)'
                  const label = el.querySelector('.tpl-label') as HTMLElement
                  if (label) label.style.color = 'rgba(255,255,255,0.95)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(255, 255, 255, 0.04)'
                  el.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  el.style.boxShadow = 'none'
                  const label = el.querySelector('.tpl-label') as HTMLElement
                  if (label) label.style.color = 'rgba(255,255,255,0.65)'
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  padding: '9px 10px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <span
                  className="tpl-label"
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.65)',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {template.name}
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    color: 'rgba(255,255,255,0.30)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                  }}
                >
                  {template.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer Section: Export/Import */}
      <div
        style={{
          padding: expanded ? '16px 12px' : '16px 8px',
          flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.01))',
        }}
      >
        <button
          onClick={handleExport}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.08)'
            el.style.borderColor = 'rgba(255,255,255,0.12)'
            el.style.color = 'rgba(255,255,255,0.9)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.03)'
            el.style.borderColor = 'rgba(255,255,255,0.06)'
            el.style.color = 'rgba(255,255,255,0.45)'
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.45)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Export Workflow JSON"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {expanded && <span>Export JSON</span>}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.08)'
            el.style.borderColor = 'rgba(255,255,255,0.12)'
            el.style.color = 'rgba(255,255,255,0.9)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.03)'
            el.style.borderColor = 'rgba(255,255,255,0.06)'
            el.style.color = 'rgba(255,255,255,0.45)'
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.45)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Import Workflow JSON"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {expanded && <span>Import JSON</span>}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />

        {expanded && (
          <p
            style={{
              fontSize: '9px',
              color: 'rgba(255,255,255,0.20)',
              textAlign: 'center',
              marginTop: '6px',
              fontWeight: 500,
            }}
          >
            Drag nodes onto canvas to add
          </p>
        )}
      </div>
    </div>
  )
}