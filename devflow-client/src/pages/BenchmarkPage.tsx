import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { getSocket } from '../services/socketService'
import { useFlowStore } from '../store/flowStore'
import { useAuthStore } from '../store/authStore'

// ─── Types ────────────────────────────────────────────────────────────────────
type StatusCodes = {
  s2xx: number; s3xx: number; s4xx: number; s5xx: number
  sTimeout: number; sConnErr: number
}

type LoadTestStats = {
  loadTestId: string
  total: number; completed: number; successful: number; failed: number
  avgLatency: number; minLatency: number; maxLatency: number
  p50: number; p95: number; p99: number
  rps: number; active: number; elapsed: number
  successRate: number; progress: number
  statusCodes: StatusCodes
  errors?: Record<string, number>
}

type RpsDataPoint = { time: number; rps: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

/** Always display latency in seconds */
function fmtSec(ms: number): string {
  if (ms <= 0) return '—'
  return `${(ms / 1000).toFixed(2)}s`
}

function getVerdict(s: LoadTestStats): {
  label: string; emoji: string; color: string; bg: string; border: string; desc: string
} {
  const { successRate, avgLatency, rps } = s
  if (successRate >= 99 && avgLatency <= 200 && rps >= 50)
    return { label: 'Excellent', emoji: '🚀', color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)', desc: 'API handled all traffic perfectly — zero bottlenecks, ultra-low latency.' }
  if (successRate >= 95 && avgLatency <= 500)
    return { label: 'Good', emoji: '✅', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.25)', desc: 'API performed well under load. Minor latency increases are acceptable at this scale.' }
  if (successRate >= 80)
    return { label: 'Degraded', emoji: '⚠️', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', desc: 'Significant degradation detected. Check rate limits, connection pools, and server CPU/memory.' }
  return { label: 'Poor', emoji: '🔴', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', desc: 'High failure rate — the API cannot handle this load. Scale horizontally or reduce per-request cost.' }
}

function LatencyBar({ label, ms, maxMs, color }: { label: string; ms: number; maxMs: number; color: string }) {
  const pct = maxMs > 0 ? Math.min((ms / maxMs) * 100, 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ width: '34px', fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '10px', transition: 'width 0.5s' }} />
      </div>
      <span style={{ minWidth: '44px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{fmtSec(ms)}</span>
    </div>
  )
}

function StatCard({ label, value, sub, color = '#fff' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
      <p style={{ margin: '0 0 5px', fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      {sub && <p style={{ margin: '3px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{sub}</p>}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function BenchmarkPage({ onClose }: { onClose: () => void }) {
  const { nodes, workflowId } = useFlowStore()
  const { user } = useAuthStore()

  // Config
  const [targetUrl, setTargetUrl]       = useState('')
  const [method, setMethod]             = useState('GET')
  const [totalUsers, setTotalUsers]     = useState(1000)
  const [batchSize, setBatchSize]       = useState(100)
  const [testMode, setTestMode]         = useState<'spike' | 'ramp'>('spike')
  const [rampSecs, setRampSecs]         = useState(30)
  const [customHeaders, setCustomHeaders] = useState('')
  const [body, setBody]                 = useState('')

  // Runtime state
  const [phase, setPhase]         = useState<'config' | 'running' | 'complete'>('config')
  const [loadTestId, setLoadTestId] = useState<string | null>(null)
  const [stats, setStats]         = useState<LoadTestStats | null>(null)
  const [finalStats, setFinalStats] = useState<LoadTestStats | null>(null)
  const [rpsHistory, setRpsHistory] = useState<RpsDataPoint[]>([])
  const [errors, setErrors]       = useState<Record<string, number>>({})
  const [saved, setSaved]         = useState(false)
  const saveAttempted             = useRef(false)

  // Pre-fill URL from canvas node
  useEffect(() => {
    if (nodes.length > 0 && nodes[0].data.url) {
      setTargetUrl(nodes[0].data.url)
      setMethod(nodes[0].data.method)
    }
  }, [nodes])

  // Socket listener
  useEffect(() => {
    if (!user) return
    const socket = getSocket()
    const userId = user.id || (user as any)._id
    socket.emit('join_loadtest', userId)

    socket.on('loadtest_update', (data: LoadTestStats) => {
      setStats(data)
      setRpsHistory((prev) => [...prev, { time: Date.now(), rps: data.rps }].slice(-80))
    })

    socket.on('loadtest_complete', (data: LoadTestStats & { errors: Record<string, number> }) => {
      setStats(data)
      setFinalStats(data)
      setErrors(data.errors ?? {})
      setPhase('complete')
    })

    return () => {
      socket.off('loadtest_update')
      socket.off('loadtest_complete')
    }
  }, [user])

  // Auto-save to history when complete
  useEffect(() => {
    if (phase !== 'complete' || !finalStats || saveAttempted.current) return
    saveAttempted.current = true
    api.post('/loadtest/save', {
      workflowId: workflowId ?? undefined,
      loadTestId: finalStats.loadTestId,
      targetUrl, method,
      totalUsers: finalStats.total, completed: finalStats.completed,
      successful: finalStats.successful, failed: finalStats.failed,
      successRate: finalStats.successRate, avgLatency: finalStats.avgLatency,
      p95: finalStats.p95, p99: finalStats.p99,
      rps: finalStats.rps, elapsed: finalStats.elapsed, errors,
    }).then(() => setSaved(true)).catch(() => {})
  }, [phase, finalStats])

  const startLoadTest = async () => {
    if (!targetUrl) return
    setPhase('running'); setStats(null); setFinalStats(null)
    setRpsHistory([]); setErrors({}); setSaved(false)
    saveAttempted.current = false

    let parsedHeaders: Record<string, string> = {}
    try { if (customHeaders.trim()) parsedHeaders = JSON.parse(customHeaders) }
    catch { alert('Invalid headers JSON'); setPhase('config'); return }

    try {
      const res = await api.post('/loadtest/start', {
        workflowId: workflowId ?? undefined,
        targetUrl, method, headers: parsedHeaders,
        body: body.trim() || undefined,
        totalUsers,
        rampUpSeconds: testMode === 'spike' ? 0 : rampSecs,
        batchSize,
      })
      setLoadTestId(res.data.loadTestId)
    } catch {
      alert('Failed to start load test')
      setPhase('config')
    }
  }

  const stopLoadTest = async () => {
    if (!loadTestId) return
    await api.post(`/loadtest/stop/${loadTestId}`).catch(() => {})
    setPhase('complete')
  }

  const reset = () => {
    setPhase('config'); setStats(null); setFinalStats(null)
    setRpsHistory([]); setErrors({}); setSaved(false)
    saveAttempted.current = false
  }

  const maxRps    = rpsHistory.length > 0 ? Math.max(...rpsHistory.map((r) => r.rps), 1) : 1
  const verdict   = finalStats ? getVerdict(finalStats) : null
  const displayed = stats

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(18px)' }} onClick={phase === 'config' ? onClose : undefined} />

      <div style={{ width: '100%', maxWidth: '1000px', maxHeight: '93vh', background: '#090909', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '22px', boxShadow: '0 60px 120px -20px rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', position: 'relative', animation: 'ltIn 0.35s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* ── Header ── */}
        <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#fff' }}>Load Tester</h1>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                {phase === 'config'   && 'Simulate thousands of concurrent users hitting your API'}
                {phase === 'running'  && displayed && `${displayed.progress}% · ${fmtNum(displayed.completed)} / ${fmtNum(displayed.total)} requests · ${displayed.elapsed}s elapsed`}
                {phase === 'running'  && !displayed && 'Launching workers...'}
                {phase === 'complete' && finalStats && `Completed · ${fmtNum(finalStats.total)} users · ${finalStats.elapsed}s`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {phase === 'running' && (
              <button onClick={stopLoadTest} style={{ padding: '6px 13px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Stop</button>
            )}
            <button onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ════ CONFIG PHASE ════ */}
          {phase === 'config' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Test mode selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {(['spike', 'ramp'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setTestMode(m)}
                    style={{ padding: '14px', borderRadius: '13px', border: `1px solid ${testMode === m ? (m === 'spike' ? 'rgba(239,68,68,0.4)' : 'rgba(99,102,241,0.4)') : 'rgba(255,255,255,0.06)'}`, background: testMode === m ? (m === 'spike' ? 'rgba(239,68,68,0.08)' : 'rgba(99,102,241,0.08)') : 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <p style={{ margin: '0 0 3px', fontSize: '12px', fontWeight: 700, color: testMode === m ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                      {m === 'spike' ? '⚡ Spike Test' : '📈 Ramp Test'}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                      {m === 'spike' ? 'All users hit at once — maximum concurrency' : 'Gradually increase load over time'}
                    </p>
                  </button>
                ))}
              </div>

              {/* URL */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Target Endpoint</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}>
                    {['GET','POST','PUT','DELETE','PATCH'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://api.example.com/endpoint" style={{ flex: 1, background: '#141414', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', fontFamily: 'monospace', outline: 'none' }} />
                </div>
              </div>

              {/* Knobs */}
              <div style={{ display: 'grid', gridTemplateColumns: testMode === 'ramp' ? 'repeat(3,1fr)' : '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'Total Users', value: totalUsers, set: (v: number) => setTotalUsers(Math.min(v, 1_000_000)), min: 1, max: 1_000_000, hint: 'Concurrent virtual users', color: '#f59e0b' },
                  { label: 'Batch Size', value: batchSize, set: (v: number) => setBatchSize(Math.min(v, 500)), min: 1, max: 500, hint: 'Requests per worker slot', color: '#34d399' },
                  ...(testMode === 'ramp' ? [{ label: 'Ramp-up (s)', value: rampSecs, set: setRampSecs, min: 1, max: 300, hint: 'Seconds to reach full load', color: '#818cf8' }] : []),
                ].map((f) => (
                  <div key={f.label} style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '13px', padding: '14px' }}>
                    <label style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '7px' }}>{f.label}</label>
                    <input type="number" value={f.value} min={f.min} max={f.max} onChange={(e) => f.set(Number(e.target.value))} style={{ width: '100%', background: 'transparent', border: 'none', color: f.color, fontSize: '28px', fontWeight: 800, outline: 'none', padding: 0 }} />
                    <p style={{ margin: '3px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>{f.hint}</p>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Concurrent Batches', value: Math.ceil(totalUsers / batchSize).toLocaleString() },
                  { label: 'Max Simultaneous Req', value: fmtNum(Math.min(totalUsers, batchSize * 200)) },
                  { label: 'Mode', value: testMode === 'spike' ? '⚡ All-at-once' : `📈 ${rampSecs}s ramp` },
                  { label: 'Per Batch', value: `${batchSize} requests` },
                ].map((item) => (
                  <div key={item.label}>
                    <p style={{ margin: 0, fontSize: '9px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 700, color: '#fff' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Advanced */}
              <details>
                <summary style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, listStyle: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  Custom Headers &amp; Body
                </summary>
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea value={customHeaders} onChange={(e) => setCustomHeaders(e.target.value)} placeholder={'{\n  "Authorization": "Bearer token"\n}'} rows={3} style={{ width: '100%', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '10px', padding: '10px 14px', fontSize: '11px', fontFamily: 'monospace', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                  {['POST','PUT','PATCH'].includes(method) && (
                    <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={'{\n  "key": "value"\n}'} rows={3} style={{ width: '100%', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '10px', padding: '10px 14px', fontSize: '11px', fontFamily: 'monospace', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                  )}
                </div>
              </details>

              <button onClick={startLoadTest} disabled={!targetUrl} style={{ padding: '14px', borderRadius: '13px', background: targetUrl ? 'linear-gradient(135deg,#fff 0%,#e5e5e5 100%)' : 'rgba(255,255,255,0.05)', color: targetUrl ? '#000' : 'rgba(255,255,255,0.2)', fontSize: '14px', fontWeight: 800, border: 'none', cursor: targetUrl ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '-0.01em' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                {testMode === 'spike' ? `⚡ Spike Test — ${fmtNum(totalUsers)} users at once` : `📈 Ramp Test — ${fmtNum(totalUsers)} users over ${rampSecs}s`}
              </button>
            </div>
          )}

          {/* ════ RUNNING — no data yet ════ */}
          {phase === 'running' && !displayed && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '20px' }}>
              <div style={{ position: 'relative', width: '52px', height: '52px' }}>
                <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(255,255,255,0.06)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', inset: 0, border: '3px solid transparent', borderTopColor: '#ef4444', borderRadius: '50%', animation: 'ltSpin 0.9s linear infinite' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#fff' }}>Firing requests...</p>
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                  {testMode === 'spike' ? `All ${fmtNum(totalUsers)} users hitting simultaneously` : `Ramping up over ${rampSecs}s`}
                </p>
              </div>
            </div>
          )}

          {/* ════ RUNNING — live data ════ */}
          {phase === 'running' && displayed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Status + progress */}
              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'ltPulse 1s infinite' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>LIVE</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{displayed.elapsed}s · {fmtNum(displayed.active)} active users</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(displayed.completed)} / {fmtNum(displayed.total)}</span>
                  <div style={{ width: '90px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${displayed.progress}%`, height: '100%', background: 'linear-gradient(90deg,#ef4444,#f97316)', borderRadius: '10px', transition: 'width 0.6s' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff', minWidth: '30px' }}>{displayed.progress}%</span>
                </div>
              </div>

              {/* Top metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                <StatCard label="Req/sec" value={fmtNum(displayed.rps)} sub="throughput" />
                <StatCard label="Success Rate" value={`${displayed.successRate}%`} color={displayed.successRate >= 95 ? '#34d399' : displayed.successRate >= 80 ? '#f59e0b' : '#ef4444'} />
                <StatCard label="Failures" value={fmtNum(displayed.failed)} sub={`of ${fmtNum(displayed.completed)}`} color={displayed.failed === 0 ? '#34d399' : '#f87171'} />
              </div>

              {/* Latency bars */}
              <div style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ margin: '0 0 12px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Latency Distribution</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(() => {
                    const maxMs = displayed.maxLatency || displayed.p99 || 1
                    return [
                      { label: 'Min',  ms: displayed.minLatency, color: '#34d399' },
                      { label: 'Avg',  ms: displayed.avgLatency, color: '#60a5fa' },
                      { label: 'P50',  ms: displayed.p50,        color: '#818cf8' },
                      { label: 'P95',  ms: displayed.p95,        color: '#f59e0b' },
                      { label: 'P99',  ms: displayed.p99,        color: '#f87171' },
                      { label: 'Max',  ms: displayed.maxLatency, color: '#ef4444' },
                    ].map((r) => <LatencyBar key={r.label} {...r} maxMs={maxMs} />)
                  })()}
                </div>
              </div>

              {/* Status code buckets */}
              {displayed.statusCodes && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                  {[
                    { label: '2xx OK',      val: displayed.statusCodes.s2xx,     color: '#34d399' },
                    { label: '3xx Redirect', val: displayed.statusCodes.s3xx,    color: '#60a5fa' },
                    { label: '4xx Client',   val: displayed.statusCodes.s4xx,    color: '#f59e0b' },
                    { label: '5xx Server',   val: displayed.statusCodes.s5xx,    color: '#f87171' },
                    { label: 'Timeout',      val: displayed.statusCodes.sTimeout, color: '#c084fc' },
                    { label: 'Conn Error',   val: displayed.statusCodes.sConnErr, color: '#ef4444' },
                  ].map((b) => (
                    <div key={b.label} style={{ padding: '10px 12px', background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{b.label}</p>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: b.val > 0 ? b.color : 'rgba(255,255,255,0.15)', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(b.val)}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* RPS chart */}
              {rpsHistory.length > 1 && (
                <div style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Requests / Second</p>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#f87171' }}>Peak {fmtNum(maxRps)} rps</span>
                  </div>
                  <div style={{ height: '64px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
                    {rpsHistory.map((p, i) => (
                      <div key={i} style={{ flex: 1, height: `${Math.max((p.rps / maxRps) * 100, 2)}%`, background: `rgba(239,68,68,${0.2 + (i / rpsHistory.length) * 0.6})`, borderRadius: '2px 2px 0 0', transition: 'height 0.3s' }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ COMPLETE PHASE ════ */}
          {phase === 'complete' && finalStats && verdict && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Verdict hero */}
              <div style={{ padding: '20px 22px', background: verdict.bg, border: `1px solid ${verdict.border}`, borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>{verdict.emoji}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Performance Verdict</p>
                      <p style={{ margin: '2px 0 0', fontSize: '24px', fontWeight: 900, color: verdict.color, letterSpacing: '-0.02em' }}>{verdict.label}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Success Rate</p>
                    <p style={{ margin: '2px 0 0', fontSize: '34px', fontWeight: 900, color: verdict.color, fontVariantNumeric: 'tabular-nums' }}>{finalStats.successRate}%</p>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6', borderTop: `1px solid ${verdict.border}`, paddingTop: '10px' }}>{verdict.desc}</p>
              </div>

              {/* Quick summary bar */}
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                  {fmtNum(finalStats.total)} users · {finalStats.elapsed}s · {fmtNum(finalStats.rps)} peak rps · {fmtSec(finalStats.avgLatency)} avg
                </span>
                {saved && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#34d399', fontSize: '11px', fontWeight: 600 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Saved to History
                  </div>
                )}
              </div>

              {/* Throughput + reliability row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                <StatCard label="Peak Req/sec" value={fmtNum(maxRps)} sub="throughput" color="#fff" />
                <StatCard label="Successful" value={fmtNum(finalStats.successful)} sub={`${finalStats.successRate}% of total`} color="#34d399" />
                <StatCard label="Failed" value={fmtNum(finalStats.failed)} sub={finalStats.failed === 0 ? 'Zero failures ✓' : 'See breakdown below'} color={finalStats.failed === 0 ? '#34d399' : '#f87171'} />
              </div>

              {/* Latency analysis */}
              <div style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '13px', padding: '16px' }}>
                <p style={{ margin: '0 0 14px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Latency Analysis</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  {(() => {
                    const maxMs = finalStats.maxLatency || finalStats.p99 || 1
                    return [
                      { label: 'Min',  ms: finalStats.minLatency, color: '#34d399' },
                      { label: 'Avg',  ms: finalStats.avgLatency, color: '#60a5fa' },
                      { label: 'P50',  ms: finalStats.p50,        color: '#818cf8' },
                      { label: 'P95',  ms: finalStats.p95,        color: '#f59e0b' },
                      { label: 'P99',  ms: finalStats.p99,        color: '#f87171' },
                      { label: 'Max',  ms: finalStats.maxLatency, color: '#ef4444' },
                    ].map((r) => <LatencyBar key={r.label} {...r} maxMs={maxMs} />)
                  })()}
                </div>
                <p style={{ margin: '14px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
                  Spread: {fmtSec(finalStats.minLatency)} – {fmtSec(finalStats.maxLatency)} · P99–P50 gap: {fmtSec(finalStats.p99 - finalStats.p50)} (tail latency indicator)
                </p>
              </div>

              {/* Status code breakdown */}
              {finalStats.statusCodes && (
                <div style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '13px', padding: '16px' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>HTTP Response Breakdown</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                    {[
                      { label: '2xx Success',   val: finalStats.statusCodes.s2xx,      color: '#34d399', pct: finalStats.completed },
                      { label: '3xx Redirect',  val: finalStats.statusCodes.s3xx,      color: '#60a5fa', pct: finalStats.completed },
                      { label: '4xx Client Err',val: finalStats.statusCodes.s4xx,      color: '#f59e0b', pct: finalStats.completed },
                      { label: '5xx Server Err',val: finalStats.statusCodes.s5xx,      color: '#f87171', pct: finalStats.completed },
                      { label: 'Timeout (30s)', val: finalStats.statusCodes.sTimeout,  color: '#c084fc', pct: finalStats.completed },
                      { label: 'Conn Error',    val: finalStats.statusCodes.sConnErr,  color: '#ef4444', pct: finalStats.completed },
                    ].map((b) => {
                      const pctVal = b.pct > 0 ? Math.round((b.val / b.pct) * 100) : 0
                      return (
                        <div key={b.label} style={{ padding: '10px 12px', background: b.val > 0 ? 'rgba(255,255,255,0.02)' : 'transparent', border: `1px solid ${b.val > 0 ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)'}`, borderRadius: '10px' }}>
                          <p style={{ margin: '0 0 3px', fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{b.label}</p>
                          <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: b.val > 0 ? b.color : 'rgba(255,255,255,0.1)', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(b.val)}</p>
                          {b.val > 0 && <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{pctVal}% of requests</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Error type breakdown */}
              {Object.keys(errors).length > 0 && (
                <div style={{ padding: '14px 16px', background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.12)', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Error Type Breakdown</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {Object.entries(errors).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                      const pct = finalStats.failed > 0 ? Math.round((count / finalStats.failed) * 100) : 0
                      return (
                        <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ flex: 1, fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{type}</span>
                          <div style={{ width: `${Math.min(pct * 1.2, 100)}px`, height: '3px', background: '#ef4444', borderRadius: '10px', opacity: 0.5 }} />
                          <span style={{ minWidth: '32px', fontSize: '11px', fontWeight: 700, color: '#f87171', textAlign: 'right' }}>{count.toLocaleString()}</span>
                          <span style={{ minWidth: '30px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* RPS chart */}
              {rpsHistory.length > 1 && (
                <div style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Req/sec Over Time</p>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#60a5fa' }}>Peak {fmtNum(maxRps)} rps</span>
                  </div>
                  <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
                    {rpsHistory.map((p, i) => <div key={i} style={{ flex: 1, height: `${Math.max((p.rps / maxRps) * 100, 2)}%`, background: 'rgba(96,165,250,0.45)', borderRadius: '2px 2px 0 0' }} />)}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div style={{ padding: '15px 16px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '13px' }}>
                <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Developer Analysis</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {[
                    finalStats.avgLatency > 1000  ? `🔴 Avg latency ${fmtSec(finalStats.avgLatency)} — responses are critically slow. Profile DB queries and reduce synchronous I/O.` : null,
                    finalStats.avgLatency > 500   ? `⚠️ Avg latency ${fmtSec(finalStats.avgLatency)} — consider response caching (Redis) or CDN for static responses.` : null,
                    finalStats.avgLatency <= 200  ? `✅ Avg latency ${fmtSec(finalStats.avgLatency)} — excellent response time under load.` : null,
                    finalStats.p99 - finalStats.p50 > 2000 ? `⚠️ High tail latency gap (${fmtSec(finalStats.p99 - finalStats.p50)}) — some requests are severely affected. Check for lock contention or GC pauses.` : null,
                    finalStats.statusCodes?.s5xx > 0 ? `🔴 ${fmtNum(finalStats.statusCodes.s5xx)} server errors (5xx) — your backend is throwing exceptions under load. Check error logs and connection pool limits.` : null,
                    finalStats.statusCodes?.s4xx > 0 ? `⚠️ ${fmtNum(finalStats.statusCodes.s4xx)} client errors (4xx) — check for rate limiting (429) or auth issues at scale.` : null,
                    finalStats.statusCodes?.sTimeout > 0 ? `🔴 ${fmtNum(finalStats.statusCodes.sTimeout)} timeouts — server is overwhelmed, requests taking >30s. Scale horizontally or add a load balancer.` : null,
                    finalStats.successRate >= 99  ? `✅ ${finalStats.successRate}% success rate — API is production-ready for this traffic level.` : null,
                    `ℹ️ To scale to 1M users: deploy ${Math.ceil(1_000_000 / 50_000)} worker replicas — all share the same BullMQ Redis queue for zero-config horizontal scaling.`,
                  ].filter(Boolean).map((tip, i) => (
                    <p key={i} style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.55' }}>{tip}</p>
                  ))}
                </div>
              </div>

              <button onClick={reset} style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                Run Another Test
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ltIn { from { opacity:0; transform:scale(0.96) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes ltPulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes ltSpin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>
    </div>
  )
}