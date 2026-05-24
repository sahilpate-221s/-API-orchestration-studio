import { useState, useRef, useEffect } from 'react'
import { useFlowStore } from '../../store/flowStore'
import type { FlowNode, FlowEdge } from '../../types'
import api from '../../services/api'

const nodeLibrary = [
  { method: 'GET', label: 'Get Request', desc: 'Retrieve a resource', color: '#34d399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.18)', glow: 'rgba(52,211,153,0.20)' },
  { method: 'POST', label: 'Post Request', desc: 'Create a resource', color: '#60a5fa', bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.18)', glow: 'rgba(96,165,250,0.20)' },
  { method: 'PUT', label: 'Put Request', desc: 'Replace a resource', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.18)', glow: 'rgba(251,191,36,0.20)' },
  { method: 'DELETE', label: 'Delete Request', desc: 'Remove a resource', color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.18)', glow: 'rgba(248,113,113,0.20)' },
  { method: 'PATCH', label: 'Patch Request', desc: 'Partially update', color: '#ffffff', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.15)', glow: 'rgba(255,255,255,0.10)' },
]

type TemplateData = { name: string; description: string; nodes: FlowNode[]; edges: FlowEdge[] }

const builtInTemplates: TemplateData[] = [
  {
    name: 'Auth Flow', description: 'Login then fetch profile',
    nodes: [
      { id: 't1', type: 'apiNode', position: { x: 100, y: 100 }, data: { label: 'Login', method: 'POST' as const, url: 'https://reqres.in/api/login', status: 'idle' as const, body: '{"email":"eve.holt@reqres.in","password":"cityslicka"}' } },
      { id: 't2', type: 'apiNode', position: { x: 450, y: 100 }, data: { label: 'Get Users', method: 'GET' as const, url: 'https://reqres.in/api/users', status: 'idle' as const } },
    ],
    edges: [{ id: 'te1', source: 't1', target: 't2', animated: true, style: { stroke: '#ffffff', strokeWidth: 1.5 } }],
  },
  {
    name: 'Data Chain', description: 'Fetch → transform → post',
    nodes: [
      { id: 't1', type: 'apiNode', position: { x: 100, y: 100 }, data: { label: 'Fetch Posts', method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/posts/1', status: 'idle' as const } },
      { id: 't2', type: 'apiNode', position: { x: 450, y: 100 }, data: { label: 'Fetch Comments', method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/comments?postId=1', status: 'idle' as const } },
      { id: 't3', type: 'apiNode', position: { x: 800, y: 100 }, data: { label: 'Create Todo', method: 'POST' as const, url: 'https://jsonplaceholder.typicode.com/todos', status: 'idle' as const, body: '{"title":"review post","completed":false}' } },
    ],
    edges: [
      { id: 'te1', source: 't1', target: 't2', animated: true, style: { stroke: '#ffffff', strokeWidth: 1.5 } },
      { id: 'te2', source: 't2', target: 't3', animated: true, style: { stroke: '#ffffff', strokeWidth: 1.5 } },
    ],
  },
  {
    name: 'Parallel Fetch', description: 'Two independent API calls',
    nodes: [
      { id: 't1', type: 'apiNode', position: { x: 100, y: 200 }, data: { label: 'Trigger', method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/users/1', status: 'idle' as const } },
      { id: 't2', type: 'apiNode', position: { x: 450, y: 80 }, data: { label: 'Fetch Posts', method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/posts', status: 'idle' as const } },
      { id: 't3', type: 'apiNode', position: { x: 450, y: 320 }, data: { label: 'Fetch Albums', method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/albums', status: 'idle' as const } },
    ],
    edges: [
      { id: 'te1', source: 't1', target: 't2', animated: true, style: { stroke: '#ffffff', strokeWidth: 1.5 } },
      { id: 'te2', source: 't1', target: 't3', animated: true, style: { stroke: '#ffffff', strokeWidth: 1.5 } },
    ],
  },
]

// Shared hover helpers
const hoverBtn = (bg: string, border: string, color: string) => ({
  onMouseEnter: (e: React.MouseEvent) => { const el = e.currentTarget as HTMLElement; el.style.background = bg; el.style.borderColor = border; el.style.color = color },
  onMouseLeave: (e: React.MouseEvent) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.03)'; el.style.borderColor = 'rgba(255,255,255,0.06)'; el.style.color = 'rgba(255,255,255,0.45)' },
})
const defaultBtnHover = hoverBtn('rgba(255,255,255,0.08)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.9)')

// Chevron SVG
function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

type CustomTemplate = { _id: string; name: string; description: string; nodes: FlowNode[]; edges: FlowEdge[] }

export default function Sidebar() {
  const { nodes, edges, exportWorkflow, importWorkflow, mergeTemplate } = useFlowStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [expanded, setExpanded] = useState(true)
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null)
  const [builtinOpen, setBuiltinOpen] = useState(true)
  const [customOpen, setCustomOpen] = useState(true)
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTplName, setNewTplName] = useState('')
  const [newTplDesc, setNewTplDesc] = useState('')
  const [saving, setSaving] = useState(false)

  // Load custom templates on mount
  useEffect(() => {
    api.get('/templates').then((r) => setCustomTemplates(r.data.templates ?? [])).catch(() => {})
  }, [])

  const onDragStart = (e: React.DragEvent, method: string) => {
    e.dataTransfer.setData('application/reactflow-method', method)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleExport = () => {
    const json = exportWorkflow()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'workflow.json'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => importWorkflow(ev.target?.result as string)
    reader.readAsText(file)
    e.target.value = ''
  }

  const applyTemplate = (t: TemplateData) => {
    mergeTemplate(t.nodes as FlowNode[], t.edges as FlowEdge[])
  }

  const saveCustomTemplate = async () => {
    if (!newTplName.trim() || nodes.length === 0) return
    setSaving(true)
    try {
      const res = await api.post('/templates', { name: newTplName.trim(), description: newTplDesc.trim(), nodes, edges })
      setCustomTemplates((prev) => [res.data.template, ...prev])
      setNewTplName(''); setNewTplDesc(''); setShowCreateModal(false)
    } catch { alert('Failed to save template') }
    finally { setSaving(false) }
  }

  const deleteCustomTemplate = async (id: string) => {
    try {
      await api.delete(`/templates/${id}`)
      setCustomTemplates((prev) => prev.filter((t) => t._id !== id))
    } catch { alert('Failed to delete template') }
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 10px', fontSize: '11px', color: '#fff', outline: 'none' }
  const footerBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: expanded ? 'flex-start' : 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'all 0.15s ease', width: '100%' }

  // Template card renderer
  const renderTemplateCard = (t: TemplateData, key: string, onDelete?: () => void) => (
    <div key={key} style={{ display: 'flex', alignItems: 'stretch', gap: '0' }}>
      <button
        onClick={() => applyTemplate(t)}
        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.08)'; el.style.borderColor = 'rgba(255,255,255,0.15)' }}
        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.04)'; el.style.borderColor = 'rgba(255,255,255,0.1)' }}
        style={{ flex: 1, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '2px', padding: '9px 10px', borderRadius: onDelete ? '10px 0 0 10px' : '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRight: onDelete ? 'none' : undefined, cursor: 'pointer', transition: 'all 0.2s ease' }}
      >
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>{t.name}</span>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.30)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{t.description}</span>
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.15)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
          style={{ width: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: 'none', borderRadius: '0 10px 10px 0', cursor: 'pointer', transition: 'all 0.2s ease' }}
          title="Delete template"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      )}
    </div>
  )

  // Section header renderer
  const renderSectionHeader = (label: string, isOpen: boolean, toggle: () => void, rightAction?: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '4px', paddingRight: '4px' }}>
      <button onClick={toggle} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <Chevron open={isOpen} />
        <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.20)', textTransform: 'uppercase', userSelect: 'none' }}>{label}</span>
      </button>
      {rightAction}
    </div>
  )

  return (
    <div style={{ width: expanded ? '180px' : '56px', height: '100%', background: '#0c0c0c', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden', position: 'relative', boxShadow: '4px 0 24px rgba(0,0,0,0.4)', zIndex: 5 }}>
      {/* Toggle */}
      <button onClick={() => setExpanded((p) => !p)} style={{ position: 'absolute', top: '10px', right: '10px', width: '22px', height: '22px', borderRadius: '5px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: 'background 0.15s ease', flexShrink: 0 }} title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Node Library label */}
      <div style={{ padding: expanded ? '12px 14px 0 14px' : '12px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexShrink: 0, justifyContent: expanded ? 'flex-start' : 'center' }}>
        <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.20)', textTransform: 'uppercase', userSelect: 'none', whiteSpace: 'nowrap' }}>{expanded ? 'Node Library' : 'API'}</span>
      </div>

      {/* Scrollable content */}
      <div className="custom-scrollbar" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', padding: expanded ? '0 10px' : '0 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {/* Node items */}
        {nodeLibrary.map((node) => {
          const isH = hoveredMethod === node.method
          return (
            <div key={node.method} draggable onDragStart={(e) => onDragStart(e, node.method)} onMouseEnter={() => setHoveredMethod(node.method)} onMouseLeave={() => setHoveredMethod(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: expanded ? '7px 8px' : '6px 0', borderRadius: '8px', background: isH ? node.bg : 'transparent', border: `1px solid ${isH ? node.border : 'transparent'}`, cursor: 'grab', transition: 'all 0.15s ease', boxShadow: isH ? `0 0 14px ${node.glow}` : 'none', userSelect: 'none', justifyContent: expanded ? 'flex-start' : 'center', flexShrink: 0, position: 'relative' }}>
              <div style={{ minWidth: expanded ? '34px' : '36px', height: '20px', borderRadius: '4px', background: node.bg, border: `1px solid ${node.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '7.5px', fontWeight: 800, letterSpacing: '0.06em', color: node.color, lineHeight: 1 }}>{node.method}</span>
              </div>
              {expanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: isH ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap', transition: 'color 0.15s ease', lineHeight: 1.2 }}>{node.label}</span>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', whiteSpace: 'nowrap', lineHeight: 1.2 }}>{node.desc}</span>
                </div>
              )}
              {!expanded && isH && (
                <div style={{ position: 'absolute', left: 'calc(100% + 10px)', top: '50%', transform: 'translateY(-50%)', background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '5px 9px', whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.75)', pointerEvents: 'none', zIndex: 50, boxShadow: '0 4px 14px rgba(0,0,0,0.5)' }}>{node.label}</div>
              )}
            </div>
          )
        })}

        {/* Built-in Templates */}
        {expanded && (
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
            {renderSectionHeader('Templates', builtinOpen, () => setBuiltinOpen((p) => !p))}
            {builtinOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {builtInTemplates.map((t) => renderTemplateCard(t, `b-${t.name}`))}
              </div>
            )}
          </div>
        )}

        {/* Custom Templates */}
        {expanded && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, paddingBottom: '12px' }}>
            {renderSectionHeader('My Templates', customOpen, () => setCustomOpen((p) => !p),
              <button onClick={() => setShowCreateModal(true)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '10px', fontWeight: 700, cursor: 'pointer', padding: '2px 4px' }} title="Save current canvas as template">+ New</button>
            )}
            {customOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {customTemplates.length === 0 && <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', paddingLeft: '4px' }}>No custom templates yet</p>}
                {customTemplates.map((t) => renderTemplateCard(
                  { name: t.name, description: t.description, nodes: t.nodes, edges: t.edges },
                  `c-${t._id}`,
                  () => deleteCustomTemplate(t._id)
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: expanded ? '16px 12px' : '16px 8px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.01))' }}>
        <button onClick={handleExport} {...defaultBtnHover} style={footerBtnStyle} title="Export Workflow JSON">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          {expanded && <span>Export JSON</span>}
        </button>
        <button onClick={() => fileInputRef.current?.click()} {...defaultBtnHover} style={footerBtnStyle} title="Import Workflow JSON">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          {expanded && <span>Import JSON</span>}
        </button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        {expanded && <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.20)', textAlign: 'center', marginTop: '6px', fontWeight: 500 }}>Drag nodes onto canvas to add</p>}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <>
          <div onClick={() => setShowCreateModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '340px', background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', zIndex: 101, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#fff' }}>Save as Template</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Save the current {nodes.length} node(s) and {edges.length} edge(s) as a reusable template available across all projects.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input value={newTplName} onChange={(e) => setNewTplName(e.target.value)} placeholder="Template name" style={inputStyle} autoFocus onKeyDown={(e) => e.key === 'Enter' && saveCustomTemplate()} />
              <input value={newTplDesc} onChange={(e) => setNewTplDesc(e.target.value)} placeholder="Short description (optional)" style={inputStyle} onKeyDown={(e) => e.key === 'Enter' && saveCustomTemplate()} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreateModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveCustomTemplate} disabled={saving || !newTplName.trim() || nodes.length === 0} style={{ padding: '8px 16px', borderRadius: '8px', background: '#60a5fa', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving || !newTplName.trim() ? 0.5 : 1 }}>{saving ? 'Saving...' : 'Save Template'}</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}