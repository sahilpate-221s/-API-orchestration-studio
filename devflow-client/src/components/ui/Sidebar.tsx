import { useState, useRef, useEffect, useCallback } from 'react'
import { useFlowStore } from '../../store/flowStore'
import type { FlowNode, FlowEdge } from '../../types'
import api from '../../services/api'

const nodeLibrary = [
  { method: 'GET', label: 'Get Request', desc: 'Retrieve a resource', color: '#3ECF8E', bg: 'rgba(62,207,142,0.10)', border: 'rgba(62,207,142,0.22)', glow: 'rgba(62,207,142,0.20)' },
  { method: 'POST', label: 'Post Request', desc: 'Create a resource', color: '#8B7CF6', bg: 'rgba(139,124,246,0.10)', border: 'rgba(139,124,246,0.22)', glow: 'rgba(139,124,246,0.20)' },
  { method: 'PUT', label: 'Put Request', desc: 'Replace a resource', color: '#EF9F27', bg: 'rgba(239,159,39,0.10)', border: 'rgba(239,159,39,0.22)', glow: 'rgba(239,159,39,0.20)' },
  { method: 'DELETE', label: 'Delete Request', desc: 'Remove a resource', color: '#E24B4A', bg: 'rgba(226,75,74,0.10)', border: 'rgba(226,75,74,0.22)', glow: 'rgba(226,75,74,0.20)' },
  { method: 'PATCH', label: 'Patch Request', desc: 'Partially update', color: '#F2F3F5', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.15)', glow: 'rgba(255,255,255,0.10)' },
]

type TemplateData = { name: string; description: string; nodes: FlowNode[]; edges: FlowEdge[] }

const builtInTemplates: TemplateData[] = [
  {
    name: 'Auth Flow', description: 'Login then fetch profile',
    nodes: [
      { id: 't1', type: 'apiNode', position: { x: 100, y: 100 }, data: { label: 'Login', method: 'POST' as const, url: 'https://reqres.in/api/login', status: 'idle' as const, body: '{"email":"eve.holt@reqres.in","password":"cityslicka"}' } },
      { id: 't2', type: 'apiNode', position: { x: 450, y: 100 }, data: { label: 'Get Users', method: 'GET' as const, url: 'https://reqres.in/api/users', status: 'idle' as const } },
    ],
    edges: [{ id: 'te1', source: 't1', target: 't2', animated: true, style: { stroke: '#3ECF8E', strokeWidth: 1.5 } }],
  },
  {
    name: 'Data Chain', description: 'Fetch → transform → post',
    nodes: [
      { id: 't1', type: 'apiNode', position: { x: 100, y: 100 }, data: { label: 'Fetch Posts', method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/posts/1', status: 'idle' as const } },
      { id: 't2', type: 'apiNode', position: { x: 450, y: 100 }, data: { label: 'Fetch Comments', method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/comments?postId=1', status: 'idle' as const } },
      { id: 't3', type: 'apiNode', position: { x: 800, y: 100 }, data: { label: 'Create Todo', method: 'POST' as const, url: 'https://jsonplaceholder.typicode.com/todos', status: 'idle' as const, body: '{"title":"review post","completed":false}' } },
    ],
    edges: [
      { id: 'te1', source: 't1', target: 't2', animated: true, style: { stroke: '#3ECF8E', strokeWidth: 1.5 } },
      { id: 'te2', source: 't2', target: 't3', animated: true, style: { stroke: '#3ECF8E', strokeWidth: 1.5 } },
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
      { id: 'te1', source: 't1', target: 't2', animated: true, style: { stroke: '#3ECF8E', strokeWidth: 1.5 } },
      { id: 'te2', source: 't1', target: 't3', animated: true, style: { stroke: '#3ECF8E', strokeWidth: 1.5 } },
    ],
  },
]

// Shared hover helpers
const hoverBtn = (bg: string, border: string, color: string) => ({
  onMouseEnter: (e: React.MouseEvent) => { const el = e.currentTarget as HTMLElement; el.style.background = bg; el.style.borderColor = border; el.style.color = color },
  onMouseLeave: (e: React.MouseEvent) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.03)'; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.color = '#93959D' },
})
const defaultBtnHover = hoverBtn('rgba(62,207,142,0.08)', 'rgba(62,207,142,0.25)', '#3ECF8E')

// Chevron SVG
function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#5A5C64" strokeWidth="2.5" strokeLinecap="round" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

type CustomTemplate = { _id: string; name: string; description: string; nodes: FlowNode[]; edges: FlowEdge[] }
type TooltipState = { label: string; top: number; left: number } | null

function AIWorkflowGenerator({ mergeTemplate }: { mergeTemplate: (nodes: FlowNode[], edges: FlowEdge[]) => void }) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState('')

  const generate = async () => {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError('')
    setExplanation('')

    try {
      const res = await api.post('/ai/generate-workflow', { description: prompt })
      const { workflow } = res.data

      // Convert AI response nodes to FlowNode format
      const flowNodes: FlowNode[] = workflow.nodes.map((n: any) => ({
        id: `ai-${n.id}-${Date.now()}`,
        type: 'apiNode',
        position: n.position,
        data: {
          label: n.label,
          method: n.method as any,
          url: n.url,
          status: 'idle' as const,
          headers: n.headers ?? {},
          body: n.body ?? '',
        },
      }))

      // Build id map for edges (old id → new id)
      const idMap = new Map<string, string>()
      workflow.nodes.forEach((n: any, i: number) => {
        idMap.set(n.id, flowNodes[i].id)
      })

      // Convert edges
      const flowEdges: FlowEdge[] = workflow.edges.map((e: any, i: number) => ({
        id: `ai-edge-${i}-${Date.now()}`,
        source: idMap.get(e.source) ?? e.source,
        target: idMap.get(e.target) ?? e.target,
        animated: true,
        style: { stroke: '#3ECF8E', strokeWidth: 1.5 },
      }))

      mergeTemplate(flowNodes, flowEdges)
      setExplanation(workflow.explanation)
      setPrompt('')
    } catch (err) {
      setError('Failed to generate workflow. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: '20px', marginBottom: '4px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '4px' }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3ECF8E" strokeWidth="2.5">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.14em', color: '#5A5C64', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
          AI Workflow
        </span>
      </div>

      {/* Input area */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              generate()
            }
          }}
          placeholder='Describe a workflow... e.g. "Fetch a user, get their posts, then send results to a webhook"'
          disabled={loading}
          rows={5}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '10px',
            padding: '10px 12px',
            paddingBottom: '36px',
            fontSize: '11px',
            color: '#F2F3F5',
            outline: 'none',
            fontFamily: 'inherit',
            resize: 'none',
            boxSizing: 'border-box',
            lineHeight: 1.5,
            transition: 'border-color 0.15s ease',
            opacity: loading ? 0.6 : 1,
            overflow: 'hidden',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(62,207,142,0.45)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
        />

        {/* Generate button inside textarea */}
        <button
          onClick={generate}
          disabled={!prompt.trim() || loading}
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            padding: '4px 10px',
            borderRadius: '7px',
            background: prompt.trim() && !loading ? '#3ECF8E' : 'rgba(255,255,255,0.05)',
            border: 'none',
            color: prompt.trim() && !loading ? '#06110C' : '#5A5C64',
            fontSize: '10px',
            fontWeight: 700,
            cursor: prompt.trim() && !loading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.15s ease',
            fontFamily: 'inherit',
          }}
        >
          {loading ? (
            <>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Building...
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              Generate
            </>
          )}
        </button>
      </div>

      {/* Success explanation */}
      {explanation && !loading && (
        <div style={{
          padding: '8px 10px',
          background: 'rgba(62,207,142,0.06)',
          border: '1px solid rgba(62,207,142,0.18)',
          borderRadius: '8px',
          fontSize: '10px',
          color: '#3ECF8E',
          lineHeight: 1.5,
          display: 'flex',
          gap: '6px',
          alignItems: 'flex-start'
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3ECF8E" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '1px' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {explanation}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: '8px 10px',
          background: 'rgba(226,75,74,0.06)',
          border: '1px solid rgba(226,75,74,0.18)',
          borderRadius: '8px',
          fontSize: '10px',
          color: '#E24B4A',
          lineHeight: 1.5
        }}>
          {error}
        </div>
      )}

      {/* Hint examples */}
      {!explanation && !error && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            'Fetch user then get their posts',
            'Login and get profile data',
            'Create order then confirm it',
          ].map(hint => (
            <button
              key={hint}
              onClick={() => setPrompt(hint)}
              style={{
                textAlign: 'left',
                background: 'none',
                border: 'none',
                padding: '3px 4px',
                fontSize: '9.5px',
                color: '#5A5C64',
                cursor: 'pointer',
                fontFamily: 'inherit',
                borderRadius: '4px',
                transition: 'color 0.12s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#93959D' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#5A5C64' }}
            >
              <span style={{ color: '#3ECF8E', fontSize: '8px' }}>→</span>
              {hint}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default function Sidebar() {
  const { nodes, edges, exportWorkflow, importWorkflow, mergeTemplate } = useFlowStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [expanded, setExpanded] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(200)
  const isDraggingSidebar = useRef(false)

  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState>(null)
  const [builtinOpen, setBuiltinOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTplName, setNewTplName] = useState('')
  const [newTplDesc, setNewTplDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [nodeLibOpen, setNodeLibOpen] = useState(true)

  // Dynamic Sidebar Resizing Handler (Drag Right/Left)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingSidebar.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSidebar.current) return
      const newWidth = e.clientX
      // Clamp width between 160px and 450px
      const clamped = Math.max(160, Math.min(newWidth, 450))
      setSidebarWidth(clamped)
      setExpanded(true)
    }

    const handleMouseUp = () => {
      isDraggingSidebar.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [])

  // Load custom templates on mount
  useEffect(() => {
    api.get('/templates').then((r) => setCustomTemplates(r.data.templates ?? [])).catch(() => { })
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

  const showTooltip = (e: React.MouseEvent, label: string) => {
    if (expanded) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltip({ label, top: rect.top + rect.height / 2, left: rect.right + 10 })
  }
  const hideTooltip = () => setTooltip(null)

  const focusRing = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(62,207,142,0.55)'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(62,207,142,0.12)'
  }
  const blurRing = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
    e.currentTarget.style.boxShadow = 'none'
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', padding: '9px 11px', fontSize: '12px', color: '#F2F3F5', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s ease, box-shadow 0.15s ease', boxSizing: 'border-box' }
  const footerBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: expanded ? 'flex-start' : 'center', gap: '10px', padding: '8px 10px', borderRadius: '9px', fontSize: '11px', fontWeight: 500, color: '#93959D', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'all 0.15s ease', width: '100%' }

  // Template card renderer
  const renderTemplateCard = (t: TemplateData, key: string, onDelete?: () => void) => (
    <div key={key} style={{ display: 'flex', alignItems: 'stretch', gap: '0' }}>
      <button
        onClick={() => applyTemplate(t)}
        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(62,207,142,0.07)'; el.style.borderColor = 'rgba(62,207,142,0.28)' }}
        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.03)'; el.style.borderColor = 'rgba(255,255,255,0.09)' }}
        style={{ flex: 1, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '2px', padding: '9px 10px', borderRadius: onDelete ? '10px 0 0 10px' : '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRight: onDelete ? 'none' : undefined, cursor: 'pointer', transition: 'all 0.18s ease' }}
      >
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#C9CBD1' }}>{t.name}</span>
        <span style={{ fontSize: '9px', color: '#5A5C64', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{t.description}</span>
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(226,75,74,0.14)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
          style={{ width: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderLeft: 'none', borderRadius: '0 10px 10px 0', cursor: 'pointer', transition: 'all 0.18s ease' }}
          title="Delete template"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  )

  // Section header renderer
  const renderSectionHeader = (label: string, isOpen: boolean, toggle: () => void, rightAction?: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '4px', paddingRight: '4px' }}>
      <button onClick={toggle} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <Chevron open={isOpen} />
        <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.14em', color: '#5A5C64', textTransform: 'uppercase', userSelect: 'none', fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
      </button>
      {rightAction}
    </div>
  )

  return (
    <div
      style={{
        width: expanded ? `${sidebarWidth}px` : '56px',
        height: '100%',
        background: '#0B0C0E',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: isDraggingSidebar.current ? 'none' : 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
        zIndex: 5,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Dynamic Drag Handle on right edge */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 bottom-0 right-0 w-3 -mr-1.5 cursor-col-resize z-40 group flex items-center justify-center hover:bg-[#3ECF8E]/10 transition-colors"
        title="Drag right/left to adjust sidebar width"
      >
        <div className="w-1 h-14 rounded-full bg-white/20 group-hover:bg-[#3ECF8E] transition-all group-hover:h-20 group-hover:shadow-[0_0_12px_#3ECF8E]" />
      </div>

      {/* Toggle */}
      <button
        onClick={() => setExpanded((p) => !p)}
        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(62,207,142,0.12)'; el.style.borderColor = 'rgba(62,207,142,0.3)'; const svg = el.querySelector('svg'); if (svg) svg.style.stroke = '#3ECF8E' }}
        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.04)'; el.style.borderColor = 'rgba(255,255,255,0.08)'; const svg = el.querySelector('svg'); if (svg) svg.style.stroke = '#93959D' }}
        style={{ position: 'absolute', top: '10px', right: '10px', width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: 'background 0.15s ease, border-color 0.15s ease', flexShrink: 0 }}
        title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#93959D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), stroke 0.15s ease' }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Node Library label — collapsible */}
      <div
        onClick={() => expanded && setNodeLibOpen(p => !p)}
        style={{ padding: expanded ? '12px 14px 0 14px' : '12px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexShrink: 0, justifyContent: expanded ? 'flex-start' : 'center', cursor: expanded ? 'pointer' : 'default', userSelect: 'none' }}
      >
        {expanded && <Chevron open={nodeLibOpen} />}
        <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.14em', color: '#5A5C64', textTransform: 'uppercase', userSelect: 'none', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>{expanded ? 'Node Library' : 'API'}</span>
      </div>

      {/* Scrollable content */}
      <div className="custom-scrollbar" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', padding: expanded ? '0 10px' : '0 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {/* Node items */}
        {(!expanded || nodeLibOpen) && nodeLibrary.map((node) => {
          const isH = hoveredMethod === node.method
          return (
            <div
              key={node.method}
              draggable
              onDragStart={(e) => onDragStart(e, node.method)}
              onMouseEnter={(e) => { setHoveredMethod(node.method); showTooltip(e, node.label) }}
              onMouseLeave={() => { setHoveredMethod(null); hideTooltip() }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: expanded ? '7px 8px' : '6px 0', borderRadius: '8px', background: isH ? node.bg : 'transparent', border: `1px solid ${isH ? node.border : 'transparent'}`, cursor: 'grab', transition: 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease', boxShadow: isH ? `0 0 14px ${node.glow}` : 'none', userSelect: 'none', justifyContent: expanded ? 'flex-start' : 'center', flexShrink: 0, position: 'relative', width: '100%', boxSizing: 'border-box' }}
            >
              <div style={{ minWidth: expanded ? '34px' : '36px', height: '20px', borderRadius: '5px', background: node.bg, border: `1px solid ${node.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.06em', color: node.color, lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>{node.method}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', overflow: 'hidden', flex: expanded ? 1 : 0, minWidth: 0, opacity: expanded ? 1 : 0, transition: 'flex 0.22s ease, opacity 0.15s ease' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: isH ? '#F2F3F5' : '#C9CBD1', whiteSpace: 'nowrap', transition: 'color 0.15s ease', lineHeight: 1.2 }}>{node.label}</span>
                <span style={{ fontSize: '10px', color: '#5A5C64', whiteSpace: 'nowrap', lineHeight: 1.2 }}>{node.desc}</span>
              </div>
            </div>
          )
        })}

        {/* AI Workflow Generator */}
        {expanded && (
          <AIWorkflowGenerator mergeTemplate={mergeTemplate} />
        )}

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
              <button onClick={() => setShowCreateModal(true)} style={{ background: 'none', border: 'none', color: '#3ECF8E', fontSize: '10px', fontWeight: 700, cursor: 'pointer', padding: '2px 4px', fontFamily: "'JetBrains Mono', monospace" }} title="Save current canvas as template">+ New</button>
            )}
            {customOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {customTemplates.length === 0 && <p style={{ margin: 0, fontSize: '10px', color: '#5A5C64', fontStyle: 'italic', paddingLeft: '4px' }}>No custom templates yet</p>}
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
      <div style={{ padding: expanded ? '16px 12px' : '16px 8px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.015))' }}>
        <button onClick={handleExport} {...defaultBtnHover} style={footerBtnStyle} title="Export Workflow JSON">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          {expanded && <span>Export JSON</span>}
        </button>
        <button onClick={() => fileInputRef.current?.click()} {...defaultBtnHover} style={footerBtnStyle} title="Import Workflow JSON">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          {expanded && <span>Import JSON</span>}
        </button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        {expanded && <p style={{ fontSize: '9px', color: '#5A5C64', textAlign: 'center', marginTop: '6px', fontWeight: 500 }}>Drag nodes onto canvas to add</p>}
      </div>

      {/* Collapsed-rail tooltip */}
      {tooltip && !expanded && (
        <div
          style={{
            position: 'fixed',
            top: tooltip.top,
            left: tooltip.left,
            transform: 'translateY(-50%)',
            background: '#17181C',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '7px',
            padding: '5px 9px',
            whiteSpace: 'nowrap',
            fontSize: '11px',
            fontWeight: 500,
            color: '#F2F3F5',
            pointerEvents: 'none',
            zIndex: 200,
            boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
          }}
        >
          {tooltip.label}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <>
          <div onClick={() => setShowCreateModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 100 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '340px', background: '#131417', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', zIndex: 101, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#F2F3F5', fontFamily: "'Inter Tight', 'Inter', sans-serif" }}>Save as Template</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#F2F3F5' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#5A5C64' }}
                style={{ background: 'none', border: 'none', color: '#5A5C64', cursor: 'pointer', transition: 'color 0.15s ease' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: '#93959D', lineHeight: 1.6 }}>Save the current {nodes.length} node(s) and {edges.length} edge(s) as a reusable template available across all projects.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input value={newTplName} onChange={(e) => setNewTplName(e.target.value)} placeholder="Template name" style={inputStyle} autoFocus onFocus={focusRing} onBlur={blurRing} onKeyDown={(e) => e.key === 'Enter' && saveCustomTemplate()} />
              <input value={newTplDesc} onChange={(e) => setNewTplDesc(e.target.value)} placeholder="Short description (optional)" style={inputStyle} onFocus={focusRing} onBlur={blurRing} onKeyDown={(e) => e.key === 'Enter' && saveCustomTemplate()} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '9px 16px', borderRadius: '9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#93959D', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}
              >
                Cancel
              </button>
              <button
                onClick={saveCustomTemplate}
                disabled={saving || !newTplName.trim() || nodes.length === 0}
                style={{ padding: '9px 16px', borderRadius: '9px', background: '#3ECF8E', border: 'none', color: '#06110C', fontSize: '12px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving || !newTplName.trim() || nodes.length === 0 ? 0.5 : 1, transition: 'opacity 0.15s ease, background 0.15s ease' }}
              >
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}