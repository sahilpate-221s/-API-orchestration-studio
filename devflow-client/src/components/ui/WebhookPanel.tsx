import { useState, useEffect } from 'react'
import { useFlowStore } from '../../store/flowStore'
import api from '../../services/api'

type Webhook = {
  webhookId: string
  name: string
  active: boolean
  triggerCount: number
  lastTriggeredAt?: string
  createdAt: string
}

export default function WebhookPanel({ nodeId, onClose }: { nodeId: string; onClose: () => void }) {
  const { nodes, workflowId, updateNodeData } = useFlowStore()
  const node = nodes.find(n => n.id === nodeId)
  const data = node?.data as any

  const [webhook, setWebhook] = useState<Webhook | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:5000'

  useEffect(() => {
    if (data?.webhookId && workflowId) {
      loadWebhook()
    }
  }, [nodeId])

  const loadWebhook = async () => {
    if (!workflowId) return
    try {
      const res = await api.get(`/webhooks/workflow/${workflowId}`)
      const found = res.data.webhooks.find((w: Webhook) => w.webhookId === data?.webhookId)
      if (found) setWebhook(found)
    } catch (err) {
      console.error('Failed to load webhook:', err)
    }
  }

  const createWebhook = async () => {
    if (!workflowId) {
      alert('Save the workflow first before creating a webhook')
      return
    }
    setLoading(true)
    try {
      const res = await api.post(`/webhooks/workflow/${workflowId}`, {
        name: data?.label ?? 'Webhook Trigger'
      })
      const newWebhook = res.data.webhook
      setWebhook(newWebhook)

      const webhookUrl = `${baseUrl}/api/webhooks/trigger/${newWebhook.webhookId}`
      updateNodeData(nodeId, {
        webhookId: newWebhook.webhookId,
        webhookUrl,
        active: true,
        triggerCount: 0,
      })
    } catch (err) {
      console.error('Failed to create webhook:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async () => {
    if (!webhook) return
    try {
      const res = await api.patch(`/webhooks/${webhook.webhookId}/toggle`)
      setWebhook(res.data.webhook)
      updateNodeData(nodeId, { active: res.data.webhook.active })
    } catch (err) {
      console.error('Failed to toggle webhook:', err)
    }
  }

  const regenerate = async () => {
    if (!webhook) return
    setRegenerating(true)
    try {
      const res = await api.post(`/webhooks/${webhook.webhookId}/regenerate`)
      const updated = res.data.webhook
      setWebhook(updated)
      const webhookUrl = `${baseUrl}/api/webhooks/trigger/${updated.webhookId}`
      updateNodeData(nodeId, { webhookId: updated.webhookId, webhookUrl })
    } catch (err) {
      console.error('Failed to regenerate:', err)
    } finally {
      setRegenerating(false)
    }
  }

  const deleteWebhook = async () => {
    if (!webhook) return
    if (!confirm('Delete this webhook? External services will no longer be able to trigger this workflow.')) return
    try {
      await api.delete(`/webhooks/${webhook.webhookId}`)
      setWebhook(null)
      updateNodeData(nodeId, { webhookId: undefined, webhookUrl: undefined, active: false })
    } catch (err) {
      console.error('Failed to delete webhook:', err)
    }
  }

  const copyUrl = () => {
    const url = `${baseUrl}/api/webhooks/trigger/${webhook?.webhookId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const testWebhook = async () => {
    if (!webhook) return
    setTestResult(null)
    try {
      const res = await api.post(`/webhooks/trigger/${webhook.webhookId}`, {
        test: true,
        source: 'DevFlow test',
        timestamp: new Date().toISOString()
      })
      setTestResult(`✓ Triggered! Execution ID: ${res.data.executionId}`)
      loadWebhook()
    } catch (err: any) {
      setTestResult(`✗ Failed: ${err.response?.data?.message ?? err.message}`)
    }
  }

  const webhookUrl = webhook
    ? `${baseUrl}/api/webhooks/trigger/${webhook.webhookId}`
    : null

  const labelClass = "text-[10px] font-semibold text-zinc-500 uppercase tracking-widest"
  const inputClass = "w-full bg-[#141414] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white/90 placeholder:text-zinc-700 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all"

  return (
    <>
      <div className="absolute inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[360px] z-20 bg-[#0d0d0d] border-l border-white/[0.06] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <div style={{
              width: '24px', height: '24px', borderRadius: '7px',
              background: 'rgba(251,113,133,0.12)',
              border: '1px solid rgba(251,113,133,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span className="text-sm font-medium text-white/80">Webhook Trigger</span>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-white/[0.04]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

          {/* Not created yet */}
          {!webhook && !data?.webhookId && (
            <div className="flex flex-col gap-4">
              <div className="bg-pink-500/5 border border-pink-500/10 rounded-xl p-4">
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Generate a unique webhook URL for this workflow. External services like GitHub, Stripe, or Shopify can hit this URL to automatically trigger your workflow.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelClass}>Node Label</label>
                <input
                  value={data?.label ?? ''}
                  onChange={e => updateNodeData(nodeId, { label: e.target.value })}
                  placeholder="e.g. GitHub Push Trigger"
                  className={inputClass}
                />
              </div>

              <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-4">
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-3">What happens when triggered</p>
                <div className="flex flex-col gap-2">
                  {[
                    'External service sends POST/GET to webhook URL',
                    'DevFlow receives the request payload',
                    'Workflow executes with payload as context',
                    'Field mapper can extract values from webhook body',
                  ].map((step, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span style={{ fontSize: '9px', color: '#fb7185', fontWeight: 800, minWidth: '14px', marginTop: '1px' }}>{i + 1}.</span>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!workflowId && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-[10px] text-amber-400">
                    ⚠ Save your workflow first before creating a webhook.
                  </p>
                </div>
              )}

              <button
                onClick={createWebhook}
                disabled={loading || !workflowId}
                className="w-full py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                style={{
                  background: workflowId && !loading ? '#fb7185' : 'rgba(251,113,133,0.2)',
                  color: workflowId && !loading ? '#fff' : 'rgba(255,255,255,0.3)',
                  border: 'none', cursor: workflowId && !loading ? 'pointer' : 'not-allowed'
                }}
              >
                {loading ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" />
                    </svg>
                    Generate Webhook URL
                  </>
                )}
              </button>
            </div>
          )}

          {/* Webhook exists */}
          {webhook && (
            <div className="flex flex-col gap-5">

              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: webhook.active ? '#34d399' : '#3f3f46',
                    boxShadow: webhook.active ? '0 0 8px #34d399' : 'none',
                  }} />
                  <span className="text-xs text-zinc-400">
                    {webhook.active ? 'Active — accepting requests' : 'Inactive — not accepting requests'}
                  </span>
                </div>
                <button
                  onClick={toggleActive}
                  className="text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
                  style={{
                    background: webhook.active ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)',
                    border: `1px solid ${webhook.active ? 'rgba(239,68,68,0.2)' : 'rgba(52,211,153,0.2)'}`,
                    color: webhook.active ? '#f87171' : '#34d399',
                    cursor: 'pointer'
                  }}
                >
                  {webhook.active ? 'Disable' : 'Enable'}
                </button>
              </div>

              {/* Webhook URL */}
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Webhook URL</label>
                <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-3">
                  <p className="text-[10px] font-mono text-zinc-400 break-all leading-relaxed">
                    {webhookUrl}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyUrl}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-colors"
                    style={{
                      background: copied ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${copied ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.08)'}`,
                      color: copied ? '#34d399' : 'rgba(255,255,255,0.6)',
                      cursor: 'pointer'
                    }}
                  >
                    {copied ? (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy URL
                      </>
                    )}
                  </button>
                  <button
                    onClick={regenerate}
                    disabled={regenerating}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.4)',
                      cursor: regenerating ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <svg className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    Rotate
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-3">
                  <p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1">Triggered</p>
                  <p className="text-xl font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {webhook.triggerCount}×
                  </p>
                </div>
                <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-3">
                  <p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1">Last Triggered</p>
                  <p className="text-xs text-zinc-400">
                    {webhook.lastTriggeredAt
                      ? new Date(webhook.lastTriggeredAt).toLocaleTimeString()
                      : 'Never'}
                  </p>
                </div>
              </div>

              {/* Test trigger */}
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Test Trigger</label>
                <button
                  onClick={testWebhook}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                  style={{
                    background: 'rgba(251,113,133,0.08)',
                    border: '1px solid rgba(251,113,133,0.2)',
                    color: '#fb7185', cursor: 'pointer'
                  }}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Send Test Trigger
                </button>
                {testResult && (
                  <p className={`text-[10px] px-3 py-2 rounded-lg ${testResult.startsWith('✓') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {testResult}
                  </p>
                )}
              </div>

              {/* Field mapper hint */}
              <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-4">
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-2">
                  Using Webhook Data in Nodes
                </p>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  In any node's Field Mappings, select <span className="text-pink-400 font-mono">__webhook__</span> as the source node. Then use JSONPath to extract values from the incoming payload:
                </p>
                <div className="mt-2 flex flex-col gap-1">
                  {[
                    '$.body.userId',
                    '$.body.event',
                    '$.headers.x-github-event',
                    '$.query.token',
                  ].map(path => (
                    <span key={path} className="text-[9px] font-mono text-pink-400/70 bg-pink-500/5 px-2 py-0.5 rounded">
                      {path}
                    </span>
                  ))}
                </div>
              </div>

              {/* Danger zone */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={deleteWebhook}
                  className="w-full py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={{
                    background: 'rgba(239,68,68,0.05)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    color: '#f87171', cursor: 'pointer'
                  }}
                >
                  Delete Webhook
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-white/[0.06] shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-[#1a1a1a] hover:bg-[#222] transition-colors text-white text-xs font-semibold py-2.5 rounded-xl border border-white/[0.06]"
          >
            Done
          </button>
        </div>
      </div>
    </>
  )
}