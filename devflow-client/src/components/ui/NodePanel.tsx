import { useEffect, useState } from 'react'
import { useFlowStore } from '../../store/flowStore'
import type { HttpMethod, NodeData } from '../../types'
import FieldMapper from './FieldMapper'
import api from '../../services/api'

const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

const methodConfig: Record<string, { color: string; bg: string; border: string }> = {
  GET:    { color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.20)' },
  POST:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.20)' },
  PUT:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.20)' },
  DELETE: { color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.20)' },
  PATCH:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.20)' },
}

export default function NodePanel() {
  const { nodes, selectedNodeId, setSelectedNode, updateNodeData } = useFlowStore()
  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  const [form, setForm] = useState<Partial<NodeData>>({})
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // Sync form when selected node changes
  useEffect(() => {
    if (selectedNode) setForm(selectedNode.data)
    else setForm({})
  }, [selectedNodeId])

  if (!selectedNode) return null

  const update = (field: keyof NodeData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    updateNodeData(selectedNode.id, { [field]: value })
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

  const selectedMethod = (form.method ?? 'GET') as HttpMethod
  const m = methodConfig[selectedMethod]

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 10,
        }}
        onClick={() => setSelectedNode(null)}
      />

      {/* Panel */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          height: '100%',
          width: '360px',
          background: 'rgba(12,12,12,0.95)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 20,
          backdropFilter: 'blur(20px)',
          boxShadow: '-12px 0 48px rgba(0,0,0,0.6), -4px 0 12px rgba(0,0,0,0.3)',
          animation: 'slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <style>
          {`
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}
        </style>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '5px',
                background: m.bg,
                color: m.color,
                border: `1px solid ${m.border}`,
                letterSpacing: '0.05em',
              }}
            >
              {selectedMethod}
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
              Node Settings
            </span>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.color = 'white'
              el.style.background = 'rgba(255,255,255,0.08)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.color = 'rgba(255,255,255,0.4)'
              el.style.background = 'rgba(255,255,255,0.04)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            scrollbarWidth: 'none',
          }}
        >
          {/* AI Generate */}
          <Section label="AI Generate">
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateWithAI()}
                placeholder="Fetch all GitHub repos for a user..."
                style={{ ...inputStyle, flex: 1, fontSize: '11px' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.55)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
              <button
                onClick={generateWithAI}
                disabled={aiLoading || !aiPrompt.trim()}
                style={{
                  minWidth: '44px',
                  borderRadius: '10px',
                  border: '1px solid rgba(99,102,241,0.30)',
                  background: aiLoading || !aiPrompt.trim() ? 'rgba(99,102,241,0.18)' : '#6366f1',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: aiLoading || !aiPrompt.trim() ? 'not-allowed' : 'pointer',
                  opacity: aiLoading || !aiPrompt.trim() ? 0.45 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                {aiLoading ? '...' : 'AI'}
              </button>
            </div>
          </Section>

          {/* Label Input */}
          <Section label="Label">
            <input
              value={form.label ?? ''}
              onChange={(e) => update('label', e.target.value)}
              placeholder="e.g. Fetch User List"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </Section>

          {/* Method Selection */}
          <Section label="Request Method">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {methods.map((method) => {
                const isSelected = form.method === method
                const cfg = methodConfig[method]
                return (
                  <button
                    key={method}
                    onClick={() => update('method', method)}
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: isSelected ? cfg.bg : 'rgba(255,255,255,0.03)',
                      color: isSelected ? cfg.color : 'rgba(255,255,255,0.3)',
                      border: `1px solid ${isSelected ? cfg.border : 'rgba(255,255,255,0.06)'}`,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
                      }
                    }}
                  >
                    {method}
                  </button>
                )
              })}
            </div>
          </Section>

          {/* URL Input */}
          <Section label="Endpoint URL">
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10A15.3 15.3 0 0 1 8 12a15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <input
                value={form.url ?? ''}
                onChange={(e) => update('url', e.target.value)}
                placeholder="https://api.example.com/data"
                style={{ ...inputStyle, paddingLeft: '34px', fontFamily: 'monospace', fontSize: '11px' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>
          </Section>

          {/* Headers Editor */}
          <Section label="Request Headers">
            <HeadersEditor
              value={form.headers ?? {}}
              onChange={(h) => update('headers', h)}
            />
          </Section>

          {/* Body Editor */}
          {['POST', 'PUT', 'PATCH'].includes(form.method ?? '') && (
            <Section label="Request Body (JSON)">
              <textarea
                value={form.body ?? ''}
                onChange={(e) => update('body', e.target.value)}
                placeholder={'{\n  "key": "value"\n}'}
                rows={8}
                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '11px', resize: 'none', height: 'auto' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </Section>
          )}

          {/* Field Mapper */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
              Field Mappings
            </label>
            <p className="text-[10px] text-zinc-600 leading-relaxed m-0">
              Pull values from previous nodes into this request.
            </p>
            <FieldMapper nodeId={selectedNode.id} />
          </div>

          {/* Response Viewer */}
          {Boolean(selectedNode.data.response) && (
            <Section label="Last Response">
              <div
                style={{
                  background: 'rgba(52,211,153,0.05)',
                  border: '1px solid rgba(52,211,153,0.15)',
                  borderRadius: '12px',
                  padding: '12px',
                  overflow: 'auto',
                  maxHeight: '240px',
                }}
              >
                <pre style={{ margin: 0, fontSize: '10px', color: '#34d399', fontFamily: 'monospace' }}>
                  {JSON.stringify(selectedNode.data.response, null, 2)}
                </pre>
              </div>
            </Section>
          )}

          {/* Error Viewer */}
          {selectedNode.data.error && (
            <Section label="Error">
              <div
                style={{
                  background: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.20)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                }}
              >
                <p style={{ margin: 0, fontSize: '11px', color: '#f87171', fontFamily: 'monospace' }}>
                  {selectedNode.data.error}
                </p>
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <button
            onClick={() => setSelectedNode(null)}
            style={{
              width: '100%',
              background: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              color: '#000000',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(255,255,255,0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f4f4f5'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,255,255,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,255,255,0.1)'
            }}
          >
            Apply Changes
          </button>
        </div>
      </div>
    </>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '13px',
  color: 'white',
  outline: 'none',
  transition: 'all 0.15s ease',
}

function HeadersEditor({ value, onChange }: { value: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  const entries = Object.entries(value)

  const updateKey = (oldKey: string, newKey: string) => {
    const updated = { ...value }
    const val = updated[oldKey]
    delete updated[oldKey]
    updated[newKey] = val
    onChange(updated)
  }

  const updateVal = (key: string, val: string) => {
    onChange({ ...value, [key]: val })
  }

  const addRow = () => onChange({ ...value, '': '' })
  const removeRow = (key: string) => {
    const updated = { ...value }
    delete updated[key]
    onChange(updated)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {entries.map(([k, v], i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            value={k}
            onChange={(e) => updateKey(k, e.target.value)}
            placeholder="Key"
            style={{ ...inputStyle, padding: '7px 10px', fontSize: '11px', fontFamily: 'monospace' }}
          />
          <input
            value={v}
            onChange={(e) => updateVal(k, e.target.value)}
            placeholder="Value"
            style={{ ...inputStyle, padding: '7px 10px', fontSize: '11px', fontFamily: 'monospace' }}
          />
          <button
            onClick={() => removeRow(k)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.2)',
              cursor: 'pointer',
              padding: '4px',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
      <button
        onClick={addRow}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '8px',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
          e.currentTarget.style.borderStyle = 'solid'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
          e.currentTarget.style.borderStyle = 'dashed'
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Header
      </button>
    </div>
  )
}
