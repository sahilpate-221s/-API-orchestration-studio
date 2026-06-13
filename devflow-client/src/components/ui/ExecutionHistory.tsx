import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useFlowStore } from '../../store/flowStore'

type NodeResult = {
  nodeId: string
  nodeLabel: string
  status: 'success' | 'error' | 'skipped'
  executionTime: number
  fromCache: boolean
  retryCount: number
  error?: string
}

type StatusCodes = {
  s2xx: number; s3xx: number; s4xx: number; s5xx: number
  sTimeout: number; sConnErr: number
}

type LoadTestMeta = {
  loadTestId: string
  targetUrl: string
  method: string
  totalUsers: number
  completed: number
  successful: number
  failed: number
  successRate: number
  avgLatency: number
  minLatency?: number
  maxLatency?: number
  p50?: number
  p95: number
  p99: number
  rps: number
  elapsed: number
  statusCodes?: StatusCodes
  errors: Record<string, number>
}

type Execution = {
  executionId: string
  status: 'queued' | 'running' | 'success' | 'error'
  totalTime: number
  triggeredAt: string
  completedAt?: string
  nodes: NodeResult[]
  idempotencyKey?: string
  loadTestMeta?: LoadTestMeta
}

type Props = {
  onClose: () => void
}

function fmt(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function fmtSec(ms: number | undefined): string {
  if (ms === undefined || ms <= 0) return '—'
  return `${(ms / 1000).toFixed(2)}s`
}

function getVerdict(meta: LoadTestMeta) {
  if (meta.successRate >= 99 && meta.avgLatency <= 200) return { label: 'Excellent', emoji: '🚀', color: '#34d399' }
  if (meta.successRate >= 95 && meta.avgLatency <= 500) return { label: 'Good', emoji: '✅', color: '#60a5fa' }
  if (meta.successRate >= 80) return { label: 'Degraded', emoji: '⚠️', color: '#f59e0b' }
  return { label: 'Poor', emoji: '🔴', color: '#ef4444' }
}

export default function ExecutionHistory({ onClose }: Props) {
  const { workflowId } = useFlowStore()

  const [executions, setExecutions] = useState<Execution[]>([])
  const [selected, setSelected] = useState<Execution | null>(null)
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  const fetchHistory = (skip = 0) => {
    if (!workflowId) return
    const method = skip === 0 ? setLoading : setLoadingMore
    method(true)
    api
      .get(`/execution/${workflowId}/history`, { params: { skip, limit: 15 } })
      .then((r) => {
        if (skip === 0) setExecutions(r.data.executions)
        else setExecutions((prev) => [...prev, ...r.data.executions])
        setHasMore(r.data.pagination.hasMore)
        setTotal(r.data.pagination.total)
      })
      .finally(() => method(false))
  }

  useEffect(() => { fetchHistory(0) }, [workflowId])

  const statusColor: Record<string, string> = {
    success: '#34d399', error: '#f87171', running: '#60a5fa', queued: '#9ca3af', skipped: '#fbbf24',
  }
  const statusBg: Record<string, string> = {
    success: 'rgba(52,211,153,0.1)', error: 'rgba(248,113,113,0.1)', running: 'rgba(96,165,250,0.1)',
    queued: 'rgba(156,163,175,0.1)', skipped: 'rgba(251,191,36,0.1)',
  }

  const isLoadTest = (ex: Execution) =>
    ex.idempotencyKey?.startsWith('loadtest-') || ex.idempotencyKey?.startsWith('benchmark-')

  return (
    <div className="absolute inset-0 z-50 flex justify-end overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" onClick={onClose} />

      <div
        style={{
          width: '440px', height: '100%', background: 'rgba(13,13,13,0.95)',
          backdropFilter: 'blur(16px)', borderLeft: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', position: 'relative',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
        }}
        className="animate-in slide-in-from-right duration-300 ease-out"
      >
        {/* Header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {view === 'detail' ? (
              <button
                onClick={() => setView('list')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              </button>
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
            )}
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: 0 }}>
                {view === 'detail' && selected
                  ? isLoadTest(selected) ? 'Load Test Details' : 'Run Details'
                  : 'History'}
              </h2>
              {view === 'list' && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{total} runs total</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

          {/* ── LIST VIEW ── */}
          <div
            style={{
              position: 'absolute', inset: 0, padding: '20px', overflowY: 'auto',
              transform: view === 'list' ? 'translateX(0)' : 'translateX(-100%)',
              opacity: view === 'list' ? 1 : 0,
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              pointerEvents: view === 'list' ? 'auto' : 'none',
            }}
          >
            {loading && executions.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', borderRadius: '50%' }} className="animate-spin" />
              </div>
            ) : executions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                <p style={{ fontSize: '13px' }}>No runs recorded yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {executions.map((ex, i) => {
                  const lt = isLoadTest(ex)
                  return (
                    <button
                      key={ex.executionId}
                      onClick={() => { setSelected(ex); setView('detail') }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '14px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: '8px',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          {lt && (
                            <span style={{ padding: '2px 6px', borderRadius: '5px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '8px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              Load Test
                            </span>
                          )}
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                            {lt && ex.loadTestMeta
                              ? `${fmt(ex.loadTestMeta.totalUsers)} users · ${ex.loadTestMeta.method}`
                              : lt ? 'Load Test'
                              : `Run #${total - i}`}
                          </span>
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '3px 8px', borderRadius: '4px', background: statusBg[ex.status], color: statusColor[ex.status] }}>
                          {lt && ex.loadTestMeta ? `${ex.loadTestMeta.successRate}% ok` : ex.status}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
                        <span style={{ fontSize: '11px', color: '#fff' }}>
                          {new Date(ex.triggeredAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ fontSize: '11px', color: '#fff', fontFamily: 'monospace' }}>
                          {lt && ex.loadTestMeta
                            ? `${fmt(ex.loadTestMeta.rps)} rps · ${fmtSec(ex.loadTestMeta.avgLatency)} avg`
                            : `${ex.totalTime}ms`}
                        </span>
                      </div>
                    </button>
                  )
                })}

                {hasMore && (
                  <button
                    onClick={() => fetchHistory(executions.length)}
                    disabled={loadingMore}
                    style={{ padding: '12px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.3)', fontSize: '11px', cursor: 'pointer', marginTop: '4px' }}
                  >
                    {loadingMore ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── DETAIL VIEW ── */}
          <div
            style={{
              position: 'absolute', inset: 0, padding: '20px', overflowY: 'auto',
              transform: view === 'detail' ? 'translateX(0)' : 'translateX(100%)',
              opacity: view === 'detail' ? 1 : 0,
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              pointerEvents: view === 'detail' ? 'auto' : 'none',
            }}
          >
            {selected && isLoadTest(selected) && selected.loadTestMeta ? (
              /* ── Load Test Detail ── */
              (() => {
                const meta = selected.loadTestMeta!
                const verdict = getVerdict(meta)
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Verdict */}
                    <div style={{ padding: '18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '22px' }}>{verdict.emoji}</span>
                          <div>
                            <p style={{ margin: 0, fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Verdict</p>
                            <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: verdict.color }}>{verdict.label}</p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Success Rate</p>
                          <p style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: verdict.color }}>{meta.successRate}%</p>
                        </div>
                      </div>
                      <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ margin: 0, fontSize: '9px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target</p>
                        <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#fff', fontFamily: 'monospace', wordBreak: 'break-all' }}>{meta.method} {meta.targetUrl}</p>
                        <p style={{ margin: '6px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{new Date(selected.triggeredAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Metrics grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[
                        { label: 'Total Users', value: fmt(meta.totalUsers), color: '#fff' },
                        { label: 'Duration', value: `${meta.elapsed}s`, color: '#fff' },
                        { label: 'Avg Latency', value: fmtSec(meta.avgLatency), color: meta.avgLatency <= 200 ? '#34d399' : meta.avgLatency <= 500 ? '#f59e0b' : '#ef4444' },
                        { label: 'Peak Req/sec', value: fmt(meta.rps), color: '#60a5fa' },
                        { label: 'P95 Latency', value: fmtSec(meta.p95), color: '#f59e0b' },
                        { label: 'P99 Latency', value: fmtSec(meta.p99), color: '#f87171' },
                        { label: 'Successful', value: fmt(meta.successful), color: '#34d399' },
                        { label: 'Failed', value: fmt(meta.failed), color: meta.failed === 0 ? '#34d399' : '#f87171' },
                      ].map((m) => (
                        <div key={m.label} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                          <p style={{ margin: '0 0 4px', fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</p>
                          <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: m.color }}>{m.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Status Code Breakdown */}
                    {meta.statusCodes && (
                      <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>HTTP Status Codes</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {[
                            { label: '2xx Success', val: meta.statusCodes.s2xx, color: '#34d399' },
                            { label: '3xx Redirect', val: meta.statusCodes.s3xx, color: '#60a5fa' },
                            { label: '4xx Client', val: meta.statusCodes.s4xx, color: '#f59e0b' },
                            { label: '5xx Server', val: meta.statusCodes.s5xx, color: '#f87171' },
                            { label: 'Timeout', val: meta.statusCodes.sTimeout, color: '#c084fc' },
                            { label: 'Conn Error', val: meta.statusCodes.sConnErr, color: '#ef4444' },
                          ].map((b) => (
                            <div key={b.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{b.label}</span>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: b.val > 0 ? b.color : 'rgba(255,255,255,0.2)', fontVariantNumeric: 'tabular-nums' }}>{fmt(b.val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error breakdown */}
                    {Object.keys(meta.errors ?? {}).length > 0 && (
                      <div style={{ padding: '14px', background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.12)', borderRadius: '12px' }}>
                        <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Error Breakdown</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {Object.entries(meta.errors).map(([type, count]) => (
                            <div key={type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{type}</span>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#f87171' }}>{count.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()
            ) : selected ? (
              /* ── Normal Run Detail ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Run Summary</h3>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0' }}>{new Date(selected.triggeredAt).toLocaleString()}</p>
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 10px', borderRadius: '6px', background: statusBg[selected.status], color: statusColor[selected.status] }}>
                      {selected.status}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <p style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Duration</p>
                      <p style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>{selected.totalTime}ms</p>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <p style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Nodes</p>
                      <p style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>{selected.nodes.length}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px 4px' }}>Node Activity</h4>
                  {selected.nodes.map((node) => (
                    <div key={node.nodeId} style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor[node.status] }} />
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#eee' }}>{node.nodeLabel}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{node.executionTime}ms</span>
                      </div>
                      {node.error && (
                        <div style={{ marginTop: '4px', padding: '8px 10px', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.1)', borderRadius: '6px', fontSize: '11px', color: '#fca5a5', fontFamily: 'monospace', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                          {node.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  )
}