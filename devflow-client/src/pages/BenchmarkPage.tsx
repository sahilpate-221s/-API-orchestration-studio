// import { useState, useEffect, useRef, useCallback } from 'react'
// import api from '../services/api'
// import { getSocket } from '../services/socketService'
// import { useFlowStore } from '../store/flowStore'
// import { useAuthStore } from '../store/authStore'

// // ─── Types ────────────────────────────────────────────────────────────────────
// type StatusCodes = { s2xx: number; s3xx: number; s4xx: number; s5xx: number; sTimeout: number; sConnErr: number }
// type SpeedBuckets = { fast: number; ok: number; slow: number; verySlow: number }
// type LoadTestStats = {
//   loadTestId: string
//   total: number; completed: number; successful: number; failed: number
//   avgLatency: number; minLatency: number; maxLatency: number
//   rps: number; instantRps: number; active: number; elapsed: number
//   successRate: number; progress: number
//   statusCodes: StatusCodes; speed: SpeedBuckets
//   rpsTimeline?: number[]; latencyTimeline?: number[]
//   usersTimeline?: number[]; queueTimeline?: number[]
//   errors?: Record<string, number>
//   verdict?: string; verdictDesc?: string
// }

// const fmtNum = (n: number) =>
//   n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
//     : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n)
// const fmtMs = (ms: number | undefined) => {
//   if (!ms || ms <= 0) return '—'
//   return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`
// }

// const VERDICTS: Record<string, { emoji: string; color: string; bg: string; border: string; label: string; desc: string; tips: string[] }> = {
//   'Excellent':              { emoji: '🚀', color: '#3ECF8E', bg: 'rgba(62,207,142,0.08)',   border: 'rgba(62,207,142,0.25)',   label: 'Production Ready',       desc: 'Zero bottleneck saturation. All requests handled cleanly with low latency.',  tips: ['Deploy behind a CDN for further latency reduction.', 'Maintain current resource config.'] },
//   'Out Of Memory':          { emoji: '💥', color: '#EF4444', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.25)',    label: 'OOM Crash',              desc: 'Server ran out of memory buffering active request queues.',                   tips: ['Increase server RAM allocation.', 'Stream heavy payloads instead of fully buffering.', 'Add rate-limiting to drop packets early.'] },
//   'Database Pool Starvation':{ emoji: '🗄️', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)',  label: 'DB Pool Starved',        desc: 'DB connection pool saturated — requests blocked waiting for a free slot.',   tips: ['Increase db pool limit in environment config.', 'Deploy PgBouncer or similar pooler.', 'Add Redis caching for hot read endpoints.'] },
//   'Request Timeout':        { emoji: '⏳', color: '#EC4899', bg: 'rgba(236,72,153,0.08)',   border: 'rgba(236,72,153,0.25)',   label: 'Event Loop Blocked',     desc: 'Requests queued beyond gateway timeout. Server event loop fully saturated.',  tips: ['Delegate CPU work to Worker Threads.', 'Offload tasks to BullMQ queues.', 'Scale horizontally with PM2 Cluster.'] },
//   'CPU Saturated':          { emoji: '🔥', color: '#EF4444', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.25)',    label: 'CPU Exhaustion',         desc: 'CPU cores at 100%. Request queue overflowed, connections dropped with 503.',  tips: ['Upgrade to more CPU cores.', 'Add a load balancer + backend replicas.', 'Reduce per-request serialization overhead.'] },
//   'Degraded Performance':   { emoji: '⚠️', color: '#8B7CF6', bg: 'rgba(139,124,246,0.08)', border: 'rgba(139,124,246,0.25)', label: 'Latency Degraded',       desc: 'Server handled all requests but response time climbed significantly.',        tips: ['Profile endpoint for nested ORM queries.', 'Add Cache-Control headers to offload load.', 'Enable gzip/brotli compression.'] },
// }

// // ─── Design System Tokens (DevFlow Emerald + Raycast Command Studio) ─────────
// const C = {
//   bg: '#0B0C0E',
//   surface: '#0E0F12',
//   surfaceElevated: '#131417',
//   borderSubtle: 'rgba(255, 255, 255, 0.08)',
//   borderDefault: 'rgba(255, 255, 255, 0.12)',
//   borderHighlight: 'rgba(62, 207, 142, 0.35)',
//   textPrimary: '#F2F3F5',
//   textSecondary: '#93959D',
//   textMuted: '#5A5C64',
//   accent: '#3ECF8E',
//   accentPurple: '#8B7CF6',
//   brandGradient: 'linear-gradient(135deg, #059669 0%, #3ECF8E 50%, #8B7CF6 100%)',
//   emeraldGlow: '0 0 24px rgba(62, 207, 142, 0.25)',
//   success: '#3ECF8E',
//   warning: '#F59E0B',
//   error: '#EF4444',
//   purple: '#8B7CF6',
//   blue: '#60A5FA'
// }

// const METHOD_COLORS: Record<string, string> = {
//   GET: C.success, POST: C.blue, PUT: C.warning, DELETE: C.error, PATCH: C.purple
// }

// // Keyboard shortcut badge component (Raycast style)
// function Kbd({ children }: { children: React.ReactNode }) {
//   return (
//     <kbd style={{
//       display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
//       padding: '2px 6px', borderRadius: 5,
//       background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)',
//       boxShadow: '0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
//       color: 'rgba(255, 255, 255, 0.75)', fontSize: 10, fontWeight: 700,
//       fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, letterSpacing: '0.02em'
//     }}>
//       {children}
//     </kbd>
//   )
// }

// // Section Header Component for High Clarity
// function SectionHeader({ icon, title, desc }: { icon?: string; title: string; desc?: string }) {
//   return (
//     <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//       <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
//         {icon && <span style={{ fontSize: 11 }}>{icon}</span>}
//         <span style={{ fontSize: 10, fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'JetBrains Mono', monospace" }}>
//           {title}
//         </span>
//       </div>
//       {desc && <span style={{ fontSize: 10, color: C.textMuted }}>{desc}</span>}
//     </div>
//   )
// }

// // ─── Bezier chart helper ──────────────────────────────────────────────────────
// function buildBezierPath(data: number[], W: number, H: number, pad: number) {
//   const max = Math.max(...data, 1)
//   const min = Math.min(...data, 0)
//   const rng = max - min || 1
//   const pts = data.map((v, i) => ({
//     x: (i / (data.length - 1)) * W,
//     y: pad + ((1 - (v - min) / rng) * (H - pad * 2))
//   }))

//   let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
//   for (let i = 1; i < pts.length; i++) {
//     const cp1x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * 0.5
//     const cp2x = pts[i].x - (pts[i].x - pts[i - 1].x) * 0.5
//     d += ` C ${cp1x.toFixed(1)},${pts[i - 1].y.toFixed(1)} ${cp2x.toFixed(1)},${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`
//   }
//   const areaD = `${d} L ${pts[pts.length - 1].x.toFixed(1)},${H} L ${pts[0].x.toFixed(1)},${H} Z`
//   const lastPt = pts[pts.length - 1]
//   return { lineD: d, areaD, lastPt }
// }

// // ─── Waveform chart (bezier SVG) ──────────────────────────────────────────────
// function LiveChart({ data, color, label, value, height = 72 }: {
//   data: number[]; color: string; label: string; value: string; height?: number
// }) {
//   const W = 400; const H = 80
//   const has = data.length >= 2
//   const uid = `lc-${color.replace('#', '')}-${label.replace(/\s/g, '')}`

//   let lineD = ''; let areaD = ''; let lastPt = { x: 0, y: 0 }
//   if (has) {
//     const result = buildBezierPath(data, W, H, 6)
//     lineD = result.lineD; areaD = result.areaD; lastPt = result.lastPt
//   }

//   return (
//     <div style={{
//       background: C.surface, border: `1px solid ${C.borderSubtle}`,
//       borderRadius: 14, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8,
//       boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)'
//     }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <span style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
//         <span style={{ fontSize: 14, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
//       </div>
//       <div style={{ height, position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
//         {!has ? (
//           <div style={{ height: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
//             <div style={{
//               width: '60%', height: 2, borderRadius: 2,
//               background: `linear-gradient(90deg, transparent, ${color}66, transparent)`,
//               animation: 'ltScan 1.8s ease-in-out infinite'
//             }} />
//           </div>
//         ) : (
//           <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
//             <defs>
//               <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
//                 <stop offset="0%" stopColor={color} stopOpacity="0.25" />
//                 <stop offset="85%" stopColor={color} stopOpacity="0" />
//               </linearGradient>
//             </defs>
//             {/* grid lines */}
//             <line x1="0" y1={H * 0.25} x2={W} y2={H * 0.25} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="4 4" />
//             <line x1="0" y1={H * 0.5} x2={W} y2={H * 0.5} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="4 4" />
//             <line x1="0" y1={H * 0.75} x2={W} y2={H * 0.75} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="4 4" />
//             {/* area fill */}
//             <path d={areaD} fill={`url(#${uid})`} />
//             {/* line */}
//             <path d={lineD} fill="none" stroke={color} strokeWidth="1.8"
//               strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
//             {/* end glow dot */}
//             <circle cx={lastPt.x} cy={lastPt.y} r="5" fill={color} opacity="0.3" />
//             <circle cx={lastPt.x} cy={lastPt.y} r="2.5" fill={color} />
//           </svg>
//         )}
//       </div>
//     </div>
//   )
// }

// // ─── Gauge ring ───────────────────────────────────────────────────────────────
// function GaugeRing({ pct, color, label, sub }: { pct: number; color: string; label: string; sub: string }) {
//   const r = 22; const circ = 2 * Math.PI * r
//   const off = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ
//   return (
//     <div style={{
//       flex: 1, background: C.surface, border: `1px solid ${C.borderSubtle}`,
//       borderRadius: 14, padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
//       boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)'
//     }}>
//       <div style={{ position: 'relative', flexShrink: 0 }}>
//         <svg width="56" height="56" viewBox="0 0 56 56">
//           <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4.5" />
//           <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circ}
//             strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 28 28)"
//             style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.35s ease' }} />
//         </svg>
//         <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//           <span style={{ fontSize: 11, fontWeight: 800, color: C.textPrimary, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>
//             {pct === 0 ? <span style={{ color: C.textMuted, fontWeight: 400, fontSize: 10 }}>—</span> : `${pct}%`}
//           </span>
//         </div>
//       </div>
//       <div style={{ textAlign: 'center' }}>
//         <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2, fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
//         <div style={{ fontSize: 10, color: C.textSecondary, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>{sub}</div>
//       </div>
//     </div>
//   )
// }

// // ─── Pattern card SVG ─────────────────────────────────────────────────────────
// function PatternPreview({ type, active }: { type: 'spike' | 'ramp' | 'wave'; active: boolean }) {
//   const stroke = active ? '#3ECF8E' : 'rgba(255,255,255,0.18)'
//   const fill = active ? 'rgba(62,207,142,0.12)' : 'rgba(255,255,255,0.02)'
//   if (type === 'spike') return (
//     <svg viewBox="0 0 80 36" width="80" height="36">
//       <polygon points="0,32 34,32 40,5 46,32 80,32" fill={fill} />
//       <polyline points="0,32 34,32 40,5 46,32 80,32" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
//     </svg>
//   )
//   if (type === 'ramp') return (
//     <svg viewBox="0 0 80 36" width="80" height="36">
//       <polygon points="0,32 80,6 80,32" fill={fill} />
//       <line x1="0" y1="32" x2="80" y2="6" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
//     </svg>
//   )
//   const sinPts = Array.from({ length: 40 }, (_, i) => {
//     const x = (i / 39) * 80
//     const y = 18 - Math.sin((i / 39) * Math.PI * 3.2) * 12
//     return `${x.toFixed(1)},${y.toFixed(1)}`
//   }).join(' ')
//   return (
//     <svg viewBox="0 0 80 36" width="80" height="36">
//       <polyline points={sinPts} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
//     </svg>
//   )
// }

// // ─── Skeleton loader ──────────────────────────────────────────────────────────
// function Skeleton({ width = '100%', height = 32 }: { width?: string | number; height?: number }) {
//   return (
//     <div style={{
//       width, height, borderRadius: 8,
//       background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)',
//       backgroundSize: '200% 100%',
//       animation: 'ltSkeleton 1.5s ease-in-out infinite'
//     }} />
//   )
// }

// // ─── Big Number Selector ──────────────────────────────────────────────────────
// const VU_STEPS = [100, 500, 1_000, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000]
// const DUR_PRESETS = [15, 30, 45, 60, 90, 120]

// function VuSelector({ value, onChange, durationSecs }: { value: number; onChange: (v: number) => void; durationSecs: number }) {
//   const labels: Record<number, string> = {
//     100: '100', 500: '500', 1_000: '1K', 5_000: '5K', 10_000: '10K',
//     25_000: '25K', 50_000: '50K', 100_000: '100K', 250_000: '250K',
//     500_000: '500K', 1_000_000: '1M'
//   }
//   const stepIdx = VU_STEPS.indexOf(value)
//   const sliderIdx = stepIdx === -1 ? 0 : stepIdx

//   const displayLabel = labels[value] ?? (value >= 1_000_000 ? '1M' : value >= 1_000 ? `${(value / 1_000).toFixed(0)}K` : String(value))
//   const estRequests = value * Math.max(1, Math.floor(durationSecs / 5))

//   return (
//     <div style={{
//       background: C.surface, border: `1px solid ${C.borderSubtle}`,
//       borderRadius: 14, padding: '18px 20px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)'
//     }}>
//       <SectionHeader icon="👥" title="Virtual Users Capacity" desc="Concurrent request workers" />

//       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
//         <div>
//           <div style={{
//             fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em',
//             background: 'linear-gradient(135deg, #3ECF8E 0%, #059669 40%, #8B7CF6 100%)',
//             WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
//             fontVariantNumeric: 'tabular-nums', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace",
//             transition: 'all 0.15s'
//           }}>
//             {displayLabel}
//           </div>
//           <div style={{ fontSize: 10.5, color: C.textSecondary, marginTop: 6 }}>
//             concurrent users firing requests simultaneously
//           </div>
//         </div>
//       </div>

//       {/* Quick-pick pills */}
//       <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14, marginTop: 14 }}>
//         {VU_STEPS.map(v => {
//           const sel = value === v
//           return (
//             <button key={v} onClick={() => onChange(v)} style={{
//               padding: '5px 12px', borderRadius: 100, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
//               fontSize: 10.5, fontWeight: 700, transition: 'all 0.15s',
//               background: sel ? 'rgba(62, 207, 142, 0.14)' : 'rgba(255,255,255,0.03)',
//               border: `1px solid ${sel ? 'rgba(62, 207, 142, 0.45)' : C.borderSubtle}`,
//               color: sel ? '#3ECF8E' : C.textSecondary,
//               boxShadow: sel ? '0 0 14px rgba(62, 207, 142, 0.2)' : 'none'
//             }}>
//               {labels[v]}
//             </button>
//           )
//         })}
//       </div>

//       {/* Smooth range slider */}
//       <input type="range" min={0} max={VU_STEPS.length - 1} step={1} value={sliderIdx}
//         onChange={e => onChange(VU_STEPS[Number(e.target.value)])}
//         style={{ width: '100%', accentColor: C.accent, cursor: 'pointer', height: 4 }} />

//       {/* Info text */}
//       <div style={{ fontSize: 10, color: C.textMuted, marginTop: 10, fontStyle: 'italic', fontFamily: "'JetBrains Mono', monospace" }}>
//         ~{fmtNum(estRequests)} total requests will be fired over {durationSecs}s
//       </div>
//     </div>
//   )
// }

// // ─── Main Component ───────────────────────────────────────────────────────────
// export default function BenchmarkPage({ onClose }: { onClose: () => void }) {
//   const { nodes, workflowId } = useFlowStore()
//   const { user } = useAuthStore()

//   const [targetUrl, setTargetUrl] = useState('')
//   const [method, setMethod] = useState('GET')
//   const [customHeaders, setCustomHeaders] = useState('')
//   const [body, setBody] = useState('')

//   const [totalUsers, setTotalUsers] = useState(1_000)
//   const [testMode, setTestMode] = useState<'spike' | 'ramp' | 'wave'>('spike')
//   const [durationSecs, setDurationSecs] = useState(30)

//   const [serverCores, setServerCores] = useState(16)
//   const [dbPoolLimit, setDbPoolLimit] = useState(200)
//   const [maxQueueBacklog, setMaxQueueBacklog] = useState(50_000)
//   const [serverMemoryGB, setServerMemoryGB] = useState(16)
//   const [networkBandwidthMbps, setNetworkBandwidthMbps] = useState(10_000)

//   const [phase, setPhase] = useState<'config' | 'running' | 'complete'>('config')
//   const [loadTestId, setLoadTestId] = useState<string | null>(null)
//   const [stats, setStats] = useState<LoadTestStats | null>(null)
//   const [finalStats, setFinalStats] = useState<LoadTestStats | null>(null)
//   const [errors, setErrors] = useState<Record<string, number>>({})
//   const [saved, setSaved] = useState(false)

//   const [rpsHistory, setRpsHistory] = useState<number[]>([])
//   const [latHistory, setLatHistory] = useState<number[]>([])
//   const [usersHistory, setUsersHistory] = useState<number[]>([])
//   const [queueHistory, setQueueHistory] = useState<number[]>([])
//   const [telemetry, setTelemetry] = useState<{ cpu: number; memory: number; dbPool: number; network: number; activeUsers: number; queueDepth: number } | null>(null)
//   const [simLogs, setSimLogs] = useState<string[]>([])

//   const [elapsed, setElapsed] = useState(0)
//   const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)
//   const terminalRef = useRef<HTMLDivElement>(null)
//   const terminalEndRef = useRef<HTMLDivElement>(null)
//   const saveAttempted = useRef(false)
//   const userScrolledUp = useRef(false)
//   const [showAdvanced, setShowAdvanced] = useState(false)

//   // speed bar animation state for complete phase
//   const [speedMounted, setSpeedMounted] = useState(false)

//   // Keyboard shortcut listener (Raycast command palette style)
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.key === 'Escape' && phase === 'config') {
//         onClose()
//       }
//       if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && phase === 'config' && targetUrl) {
//         e.preventDefault()
//         start()
//       }
//     }
//     window.addEventListener('keydown', handleKeyDown)
//     return () => window.removeEventListener('keydown', handleKeyDown)
//   }, [phase, targetUrl, onClose])

//   useEffect(() => {
//     if (phase === 'running') {
//       setElapsed(0)
//       elapsedRef.current = setInterval(() => setElapsed(p => p + 1), 1000)
//     } else {
//       if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null }
//     }
//     return () => { if (elapsedRef.current) clearInterval(elapsedRef.current) }
//   }, [phase])

//   useEffect(() => {
//     if (!userScrolledUp.current && terminalEndRef.current)
//       terminalEndRef.current.scrollIntoView({ behavior: 'smooth' })
//   }, [simLogs])

//   useEffect(() => {
//     const el = terminalRef.current; if (!el) return
//     const fn = () => { userScrolledUp.current = el.scrollHeight - el.scrollTop - el.clientHeight > 20 }
//     el.addEventListener('scroll', fn)
//     return () => el.removeEventListener('scroll', fn)
//   }, [])

//   useEffect(() => {
//     if (nodes.length > 0 && nodes[0].data.url) {
//       setTargetUrl(nodes[0].data.url); setMethod(nodes[0].data.method ?? 'GET')
//     }
//   }, [nodes])

//   useEffect(() => {
//     if (!user) return
//     const socket = getSocket()
//     const userId = ((user as any)._id ?? (user as any).id ?? '') as string
//     if (!userId) return
//     const joinRoom = () => socket.emit('join_loadtest', userId)
//     if (socket.connected) joinRoom(); else socket.once('connect', joinRoom)

//     socket.on('loadtest_update', (data: any) => {
//       setStats(data)
//       if (data.rpsTimeline)     setRpsHistory(data.rpsTimeline)
//       if (data.latencyTimeline) setLatHistory(data.latencyTimeline)
//       if (data.usersTimeline)   setUsersHistory(data.usersTimeline)
//       if (data.queueTimeline)   setQueueHistory(data.queueTimeline)
//       if (data.telemetry)       setTelemetry(data.telemetry)
//       if (data.logs)            setSimLogs(data.logs)
//     })
//     socket.on('loadtest_complete', (data: any) => {
//       setStats(data); setFinalStats(data); setErrors(data.errors ?? {}); setPhase('complete')
//       if (data.rpsTimeline)     setRpsHistory(data.rpsTimeline)
//       if (data.latencyTimeline) setLatHistory(data.latencyTimeline)
//       if (data.usersTimeline)   setUsersHistory(data.usersTimeline)
//       if (data.queueTimeline)   setQueueHistory(data.queueTimeline)
//       if (data.telemetry)       setTelemetry(data.telemetry)
//       if (data.logs)            setSimLogs(data.logs)
//     })
//     return () => { socket.off('connect', joinRoom); socket.off('loadtest_update'); socket.off('loadtest_complete') }
//   }, [user])

//   useEffect(() => {
//     if (phase !== 'complete' || !finalStats || saveAttempted.current) return
//     saveAttempted.current = true
//     api.post('/loadtest/save', {
//       workflowId: workflowId ?? undefined, loadTestId: finalStats.loadTestId, targetUrl, method,
//       totalUsers: finalStats.total, completed: finalStats.completed, successful: finalStats.successful,
//       failed: finalStats.failed, successRate: finalStats.successRate, avgLatency: finalStats.avgLatency,
//       minLatency: finalStats.minLatency, maxLatency: finalStats.maxLatency, rps: finalStats.rps,
//       elapsed: finalStats.elapsed, statusCodes: finalStats.statusCodes, errors, verdict: finalStats.verdict,
//     }).then(() => setSaved(true)).catch(() => {})
//   }, [phase, finalStats])

//   // trigger speed bar animation on complete
//   useEffect(() => {
//     if (phase === 'complete') {
//       setSpeedMounted(false)
//       const t = setTimeout(() => setSpeedMounted(true), 100)
//       return () => clearTimeout(t)
//     }
//   }, [phase])

//   const start = useCallback(async () => {
//     if (!targetUrl) return
//     setPhase('running'); setStats(null); setFinalStats(null)
//     setRpsHistory([]); setLatHistory([]); setUsersHistory([]); setQueueHistory([])
//     setTelemetry(null); setSimLogs([]); setErrors({}); setSaved(false)
//     saveAttempted.current = false; userScrolledUp.current = false

//     let parsedHeaders: Record<string, string> = {}
//     try { if (customHeaders.trim()) parsedHeaders = JSON.parse(customHeaders) }
//     catch { alert('Invalid JSON headers'); setPhase('config'); return }

//     try {
//       const res = await api.post('/loadtest/start', {
//         workflowId: workflowId ?? undefined, targetUrl, method,
//         headers: parsedHeaders, body: body.trim() || undefined,
//         totalUsers, durationSeconds: durationSecs, mode: testMode,
//         serverCores, dbPoolLimit, maxQueueBacklog, serverMemoryGB, networkBandwidthMbps
//       })
//       setLoadTestId(res.data.loadTestId)
//     } catch { alert('Failed to launch simulation'); setPhase('config') }
//   }, [targetUrl, method, totalUsers, testMode, durationSecs, customHeaders, body, workflowId, serverCores, dbPoolLimit, maxQueueBacklog, serverMemoryGB, networkBandwidthMbps])

//   const abort = useCallback(async () => {
//     if (!loadTestId) return
//     await api.post(`/loadtest/stop/${loadTestId}`).catch(() => {})
//     setPhase('complete')
//   }, [loadTestId])

//   const reset = useCallback(() => {
//     setPhase('config'); setStats(null); setFinalStats(null)
//     setRpsHistory([]); setLatHistory([]); setUsersHistory([]); setQueueHistory([])
//     setTelemetry(null); setSimLogs([]); setErrors({}); setSaved(false)
//     saveAttempted.current = false; userScrolledUp.current = false
//   }, [])

//   const peakRps = rpsHistory.length > 0 ? Math.max(...rpsHistory) : 0
//   const verdict = finalStats?.verdict ? (VERDICTS[finalStats.verdict] ?? VERDICTS['Excellent']) : null

//   const gc = (v: number) => v > 85 ? C.error : v > 60 ? C.warning : C.success

//   // ─── Status code breakdown data ───────────────────────────────────────────
//   const statusBreakdown = stats ? [
//     { label: '2xx Success', color: C.success, count: stats.statusCodes.s2xx, dot: '●' },
//     { label: '4xx Client Error', color: C.warning, count: stats.statusCodes.s4xx, dot: '●' },
//     { label: '5xx Server Error', color: C.error, count: stats.statusCodes.s5xx, dot: '●' },
//     { label: 'Timeout', color: '#EC4899', count: stats.statusCodes.sTimeout, dot: '●' },
//     { label: 'Conn Error', color: C.purple, count: stats.statusCodes.sConnErr, dot: '●' },
//   ] : []

//   return (
//     <div style={{
//       position: 'fixed', inset: 0, zIndex: 9999,
//       fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
//       display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
//     }}>
//       {/* DevFlow Ambient Glass Backdrop */}
//       <div style={{ position: 'absolute', inset: 0, background: 'rgba(11, 12, 14, 0.45)', backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)' }}
//         onClick={phase === 'config' ? onClose : undefined} />

//       {/* Fusion Window Container */}
//       <div style={{
//         position: 'relative', width: '100%', maxWidth: 1020, maxHeight: '94vh',
//         background: 'rgba(11, 12, 14, 0.78)',
//         backdropFilter: 'blur(24px) saturate(180%)',
//         WebkitBackdropFilter: 'blur(24px) saturate(180%)',
//         border: '1px solid rgba(255, 255, 255, 0.12)',
//         borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column',
//         boxShadow: '0 32px 90px rgba(0, 0, 0, 0.85), 0 0 70px rgba(62, 207, 142, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
//         animation: 'ltOpen 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
//       }}>

//         {/* Signature DevFlow Glow Orbs */}
//         <div aria-hidden style={{ position: 'absolute', top: '-15%', left: '15%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(62, 207, 142, 0.07) 0%, transparent 70%)', filter: 'blur(110px)', pointerEvents: 'none' }} />
//         <div aria-hidden style={{ position: 'absolute', bottom: '-15%', right: '12%', width: 440, height: 440, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139, 124, 246, 0.06) 0%, transparent 70%)', filter: 'blur(110px)', pointerEvents: 'none' }} />

//         {/* Dot pattern overlay */}
//         <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.35, pointerEvents: 'none' }} />

//         {/* ═══ Command Header Bar ═══ */}
//         <div style={{
//           display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//           padding: '14px 22px', borderBottom: `1px solid ${C.borderSubtle}`,
//           background: '#0E0F12', flexShrink: 0, position: 'relative', zIndex: 2
//         }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//             <div style={{
//               width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
//               background: 'rgba(62, 207, 142, 0.12)', border: '1px solid rgba(62, 207, 142, 0.3)',
//               boxShadow: '0 0 16px rgba(62, 207, 142, 0.2)'
//             }}>
//               <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3ECF8E" strokeWidth="2.5">
//                 <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
//               </svg>
//             </div>
//             <div>
//               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                 <span style={{ fontSize: 13.5, fontWeight: 800, color: C.textPrimary, letterSpacing: '-0.01em' }}>DevFlow Benchmark Studio</span>
//                 <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(62, 207, 142, 0.14)', color: '#3ECF8E', border: '1px solid rgba(62, 207, 142, 0.3)', fontFamily: "'JetBrains Mono', monospace" }}>LOAD ENGINE</span>
//               </div>
//               <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 1, fontFamily: "'JetBrains Mono', monospace" }}>
//                 {phase === 'config' && 'Configure load test parameters, traffic profiles & server hardware'}
//                 {phase === 'running' && `Executing · ${elapsed}s · ${totalUsers.toLocaleString()} VUs active`}
//                 {phase === 'complete' && `Simulation Complete · ${finalStats?.elapsed ?? 0}s · ${verdict?.label ?? ''}`}
//               </div>
//             </div>
//           </div>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//             {phase === 'config' && (
//               <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
//                 <Kbd>ESC</Kbd>
//                 <span style={{ fontSize: 10, color: C.textMuted }}>Close</span>
//               </div>
//             )}
//             {phase === 'running' && (
//               <button onClick={abort} style={{
//                 padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)',
//                 background: 'rgba(239,68,68,0.1)', color: '#F87171',
//                 fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
//               }}>Abort Simulation</button>
//             )}
//             <button onClick={onClose} style={{
//               width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.borderSubtle}`,
//               background: 'rgba(255,255,255,0.03)', color: C.textSecondary, cursor: 'pointer',
//               display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
//             }}>
//               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
//                 <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
//               </svg>
//             </button>
//           </div>
//         </div>

//         {/* ═══ Body Container ═══ */}
//         <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative', zIndex: 2 }}>

//           {/* ═══ PHASE 1: CONFIG ═══ */}
//           {phase === 'config' && (
//             <>
//               {/* 1. Target Endpoint Section */}
//               <div style={{ background: C.surface, border: `1px solid ${C.borderSubtle}`, borderRadius: 14, padding: '16px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
//                 <SectionHeader icon="🌐" title="1. Target API Endpoint" desc="Specify target URL & HTTP method" />
//                 <div style={{ display: 'flex', gap: 8 }}>
//                   <select value={method} onChange={e => setMethod(e.target.value)} style={{
//                     background: C.surfaceElevated, border: `1px solid ${C.borderDefault}`, color: METHOD_COLORS[method] || C.accent,
//                     borderRadius: 8, padding: '10px 14px', fontSize: 12, fontWeight: 800,
//                     outline: 'none', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", minWidth: 90
//                   }}>
//                     {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <option key={m} style={{ color: METHOD_COLORS[m] }}>{m}</option>)}
//                   </select>
//                   <input value={targetUrl} onChange={e => setTargetUrl(e.target.value)}
//                     placeholder="https://api.example.com/v1/users"
//                     style={{
//                       flex: 1, background: C.surfaceElevated, border: `1px solid ${C.borderDefault}`,
//                       color: C.textPrimary, borderRadius: 8, padding: '10px 14px',
//                       fontSize: 12, fontFamily: "'JetBrains Mono', monospace", outline: 'none'
//                     }} />
//                 </div>
//               </div>

//               {/* Two Column Section for VU + Traffic Pattern + Server Hardware */}
//               <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: 16 }}>
//                 {/* LEFT COLUMN */}
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
//                   {/* 2. VU Capacity Selector */}
//                   <VuSelector value={totalUsers} onChange={setTotalUsers} durationSecs={durationSecs} />

//                   {/* 3. Traffic Load Pattern */}
//                   <div style={{ background: C.surface, border: `1px solid ${C.borderSubtle}`, borderRadius: 14, padding: '16px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
//                     <SectionHeader icon="📈" title="Traffic Curve Pattern" desc="Simulated distribution model" />
//                     <div style={{ display: 'flex', gap: 8 }}>
//                       {(['spike', 'ramp', 'wave'] as const).map(mode => {
//                         const names = { spike: 'Spike Test', ramp: 'Linear Ramp', wave: 'Wave Load' }
//                         const descs = { spike: 'Instant max saturation', ramp: 'Gradual ramp up', wave: 'Oscillating traffic' }
//                         const sel = testMode === mode
//                         return (
//                           <button key={mode} onClick={() => setTestMode(mode)} style={{
//                             flex: 1, padding: '14px 8px 12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
//                             background: sel ? 'rgba(62, 207, 142, 0.08)' : 'rgba(255,255,255,0.02)',
//                             border: `1px solid ${sel ? 'rgba(62, 207, 142, 0.45)' : C.borderSubtle}`,
//                             boxShadow: sel ? '0 0 20px rgba(62, 207, 142, 0.16)' : 'none',
//                             display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
//                             transition: 'all 0.15s'
//                           }}>
//                             <PatternPreview type={mode} active={sel} />
//                             <div>
//                               <div style={{ fontSize: 11, fontWeight: 700, color: sel ? '#3ECF8E' : 'rgba(255,255,255,0.5)', textAlign: 'center' }}>{names[mode]}</div>
//                               <div style={{ fontSize: 8.5, color: C.textMuted, textAlign: 'center', marginTop: 2 }}>{descs[mode]}</div>
//                             </div>
//                           </button>
//                         )
//                       })}
//                     </div>
//                   </div>

//                   {/* 4. Test Duration presets */}
//                   <div style={{ background: C.surface, border: `1px solid ${C.borderSubtle}`, borderRadius: 14, padding: '16px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
//                     <SectionHeader icon="⏱" title="Simulation Duration" desc="Total run time in seconds" />
//                     <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
//                       <span style={{
//                         fontSize: 38, fontWeight: 900, color: C.textPrimary, letterSpacing: '-0.03em',
//                         fontVariantNumeric: 'tabular-nums', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace"
//                       }}>
//                         {durationSecs}
//                       </span>
//                       <span style={{ fontSize: 14, fontWeight: 500, color: C.textMuted }}>seconds</span>
//                     </div>
//                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
//                       {DUR_PRESETS.map(d => (
//                         <button key={d} onClick={() => setDurationSecs(d)} style={{
//                           padding: '5px 14px', borderRadius: 100, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
//                           fontSize: 10.5, fontWeight: 700, transition: 'all 0.15s',
//                           background: durationSecs === d ? 'rgba(62, 207, 142, 0.14)' : 'rgba(255,255,255,0.03)',
//                           border: `1px solid ${durationSecs === d ? 'rgba(62, 207, 142, 0.45)' : C.borderSubtle}`,
//                           color: durationSecs === d ? '#3ECF8E' : C.textSecondary
//                         }}>{d}s</button>
//                       ))}
//                     </div>
//                   </div>
//                 </div>

//                 {/* RIGHT COLUMN — Hardware Simulation */}
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
//                   {/* Server Profile panel */}
//                   <div style={{
//                     background: C.surface, border: `1px solid ${C.borderSubtle}`,
//                     borderRadius: 14, padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1,
//                     boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)'
//                   }}>
//                     <SectionHeader icon="⚡" title="Server Infrastructure" desc="Hardware constraints" />

//                     {[
//                       { label: 'CPU Cores', value: serverCores, set: (v: number) => setServerCores(v), min: 1, max: 128, step: 1, fmt: (v: number) => `${v} cores`, color: C.accent },
//                       { label: 'DB Connections', value: dbPoolLimit, set: (v: number) => setDbPoolLimit(v), min: 10, max: 1000, step: 10, fmt: (v: number) => `${v} max`, color: C.blue },
//                       { label: 'Server RAM', value: serverMemoryGB, set: (v: number) => setServerMemoryGB(v), min: 1, max: 64, step: 1, fmt: (v: number) => `${v} GB`, color: C.purple },
//                       { label: 'Queue Backlog', value: maxQueueBacklog, set: (v: number) => setMaxQueueBacklog(v), min: 1000, max: 200_000, step: 1000, fmt: (v: number) => fmtNum(v), color: C.warning },
//                       { label: 'Network Limit', value: networkBandwidthMbps, set: (v: number) => setNetworkBandwidthMbps(v), min: 100, max: 40_000, step: 100, fmt: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}Gbps` : `${v}Mbps`, color: C.purple },
//                     ].map(k => (
//                       <div key={k.label}>
//                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
//                           <span style={{ fontSize: 10.5, color: C.textSecondary, fontWeight: 600 }}>{k.label}</span>
//                           <span style={{ fontSize: 10.5, fontWeight: 800, color: k.color, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>{k.fmt(k.value)}</span>
//                         </div>
//                         <input type="range" min={k.min} max={k.max} step={k.step} value={k.value}
//                           onChange={e => k.set(Number(e.target.value))}
//                           style={{ width: '100%', accentColor: C.accent, cursor: 'pointer', height: 3 }} />
//                       </div>
//                     ))}
//                     <div style={{
//                       padding: '10px 12px', borderRadius: 10,
//                       background: 'rgba(62, 207, 142, 0.07)', border: '1px solid rgba(62, 207, 142, 0.18)',
//                       fontSize: 10.5, color: C.textSecondary, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace"
//                     }}>
//                       Estimated max throughput: <span style={{ fontWeight: 800, color: C.accent }}>{(serverCores * 285).toLocaleString()}</span> req/s
//                     </div>
//                   </div>

//                   {/* Advanced headers/body payload */}
//                   <div>
//                     <button onClick={() => setShowAdvanced(p => !p)} style={{
//                       background: 'none', border: 'none', color: C.textSecondary, fontSize: 11,
//                       cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
//                       padding: '4px 0', fontFamily: 'inherit', fontWeight: 600
//                     }}>
//                       <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
//                         style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
//                         <path d="M6 9l6 6 6-6" />
//                       </svg>
//                       {showAdvanced ? 'Hide Payload Settings' : 'Custom Headers & Payload'}
//                     </button>

//                     {showAdvanced && (
//                       <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
//                         <textarea value={customHeaders} onChange={e => setCustomHeaders(e.target.value)}
//                           placeholder={'Custom Headers JSON\n{"Authorization": "Bearer token"}'}
//                           rows={2} style={{
//                             background: C.surfaceElevated, border: `1px solid ${C.borderSubtle}`, borderRadius: 8,
//                             color: C.textPrimary, padding: '8px 10px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
//                             resize: 'vertical', outline: 'none', width: '100%', boxSizing: 'border-box'
//                           }} />
//                         {['POST', 'PUT', 'PATCH'].includes(method) && (
//                           <textarea value={body} onChange={e => setBody(e.target.value)}
//                             placeholder={'Request body JSON\n{"key": "value"}'}
//                             rows={2} style={{
//                               background: C.surfaceElevated, border: `1px solid ${C.borderSubtle}`, borderRadius: 8,
//                               color: C.textPrimary, padding: '8px 10px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
//                               resize: 'vertical', outline: 'none', width: '100%', boxSizing: 'border-box'
//                             }} />
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Action Button */}
//               <button onClick={start} disabled={!targetUrl} style={{
//                 padding: '16px', borderRadius: 12, fontSize: 13.5, fontWeight: 800,
//                 fontFamily: 'inherit', border: 'none', cursor: targetUrl ? 'pointer' : 'not-allowed',
//                 background: targetUrl ? 'linear-gradient(135deg, #059669 0%, #3ECF8E 50%, #10B981 100%)' : 'rgba(255,255,255,0.04)',
//                 color: targetUrl ? '#0B0C0E' : 'rgba(255,255,255,0.2)',
//                 boxShadow: targetUrl ? '0 6px 28px rgba(62, 207, 142, 0.35)' : 'none',
//                 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
//                 transition: 'all 0.2s', letterSpacing: '-0.01em'
//               }}>
//                 <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
//                   <polygon points="5 3 19 12 5 21 5 3" />
//                 </svg>
//                 <span>Launch Benchmark Test ({totalUsers.toLocaleString()} VUs for {durationSecs}s)</span>
//                 <Kbd>⌘↵</Kbd>
//               </button>
//             </>
//           )}

//           {/* ═══ PHASE 2: RUNNING ═══ */}
//           {phase === 'running' && (
//             <>
//               {/* SECTION 1 — Live Progress Header */}
//               <div style={{
//                 display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//                 padding: '12px 18px', borderRadius: 14,
//                 background: C.surface, border: `1px solid ${C.borderSubtle}`,
//                 boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
//               }}>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
//                   <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
//                     <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: C.error, animation: 'ltBlink 1s ease-in-out infinite' }} />
//                     <span style={{
//                       fontSize: 9.5, fontWeight: 800, color: C.error, letterSpacing: '0.1em',
//                       padding: '3px 8px', borderRadius: 100, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
//                       fontFamily: "'JetBrains Mono', monospace"
//                     }}>LIVE SIMULATION</span>
//                   </div>
//                   {[
//                     { label: `${totalUsers.toLocaleString()} VUs`, icon: '👥' },
//                     { label: testMode.charAt(0).toUpperCase() + testMode.slice(1), icon: '📊' },
//                     { label: `${durationSecs}s`, icon: '⏱' },
//                   ].map(chip => (
//                     <span key={chip.label} style={{
//                       fontSize: 10.5, fontWeight: 700, color: C.textPrimary,
//                       fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace",
//                       padding: '3px 10px', borderRadius: 100,
//                       background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.borderSubtle}`
//                     }}>{chip.icon} {chip.label}</span>
//                   ))}
//                 </div>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                   <span style={{ fontSize: 11.5, color: C.textSecondary, fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
//                     {elapsed}s / {durationSecs}s
//                   </span>
//                   <div style={{ width: 140, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden' }}>
//                     <div style={{
//                       height: '100%',
//                       width: `${stats ? stats.progress : Math.round((elapsed / durationSecs) * 100)}%`,
//                       background: 'linear-gradient(90deg, #3ECF8E, #8B7CF6)',
//                       borderRadius: 100, transition: 'width 0.8s ease'
//                     }} />
//                   </div>
//                   <span style={{ fontSize: 12, fontWeight: 800, color: C.textPrimary, fontVariantNumeric: 'tabular-nums', minWidth: 34, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>
//                     {stats ? stats.progress : Math.round((elapsed / durationSecs) * 100)}%
//                   </span>
//                 </div>
//               </div>

//               {/* SECTION 2 — 4 Key Real-time Metric Cards */}
//               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
//                 {/* Requests Fired */}
//                 <div style={{ borderRadius: 14, padding: '16px', background: C.surface, border: `1px solid ${C.borderSubtle}` }}>
//                   <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Requests Fired</div>
//                   {stats ? (
//                     <>
//                       <div style={{ fontSize: 32, fontWeight: 900, color: C.textPrimary, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>
//                         {fmtNum(stats.completed)}
//                       </div>
//                       <div style={{ fontSize: 10, color: C.textSecondary, marginTop: 6, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>
//                         out of {fmtNum(stats.total)} total
//                       </div>
//                     </>
//                   ) : <Skeleton height={32} />}
//                 </div>

//                 {/* Errors */}
//                 <div style={{
//                   borderRadius: 14, padding: '16px',
//                   background: (stats?.failed ?? 0) > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(62,207,142,0.05)',
//                   border: `1px solid ${(stats?.failed ?? 0) > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(62,207,142,0.2)'}`,
//                   transition: 'background 0.5s, border-color 0.5s'
//                 }}>
//                   <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Failed Requests</div>
//                   {stats ? (
//                     <>
//                       <div style={{
//                         fontSize: 32, fontWeight: 900, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace",
//                         color: (stats.failed) > 0 ? C.error : C.success
//                       }}>
//                         {fmtNum(stats.failed)}
//                       </div>
//                       <div style={{ fontSize: 10, color: C.textSecondary, marginTop: 6, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>
//                         {stats.successRate}% success rate
//                       </div>
//                     </>
//                   ) : <Skeleton height={32} />}
//                 </div>

//                 {/* Throughput */}
//                 <div style={{ borderRadius: 14, padding: '16px', background: 'rgba(62,207,142,0.06)', border: '1px solid rgba(62,207,142,0.2)' }}>
//                   <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Throughput</div>
//                   {stats ? (
//                     <>
//                       <div style={{ fontSize: 32, fontWeight: 900, color: C.accent, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>
//                         {fmtNum(stats.instantRps ?? stats.rps ?? 0)}
//                       </div>
//                       <div style={{ fontSize: 10, color: C.textSecondary, marginTop: 6 }}>requests / sec</div>
//                     </>
//                   ) : <Skeleton height={32} />}
//                 </div>

//                 {/* Response Latency */}
//                 <div style={{ borderRadius: 14, padding: '16px', background: C.surface, border: `1px solid ${C.borderSubtle}` }}>
//                   <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Avg Latency</div>
//                   {stats ? (
//                     <>
//                       <div style={{
//                         fontSize: 32, fontWeight: 900, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace",
//                         color: stats.avgLatency < 500 ? C.success : stats.avgLatency < 2000 ? C.warning : C.error
//                       }}>
//                         {fmtMs(stats.avgLatency)}
//                       </div>
//                       <div style={{ fontSize: 10, color: C.textSecondary, marginTop: 6 }}>per request</div>
//                     </>
//                   ) : <Skeleton height={32} />}
//                 </div>
//               </div>

//               {/* SECTION 3 — Telemetry Resource Gauges */}
//               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
//                 <GaugeRing pct={telemetry?.cpu ?? 0} color={telemetry ? gc(telemetry.cpu) : 'rgba(255,255,255,0.15)'}
//                   label="CPU Core Load" sub={telemetry ? `${serverCores} cores` : 'waiting…'} />
//                 <GaugeRing pct={telemetry?.memory ?? 0} color={telemetry ? gc(telemetry.memory) : 'rgba(255,255,255,0.15)'}
//                   label="RAM Memory" sub={telemetry ? `${((telemetry.memory / 100) * serverMemoryGB).toFixed(1)}/${serverMemoryGB}GB` : 'waiting…'} />
//                 <GaugeRing pct={telemetry?.dbPool ?? 0} color={telemetry ? gc(telemetry.dbPool) : 'rgba(255,255,255,0.15)'}
//                   label="DB Pool Slots" sub={telemetry ? `${dbActiveConnsCheck(telemetry.dbPool)}/${dbPoolLimit}` : 'waiting…'} />
//                 <GaugeRing pct={telemetry?.network ?? 0} color={telemetry ? gc(telemetry.network) : 'rgba(255,255,255,0.15)'}
//                   label="Network I/O" sub={telemetry ? `${((telemetry.network / 100) * networkBandwidthMbps / 1000).toFixed(1)}Gbps` : 'waiting…'} />
//               </div>

//               {/* SECTION 4 — Waveform Live Charts */}
//               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
//                 <LiveChart data={rpsHistory} color="#3ECF8E" label="Throughput (Req/sec)"
//                   value={fmtNum(stats?.instantRps ?? stats?.rps ?? 0)} height={68} />
//                 <LiveChart data={latHistory} color="#F59E0B" label="Avg Latency (ms)"
//                   value={fmtMs(stats?.avgLatency)} height={68} />
//                 <LiveChart data={queueHistory} color="#8B7CF6" label="Queue Backlog Depth"
//                   value={fmtNum(telemetry?.queueDepth ?? 0)} height={68} />
//               </div>

//               {/* SECTION 5 — Status Breakdown & Active Users */}
//               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
//                 {/* Traffic Distribution */}
//                 <div style={{ background: C.surface, border: `1px solid ${C.borderSubtle}`, borderRadius: 14, padding: '14px 16px' }}>
//                   <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>Live Status Code Distribution</div>
//                   {stats ? (
//                     <>
//                       <div style={{ display: 'flex', height: 6, borderRadius: 100, overflow: 'hidden', marginBottom: 12, background: 'rgba(255,255,255,0.04)' }}>
//                         {stats.completed > 0 && (
//                           <>
//                             <div style={{ width: `${(stats.successful / stats.completed) * 100}%`, background: C.success, transition: 'width 0.5s ease' }} />
//                             <div style={{ width: `${(stats.failed / stats.completed) * 100}%`, background: C.error, transition: 'width 0.5s ease' }} />
//                           </>
//                         )}
//                       </div>
//                       <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
//                         {statusBreakdown.filter(r => r.count > 0).map(r => (
//                           <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                             <span style={{ color: r.color, fontSize: 8, lineHeight: 1 }}>{r.dot}</span>
//                             <span style={{ fontSize: 10.5, color: C.textSecondary, flex: 1, fontWeight: 500 }}>{r.label}</span>
//                             <div style={{ width: 50, height: 3, borderRadius: 100, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
//                               <div style={{ height: '100%', width: `${Math.min(100, (r.count / Math.max(stats.completed, 1)) * 100)}%`, background: r.color, borderRadius: 100, transition: 'width 0.4s ease' }} />
//                             </div>
//                             <span style={{ fontSize: 10.5, fontWeight: 700, color: r.color, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace", minWidth: 36, textAlign: 'right' }}>{fmtNum(r.count)}</span>
//                           </div>
//                         ))}
//                       </div>
//                     </>
//                   ) : <Skeleton height={40} />}
//                 </div>

//                 {/* Active Users Chart */}
//                 <LiveChart data={usersHistory} color={C.purple} label="Active Concurrent Users"
//                   value={fmtNum(telemetry?.activeUsers ?? 0)} height={90} />
//               </div>

//               {/* SECTION 6 — Event Console Log */}
//               <div style={{ background: '#07080B', border: `1px solid ${C.borderSubtle}`, borderRadius: 14, overflow: 'hidden' }}>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 16px', background: '#0B0C0E', borderBottom: `1px solid ${C.borderSubtle}` }}>
//                   <span style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono', monospace" }}>Simulation Event Stream</span>
//                   <div style={{ display: 'flex', gap: 5 }}>
//                     {['#EF4444', '#F59E0B', '#3ECF8E'].map(c => (
//                       <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.75 }} />
//                     ))}
//                   </div>
//                 </div>
//                 <div ref={terminalRef} style={{
//                   height: 110, overflowY: 'auto', padding: '10px 16px',
//                   fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5,
//                   display: 'flex', flexDirection: 'column', gap: 2.5
//                 }}>
//                   {simLogs.length === 0
//                     ? <span style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Listening for live events…</span>
//                     : simLogs.map((log, i) => {
//                         const c = log.includes('[CRITICAL]') ? '#EC4899' : log.includes('[ERROR]') ? C.error : log.includes('[WARN]') ? C.warning : C.success
//                         return <div key={i} style={{ color: c, lineHeight: 1.5, wordBreak: 'break-all' }}>{log}</div>
//                       })}
//                   <div ref={terminalEndRef} />
//                 </div>
//               </div>
//             </>
//           )}

//           {/* ═══ PHASE 3: COMPLETE ═══ */}
//           {phase === 'complete' && finalStats && verdict && (
//             <>
//               {/* SECTION 1 — Verdict banner */}
//               <div style={{
//                 padding: '22px 24px', borderRadius: 16,
//                 background: verdict.bg, border: `1px solid ${verdict.border}`,
//                 boxShadow: `0 0 40px ${verdict.bg}`,
//                 animation: 'ltSlideUp 0.35s cubic-bezier(0.16,1,0.3,1)'
//               }}>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
//                   <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
//                     <span style={{ fontSize: 38 }}>{verdict.emoji}</span>
//                     <div>
//                       <div style={{ fontSize: 9.5, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3, fontFamily: "'JetBrains Mono', monospace" }}>Verdict</div>
//                       <div style={{ fontSize: 24, fontWeight: 900, color: verdict.color, letterSpacing: '-0.02em' }}>{verdict.label}</div>
//                     </div>
//                   </div>
//                   <div style={{ textAlign: 'right' }}>
//                     <div style={{ fontSize: 9.5, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2, fontFamily: "'JetBrains Mono', monospace" }}>Success Rate</div>
//                     <div style={{ fontSize: 34, fontWeight: 900, color: verdict.color, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>{finalStats.successRate}%</div>
//                     {saved && (
//                       <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 100, background: 'rgba(62,207,142,0.14)', border: '1px solid rgba(62,207,142,0.3)' }}>
//                         <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#3ECF8E" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
//                         <span style={{ fontSize: 9.5, color: C.accent, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>Saved to History</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//                 <div style={{ fontSize: 11.5, color: C.textSecondary, lineHeight: 1.6, borderTop: `1px solid ${verdict.border}`, paddingTop: 12 }}>
//                   {verdict.desc}
//                 </div>
//               </div>

//               {/* SECTION 2 — Summary strip */}
//               <div style={{
//                 padding: '12px 16px', borderRadius: 10,
//                 background: 'rgba(62,207,142,0.05)', border: '1px solid rgba(62,207,142,0.16)',
//                 fontSize: 11.5, color: C.textSecondary, lineHeight: 1.5, fontVariantNumeric: 'tabular-nums', textAlign: 'center'
//               }}>
//                 Fired <span style={{ fontWeight: 800, color: C.textPrimary }}>{fmtNum(finalStats.completed)}</span> requests across <span style={{ fontWeight: 800, color: C.textPrimary }}>{fmtNum(finalStats.total)}</span> VUs over <span style={{ fontWeight: 800, color: C.textPrimary }}>{finalStats.elapsed}s</span> · <span style={{ fontWeight: 800, color: C.success }}>{fmtNum(finalStats.successful)}</span> succeeded · <span style={{ fontWeight: 800, color: finalStats.failed > 0 ? C.error : C.textMuted }}>{fmtNum(finalStats.failed)}</span> failed
//               </div>

//               {/* SECTION 3 — 6 Stat Cards Grid */}
//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
//                 {[
//                   { label: 'Accepted Requests', val: fmtNum(finalStats.successful), color: C.success },
//                   { label: 'Rejected Requests', val: fmtNum(finalStats.failed), color: finalStats.failed > 0 ? C.error : C.textMuted },
//                   { label: 'Peak Throughput', val: `${fmtNum(peakRps)} rps`, color: C.accent },
//                   { label: 'Avg Latency', val: fmtMs(finalStats.avgLatency), color: finalStats.avgLatency < 500 ? C.success : finalStats.avgLatency < 2000 ? C.warning : C.error },
//                   { label: 'Min Latency', val: fmtMs(finalStats.minLatency), color: C.success },
//                   { label: 'Max Latency', val: fmtMs(finalStats.maxLatency), color: C.error },
//                 ].map(s => (
//                   <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.borderSubtle}`, borderRadius: 14, padding: '16px 18px' }}>
//                     <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>{s.label}</div>
//                     <div style={{ fontSize: 24, fontWeight: 900, color: s.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>{s.val}</div>
//                   </div>
//                 ))}
//               </div>

//               {/* SECTION 4 — Full Width RPS Waveform */}
//               {rpsHistory.length > 1 && (
//                 <LiveChart data={rpsHistory} color="#3ECF8E" label="Throughput Profile (Req/sec)" value={`Peak ${fmtNum(peakRps)} req/s`} height={120} />
//               )}

//               {/* SECTION 5 — Latency Profile & Status Breakdown */}
//               {rpsHistory.length > 1 && (
//                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
//                   {/* Latency Speed Distribution */}
//                   <div style={{ background: C.surface, border: `1px solid ${C.borderSubtle}`, borderRadius: 14, padding: '16px 18px' }}>
//                     <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, fontFamily: "'JetBrains Mono', monospace" }}>Latency Speed Profile</div>
//                     <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
//                       {[
//                         { label: 'Fast', sub: '<500ms', count: finalStats.speed.fast, color: C.success },
//                         { label: 'OK', sub: '0.5–2s', count: finalStats.speed.ok, color: C.blue },
//                         { label: 'Slow', sub: '2–10s', count: finalStats.speed.slow, color: C.warning },
//                         { label: 'Timeout', sub: '>10s', count: finalStats.speed.verySlow, color: C.error },
//                       ].map(b => {
//                         const pct = finalStats.completed > 0 ? Math.round((b.count / finalStats.completed) * 100) : 0
//                         return (
//                           <div key={b.label}>
//                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
//                               <span style={{ fontSize: 10.5, fontWeight: 600, color: C.textSecondary }}>{b.label} <span style={{ fontSize: 8.5, color: C.textMuted }}>{b.sub}</span></span>
//                               <span style={{ fontSize: 10.5, fontWeight: 800, color: b.color, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>{fmtNum(b.count)} <span style={{ fontSize: 8.5, color: C.textMuted }}>{pct}%</span></span>
//                             </div>
//                             <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 100 }}>
//                               <div style={{
//                                 height: '100%',
//                                 width: speedMounted ? `${pct}%` : '0%',
//                                 background: b.color, borderRadius: 100,
//                                 transition: 'width 0.7s ease-out',
//                                 minWidth: pct > 0 ? 2 : 0
//                               }} />
//                             </div>
//                           </div>
//                         )
//                       })}
//                     </div>
//                   </div>

//                   {/* Status Codes */}
//                   <div style={{ background: C.surface, border: `1px solid ${C.borderSubtle}`, borderRadius: 14, padding: '16px 18px' }}>
//                     <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, fontFamily: "'JetBrains Mono', monospace" }}>Status Code Breakdown</div>
//                     <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
//                       {[
//                         { label: '2xx Success', count: finalStats.statusCodes.s2xx, color: C.success },
//                         { label: '4xx Client Error', count: finalStats.statusCodes.s4xx, color: C.warning },
//                         { label: '5xx Server Error', count: finalStats.statusCodes.s5xx, color: C.error },
//                         { label: 'Timeout', count: finalStats.statusCodes.sTimeout, color: '#EC4899' },
//                         { label: 'Conn Error', count: finalStats.statusCodes.sConnErr, color: C.purple },
//                       ].filter(r => r.count > 0).map(r => {
//                         const pct = finalStats.completed > 0 ? Math.round((r.count / finalStats.completed) * 100) : 0
//                         return (
//                           <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                             <span style={{ color: r.color, fontSize: 8, lineHeight: 1 }}>●</span>
//                             <span style={{ fontSize: 10.5, color: C.textSecondary, flex: 1, fontWeight: 500 }}>{r.label}</span>
//                             <div style={{ width: 60, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
//                               <div style={{ height: '100%', width: `${pct}%`, background: r.color, borderRadius: 100 }} />
//                             </div>
//                             <span style={{ fontSize: 10.5, fontWeight: 700, color: r.color, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace", minWidth: 44, textAlign: 'right' }}>{fmtNum(r.count)}</span>
//                           </div>
//                         )
//                       })}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Recommendations Section */}
//               <div style={{
//                 background: 'rgba(62,207,142,0.06)', border: '1px solid rgba(62,207,142,0.18)',
//                 borderRadius: 14, padding: '16px 18px'
//               }}>
//                 <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>Optimization Recommendations</div>
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
//                   {verdict.tips.map((tip, i) => (
//                     <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
//                       <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.accent, marginTop: 6, flexShrink: 0 }} />
//                       <span style={{ fontSize: 11.5, color: C.textSecondary, lineHeight: 1.6 }}>{tip}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Error breakdown */}
//               {Object.keys(errors).length > 0 && (
//                 <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '14px 16px' }}>
//                   <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>Error Log Breakdown</div>
//                   {Object.entries(errors).map(([name, count]) => (
//                     <div key={name} style={{
//                       display: 'flex', justifyContent: 'space-between', padding: '6px 0',
//                       fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5,
//                       color: '#FCA5A5', borderBottom: '1px solid rgba(239,68,68,0.08)'
//                     }}>
//                       <span>{name.replace(/_/g, ' ')}</span>
//                       <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{count.toLocaleString()}</span>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {/* Reset Button */}
//               <button onClick={reset} style={{
//                 padding: '14px', borderRadius: 12, fontFamily: 'inherit', fontWeight: 700,
//                 fontSize: 12.5, cursor: 'pointer', border: `1px solid ${C.borderDefault}`,
//                 background: 'rgba(255,255,255,0.03)', color: C.textSecondary,
//                 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
//                 transition: 'all 0.15s'
//               }}>
//                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
//                   <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
//                   <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
//                 </svg>
//                 <span>Configure New Benchmark Test</span>
//                 <Kbd>⌘R</Kbd>
//               </button>
//             </>
//           )}
//         </div>
//       </div>

//       <style>{`
//         @keyframes ltOpen    { from { opacity:0; transform:scale(0.97) translateY(10px) } to { opacity:1; transform:scale(1) translateY(0) } }
//         @keyframes ltSlideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
//         @keyframes ltBlink   { 0%,100%{opacity:1} 50%{opacity:0.25} }
//         @keyframes ltScan    { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
//         @keyframes ltSkeleton { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
//         * { box-sizing:border-box }
//         ::-webkit-scrollbar { width:3px }
//         ::-webkit-scrollbar-track { background:transparent }
//         ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:3px }
//         input[type="range"] {
//           -webkit-appearance: none; appearance: none;
//           background: rgba(255,255,255,0.08); border-radius: 100px; outline: none;
//         }
//         input[type="range"]::-webkit-slider-thumb {
//           -webkit-appearance: none; appearance: none;
//           width: 14px; height: 14px; border-radius: 50%;
//           background: #3ECF8E; cursor: pointer;
//           border: 2px solid #0B0C0E;
//           box-shadow: 0 0 10px rgba(62, 207, 142, 0.5);
//         }
//         input[type="range"]::-moz-range-thumb {
//           width: 14px; height: 14px; border-radius: 50%;
//           background: #3ECF8E; cursor: pointer;
//           border: 2px solid #0B0C0E;
//         }
//       `}</style>
//     </div>
//   )
// }

// function dbActiveConnsCheck(pct: number) {
//   return Math.round((pct / 100) * 50)
// }


import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../services/api'
import { getSocket } from '../services/socketService'
import { useFlowStore } from '../store/flowStore'
import { useAuthStore } from '../store/authStore'

// ─── Types (match new backend payload from loadTestService.ts) ──────────────
type StatusCodes = { s2xx: number; s3xx: number; s4xx: number; s5xx: number; sTimeout: number; sConnErr: number }
type LoadTestStats = {
  loadTestId: string
  total: number; completed: number; successful: number; failed: number
  avgLatency: number; minLatency: number; maxLatency: number
  p50: number; p95: number; p99: number
  rps: number; instantRps: number; elapsed: number
  successRate: number; progress: number
  statusCodes: StatusCodes
  errors?: Record<string, number>
  verdict?: string; verdictDesc?: string
}

const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n)
const fmtMs = (ms: number | undefined) => {
  if (!ms || ms <= 0) return '—'
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`
}

const VERDICTS: Record<string, { emoji: string; color: string; bg: string; border: string; label: string; desc: string; tips: string[] }> = {
  'Excellent': {
    emoji: '🚀', color: '#3ECF8E', bg: 'rgba(62,207,142,0.08)', border: 'rgba(62,207,142,0.25)',
    label: 'Handled Real Load Well', desc: 'Low error rate and stable latency across every real request fired at the target.',
    tips: ['Deploy behind a CDN for further latency reduction.', 'Re-run with more virtual users to find the actual ceiling.']
  },
  'Failing Under Load': {
    emoji: '💥', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)',
    label: 'Failing Under Load', desc: 'More than half of real requests failed, errored, or timed out at this concurrency.',
    tips: ['Check the target server logs for the errors during this window.', 'Lower concurrency and re-test to find where it starts breaking.', 'Add rate-limiting or autoscaling on the target if you own it.']
  },
  'Degraded': {
    emoji: '⚠️', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)',
    label: 'Elevated Errors', desc: 'A meaningful share of real requests returned errors under this load.',
    tips: ['Inspect the error breakdown below for the dominant failure type.', 'Check for connection pool or rate-limit ceilings on the target.']
  },
  'Slow Under Load': {
    emoji: '🐢', color: '#EC4899', bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.25)',
    label: 'Slow Under Load', desc: 'Requests mostly succeeded, but p95 latency climbed significantly under concurrency.',
    tips: ['Profile the slow endpoint for expensive queries.', 'Add caching for hot read paths.', 'Consider horizontal scaling if this is your own API.']
  },
  'Degraded Performance': {
    emoji: '📉', color: '#8B7CF6', bg: 'rgba(139,124,246,0.08)', border: 'rgba(139,124,246,0.25)',
    label: 'Latency Degraded', desc: 'The target handled all requests but response time climbed under load.',
    tips: ['Profile for nested queries or N+1 calls.', 'Add Cache-Control headers to offload repeat requests.', 'Enable gzip/brotli compression.']
  },
}

// ─── Design System Tokens (unchanged) ────────────────────────────────────────
const C = {
  bg: '#0B0C0E',
  surface: '#0E0F12',
  surfaceElevated: '#131417',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderDefault: 'rgba(255, 255, 255, 0.12)',
  borderHighlight: 'rgba(62, 207, 142, 0.35)',
  textPrimary: '#F2F3F5',
  textSecondary: '#93959D',
  textMuted: '#5A5C64',
  accent: '#3ECF8E',
  accentPurple: '#8B7CF6',
  brandGradient: 'linear-gradient(135deg, #059669 0%, #3ECF8E 50%, #8B7CF6 100%)',
  emeraldGlow: '0 0 24px rgba(62, 207, 142, 0.25)',
  success: '#3ECF8E',
  warning: '#F59E0B',
  error: '#EF4444',
  purple: '#8B7CF6',
  blue: '#60A5FA'
}

const METHOD_COLORS: Record<string, string> = {
  GET: C.success, POST: C.blue, PUT: C.warning, DELETE: C.error, PATCH: C.purple
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '2px 6px', borderRadius: 5,
      background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
      color: 'rgba(255, 255, 255, 0.75)', fontSize: 10, fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, letterSpacing: '0.02em'
    }}>
      {children}
    </kbd>
  )
}

function SectionHeader({ icon, title, desc }: { icon?: string; title: string; desc?: string }) {
  return (
    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <span style={{ fontSize: 11 }}>{icon}</span>}
        <span style={{ fontSize: 10, fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'JetBrains Mono', monospace" }}>
          {title}
        </span>
      </div>
      {desc && <span style={{ fontSize: 10, color: C.textMuted }}>{desc}</span>}
    </div>
  )
}

// ─── Bezier chart helper ──────────────────────────────────────────────────────
function buildBezierPath(data: number[], W: number, H: number, pad: number) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const rng = max - min || 1
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: pad + ((1 - (v - min) / rng) * (H - pad * 2))
  }))

  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const cp1x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * 0.5
    const cp2x = pts[i].x - (pts[i].x - pts[i - 1].x) * 0.5
    d += ` C ${cp1x.toFixed(1)},${pts[i - 1].y.toFixed(1)} ${cp2x.toFixed(1)},${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`
  }
  const areaD = `${d} L ${pts[pts.length - 1].x.toFixed(1)},${H} L ${pts[0].x.toFixed(1)},${H} Z`
  const lastPt = pts[pts.length - 1]
  return { lineD: d, areaD, lastPt }
}

function LiveChart({ data, color, label, value, height = 72 }: {
  data: number[]; color: string; label: string; value: string; height?: number
}) {
  const W = 400; const H = 80
  const has = data.length >= 2
  const uid = `lc-${color.replace('#', '')}-${label.replace(/\s/g, '')}`

  let lineD = ''; let areaD = ''; let lastPt = { x: 0, y: 0 }
  if (has) {
    const result = buildBezierPath(data, W, H, 6)
    lineD = result.lineD; areaD = result.areaD; lastPt = result.lastPt
  }

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.borderSubtle}`,
      borderRadius: 14, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
      </div>
      <div style={{ height, position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
        {!has ? (
          <div style={{ height: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <div style={{
              width: '60%', height: 2, borderRadius: 2,
              background: `linear-gradient(90deg, transparent, ${color}66, transparent)`,
              animation: 'ltScan 1.8s ease-in-out infinite'
            }} />
          </div>
        ) : (
          <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="85%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="0" y1={H * 0.25} x2={W} y2={H * 0.25} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="4 4" />
            <line x1="0" y1={H * 0.5} x2={W} y2={H * 0.5} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="4 4" />
            <line x1="0" y1={H * 0.75} x2={W} y2={H * 0.75} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="4 4" />
            <path d={areaD} fill={`url(#${uid})`} />
            <path d={lineD} fill="none" stroke={color} strokeWidth="1.8"
              strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <circle cx={lastPt.x} cy={lastPt.y} r="5" fill={color} opacity="0.3" />
            <circle cx={lastPt.x} cy={lastPt.y} r="2.5" fill={color} />
          </svg>
        )}
      </div>
    </div>
  )
}


function PatternPreview({ type, active }: { type: 'spike' | 'ramp' | 'wave'; active: boolean }) {
  const stroke = active ? '#3ECF8E' : 'rgba(255,255,255,0.18)'
  const fill = active ? 'rgba(62,207,142,0.12)' : 'rgba(255,255,255,0.02)'
  if (type === 'spike') return (
    <svg viewBox="0 0 80 36" width="80" height="36">
      <polygon points="0,32 34,32 40,5 46,32 80,32" fill={fill} />
      <polyline points="0,32 34,32 40,5 46,32 80,32" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
  if (type === 'ramp') return (
    <svg viewBox="0 0 80 36" width="80" height="36">
      <polygon points="0,32 80,6 80,32" fill={fill} />
      <line x1="0" y1="32" x2="80" y2="6" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
  const sinPts = Array.from({ length: 40 }, (_, i) => {
    const x = (i / 39) * 80
    const y = 18 - Math.sin((i / 39) * Math.PI * 3.2) * 12
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg viewBox="0 0 80 36" width="80" height="36">
      <polyline points={sinPts} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function Skeleton({ width = '100%', height = 32 }: { width?: string | number; height?: number }) {
  return (
    <div style={{
      width, height, borderRadius: 8,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)',
      backgroundSize: '200% 100%',
      animation: 'ltSkeleton 1.5s ease-in-out infinite'
    }} />
  )
}

// ─── VU Selector — capped at 3,000 real concurrent virtual users ────────────
// A single Node process can genuinely sustain a few thousand real concurrent
// request loops (same order of magnitude as k6/Locust on one machine). Higher
// numbers here would silently be capped server-side anyway, so the UI is
// honest about the real ceiling instead of promising 1M simultaneous hits.
const VU_STEPS = [10, 25, 50, 100, 250, 500, 1_000, 1_500, 2_000, 2_500, 3_000]
const DUR_PRESETS = [15, 30, 45, 60, 90, 120]

function VuSelector({ value, onChange }: { value: number; onChange: (v: number) => void; durationSecs?: number }) {
  const labels: Record<number, string> = {
    10: '10', 25: '25', 50: '50', 100: '100', 250: '250', 500: '500',
    1_000: '1K', 1_500: '1.5K', 2_000: '2K', 2_500: '2.5K', 3_000: '3K'
  }
  const stepIdx = VU_STEPS.indexOf(value)
  const sliderIdx = stepIdx === -1 ? 0 : stepIdx
  const displayLabel = labels[value] ?? String(value)

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.borderSubtle}`,
      borderRadius: 14, padding: '18px 20px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)'
    }}>
      <SectionHeader icon="👥" title="Virtual Users" desc="Real concurrent request workers" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <div style={{
            fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #3ECF8E 0%, #059669 40%, #8B7CF6 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontVariantNumeric: 'tabular-nums', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace",
            transition: 'all 0.15s'
          }}>
            {displayLabel}
          </div>
          <div style={{ fontSize: 10.5, color: C.textSecondary, marginTop: 6 }}>
            real virtual users, each looping real HTTP requests concurrently
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14, marginTop: 14 }}>
        {VU_STEPS.map(v => {
          const sel = value === v
          return (
            <button key={v} onClick={() => onChange(v)} style={{
              padding: '5px 12px', borderRadius: 100, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10.5, fontWeight: 700, transition: 'all 0.15s',
              background: sel ? 'rgba(62, 207, 142, 0.14)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${sel ? 'rgba(62, 207, 142, 0.45)' : C.borderSubtle}`,
              color: sel ? '#3ECF8E' : C.textSecondary,
              boxShadow: sel ? '0 0 14px rgba(62, 207, 142, 0.2)' : 'none'
            }}>
              {labels[v]}
            </button>
          )
        })}
      </div>

      <input type="range" min={0} max={VU_STEPS.length - 1} step={1} value={sliderIdx}
        onChange={e => onChange(VU_STEPS[Number(e.target.value)])}
        style={{ width: '100%', accentColor: C.accent, cursor: 'pointer', height: 4 }} />

      <div style={{ fontSize: 10, color: C.textMuted, marginTop: 10, fontStyle: 'italic', fontFamily: "'JetBrains Mono', monospace" }}>
        capped at 3,000 — the realistic ceiling for one real load-generating process
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BenchmarkPage({ onClose }: { onClose: () => void }) {
  const { nodes, workflowId } = useFlowStore()
  const { user } = useAuthStore()

  const [targetUrl, setTargetUrl] = useState('')
  const [method, setMethod] = useState('GET')
  const [customHeaders, setCustomHeaders] = useState('')
  const [body, setBody] = useState('')

  const [totalUsers, setTotalUsers] = useState(500)
  const [testMode, setTestMode] = useState<'spike' | 'ramp' | 'wave'>('spike')
  const [durationSecs, setDurationSecs] = useState(30)

  const [phase, setPhase] = useState<'config' | 'running' | 'complete'>('config')
  const [loadTestId, setLoadTestId] = useState<string | null>(null)
  const [stats, setStats] = useState<LoadTestStats | null>(null)
  const [finalStats, setFinalStats] = useState<LoadTestStats | null>(null)
  const [errors, setErrors] = useState<Record<string, number>>({})
  const [saved, setSaved] = useState(false)

  // Timelines are now built client-side from each real update tick,
  // since the backend streams live aggregated stats rather than fake arrays.
  const [rpsHistory, setRpsHistory] = useState<number[]>([])
  const [p50History, setP50History] = useState<number[]>([])

  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const saveAttempted = useRef(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [speedMounted, setSpeedMounted] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase === 'config') onClose()
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && phase === 'config' && targetUrl) {
        e.preventDefault()
        start()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, targetUrl, onClose])

  useEffect(() => {
    if (phase === 'running') {
      setElapsed(0)
      elapsedRef.current = setInterval(() => setElapsed(p => p + 1), 1000)
    } else {
      if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null }
    }
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current) }
  }, [phase])

  useEffect(() => {
    if (nodes.length > 0 && nodes[0].data.url) {
      setTargetUrl(nodes[0].data.url); setMethod(nodes[0].data.method ?? 'GET')
    }
  }, [nodes])

  useEffect(() => {
    if (!user) return
    const socket = getSocket()
    const userId = ((user as any)._id ?? (user as any).id ?? '') as string
    if (!userId) return
    const joinRoom = () => socket.emit('join_loadtest', userId)
    if (socket.connected) joinRoom(); else socket.once('connect', joinRoom)

    const applyUpdate = (data: LoadTestStats) => {
      setStats(data)
      setRpsHistory(h => [...h, data.instantRps ?? data.rps ?? 0].slice(-120))
      setP50History(h => [...h, data.p50 ?? 0].slice(-120))
    }

    socket.on('loadtest_update', applyUpdate)
    socket.on('loadtest_complete', (data: LoadTestStats) => {
      applyUpdate(data)
      setFinalStats(data)
      setErrors(data.errors ?? {})
      setPhase('complete')
    })
    return () => { socket.off('connect', joinRoom); socket.off('loadtest_update'); socket.off('loadtest_complete') }
  }, [user])

  useEffect(() => {
    if (phase !== 'complete' || !finalStats || saveAttempted.current) return
    saveAttempted.current = true
    api.post('/loadtest/save', {
      workflowId: workflowId ?? undefined, loadTestId: finalStats.loadTestId, targetUrl, method,
      totalUsers: finalStats.total, completed: finalStats.completed, successful: finalStats.successful,
      failed: finalStats.failed, successRate: finalStats.successRate, avgLatency: finalStats.avgLatency,
      minLatency: finalStats.minLatency, maxLatency: finalStats.maxLatency,
      p50: finalStats.p50, p95: finalStats.p95, p99: finalStats.p99,
      rps: finalStats.rps, elapsed: finalStats.elapsed, statusCodes: finalStats.statusCodes,
      errors, verdict: finalStats.verdict,
    }).then(() => setSaved(true)).catch(() => {})
  }, [phase, finalStats])

  useEffect(() => {
    if (phase === 'complete') {
      setSpeedMounted(false)
      const t = setTimeout(() => setSpeedMounted(true), 100)
      return () => clearTimeout(t)
    }
  }, [phase])

  const start = useCallback(async () => {
    if (!targetUrl) return
    setPhase('running'); setStats(null); setFinalStats(null)
    setRpsHistory([]); setP50History([])
    setErrors({}); setSaved(false)
    saveAttempted.current = false

    let parsedHeaders: Record<string, string> = {}
    try { if (customHeaders.trim()) parsedHeaders = JSON.parse(customHeaders) }
    catch { alert('Invalid JSON headers'); setPhase('config'); return }

    try {
      const res = await api.post('/loadtest/start', {
        workflowId: workflowId ?? undefined, targetUrl, method,
        headers: parsedHeaders, body: body.trim() || undefined,
        totalUsers, durationSeconds: durationSecs, mode: testMode,
      })
      setLoadTestId(res.data.loadTestId)
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to launch load test')
      setPhase('config')
    }
  }, [targetUrl, method, totalUsers, testMode, durationSecs, customHeaders, body, workflowId])

  const abort = useCallback(async () => {
    if (!loadTestId) return
    await api.post(`/loadtest/stop/${loadTestId}`).catch(() => {})
    setPhase('complete')
  }, [loadTestId])

  const reset = useCallback(() => {
    setPhase('config'); setStats(null); setFinalStats(null)
    setRpsHistory([]); setP50History([])
    setErrors({}); setSaved(false)
    saveAttempted.current = false
  }, [])

  const peakRps = rpsHistory.length > 0 ? Math.max(...rpsHistory) : 0
  const verdict = finalStats?.verdict ? (VERDICTS[finalStats.verdict] ?? VERDICTS['Excellent']) : null

  const statusBreakdown = stats ? [
    { label: '2xx Success', color: C.success, count: stats.statusCodes.s2xx },
    { label: '3xx Redirect', color: C.blue, count: stats.statusCodes.s3xx },
    { label: '4xx Client Error', color: C.warning, count: stats.statusCodes.s4xx },
    { label: '5xx Server Error', color: C.error, count: stats.statusCodes.s5xx },
    { label: 'Timeout', color: '#EC4899', count: stats.statusCodes.sTimeout },
    { label: 'Conn Error', color: C.purple, count: stats.statusCodes.sConnErr },
  ] : []

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(11, 12, 14, 0.45)', backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)' }}
        onClick={phase === 'config' ? onClose : undefined} />

      <div style={{
        position: 'relative', width: '100%', maxWidth: 1020, maxHeight: '94vh',
        background: 'rgba(11, 12, 14, 0.78)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 90px rgba(0, 0, 0, 0.85), 0 0 70px rgba(62, 207, 142, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        animation: 'ltOpen 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>

        <div aria-hidden style={{ position: 'absolute', top: '-15%', left: '15%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(62, 207, 142, 0.07) 0%, transparent 70%)', filter: 'blur(110px)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', bottom: '-15%', right: '12%', width: 440, height: 440, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139, 124, 246, 0.06) 0%, transparent 70%)', filter: 'blur(110px)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.35, pointerEvents: 'none' }} />

        {/* ═══ Command Header Bar ═══ */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 22px', borderBottom: `1px solid ${C.borderSubtle}`,
          background: '#0E0F12', flexShrink: 0, position: 'relative', zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(62, 207, 142, 0.12)', border: '1px solid rgba(62, 207, 142, 0.3)',
              boxShadow: '0 0 16px rgba(62, 207, 142, 0.2)'
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3ECF8E" strokeWidth="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: C.textPrimary, letterSpacing: '-0.01em' }}>DevFlow Benchmark Studio</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(62, 207, 142, 0.14)', color: '#3ECF8E', border: '1px solid rgba(62, 207, 142, 0.3)', fontFamily: "'JetBrains Mono', monospace" }}>REAL LOAD ENGINE</span>
              </div>
              <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 1, fontFamily: "'JetBrains Mono', monospace" }}>
                {phase === 'config' && 'Fires real concurrent HTTP requests at your target — no simulated numbers'}
                {phase === 'running' && `Executing · ${elapsed}s · ${totalUsers.toLocaleString()} real VUs`}
                {phase === 'complete' && `Test Complete · ${finalStats?.elapsed ?? 0}s · ${verdict?.label ?? ''}`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {phase === 'config' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Kbd>ESC</Kbd>
                <span style={{ fontSize: 10, color: C.textMuted }}>Close</span>
              </div>
            )}
            {phase === 'running' && (
              <button onClick={abort} style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.1)', color: '#F87171',
                fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
              }}>Abort Test</button>
            )}
            <button onClick={onClose} style={{
              width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.borderSubtle}`,
              background: 'rgba(255,255,255,0.03)', color: C.textSecondary, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ═══ Body Container ═══ */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative', zIndex: 2 }}>

          {/* ═══ PHASE 1: CONFIG ═══ */}
          {phase === 'config' && (
            <>
              <div style={{ background: C.surface, border: `1px solid ${C.borderSubtle}`, borderRadius: 14, padding: '16px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                <SectionHeader icon="🌐" title="1. Target API Endpoint" desc="Real requests are sent here" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={method} onChange={e => setMethod(e.target.value)} style={{
                    background: C.surfaceElevated, border: `1px solid ${C.borderDefault}`, color: METHOD_COLORS[method] || C.accent,
                    borderRadius: 8, padding: '10px 14px', fontSize: 12, fontWeight: 800,
                    outline: 'none', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", minWidth: 90
                  }}>
                    {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <option key={m} style={{ color: METHOD_COLORS[m] }}>{m}</option>)}
                  </select>
                  <input value={targetUrl} onChange={e => setTargetUrl(e.target.value)}
                    placeholder="https://api.example.com/v1/users"
                    style={{
                      flex: 1, background: C.surfaceElevated, border: `1px solid ${C.borderDefault}`,
                      color: C.textPrimary, borderRadius: 8, padding: '10px 14px',
                      fontSize: 12, fontFamily: "'JetBrains Mono', monospace", outline: 'none'
                    }} />
                </div>
                <div style={{ fontSize: 9.5, color: C.textMuted, marginTop: 8, fontFamily: "'JetBrains Mono', monospace" }}>
                  Only target servers you own or have permission to test. Internal/private and localhost addresses are blocked.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <VuSelector value={totalUsers} onChange={setTotalUsers} durationSecs={durationSecs} />

                  <div style={{ background: C.surface, border: `1px solid ${C.borderSubtle}`, borderRadius: 14, padding: '16px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                    <SectionHeader icon="📈" title="Traffic Curve Pattern" desc="Controls how many VUs are active over time" />
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['spike', 'ramp', 'wave'] as const).map(mode => {
                        const names = { spike: 'Spike Test', ramp: 'Linear Ramp', wave: 'Wave Load' }
                        const descs = { spike: 'All VUs active immediately', ramp: 'VUs ramp up gradually', wave: 'VU count oscillates' }
                        const sel = testMode === mode
                        return (
                          <button key={mode} onClick={() => setTestMode(mode)} style={{
                            flex: 1, padding: '14px 8px 12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                            background: sel ? 'rgba(62, 207, 142, 0.08)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${sel ? 'rgba(62, 207, 142, 0.45)' : C.borderSubtle}`,
                            boxShadow: sel ? '0 0 20px rgba(62, 207, 142, 0.16)' : 'none',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                            transition: 'all 0.15s'
                          }}>
                            <PatternPreview type={mode} active={sel} />
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: sel ? '#3ECF8E' : 'rgba(255,255,255,0.5)', textAlign: 'center' }}>{names[mode]}</div>
                              <div style={{ fontSize: 8.5, color: C.textMuted, textAlign: 'center', marginTop: 2 }}>{descs[mode]}</div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ background: C.surface, border: `1px solid ${C.borderSubtle}`, borderRadius: 14, padding: '16px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                    <SectionHeader icon="⏱" title="Test Duration" desc="Total run time in seconds" />
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
                      <span style={{
                        fontSize: 38, fontWeight: 900, color: C.textPrimary, letterSpacing: '-0.03em',
                        fontVariantNumeric: 'tabular-nums', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace"
                      }}>
                        {durationSecs}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: C.textMuted }}>seconds</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {DUR_PRESETS.map(d => (
                        <button key={d} onClick={() => setDurationSecs(d)} style={{
                          padding: '5px 14px', borderRadius: 100, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 10.5, fontWeight: 700, transition: 'all 0.15s',
                          background: durationSecs === d ? 'rgba(62, 207, 142, 0.14)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${durationSecs === d ? 'rgba(62, 207, 142, 0.45)' : C.borderSubtle}`,
                          color: durationSecs === d ? '#3ECF8E' : C.textSecondary
                        }}>{d}s</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    background: C.surface, border: `1px solid ${C.borderSubtle}`,
                    borderRadius: 14, padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)'
                  }}>
                    <SectionHeader icon="ℹ️" title="How This Test Works" />
                    {[
                      'Each virtual user is a real loop: it fires a request, waits for the real response, then repeats.',
                      'Latency, status codes, and errors shown are measured from real responses — nothing is estimated.',
                      'p50 / p95 / p99 latency are computed live from actual response times, not a formula.',
                      'The verdict at the end is based on the real failure rate and p95 latency observed.',
                    ].map((line, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.accent, marginTop: 6, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: C.textSecondary, lineHeight: 1.6 }}>{line}</span>
                      </div>
                    ))}
                    <div style={{
                      padding: '10px 12px', borderRadius: 10, marginTop: 4,
                      background: 'rgba(139, 124, 246, 0.07)', border: '1px solid rgba(139, 124, 246, 0.18)',
                      fontSize: 10, color: C.textSecondary, lineHeight: 1.5
                    }}>
                      Real concurrency is capped at 3,000 VUs per test — the reliable ceiling for one load-generating process, the same order of magnitude tools like k6 use per machine.
                    </div>
                  </div>

                  <div>
                    <button onClick={() => setShowAdvanced(p => !p)} style={{
                      background: 'none', border: 'none', color: C.textSecondary, fontSize: 11,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 0', fontFamily: 'inherit', fontWeight: 600
                    }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                      {showAdvanced ? 'Hide Payload Settings' : 'Custom Headers & Payload'}
                    </button>

                    {showAdvanced && (
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <textarea value={customHeaders} onChange={e => setCustomHeaders(e.target.value)}
                          placeholder={'Custom Headers JSON\n{"Authorization": "Bearer token"}'}
                          rows={2} style={{
                            background: C.surfaceElevated, border: `1px solid ${C.borderSubtle}`, borderRadius: 8,
                            color: C.textPrimary, padding: '8px 10px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                            resize: 'vertical', outline: 'none', width: '100%', boxSizing: 'border-box'
                          }} />
                        {['POST', 'PUT', 'PATCH'].includes(method) && (
                          <textarea value={body} onChange={e => setBody(e.target.value)}
                            placeholder={'Request body JSON\n{"key": "value"}'}
                            rows={2} style={{
                              background: C.surfaceElevated, border: `1px solid ${C.borderSubtle}`, borderRadius: 8,
                              color: C.textPrimary, padding: '8px 10px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                              resize: 'vertical', outline: 'none', width: '100%', boxSizing: 'border-box'
                            }} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button onClick={start} disabled={!targetUrl} style={{
                padding: '16px', borderRadius: 12, fontSize: 13.5, fontWeight: 800,
                fontFamily: 'inherit', border: 'none', cursor: targetUrl ? 'pointer' : 'not-allowed',
                background: targetUrl ? 'linear-gradient(135deg, #059669 0%, #3ECF8E 50%, #10B981 100%)' : 'rgba(255,255,255,0.04)',
                color: targetUrl ? '#0B0C0E' : 'rgba(255,255,255,0.2)',
                boxShadow: targetUrl ? '0 6px 28px rgba(62, 207, 142, 0.35)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.2s', letterSpacing: '-0.01em'
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Launch Real Load Test ({totalUsers.toLocaleString()} VUs for {durationSecs}s)</span>
                <Kbd>⌘↵</Kbd>
              </button>
            </>
          )}

          {/* ═══ PHASE 2: RUNNING ═══ */}
          {phase === 'running' && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 18px', borderRadius: 14,
                background: C.surface, border: `1px solid ${C.borderSubtle}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: C.error, animation: 'ltBlink 1s ease-in-out infinite' }} />
                    <span style={{
                      fontSize: 9.5, fontWeight: 800, color: C.error, letterSpacing: '0.1em',
                      padding: '3px 8px', borderRadius: 100, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>LIVE — REAL REQUESTS</span>
                  </div>
                  {[
                    { label: `${totalUsers.toLocaleString()} VUs`, icon: '👥' },
                    { label: testMode.charAt(0).toUpperCase() + testMode.slice(1), icon: '📊' },
                    { label: `${durationSecs}s`, icon: '⏱' },
                  ].map(chip => (
                    <span key={chip.label} style={{
                      fontSize: 10.5, fontWeight: 700, color: C.textPrimary,
                      fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace",
                      padding: '3px 10px', borderRadius: 100,
                      background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.borderSubtle}`
                    }}>{chip.icon} {chip.label}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11.5, color: C.textSecondary, fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                    {elapsed}s / {durationSecs}s
                  </span>
                  <div style={{ width: 140, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${stats ? stats.progress : Math.round((elapsed / durationSecs) * 100)}%`,
                      background: 'linear-gradient(90deg, #3ECF8E, #8B7CF6)',
                      borderRadius: 100, transition: 'width 0.8s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.textPrimary, fontVariantNumeric: 'tabular-nums', minWidth: 34, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>
                    {stats ? stats.progress : Math.round((elapsed / durationSecs) * 100)}%
                  </span>
                </div>
              </div>

              {/* Row 1 — core real-time metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                <div style={{ borderRadius: 14, padding: '16px', background: C.surface, border: `1px solid ${C.borderSubtle}` }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Requests Fired</div>
                  {stats ? (
                    <>
                      <div style={{ fontSize: 32, fontWeight: 900, color: C.textPrimary, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmtNum(stats.completed)}
                      </div>
                      <div style={{ fontSize: 10, color: C.textSecondary, marginTop: 6, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>real HTTP requests sent</div>
                    </>
                  ) : <Skeleton height={32} />}
                </div>

                <div style={{
                  borderRadius: 14, padding: '16px',
                  background: (stats?.failed ?? 0) > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(62,207,142,0.05)',
                  border: `1px solid ${(stats?.failed ?? 0) > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(62,207,142,0.2)'}`,
                  transition: 'background 0.5s, border-color 0.5s'
                }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Failed Requests</div>
                  {stats ? (
                    <>
                      <div style={{
                        fontSize: 32, fontWeight: 900, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace",
                        color: (stats.failed) > 0 ? C.error : C.success
                      }}>
                        {fmtNum(stats.failed)}
                      </div>
                      <div style={{ fontSize: 10, color: C.textSecondary, marginTop: 6, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>
                        {stats.successRate}% success rate
                      </div>
                    </>
                  ) : <Skeleton height={32} />}
                </div>

                <div style={{ borderRadius: 14, padding: '16px', background: 'rgba(62,207,142,0.06)', border: '1px solid rgba(62,207,142,0.2)' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Throughput</div>
                  {stats ? (
                    <>
                      <div style={{ fontSize: 32, fontWeight: 900, color: C.accent, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmtNum(stats.instantRps ?? stats.rps ?? 0)}
                      </div>
                      <div style={{ fontSize: 10, color: C.textSecondary, marginTop: 6 }}>real requests / sec</div>
                    </>
                  ) : <Skeleton height={32} />}
                </div>

                <div style={{ borderRadius: 14, padding: '16px', background: C.surface, border: `1px solid ${C.borderSubtle}` }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>p50 Latency</div>
                  {stats ? (
                    <>
                      <div style={{
                        fontSize: 32, fontWeight: 900, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace",
                        color: stats.p50 < 500 ? C.success : stats.p50 < 2000 ? C.warning : C.error
                      }}>
                        {fmtMs(stats.p50)}
                      </div>
                      <div style={{ fontSize: 10, color: C.textSecondary, marginTop: 6 }}>median real response time</div>
                    </>
                  ) : <Skeleton height={32} />}
                </div>
              </div>

              {/* Row 2 — percentile breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { label: 'p50 (median)', val: stats?.p50, color: C.success },
                  { label: 'p95', val: stats?.p95, color: C.warning },
                  { label: 'p99', val: stats?.p99, color: C.error },
                ].map(p => (
                  <div key={p.label} style={{ borderRadius: 14, padding: '14px 16px', background: C.surface, border: `1px solid ${C.borderSubtle}` }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>{p.label} Latency</div>
                    {stats ? (
                      <div style={{ fontSize: 20, fontWeight: 900, color: p.color, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>{fmtMs(p.val)}</div>
                    ) : <Skeleton height={24} />}
                  </div>
                ))}
              </div>

              {/* Charts — real values only */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <LiveChart data={rpsHistory} color="#3ECF8E" label="Throughput (Real Req/sec)"
                  value={fmtNum(stats?.instantRps ?? stats?.rps ?? 0)} height={90} />
                <LiveChart data={p50History} color="#F59E0B" label="p50 Latency (ms)"
                  value={fmtMs(stats?.p50)} height={90} />
              </div>

              {/* Status codes + live error log */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: C.surface, border: `1px solid ${C.borderSubtle}`, borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>Live Status Code Distribution</div>
                  {stats ? (
                    <>
                      <div style={{ display: 'flex', height: 6, borderRadius: 100, overflow: 'hidden', marginBottom: 12, background: 'rgba(255,255,255,0.04)' }}>
                        {stats.completed > 0 && (
                          <>
                            <div style={{ width: `${(stats.successful / stats.completed) * 100}%`, background: C.success, transition: 'width 0.5s ease' }} />
                            <div style={{ width: `${(stats.failed / stats.completed) * 100}%`, background: C.error, transition: 'width 0.5s ease' }} />
                          </>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {statusBreakdown.filter(r => r.count > 0).map(r => (
                          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: r.color, fontSize: 8, lineHeight: 1 }}>●</span>
                            <span style={{ fontSize: 10.5, color: C.textSecondary, flex: 1, fontWeight: 500 }}>{r.label}</span>
                            <div style={{ width: 50, height: 3, borderRadius: 100, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(100, (r.count / Math.max(stats.completed, 1)) * 100)}%`, background: r.color, borderRadius: 100, transition: 'width 0.4s ease' }} />
                            </div>
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: r.color, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace", minWidth: 36, textAlign: 'right' }}>{fmtNum(r.count)}</span>
                          </div>
                        ))}
                        {statusBreakdown.every(r => r.count === 0) && (
                          <span style={{ fontSize: 10.5, color: C.textMuted, fontStyle: 'italic' }}>Waiting for first responses…</span>
                        )}
                      </div>
                    </>
                  ) : <Skeleton height={40} />}
                </div>

                <div style={{ background: C.surface, border: `1px solid ${C.borderSubtle}`, borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>Live Error Types</div>
                  {stats?.errors && Object.keys(stats.errors).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {Object.entries(stats.errors).map(([name, count]) => (
                        <div key={name} style={{
                          display: 'flex', justifyContent: 'space-between',
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5,
                          color: '#FCA5A5'
                        }}>
                          <span>{name.replace(/_/g, ' ')}</span>
                          <span style={{ fontWeight: 700 }}>{count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 10.5, color: C.textMuted, fontStyle: 'italic' }}>No errors observed yet</span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ═══ PHASE 3: COMPLETE ═══ */}
          {phase === 'complete' && finalStats && verdict && (
            <>
              <div style={{
                padding: '22px 24px', borderRadius: 16,
                background: verdict.bg, border: `1px solid ${verdict.border}`,
                boxShadow: `0 0 40px ${verdict.bg}`,
                animation: 'ltSlideUp 0.35s cubic-bezier(0.16,1,0.3,1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <span style={{ fontSize: 38 }}>{verdict.emoji}</span>
                    <div>
                      <div style={{ fontSize: 9.5, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3, fontFamily: "'JetBrains Mono', monospace" }}>Verdict (from real results)</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: verdict.color, letterSpacing: '-0.02em' }}>{verdict.label}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9.5, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2, fontFamily: "'JetBrains Mono', monospace" }}>Success Rate</div>
                    <div style={{ fontSize: 34, fontWeight: 900, color: verdict.color, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>{finalStats.successRate}%</div>
                    {saved && (
                      <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 100, background: 'rgba(62,207,142,0.14)', border: '1px solid rgba(62,207,142,0.3)' }}>
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#3ECF8E" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                        <span style={{ fontSize: 9.5, color: C.accent, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>Saved to History</span>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: C.textSecondary, lineHeight: 1.6, borderTop: `1px solid ${verdict.border}`, paddingTop: 12 }}>
                  {verdict.desc}
                </div>
              </div>

              <div style={{
                padding: '12px 16px', borderRadius: 10,
                background: 'rgba(62,207,142,0.05)', border: '1px solid rgba(62,207,142,0.16)',
                fontSize: 11.5, color: C.textSecondary, lineHeight: 1.5, fontVariantNumeric: 'tabular-nums', textAlign: 'center'
              }}>
                Fired <span style={{ fontWeight: 800, color: C.textPrimary }}>{fmtNum(finalStats.completed)}</span> real requests with <span style={{ fontWeight: 800, color: C.textPrimary }}>{fmtNum(finalStats.total)}</span> VUs over <span style={{ fontWeight: 800, color: C.textPrimary }}>{finalStats.elapsed}s</span> · <span style={{ fontWeight: 800, color: C.success }}>{fmtNum(finalStats.successful)}</span> succeeded · <span style={{ fontWeight: 800, color: finalStats.failed > 0 ? C.error : C.textMuted }}>{fmtNum(finalStats.failed)}</span> failed
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Accepted Requests', val: fmtNum(finalStats.successful), color: C.success },
                  { label: 'Rejected Requests', val: fmtNum(finalStats.failed), color: finalStats.failed > 0 ? C.error : C.textMuted },
                  { label: 'Peak Throughput', val: `${fmtNum(peakRps)} rps`, color: C.accent },
                  { label: 'p50 Latency', val: fmtMs(finalStats.p50), color: finalStats.p50 < 500 ? C.success : finalStats.p50 < 2000 ? C.warning : C.error },
                  { label: 'p95 Latency', val: fmtMs(finalStats.p95), color: C.warning },
                  { label: 'p99 Latency', val: fmtMs(finalStats.p99), color: C.error },
                ].map(s => (
                  <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.borderSubtle}`, borderRadius: 14, padding: '16px 18px' }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>{s.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: s.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {rpsHistory.length > 1 && (
                <LiveChart data={rpsHistory} color="#3ECF8E" label="Throughput Profile (Real Req/sec)" value={`Peak ${fmtNum(peakRps)} req/s`} height={120} />
              )}

              {rpsHistory.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: C.surface, border: `1px solid ${C.borderSubtle}`, borderRadius: 14, padding: '16px 18px' }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, fontFamily: "'JetBrains Mono', monospace" }}>Latency Percentiles</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                      {[
                        { label: 'p50', sub: 'median', val: finalStats.p50, color: C.success },
                        { label: 'p95', sub: '95th pct', val: finalStats.p95, color: C.warning },
                        { label: 'p99', sub: '99th pct', val: finalStats.p99, color: C.error },
                      ].map(b => {
                        const maxVal = Math.max(finalStats.p99, 1)
                        const pct = Math.round((b.val / maxVal) * 100)
                        return (
                          <div key={b.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 10.5, fontWeight: 600, color: C.textSecondary }}>{b.label} <span style={{ fontSize: 8.5, color: C.textMuted }}>{b.sub}</span></span>
                              <span style={{ fontSize: 10.5, fontWeight: 800, color: b.color, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>{fmtMs(b.val)}</span>
                            </div>
                            <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 100 }}>
                              <div style={{
                                height: '100%',
                                width: speedMounted ? `${pct}%` : '0%',
                                background: b.color, borderRadius: 100,
                                transition: 'width 0.7s ease-out',
                                minWidth: pct > 0 ? 2 : 0
                              }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ background: C.surface, border: `1px solid ${C.borderSubtle}`, borderRadius: 14, padding: '16px 18px' }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, fontFamily: "'JetBrains Mono', monospace" }}>Status Code Breakdown</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { label: '2xx Success', count: finalStats.statusCodes.s2xx, color: C.success },
                        { label: '3xx Redirect', count: finalStats.statusCodes.s3xx, color: C.blue },
                        { label: '4xx Client Error', count: finalStats.statusCodes.s4xx, color: C.warning },
                        { label: '5xx Server Error', count: finalStats.statusCodes.s5xx, color: C.error },
                        { label: 'Timeout', count: finalStats.statusCodes.sTimeout, color: '#EC4899' },
                        { label: 'Conn Error', count: finalStats.statusCodes.sConnErr, color: C.purple },
                      ].filter(r => r.count > 0).map(r => {
                        const pct = finalStats.completed > 0 ? Math.round((r.count / finalStats.completed) * 100) : 0
                        return (
                          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: r.color, fontSize: 8, lineHeight: 1 }}>●</span>
                            <span style={{ fontSize: 10.5, color: C.textSecondary, flex: 1, fontWeight: 500 }}>{r.label}</span>
                            <div style={{ width: 60, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: r.color, borderRadius: 100 }} />
                            </div>
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: r.color, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace", minWidth: 44, textAlign: 'right' }}>{fmtNum(r.count)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div style={{
                background: 'rgba(62,207,142,0.06)', border: '1px solid rgba(62,207,142,0.18)',
                borderRadius: 14, padding: '16px 18px'
              }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>Recommendations</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {verdict.tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.accent, marginTop: 6, flexShrink: 0 }} />
                      <span style={{ fontSize: 11.5, color: C.textSecondary, lineHeight: 1.6 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {Object.keys(errors).length > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>Error Breakdown</div>
                  {Object.entries(errors).map(([name, count]) => (
                    <div key={name} style={{
                      display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5,
                      color: '#FCA5A5', borderBottom: '1px solid rgba(239,68,68,0.08)'
                    }}>
                      <span>{name.replace(/_/g, ' ')}</span>
                      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={reset} style={{
                padding: '14px', borderRadius: 12, fontFamily: 'inherit', fontWeight: 700,
                fontSize: 12.5, cursor: 'pointer', border: `1px solid ${C.borderDefault}`,
                background: 'rgba(255,255,255,0.03)', color: C.textSecondary,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                <span>Configure New Load Test</span>
                <Kbd>⌘R</Kbd>
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ltOpen    { from { opacity:0; transform:scale(0.97) translateY(10px) } to { opacity:1; transform:scale(1) translateY(0) } }
        @keyframes ltSlideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes ltBlink   { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes ltScan    { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes ltSkeleton { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        * { box-sizing:border-box }
        ::-webkit-scrollbar { width:3px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:3px }
        input[type="range"] {
          -webkit-appearance: none; appearance: none;
          background: rgba(255,255,255,0.08); border-radius: 100px; outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 14px; height: 14px; border-radius: 50%;
          background: #3ECF8E; cursor: pointer;
          border: 2px solid #0B0C0E;
          box-shadow: 0 0 10px rgba(62, 207, 142, 0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 50%;
          background: #3ECF8E; cursor: pointer;
          border: 2px solid #0B0C0E;
        }
      `}</style>
    </div>
  )
}