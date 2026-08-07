import { useEffect, useState, useRef, useCallback } from 'react'
import { useFlowStore } from '../../store/flowStore'
import type {
  HttpMethod,
  NodeData,
  AuthConfig,
  QueryParam,
  BodyType,
  FormField,
  FileData,
} from '../../types/index'
import type { ConditionData } from '../../types'
import FieldMapper from './FieldMapper'
import api from '../../services/api'
import WebhookPanel from './WebhookPanel'

const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

const methodConfig: Record<string, { color: string, bg: string, border: string }> = {
  GET:    { color: '#34d399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.22)' },
  POST:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.22)' },
  PUT:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.22)' },
  DELETE: { color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.22)' },
  PATCH:  { color: '#22d3ee', bg: 'rgba(34,211,238,0.10)', border: 'rgba(34,211,238,0.22)' },
}

function getStatusColor(status: number): { color: string, bg: string, border: string } {
  if (status >= 200 && status < 300) return methodConfig.GET
  if (status >= 400 && status < 500) return methodConfig.PUT
  if (status >= 500) return methodConfig.DELETE
  return { color: '#a1a1aa', bg: 'rgba(161,161,170,0.10)', border: 'rgba(161,161,170,0.22)' }
}

type Tab = 'config' | 'response' | 'mappings'

export default function NodePanel() {
  const { nodes, selectedNodeId, setSelectedNode, updateNodeData } = useFlowStore()
  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  const [panelWidth, setPanelWidth] = useState(360)
  const isDraggingPanel = useRef(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingPanel.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingPanel.current) return
      const newWidth = window.innerWidth - e.clientX
      const clamped = Math.max(280, Math.min(newWidth, 600))
      setPanelWidth(clamped)
    }

    const handleMouseUp = () => {
      isDraggingPanel.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [])

  const [tab, setTab] = useState<Tab>('config')
  const [form, setForm] = useState<Partial<NodeData>>({})
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [rawResponse, setRawResponse] = useState(false)
  const [showRespHeaders, setShowRespHeaders] = useState(false)

  const [params, setParams] = useState<QueryParam[]>([])
  const [authConfig, setAuthConfig] = useState<AuthConfig>({ type: 'none' })
  const [bodyType, setBodyType] = useState<BodyType>('json')
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [fileData, setFileData] = useState<FileData | null>(null)

  useEffect(() => {
    if (selectedNode) {
      setForm(selectedNode.data)
      setTab('config')
      setParams(selectedNode.data.queryParams ?? [])
      setAuthConfig(selectedNode.data.authConfig ?? { type: 'none' })
      setBodyType(selectedNode.data.bodyType ?? 'json')
      setFormFields(selectedNode.data.formFields ?? [])
      setFileData(selectedNode.data.fileData ?? null)
    } else {
      setForm({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId])

  useEffect(() => {
    if (selectedNode?.data.response || selectedNode?.data.error) {
      setTab('response')
    }
  }, [selectedNode?.data.response, selectedNode?.data.error])

  if (!selectedNode) return null

  // Add condition node panel — show when node type is conditionNode
  if (selectedNode?.type === 'conditionNode') {
    return <ConditionPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
  }

  if (selectedNode?.type === 'webhookNode') {
    return <WebhookPanel nodeId={selectedNode.id} onClose={() => setSelectedNode(null)} />
  }

  const update = (field: keyof NodeData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    updateNodeData(selectedNode.id, { [field]: value })
  }

  const buildUrlWithParams = (baseUrl: string, paramList: QueryParam[]): string => {
    const active = paramList.filter((p) => p.enabled && p.key)
    if (!active.length) return baseUrl
    const qs = active
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&')
    return baseUrl.includes('?') ? `${baseUrl}&${qs}` : `${baseUrl}?${qs}`
  }

  const handleParamsChange = (newParams: QueryParam[]) => {
    setParams(newParams)
    updateNodeData(selectedNode.id, { queryParams: newParams })
  }

  const handleAuthChange = (newAuth: AuthConfig) => {
    setAuthConfig(newAuth)
    updateNodeData(selectedNode.id, { authConfig: newAuth })
  }

  const handleBodyTypeChange = (bt: BodyType) => {
    setBodyType(bt)
    updateNodeData(selectedNode.id, { bodyType: bt })
  }

  const handleFormFieldsChange = (fields: FormField[]) => {
    setFormFields(fields)
    updateNodeData(selectedNode.id, { formFields: fields })
  }

  const handleFileDataChange = (fd: FileData | null) => {
    setFileData(fd)
    updateNodeData(selectedNode.id, { fileData: fd ?? undefined })
  }

  const addParam = () => handleParamsChange([...params, { id: `p-${Date.now()}`, key: '', value: '', enabled: true }])
  const updateParam = (id: string, changes: Partial<QueryParam>) => handleParamsChange(params.map((p) => p.id === id ? { ...p, ...changes } : p))
  const removeParam = (id: string) => handleParamsChange(params.filter((p) => p.id !== id))

  const addFormField = () => handleFormFieldsChange([...formFields, { id: `f-${Date.now()}`, key: '', value: '' }])
  const updateFormField = (id: string, changes: Partial<FormField>) => handleFormFieldsChange(formFields.map((f) => f.id === id ? { ...f, ...changes } : f))
  const removeFormField = (id: string) => handleFormFieldsChange(formFields.filter((f) => f.id !== id))

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1]
      handleFileDataChange({ name: file.name, base64, mimeType: file.type })
    }
    reader.readAsDataURL(file)
  }

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    try {
      const res = await api.post('/ai/generate', { description: aiPrompt })
      const { method, url, headers, body } = res.data.config
      updateNodeData(selectedNode.id, { method, url, headers, body })
      setForm((prev) => ({ ...prev, method, url, headers, body }))
      setAiPrompt('')
    } catch (err) {
      console.error('AI generation failed', err)
    } finally {
      setAiLoading(false)
    }
  }

  const mConf = methodConfig[form.method ?? 'GET'] ?? methodConfig.GET
  const response = selectedNode.data.response
  const error = selectedNode.data.error
  const statusCode = selectedNode.data.statusCode
  const responseHeaders = selectedNode.data.responseHeaders

  const tabs: { id: Tab; label: string }[] = [
    { id: 'config', label: 'Config' },
    { id: 'response', label: 'Response' },
    { id: 'mappings', label: 'Mappings' },
  ]

  const labelStyle: React.CSSProperties = { fontSize: '10px', fontWeight: 600, color: '#5A5C64', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block', fontFamily: "'JetBrains Mono', monospace" }
  const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#F2F3F5', outline: 'none', transition: 'border-color 0.15s ease', fontFamily: "'Inter', sans-serif" }
  const monoInputStyle: React.CSSProperties = { ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }
  const smallInputStyle: React.CSSProperties = { ...inputStyle, padding: '6px 10px', fontSize: '11px', flex: 1 }

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, zIndex: 10 }} onClick={() => setSelectedNode(null)} />
      
      <div 
        style={{ 
          position: 'absolute', 
          right: 0, 
          top: 0, 
          height: '100%', 
          width: `${panelWidth}px`, 
          zIndex: 20, 
          background: 'rgba(11, 12, 14, 0.78)', 
          backdropFilter: 'blur(24px)', 
          borderLeft: '1px solid rgba(255,255,255,0.08)', 
          display: 'flex', 
          flexDirection: 'column', 
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          fontFamily: "'Inter', system-ui, sans-serif",
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          transition: isDraggingPanel.current ? 'none' : 'width 0.1s ease',
        }}
      >
        {/* Dynamic Drag Handle on left edge */}
        <div
          onMouseDown={handleMouseDown}
          title="Drag left/right to adjust panel width"
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '12px', marginLeft: '-6px', cursor: 'col-resize', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ width: '4px', height: '56px', borderRadius: '4px', background: 'rgba(255,255,255,0.2)' }} />
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{ height: '22px', padding: '0 8px', borderRadius: '6px', background: mConf.bg, border: `1px solid ${mConf.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: mConf.color, fontFamily: "'JetBrains Mono', monospace" }}>{form.method}</span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#F2F3F5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {form.label}
            </span>
          </div>
          <button onClick={() => setSelectedNode(null)} style={{ background: 'transparent', border: 'none', color: '#93959D', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: '12px 0', background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === t.id ? '#3ECF8E' : 'transparent'}`, color: tab === t.id ? '#F2F3F5' : '#93959D', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {t.label}
              {t.id === 'response' && (response || error) && (
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: error ? '#E24B4A' : '#3ECF8E' }} />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {tab === 'config' && (
            <>
              {/* AI Generation */}
              <div>
                <label style={labelStyle}><span style={{ color: '#3ECF8E', marginRight: '4px' }}>✦</span> AI Assistant</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && generateWithAI()} placeholder="Describe what this API should do..." style={inputStyle} />
                  <button onClick={generateWithAI} disabled={aiLoading || !aiPrompt.trim()} style={{ background: '#3ECF8E', border: 'none', borderRadius: '8px', padding: '0 16px', color: '#06110C', fontWeight: 700, cursor: aiLoading || !aiPrompt.trim() ? 'not-allowed' : 'pointer', opacity: aiLoading || !aiPrompt.trim() ? 0.5 : 1 }}>
                    {aiLoading ? '...' : 'Gen'}
                  </button>
                </div>
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

              <div>
                <label style={labelStyle}>Label</label>
                <input value={form.label ?? ''} onChange={(e) => update('label', e.target.value)} placeholder="Node label" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Method</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {methods.map((m) => {
                    const active = form.method === m
                    const c = methodConfig[m]
                    return (
                      <button key={m} onClick={() => update('method', m)} style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', background: active ? c.bg : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? c.border : 'rgba(255,255,255,0.08)'}`, color: active ? c.color : 'rgba(255,255,255,0.5)', transition: 'all 0.15s ease' }}>
                        {m}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Endpoint URL</label>
                <input value={form.url ?? ''} onChange={(e) => update('url', e.target.value)} placeholder="https://api.example.com/v1/resource" style={monoInputStyle} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Query Parameters</label>
                  <button onClick={addParam} style={{ background: 'transparent', border: 'none', color: '#3ECF8E', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>+ Add Param</button>
                </div>
                {params.length === 0 && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>No query parameters</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {params.map((param) => (
                    <div key={param.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={param.enabled} onChange={(e) => updateParam(param.id, { enabled: e.target.checked })} style={{ cursor: 'pointer' }} />
                      <input value={param.key} onChange={(e) => updateParam(param.id, { key: e.target.value })} placeholder="Key" style={smallInputStyle} />
                      <input value={param.value} onChange={(e) => updateParam(param.id, { value: e.target.value })} placeholder="Value" style={smallInputStyle} />
                      <button onClick={() => removeParam(param.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                    </div>
                  ))}
                </div>
                {params.some((p) => p.enabled && p.key) && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ margin: 0, fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all' }}>{buildUrlWithParams(form.url ?? '', params)}</p>
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Authorization</label>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {(['none', 'bearer', 'basic', 'apikey'] as AuthConfig['type'][]).map((a) => {
                    const active = authConfig.type === a
                    const labelMap = { none: 'None', bearer: 'Bearer', basic: 'Basic', apikey: 'API Key' }
                    return (
                      <button key={a} onClick={() => handleAuthChange({ ...authConfig, type: a })} style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', background: active ? 'rgba(62,207,142,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? 'rgba(62,207,142,0.3)' : 'rgba(255,255,255,0.08)'}`, color: active ? '#3ECF8E' : '#93959D', transition: 'all 0.15s ease' }}>
                        {labelMap[a]}
                      </button>
                    )
                  })}
                </div>
                {authConfig.type === 'bearer' && (
                  <input value={authConfig.token ?? ''} onChange={(e) => handleAuthChange({ ...authConfig, token: e.target.value })} placeholder="Token" style={monoInputStyle} />
                )}
                {authConfig.type === 'basic' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input value={authConfig.username ?? ''} onChange={(e) => handleAuthChange({ ...authConfig, username: e.target.value })} placeholder="Username" style={inputStyle} />
                    <input type="password" value={authConfig.password ?? ''} onChange={(e) => handleAuthChange({ ...authConfig, password: e.target.value })} placeholder="Password" style={inputStyle} />
                  </div>
                )}
                {authConfig.type === 'apikey' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input value={authConfig.apiKeyName ?? ''} onChange={(e) => handleAuthChange({ ...authConfig, apiKeyName: e.target.value })} placeholder="Key Name" style={{ ...inputStyle, flex: 1 }} />
                      <select value={authConfig.apiKeyIn ?? 'header'} onChange={(e) => handleAuthChange({ ...authConfig, apiKeyIn: e.target.value as 'header' | 'query' })} style={{ ...inputStyle, width: '90px' }}>
                        <option value="header">Header</option>
                        <option value="query">Query</option>
                      </select>
                    </div>
                    <input value={authConfig.apiKeyValue ?? ''} onChange={(e) => handleAuthChange({ ...authConfig, apiKeyValue: e.target.value })} placeholder="Value" style={monoInputStyle} />
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Headers</label>
                  <button onClick={() => update('headers', { ...(form.headers ?? {}), '': '' })} style={{ background: 'transparent', border: 'none', color: '#3ECF8E', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>+ Add Header</button>
                </div>
                <HeadersEditor value={form.headers ?? {}} onChange={(h) => update('headers', h)} inputStyle={smallInputStyle} />
              </div>

              {['POST', 'PUT', 'PATCH'].includes(form.method ?? '') && (
                <div>
                  <label style={labelStyle}>Body</label>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {(['none', 'json', 'formdata', 'file'] as BodyType[]).map((bt) => {
                      const active = bodyType === bt
                      const labelMap = { none: 'None', json: 'JSON', formdata: 'Form', file: 'File' }
                      return (
                        <button key={bt} onClick={() => handleBodyTypeChange(bt)} style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', background: active ? 'rgba(62,207,142,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? 'rgba(62,207,142,0.3)' : 'rgba(255,255,255,0.08)'}`, color: active ? '#3ECF8E' : '#93959D', transition: 'all 0.15s ease' }}>
                          {labelMap[bt]}
                        </button>
                      )
                    })}
                  </div>

                  {bodyType === 'json' && (
                    <textarea value={form.body ?? ''} onChange={(e) => update('body', e.target.value)} placeholder={'{\n  "key": "value"\n}'} rows={6} style={{ ...monoInputStyle, resize: 'vertical' }} />
                  )}

                  {bodyType === 'formdata' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {formFields.map((field) => (
                        <div key={field.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input value={field.key} onChange={(e) => updateFormField(field.id, { key: e.target.value })} placeholder="Key" style={smallInputStyle} />
                          <input value={field.value} onChange={(e) => updateFormField(field.id, { value: e.target.value })} placeholder="Value" style={smallInputStyle} />
                          <button onClick={() => removeFormField(field.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                        </div>
                      ))}
                      <button onClick={addFormField} style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', padding: '6px', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}>+ Add Field</button>
                    </div>
                  )}

                  {bodyType === 'file' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{fileData ? fileData.name : 'Select file'}</span>
                        <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                      </label>
                      {fileData && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontSize: '11px', color: '#fff', marginBottom: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileData.name}</span>
                            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{fileData.mimeType}</span>
                          </div>
                          <button onClick={() => handleFileDataChange(null)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', flexShrink: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {tab === 'response' && (
            <>
              {!response && !error && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'rgba(255,255,255,0.2)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  <p style={{ fontSize: '12px' }}>No response data yet.</p>
                </div>
              )}

              {(!!response || !!error) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {statusCode !== undefined && (
                    <span style={{ padding: '3px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: 800, background: getStatusColor(statusCode).bg, color: getStatusColor(statusCode).color, border: `1px solid ${getStatusColor(statusCode).border}` }}>
                      {statusCode}
                    </span>
                  )}
                  {selectedNode.data.executionTime !== undefined && (
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                      <strong style={{ color: '#fff', fontWeight: 600 }}>{selectedNode.data.executionTime}</strong> ms
                    </span>
                  )}
                  {!!response && (
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                      <strong style={{ color: '#fff', fontWeight: 600 }}>{new Blob([JSON.stringify(response)]).size}</strong> B
                    </span>
                  )}
                </div>
              )}

              {error && (
                <div style={{ padding: '10px', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '9px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>Error</p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{error}</p>
                </div>
              )}

              {!!response && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Response Body</label>
                    <button onClick={() => setRawResponse((r) => !r)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '10px', cursor: 'pointer' }}>
                      {rawResponse ? 'Format' : 'Raw'}
                    </button>
                  </div>
                  <pre className="custom-scrollbar" style={{ margin: 0, padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '10px', color: rawResponse ? 'rgba(255,255,255,0.8)' : '#34d399', overflowX: 'auto', maxHeight: '250px', wordBreak: rawResponse ? 'break-all' : 'normal', whiteSpace: rawResponse ? 'pre-wrap' : 'pre' }}>
                    {rawResponse ? JSON.stringify(response) : JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              )}

              {responseHeaders && Object.keys(responseHeaders).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => setShowRespHeaders((v) => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', width: '100%' }}>
                    <label style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>Response Headers</label>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" style={{ transform: showRespHeaders ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {showRespHeaders && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                      {Object.entries(responseHeaders).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.03)', gap: '10px' }}>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', width: '90px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{k}</span>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {tab === 'mappings' && (
            <>
              <div>
                <label style={labelStyle}>Field Mappings</label>
                <p style={{ margin: 0, fontSize: '11px', color: '#93959D' }}>Map data from upstream nodes into this request.</p>
              </div>
              <FieldMapper nodeId={selectedNode.id} />
            </>
          )}

        </div>

      </div>
    </>
  )
}

function HeadersEditor({ value, onChange, inputStyle }: { value: Record<string, string>, onChange: (v: Record<string, string>) => void, inputStyle: React.CSSProperties }) {
  const entries = Object.entries(value)
  const updateKey = (oldKey: string, newKey: string) => {
    const updated = { ...value }
    const val = updated[oldKey]
    delete updated[oldKey]
    updated[newKey] = val
    onChange(updated)
  }
  const updateVal = (key: string, val: string) => onChange({ ...value, [key]: val })
  const removeRow = (key: string) => {
    const updated = { ...value }
    delete updated[key]
    onChange(updated)
  }

  if (entries.length === 0) return <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>No custom headers</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {entries.map(([k, v], i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input value={k} onChange={(e) => updateKey(k, e.target.value)} placeholder="Key" style={inputStyle} />
          <input value={v} onChange={(e) => updateVal(k, e.target.value)} placeholder="Value" style={inputStyle} />
          <button onClick={() => removeRow(k)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>
      ))}
    </div>
  )
}

function ConditionPanel({ node, onClose }: { node: any; onClose: () => void }) {
  const { nodes, updateNodeData } = useFlowStore()
  const data: ConditionData = node.data

  const upd = (field: string, value: unknown) => {
    updateNodeData(node.id, { [field]: value })
  }

  // Available source nodes (all nodes except this one)
  const sourceNodes = nodes.filter(n => n.id !== node.id && n.type === 'apiNode')

  const operators = [
    { value: 'eq', label: '== equals' },
    { value: 'neq', label: '!= not equals' },
    { value: 'gt', label: '> greater than' },
    { value: 'gte', label: '>= greater or equal' },
    { value: 'lt', label: '< less than' },
    { value: 'lte', label: '<= less or equal' },
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'exists', label: 'exists' },
    { value: 'not_exists', label: 'does not exist' },
  ]

  const inputClass = "w-full bg-[#141414] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white/90 placeholder:text-zinc-700 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
  const labelClass = "text-[10px] font-semibold text-zinc-500 uppercase tracking-widest"

  return (
    <>
      <div className="absolute inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[340px] z-20 bg-[#0d0d0d] border-l border-white/[0.06] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
              IF
            </span>
            <span className="text-sm font-medium text-white/80">Condition Node</span>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-white/[0.04]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

          {/* Label */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Label</label>
            <input value={data.label ?? ''} onChange={e => upd('label', e.target.value)}
              placeholder="Check payment status" className={inputClass} />
          </div>

          {/* Source node */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Check response from</label>
            <select value={data.sourceNodeId ?? ''} onChange={e => upd('sourceNodeId', e.target.value)}
              className={inputClass} style={{ cursor: 'pointer' }}>
              <option value="">— select a node —</option>
              {sourceNodes.map(n => (
                <option key={n.id} value={n.id}>{n.data.label}</option>
              ))}
            </select>
          </div>

          {/* JSONPath */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>JSON Path</label>
            <input value={data.sourcePath ?? ''} onChange={e => upd('sourcePath', e.target.value)}
              placeholder="$.status" className={inputClass} style={{ fontFamily: 'monospace' }} />
            <p className="text-[10px] text-zinc-600">
              Extract a value from the response. e.g. <span className="text-yellow-500/70 font-mono">$.data.status</span> or <span className="text-yellow-500/70 font-mono">$.user.age</span>
            </p>
          </div>

          {/* Operator */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Operator</label>
            <select value={data.operator ?? 'eq'} onChange={e => upd('operator', e.target.value)}
              className={inputClass} style={{ cursor: 'pointer' }}>
              {operators.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>

          {/* Compare value */}
          {data.operator !== 'exists' && data.operator !== 'not_exists' && (
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Compare Value</label>
              <input value={data.compareValue ?? ''} onChange={e => upd('compareValue', e.target.value)}
                placeholder="paid" className={inputClass} />
              <p className="text-[10px] text-zinc-600">
                The value to compare against. Numbers and booleans are auto-detected.
              </p>
            </div>
          )}

          {/* Branch labels */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Branch Labels</label>
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[9px] text-emerald-400/70 uppercase tracking-wider">YES (true)</label>
                <input value={data.trueLabel ?? 'YES'} onChange={e => upd('trueLabel', e.target.value)}
                  placeholder="YES" style={{ ...{}, fontFamily: 'inherit', background: '#141414', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '10px', padding: '8px 12px', color: '#34d399', fontSize: '12px', outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[9px] text-red-400/70 uppercase tracking-wider">NO (false)</label>
                <input value={data.falseLabel ?? 'NO'} onChange={e => upd('falseLabel', e.target.value)}
                  placeholder="NO" style={{ fontFamily: 'inherit', background: '#141414', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', padding: '8px 12px', color: '#f87171', fontSize: '12px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-3">
            <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-2">Preview</p>
            <p className="text-[11px] font-mono text-zinc-400">
              if <span className="text-yellow-400">{data.sourcePath || '$.field'}</span>{' '}
              <span className="text-zinc-300">{data.operator || '=='}</span>{' '}
              {data.operator !== 'exists' && data.operator !== 'not_exists' && (
                <span className="text-emerald-400">"{data.compareValue || '?'}"</span>
              )}
            </p>
            <div className="flex gap-4 mt-2">
              <span className="text-[10px] text-emerald-400">→ {data.trueLabel || 'YES'} branch</span>
              <span className="text-[10px] text-red-400">→ {data.falseLabel || 'NO'} branch</span>
            </div>
          </div>

          {/* How to connect */}
          <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-3">
            <p className="text-[9px] text-yellow-500/70 uppercase tracking-wider mb-1">How to use</p>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Connect the <span className="text-emerald-400">green handle</span> (right) to the YES branch node.
              Connect the <span className="text-red-400">red handle</span> (left) to the NO branch node.
              The input handle is at the top.
            </p>
          </div>

        </div>

        <div className="px-5 py-3.5 border-t border-white/[0.06] shrink-0">
          <button onClick={onClose}
            className="w-full bg-yellow-600/80 hover:bg-yellow-500/80 transition-colors text-white text-xs font-semibold py-2.5 rounded-xl">
            Done
          </button>
        </div>
      </div>
    </>
  )
}
