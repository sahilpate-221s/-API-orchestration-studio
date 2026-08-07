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

// Add drag handler for condition node
const onConditionDragStart = (e: React.DragEvent) => {
  e.dataTransfer.setData('application/reactflow-nodetype', 'conditionNode')
  e.dataTransfer.effectAllowed = 'move'
}

const onWebhookDragStart = (e: React.DragEvent) => {
  e.dataTransfer.setData('application/reactflow-nodetype', 'webhookNode')
  e.dataTransfer.effectAllowed = 'move'
}

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

function OpenAPIImporter({
  mergeTemplate,
  open,
  setOpen,
}: {
  mergeTemplate: (nodes: FlowNode[], edges: FlowEdge[]) => void
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const { importWorkflow } = useFlowStore()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fileName, setFileName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setFileName(f.name)
    setError('')
    setSuccess('')
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Smart detection: check if file is a DevFlow JSON workflow first
      const fileText = await file.text()
      try {
        const parsed = JSON.parse(fileText)
        if (parsed && (Array.isArray(parsed.nodes) || Array.isArray(parsed.edges)) && !parsed.openapi && !parsed.swagger && !parsed.paths) {
          importWorkflow(fileText)
          setSuccess('Workflow imported successfully!')
          setFile(null)
          setFileName('')
          setPrompt('')
          if (fileInputRef.current) fileInputRef.current.value = ''
          setTimeout(() => {
            setOpen(false)
            setSuccess('')
          }, 1500)
          return
        }
      } catch (e) {
        // Not a valid DevFlow JSON, process as OpenAPI spec
      }

      const formData = new FormData()
      formData.append('spec', file)
      if (prompt.trim()) formData.append('prompt', prompt.trim())

      const res = await api.post('/ai/import-openapi', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const { workflow } = res.data

      // Convert to FlowNodes
      const flowNodes: FlowNode[] = workflow.nodes.map((n: any) => ({
        id: `api-${n.id}-${Date.now()}`,
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

      const idMap = new Map<string, string>()
      workflow.nodes.forEach((n: any, i: number) => {
        idMap.set(n.id, flowNodes[i].id)
      })

      const flowEdges: FlowEdge[] = workflow.edges.map((e: any, i: number) => ({
        id: `api-edge-${i}-${Date.now()}`,
        source: idMap.get(e.source) ?? e.source,
        target: idMap.get(e.target) ?? e.target,
        animated: true,
        style: { stroke: '#8B7CF6', strokeWidth: 1.5 },
      }))

      mergeTemplate(flowNodes, flowEdges)
      setSuccess(workflow.explanation)
      setFile(null)
      setFileName('')
      setPrompt('')
      if (fileInputRef.current) fileInputRef.current.value = ''

      // Close modal after short delay
      setTimeout(() => {
        setOpen(false)
        setSuccess('')
      }, 2500)

    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to import spec. Check the file format.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div
        onClick={() => { setOpen(false); setError(''); setSuccess('') }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
        }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: '420px',
        background: '#131417',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '18px',
        padding: '24px',
        zIndex: 101,
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        display: 'flex', flexDirection: 'column', gap: '18px',
        fontFamily: 'inherit',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#F2F3F5' }}>
              Import Spec / Workflow
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#5A5C64', lineHeight: 1.5 }}>
              Upload a Swagger/OpenAPI spec (.json/.yaml) or a DevFlow workflow JSON.<br />
              AI will generate a connected workflow, or load your workflow directly.
            </p>
          </div>
          <button
            onClick={() => { setOpen(false); setError(''); setSuccess('') }}
            style={{
              background: 'none', border: 'none', color: '#5A5C64',
              cursor: 'pointer', padding: '2px', transition: 'color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F2F3F5' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#5A5C64' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* File upload area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${fileName ? 'rgba(139,124,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: fileName ? 'rgba(139,124,246,0.05)' : 'rgba(255,255,255,0.02)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = 'rgba(139,124,246,0.5)'
            el.style.background = 'rgba(139,124,246,0.07)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = fileName ? 'rgba(139,124,246,0.4)' : 'rgba(255,255,255,0.1)'
            el.style.background = fileName ? 'rgba(139,124,246,0.05)' : 'rgba(255,255,255,0.02)'
          }}
        >
          {fileName ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B7CF6" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#8B7CF6' }}>
                {fileName}
              </span>
              <button
                onClick={e => {
                  e.stopPropagation()
                  setFile(null)
                  setFileName('')
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                style={{
                  background: 'none', border: 'none', color: '#5A5C64',
                  cursor: 'pointer', padding: '2px',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5A5C64" strokeWidth="1.5" style={{ margin: '0 auto 8px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p style={{ margin: 0, fontSize: '13px', color: '#93959D', fontWeight: 500 }}>
                Click to upload file
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#5A5C64' }}>
                Supports OpenAPI spec (.json/.yaml) or workflow JSON
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.yaml,.yml"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
        </div>

        {/* Optional prompt */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{
            fontSize: '10px', fontWeight: 700, color: '#5A5C64',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            Describe what to build (optional for OpenAPI)
          </label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Create a user then fetch their orders and send a notification"
            rows={2}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px', padding: '10px 12px',
              fontSize: '12px', color: '#F2F3F5', outline: 'none',
              fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box',
              lineHeight: 1.5, transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,124,246,0.45)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
          <p style={{ margin: 0, fontSize: '10px', color: '#5A5C64' }}>
            Leave blank to let AI choose the best workflow, or skip if importing JSON.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 12px',
            background: 'rgba(226,75,74,0.08)',
            border: '1px solid rgba(226,75,74,0.2)',
            borderRadius: '10px',
            fontSize: '11px', color: '#f87171', lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{
            padding: '10px 12px',
            background: 'rgba(62,207,142,0.08)',
            border: '1px solid rgba(62,207,142,0.2)',
            borderRadius: '10px',
            fontSize: '11px', color: '#3ECF8E', lineHeight: 1.5,
            display: 'flex', gap: '8px', alignItems: 'flex-start',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '1px' }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {success}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => { setOpen(false); setError(''); setSuccess('') }}
            style={{
              padding: '9px 16px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#93959D', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            style={{
              padding: '9px 20px', borderRadius: '10px',
              background: file && !loading ? '#8B7CF6' : 'rgba(139,124,246,0.2)',
              border: 'none',
              color: file && !loading ? '#fff' : 'rgba(255,255,255,0.3)',
              fontSize: '12px', fontWeight: 700,
              cursor: file && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.15s',
            }}
          >
            {loading ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                Import Spec
              </>
            )}
          </button>
        </div>
      </div>
    </>
  )
}

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

      // Convert AI response nodes to FlowNode format (handling both apiNode and conditionNode)
      const flowNodes: FlowNode[] = workflow.nodes.map((n: any) => {
        if (n.type === 'conditionNode') {
          return {
            id: `ai-${n.id}-${Date.now()}`,
            type: 'conditionNode',
            position: n.position,
            data: {
              label: n.label || 'Check Condition',
              sourcePath: n.sourcePath || '$.status',
              operator: (n.operator || 'eq') as any,
              compareValue: n.compareValue !== undefined ? String(n.compareValue) : '200',
              status: 'idle' as const,
              sourceNodeId: n.sourceNodeId || '',
              trueLabel: n.trueLabel || 'YES',
              falseLabel: n.falseLabel || 'NO',
            },
          }
        }
        return {
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
        }
      })

      // Build id map for edges (old id → new id)
      const idMap = new Map<string, string>()
      workflow.nodes.forEach((n: any, i: number) => {
        idMap.set(n.id, flowNodes[i].id)
      })

      // Convert edges preserving sourceHandle / targetHandle
      const flowEdges: FlowEdge[] = workflow.edges.map((e: any, i: number) => ({
        id: `ai-edge-${i}-${Date.now()}`,
        source: idMap.get(e.source) ?? e.source,
        target: idMap.get(e.target) ?? e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        animated: true,
        style: { stroke: e.sourceHandle === 'false' ? '#f87171' : '#3ECF8E', strokeWidth: 1.5 },
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
  const [sidebarWidth, setSidebarWidth] = useState(220)
  const isDraggingSidebar = useRef(false)

  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState>(null)
  const [builtinOpen, setBuiltinOpen] = useState(true)
  const [customOpen, setCustomOpen] = useState(true)
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTplName, setNewTplName] = useState('')
  const [newTplDesc, setNewTplDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'nodes' | 'ai' | 'templates'>('nodes')
  const [openApiModalOpen, setOpenApiModalOpen] = useState(false)
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null)

  useEffect(() => {
    const checkHealth = () => {
      api.get('/health')
        .then(() => setBackendHealthy(true))
        .catch(() => setBackendHealthy(false))
    }
    checkHealth()
    const interval = setInterval(checkHealth, 8000)
    return () => clearInterval(interval)
  }, [])

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

  // Tab configuration
  const tabs = [
    {
      id: 'nodes' as const,
      label: 'Nodes',
      icon: (active: boolean) => (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={active ? '#3ECF8E' : '#5A5C64'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      id: 'ai' as const,
      label: 'AI',
      icon: (active: boolean) => (
        <svg width="11" height="11" viewBox="0 0 24 24" fill={active ? '#3ECF8E' : 'none'} stroke={active ? '#3ECF8E' : '#5A5C64'} strokeWidth="2">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      ),
    },
    {
      id: 'templates' as const,
      label: 'Templates',
      icon: (active: boolean) => (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={active ? '#3ECF8E' : '#5A5C64'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
    },
  ]

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

      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: expanded ? 'space-between' : 'center',
        padding: expanded ? '12px 10px 0 14px' : '14px 0 6px 0',
        flexShrink: 0,
      }}>
        {/* DevFlow logo label */}
        <div style={{
          alignItems: 'center', gap: '8px',
          userSelect: 'none',
          display: expanded ? 'flex' : 'none'
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3ECF8E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span style={{
            fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em',
            color: '#5A5C64', textTransform: 'uppercase',
            fontFamily: "'JetBrains Mono', monospace",
            whiteSpace: 'nowrap',
          }}>
            Toolbox
          </span>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setExpanded((p) => !p)}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(62,207,142,0.12)'; el.style.borderColor = 'rgba(62,207,142,0.3)'; const svg = el.querySelector('svg'); if (svg) svg.style.stroke = '#3ECF8E' }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.04)'; el.style.borderColor = 'rgba(255,255,255,0.08)'; const svg = el.querySelector('svg'); if (svg) svg.style.stroke = '#93959D' }}
          style={{
            width: '22px', height: '22px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'background 0.15s ease, border-color 0.15s ease',
            flexShrink: 0,
            marginRight: expanded ? '0' : '0'
          }}
          title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#93959D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), stroke 0.15s ease' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Tab Bar — only when expanded */}
      {expanded && (
        <div style={{ flexShrink: 0, padding: '10px 10px 0 10px' }}>
          <div style={{
            display: 'flex', gap: '4px',
            padding: '3px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                    padding: '6px 4px',
                    borderRadius: '8px',
                    background: isActive ? 'rgba(62,207,142,0.10)' : 'transparent',
                    border: isActive ? '1px solid rgba(62,207,142,0.22)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = 'rgba(255,255,255,0.05)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = 'transparent'
                    }
                  }}
                >
                  {tab.icon(isActive)}
                  <span style={{
                    fontSize: '8.5px', fontWeight: isActive ? 700 : 600,
                    color: isActive ? '#3ECF8E' : '#5A5C64',
                    letterSpacing: '0.04em',
                    transition: 'color 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}>
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Scrollable content — tab-driven */}
      <div className="custom-scrollbar" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', padding: expanded ? '10px 10px' : '8px 8px', overflowY: 'auto', overflowX: 'hidden' }}>

        {/* ═══ NODES TAB ═══ */}
        {(activeTab === 'nodes' || !expanded) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' }}>
            {/* Drag hint for nodes tab */}
            {expanded && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 8px', marginBottom: '4px',
                background: 'rgba(62,207,142,0.04)',
                borderRadius: '8px',
                border: '1px solid rgba(62,207,142,0.08)',
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3ECF8E" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <path d="M5 9l4-4 4 4" /><path d="M13 15l4 4 4-4" />
                  <rect x="9" y="5" width="2" height="14" rx="1" fill="#3ECF8E" stroke="none" />
                </svg>
                <span style={{ fontSize: '9px', color: '#5A5C64', fontWeight: 500 }}>
                  Drag nodes onto canvas
                </span>
              </div>
            )}

            {/* Node items */}
            {nodeLibrary.map((node) => {
              const isH = hoveredMethod === node.method
              return (
                <div
                  key={node.method}
                  draggable
                  onDragStart={(e) => onDragStart(e, node.method)}
                  onMouseEnter={(e) => { setHoveredMethod(node.method); showTooltip(e, node.label) }}
                  onMouseLeave={() => { setHoveredMethod(null); hideTooltip() }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: expanded ? 'flex-start' : 'center',
                    padding: expanded ? '7px 8px' : '6px 0', borderRadius: '8px',
                    background: isH ? node.bg : 'transparent', border: `1px solid ${isH ? node.border : 'transparent'}`,
                    cursor: 'grab', transition: 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                    boxShadow: isH ? `0 0 14px ${node.glow}` : 'none', userSelect: 'none',
                    flexShrink: 0, position: 'relative', width: '100%', boxSizing: 'border-box'
                  }}
                >
                  <div style={{ width: expanded ? '34px' : '36px', height: '20px', borderRadius: '5px', background: node.bg, border: `1px solid ${node.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.06em', color: node.color, lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>{node.method}</span>
                  </div>
                  {expanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', overflow: 'hidden', flex: 1, minWidth: 0, marginLeft: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: isH ? '#F2F3F5' : '#C9CBD1', whiteSpace: 'nowrap', transition: 'color 0.15s ease', lineHeight: 1.2 }}>{node.label}</span>
                      <span style={{ fontSize: '10px', color: '#5A5C64', whiteSpace: 'nowrap', lineHeight: 1.2 }}>{node.desc}</span>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Divider for logic/automation nodes */}
            <div style={{
              height: '1px',
              background: 'rgba(255,255,255,0.06)',
              margin: '8px 4px',
              width: 'calc(100% - 8px)'
            }} />

            {/* Condition node */}
            <div
              draggable
              onDragStart={onConditionDragStart}
              onMouseEnter={(e) => { setHoveredMethod('CONDITION'); showTooltip(e, 'Condition') }}
              onMouseLeave={() => { setHoveredMethod(null); hideTooltip() }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: expanded ? 'flex-start' : 'center',
                padding: expanded ? '7px 8px' : '6px 0',
                borderRadius: '8px',
                background: hoveredMethod === 'CONDITION' ? 'rgba(251,191,36,0.10)' : 'transparent',
                border: `1px solid ${hoveredMethod === 'CONDITION' ? 'rgba(251,191,36,0.22)' : 'transparent'}`,
                cursor: 'grab',
                transition: 'all 0.15s ease',
                boxShadow: hoveredMethod === 'CONDITION' ? '0 0 14px rgba(251,191,36,0.15)' : 'none',
                userSelect: 'none',
                flexShrink: 0,
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div style={{
                width: expanded ? '34px' : '36px',
                height: '20px',
                borderRadius: '5px',
                background: 'rgba(251,191,36,0.10)',
                border: '1px solid rgba(251,191,36,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#fbbf24', fontFamily: "'JetBrains Mono', monospace" }}>IF</span>
              </div>
              {expanded && (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '1px', overflow: 'hidden',
                  flex: 1, minWidth: 0, marginLeft: '10px'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: hoveredMethod === 'CONDITION' ? '#F2F3F5' : '#C9CBD1', whiteSpace: 'nowrap' }}>Condition</span>
                  <span style={{ fontSize: '10px', color: '#5A5C64', whiteSpace: 'nowrap' }}>Branch on value</span>
                </div>
              )}
            </div>

            {/* Webhook Trigger Node */}
            <div
              draggable
              onDragStart={onWebhookDragStart}
              onMouseEnter={(e) => { setHoveredMethod('WEBHOOK'); showTooltip(e, 'Webhook') }}
              onMouseLeave={() => { setHoveredMethod(null); hideTooltip() }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: expanded ? '7px 8px' : '6px 0',
                borderRadius: '8px',
                background: hoveredMethod === 'WEBHOOK' ? 'rgba(251,113,133,0.10)' : 'transparent',
                border: `1px solid ${hoveredMethod === 'WEBHOOK' ? 'rgba(251,113,133,0.22)' : 'transparent'}`,
                cursor: 'grab',
                transition: 'all 0.15s ease',
                boxShadow: hoveredMethod === 'WEBHOOK' ? '0 0 14px rgba(251,113,133,0.15)' : 'none',
                userSelect: 'none',
                justifyContent: expanded ? 'flex-start' : 'center',
                flexShrink: 0,
              }}
            >
              <div style={{
                minWidth: expanded ? '34px' : '36px',
                height: '20px',
                borderRadius: '5px',
                background: 'rgba(251,113,133,0.10)',
                border: '1px solid rgba(251,113,133,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="2.5">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '1px', overflow: 'hidden',
                maxWidth: expanded ? `${sidebarWidth - 68}px` : '0px',
                opacity: expanded ? 1 : 0, transition: 'max-width 0.22s ease, opacity 0.15s ease'
              }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: hoveredMethod === 'WEBHOOK' ? '#F2F3F5' : '#C9CBD1', whiteSpace: 'nowrap' }}>
                  Webhook
                </span>
                <span style={{ fontSize: '10px', color: '#5A5C64', whiteSpace: 'nowrap' }}>
                  External trigger
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ AI TAB ═══ */}
        {activeTab === 'ai' && expanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* AI Workflow Generator */}
            <AIWorkflowGenerator mergeTemplate={mergeTemplate} />

            {/* Divider - dynamic color representing server connection status */}
            <div style={{
              height: '1px',
              background: backendHealthy === true 
                ? 'linear-gradient(90deg, transparent, rgba(62,207,142,0.4), transparent)' 
                : backendHealthy === false 
                  ? 'linear-gradient(90deg, transparent, rgba(226,75,74,0.4), transparent)' 
                  : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
              margin: '10px 0',
              transition: 'background 0.3s ease',
            }} />

            {/* OpenAPI Importer Trigger Card */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '4px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={backendHealthy === true ? '#3ECF8E' : backendHealthy === false ? '#E24B4A' : '#93959D'} strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span style={{
                    fontSize: '8px', fontWeight: 700, letterSpacing: '0.14em',
                    color: '#5A5C64', textTransform: 'uppercase',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    API Spec
                  </span>
                </div>
                {/* Health Indicator Dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    backgroundColor: backendHealthy === true ? '#3ECF8E' : backendHealthy === false ? '#E24B4A' : '#F59E0B',
                    boxShadow: backendHealthy === true 
                      ? '0 0 8px #3ECF8E' 
                      : backendHealthy === false 
                        ? '0 0 8px #E24B4A' 
                        : '0 0 8px #F59E0B',
                    transition: 'all 0.3s ease'
                  }} />
                  <span style={{ fontSize: '8px', fontWeight: 600, color: '#5A5C64', fontFamily: "'JetBrains Mono', monospace" }}>
                    {backendHealthy === true ? 'ONLINE' : backendHealthy === false ? 'OFFLINE' : 'CHECKING'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setOpenApiModalOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '10px', width: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(62,207,142,0.06)'
                  el.style.borderColor = 'rgba(62,207,142,0.25)'
                  el.style.boxShadow = '0 4px 16px rgba(62,207,142,0.05)'
                  const iconBg = el.querySelector('.importer-icon-bg') as HTMLElement
                  if (iconBg) {
                    iconBg.style.background = 'rgba(62,207,142,0.15)'
                    iconBg.style.borderColor = 'rgba(62,207,142,0.35)'
                  }
                  const iconSvg = el.querySelector('.importer-icon-svg') as HTMLElement
                  if (iconSvg) {
                    iconSvg.style.stroke = '#3ECF8E'
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(255,255,255,0.02)'
                  el.style.borderColor = 'rgba(255,255,255,0.06)'
                  el.style.boxShadow = 'none'
                  const iconBg = el.querySelector('.importer-icon-bg') as HTMLElement
                  if (iconBg) {
                    iconBg.style.background = 'rgba(255,255,255,0.04)'
                    iconBg.style.borderColor = 'rgba(255,255,255,0.08)'
                  }
                  const iconSvg = el.querySelector('.importer-icon-svg') as HTMLElement
                  if (iconSvg) {
                    iconSvg.style.stroke = '#93959D'
                  }
                }}
              >
                <div 
                  className="importer-icon-bg"
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg 
                    className="importer-icon-svg"
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93959D" strokeWidth="2.2"
                    style={{ transition: 'stroke 0.2s ease' }}
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#F2F3F5', whiteSpace: 'nowrap' }}>
                    Import Spec / Workflow
                  </span>
                  <span style={{ fontSize: '9px', color: '#5A5C64', whiteSpace: 'nowrap' }}>
                    Upload .json or .yaml spec
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ═══ TEMPLATES TAB ═══ */}
        {activeTab === 'templates' && expanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Save current workflow as template — quick action */}
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 10px', borderRadius: '10px', width: '100%',
                background: 'rgba(62,207,142,0.06)',
                border: '1px solid rgba(62,207,142,0.15)',
                cursor: 'pointer', transition: 'all 0.15s ease',
                fontFamily: 'inherit',
                marginBottom: '4px',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'rgba(62,207,142,0.12)'
                el.style.borderColor = 'rgba(62,207,142,0.3)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'rgba(62,207,142,0.06)'
                el.style.borderColor = 'rgba(62,207,142,0.15)'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3ECF8E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#3ECF8E' }}>Save as Template</span>
                <span style={{ fontSize: '9px', color: '#5A5C64' }}>
                  {nodes.length} node{nodes.length !== 1 ? 's' : ''}, {edges.length} edge{edges.length !== 1 ? 's' : ''}
                </span>
              </div>
            </button>

            {/* Built-in Templates */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
              {renderSectionHeader('Built-in', builtinOpen, () => setBuiltinOpen((p) => !p))}
              {builtinOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {builtInTemplates.map((t) => renderTemplateCard(t, `b-${t.name}`))}
                </div>
              )}
            </div>

            {/* Custom Templates */}
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, paddingBottom: '12px' }}>
              {renderSectionHeader('My Templates', customOpen, () => setCustomOpen((p) => !p))}
              {customOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {customTemplates.length === 0 && (
                    <div style={{
                      padding: '14px 10px', textAlign: 'center',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '10px',
                      border: '1px dashed rgba(255,255,255,0.07)',
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5A5C64" strokeWidth="1.5" style={{ margin: '0 auto 6px' }}>
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                      </svg>
                      <p style={{ margin: 0, fontSize: '10px', color: '#5A5C64', fontStyle: 'italic' }}>No custom templates yet</p>
                      <p style={{ margin: '3px 0 0', fontSize: '9px', color: '#3A3C42' }}>Use "Save as Template" above</p>
                    </div>
                  )}
                  {customTemplates.map((t) => renderTemplateCard(
                    { name: t.name, description: t.description, nodes: t.nodes, edges: t.edges },
                    `c-${t._id}`,
                    () => deleteCustomTemplate(t._id)
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: expanded ? '12px 10px' : '12px 0',
        flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,0.07)',
        marginTop: 'auto',
        display: 'flex',
        flexDirection: expanded ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.015))'
      }}>
        <button
          onClick={handleExport}
          {...defaultBtnHover}
          style={{
            ...footerBtnStyle,
            width: expanded ? '100%' : '36px',
            height: expanded ? 'auto' : '36px',
            padding: expanded ? '8px 10px' : '0',
            justifyContent: 'center',
            borderRadius: '8px',
          }}
          title="Export Workflow JSON"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          {expanded && <span style={{ marginLeft: '8px' }}>Export</span>}
        </button>
        <button
          onClick={() => setOpenApiModalOpen(true)}
          {...defaultBtnHover}
          style={{
            ...footerBtnStyle,
            width: expanded ? '100%' : '36px',
            height: expanded ? 'auto' : '36px',
            padding: expanded ? '8px 10px' : '0',
            justifyContent: 'center',
            borderRadius: '8px',
          }}
          title="Import Spec / Workflow JSON"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          {expanded && <span style={{ marginLeft: '8px' }}>Import</span>}
        </button>
        {/* Hidden backup input for legacy direct JSON workflow import */}
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
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
      {/* OpenAPI Spec / DevFlow JSON Workflow Importer Controlled Modal */}
      <OpenAPIImporter
        mergeTemplate={mergeTemplate}
        open={openApiModalOpen}
        setOpen={setOpenApiModalOpen}
      />
    </div>
  )
}