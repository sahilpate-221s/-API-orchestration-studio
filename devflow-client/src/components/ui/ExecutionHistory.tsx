import { useEffect, useState, useRef, useCallback } from 'react'
import api from '../../services/api'
import { useFlowStore } from '../../store/flowStore'
import {
  Clock,
  X,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Check,
  Search,
  ChevronRight,
} from 'lucide-react'

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
  rps: number
  elapsed: number
  statusCodes?: StatusCodes
  errors: Record<string, number>
  verdict?: string
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
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function getVerdict(meta: LoadTestMeta) {
  if (meta.successRate >= 99 && meta.avgLatency <= 200) return { label: 'Production Ready', icon: CheckCircle2, color: '#3ECF8E', bg: 'rgba(62,207,142,0.12)', border: 'rgba(62,207,142,0.3)' }
  if (meta.successRate >= 95 && meta.avgLatency <= 500) return { label: 'Good Performance', icon: Check, color: '#8B7CF6', bg: 'rgba(139,124,246,0.12)', border: 'rgba(139,124,246,0.3)' }
  if (meta.successRate >= 80) return { label: 'Degraded Latency', icon: AlertTriangle, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' }
  return { label: 'Critical Bottleneck', icon: XCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' }
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

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'graph' | 'loadtest'>('all')

  // Dynamic Panel Resizing State
  const [panelWidth, setPanelWidth] = useState(480)
  const isDragging = useRef(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const newWidth = window.innerWidth - e.clientX
      // Clamp panel width between 360px and 850px (or window.innerWidth - 60px)
      const maxW = Math.min(920, window.innerWidth - 60)
      const clamped = Math.max(360, Math.min(newWidth, maxW))
      setPanelWidth(clamped)
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [])

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
    success: '#3ECF8E', error: '#EF4444', running: '#8B7CF6', queued: '#93959D', skipped: '#F59E0B',
  }
  const statusBg: Record<string, string> = {
    success: 'rgba(62,207,142,0.12)', error: 'rgba(239,68,68,0.12)', running: 'rgba(139,124,246,0.12)',
    queued: 'rgba(255,255,255,0.05)', skipped: 'rgba(245,158,11,0.12)',
  }

  const isLoadTest = (ex: Execution) =>
    ex.idempotencyKey?.startsWith('loadtest-') || ex.idempotencyKey?.startsWith('benchmark-') || Boolean(ex.loadTestMeta)

  const filteredExecutions = executions.filter((ex) => {
    const lt = isLoadTest(ex)
    if (filterType === 'graph' && lt) return false
    if (filterType === 'loadtest' && !lt) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    if (ex.executionId.toLowerCase().includes(q)) return true
    if (ex.status.toLowerCase().includes(q)) return true
    if (lt && ex.loadTestMeta?.targetUrl.toLowerCase().includes(q)) return true
    if (lt && ex.loadTestMeta?.method.toLowerCase().includes(q)) return true
    return false
  })

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden font-sans select-none">
      {/* Glass Backdrop */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel Container */}
      <div
        style={{ width: `${panelWidth}px` }}
        className="relative h-full bg-[#0B0C0E]/95 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.9)] z-10 transition-[width] duration-75 ease-out"
      >
        {/* Dynamic Resize Handle (Drag Left/Right) */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 bottom-0 left-0 w-3 -ml-1.5 cursor-col-resize z-40 group flex items-center justify-center hover:bg-[#3ECF8E]/10 transition-colors"
          title="Drag left/right to adjust history panel width"
        >
          <div className="w-1 h-14 rounded-full bg-white/20 group-hover:bg-[#3ECF8E] transition-all group-hover:h-20 group-hover:shadow-[0_0_12px_#3ECF8E]" />
        </div>

        {/* Panel Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0E0F12]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {view === 'detail' ? (
              <button
                type="button"
                onClick={() => setView('list')}
                className="p-1.5 rounded-lg text-[#93959D] hover:text-white hover:bg-white/[0.08] border border-transparent hover:border-white/10 transition-all cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 flex items-center justify-center text-[#3ECF8E] shadow-[0_0_12px_rgba(62,207,142,0.15)]">
                <Clock size={16} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight font-display">
                  {view === 'detail' && selected
                    ? isLoadTest(selected) ? 'Load Test Metrics' : 'Execution Details'
                    : 'Execution History'}
                </h2>
                {view === 'list' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/[0.06] border border-white/10 text-[#93959D]">
                    {total} runs
                  </span>
                )}
              </div>
              {view === 'list' && (
                <p className="text-[11px] font-mono text-[#5A5C64] mt-0.5">Drag left edge to resize panel width</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#5A5C64] hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar (Only in List View) */}
        {view === 'list' && (
          <div className="p-3 border-b border-white/[0.06] bg-black/20 flex flex-col gap-2.5">
            {/* Search input */}
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-[#5A5C64]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search runs by ID, URL, or status..."
                className="w-full bg-[#131417] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#5A5C64] font-mono outline-none focus:border-[#3ECF8E]/50 focus:ring-1 focus:ring-[#3ECF8E]/20 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-[#5A5C64] hover:text-white text-xs font-mono"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
              {[
                { id: 'all', label: 'All Runs' },
                { id: 'graph', label: 'Graph Runs' },
                { id: 'loadtest', label: 'Load Tests' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    filterType === f.id
                      ? 'bg-[#3ECF8E]/15 border border-[#3ECF8E]/40 text-[#3ECF8E]'
                      : 'bg-white/[0.03] border border-white/[0.06] text-[#93959D] hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Container */}
        <div className="flex-1 relative overflow-hidden">
          {/* LIST VIEW */}
          <div
            className={`absolute inset-0 p-4 overflow-y-auto custom-scrollbar transition-all duration-300 ${
              view === 'list'
                ? 'translate-x-0 opacity-100 pointer-events-auto'
                : '-translate-x-full opacity-0 pointer-events-none'
            }`}
          >
            {loading && executions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#3ECF8E]">
                <div className="w-7 h-7 rounded-full border-2 border-white/10 border-t-[#3ECF8E] animate-spin mb-3" />
                <span className="text-xs font-mono text-[#93959D]">Loading execution history...</span>
              </div>
            ) : filteredExecutions.length === 0 ? (
              <div className="text-center py-16 text-[#5A5C64]">
                <Clock size={32} className="mx-auto mb-2 opacity-30 text-[#3ECF8E]" />
                <p className="text-sm font-semibold text-[#93959D]">No matching runs found</p>
                <p className="text-xs mt-1 text-[#5A5C64]">
                  {searchQuery ? `No results for "${searchQuery}"` : 'Execute a workflow or benchmark test to record history'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredExecutions.map((ex, i) => {
                  const lt = isLoadTest(ex)
                  return (
                    <button
                      key={ex.executionId}
                      type="button"
                      onClick={() => { setSelected(ex); setView('detail') }}
                      className="w-full text-left p-3.5 rounded-xl bg-[#0E0F12] border border-white/[0.07] hover:bg-[#131417] hover:border-white/15 transition-all duration-150 flex flex-col gap-2.5 cursor-pointer group shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {lt ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-[#FF4893]/15 border border-[#FF4893]/30 text-[#FF4893] flex-shrink-0">
                              Load Test
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-[#8B7CF6]/15 border border-[#8B7CF6]/30 text-[#8B7CF6] flex-shrink-0">
                              DAG Run
                            </span>
                          )}
                          <span className="text-xs font-semibold text-white group-hover:text-[#3ECF8E] transition-colors truncate">
                            {lt && ex.loadTestMeta
                              ? `Load Test #${total - i} · ${fmt(ex.loadTestMeta.totalUsers)} VUs`
                              : `Run #${total - i}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: statusBg[ex.status],
                              color: statusColor[ex.status],
                            }}
                          >
                            {lt && ex.loadTestMeta ? `${ex.loadTestMeta.successRate}% ok` : ex.status}
                          </span>
                          <ChevronRight size={14} className="text-[#5A5C64] group-hover:text-white transition-colors" />
                        </div>
                      </div>

                      {/* Stat summary strip */}
                      <div className="flex items-center justify-between text-xs font-mono text-[#5A5C64] pt-2 border-t border-white/[0.04]">
                        <span>
                          {new Date(ex.triggeredAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[#93959D] font-medium">
                          {lt && ex.loadTestMeta
                            ? `${fmt(ex.loadTestMeta.totalUsers)} VUs · ${fmt(ex.loadTestMeta.rps)} rps · ${fmtSec(ex.loadTestMeta.avgLatency)}`
                            : `${ex.nodes.length} nodes · ${ex.totalTime}ms`}
                        </span>
                      </div>
                    </button>
                  )
                })}

                {hasMore && (
                  <button
                    type="button"
                    onClick={() => fetchHistory(executions.length)}
                    disabled={loadingMore}
                    className="w-full py-3 rounded-xl border border-dashed border-white/10 text-xs font-mono text-[#93959D] hover:text-white hover:border-[#3ECF8E]/40 hover:bg-[#3ECF8E]/5 transition-all cursor-pointer mt-2"
                  >
                    {loadingMore ? 'Loading more history...' : 'Load older runs'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* DETAIL VIEW */}
          <div
            className={`absolute inset-0 p-4 overflow-y-auto custom-scrollbar transition-all duration-300 ${
              view === 'detail'
                ? 'translate-x-0 opacity-100 pointer-events-auto'
                : 'translate-x-full opacity-0 pointer-events-none'
            }`}
          >
            {selected && isLoadTest(selected) && selected.loadTestMeta ? (
              /* Load Test Detailed Metrics */
              (() => {
                const meta = selected.loadTestMeta!
                const verdict = getVerdict(meta)
                const VerdictIcon = verdict.icon

                return (
                  <div className="space-y-4">
                    {/* Verdict Banner */}
                    <div
                      className="p-4 rounded-2xl border transition-all"
                      style={{ backgroundColor: verdict.bg, borderColor: verdict.border }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${verdict.color}20`, border: `1px solid ${verdict.color}40` }}
                          >
                            <VerdictIcon size={22} style={{ color: verdict.color }} />
                          </div>
                          <div>
                            <p className="text-[9.5px] font-mono uppercase tracking-widest text-[#93959D]">Verdict</p>
                            <p className="text-lg font-bold font-display" style={{ color: verdict.color }}>{verdict.label}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9.5px] font-mono uppercase tracking-widest text-[#93959D]">Success Rate</p>
                          <p className="text-2xl font-black font-mono" style={{ color: verdict.color }}>{meta.successRate}%</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/[0.08] space-y-1">
                        <p className="text-[9.5px] font-mono uppercase tracking-wider text-[#93959D]">Target Endpoint</p>
                        <p className="text-xs font-mono text-white break-all flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/10">{meta.method}</span>
                          {meta.targetUrl}
                        </p>
                        <p className="text-[10.5px] font-mono text-[#5A5C64] pt-1">{new Date(selected.triggeredAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono">
                      {[
                        { label: 'Total Users', value: fmt(meta.totalUsers), color: '#F2F3F5' },
                        { label: 'Duration', value: `${meta.elapsed}s`, color: '#F2F3F5' },
                        { label: 'Avg Latency', value: fmtSec(meta.avgLatency), color: meta.avgLatency <= 200 ? '#3ECF8E' : meta.avgLatency <= 500 ? '#F59E0B' : '#EF4444' },
                        { label: 'Peak Req/sec', value: fmt(meta.rps), color: '#3ECF8E' },
                        { label: 'Successful', value: fmt(meta.successful), color: '#3ECF8E' },
                        { label: 'Failed', value: fmt(meta.failed), color: meta.failed === 0 ? '#3ECF8E' : '#EF4444' },
                      ].map((m) => (
                        <div key={m.label} className="p-3 rounded-xl bg-[#0E0F12] border border-white/[0.07]">
                          <p className="text-[9px] uppercase tracking-widest text-[#5A5C64]">{m.label}</p>
                          <p className="text-base font-extrabold mt-1" style={{ color: m.color }}>{m.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Status Code Breakdown */}
                    {meta.statusCodes && (
                      <div className="p-4 rounded-xl bg-[#0E0F12] border border-white/[0.07] font-mono">
                        <p className="text-[10px] uppercase tracking-wider text-[#5A5C64] mb-3 font-semibold">HTTP Status Code Distribution</p>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {[
                            { label: '2xx Success', val: meta.statusCodes.s2xx, color: '#3ECF8E' },
                            { label: '3xx Redirect', val: meta.statusCodes.s3xx, color: '#8B7CF6' },
                            { label: '4xx Client', val: meta.statusCodes.s4xx, color: '#F59E0B' },
                            { label: '5xx Server', val: meta.statusCodes.s5xx, color: '#EF4444' },
                            { label: 'Timeout', val: meta.statusCodes.sTimeout, color: '#EC4899' },
                            { label: 'Conn Error', val: meta.statusCodes.sConnErr, color: '#EF4444' },
                          ].map((b) => (
                            <div key={b.label} className="flex justify-between items-center p-2 rounded-lg bg-black/20">
                              <span className="text-[#93959D]">{b.label}</span>
                              <span className="font-bold" style={{ color: b.val > 0 ? b.color : '#5A5C64' }}>{fmt(b.val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()
            ) : selected ? (
              /* Standard Execution Run Detail */
              <div className="space-y-4 font-sans">
                <div className="p-4 rounded-2xl bg-[#0E0F12] border border-white/10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-bold text-white font-display">Run Execution Summary</h3>
                      <p className="text-xs font-mono text-[#5A5C64] mt-1">{new Date(selected.triggeredAt).toLocaleString()}</p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: statusBg[selected.status],
                        color: statusColor[selected.status],
                      }}
                    >
                      {selected.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                      <p className="text-[9px] uppercase tracking-wider text-[#5A5C64]">Total Duration</p>
                      <p className="text-base font-bold text-white mt-1">{selected.totalTime}ms</p>
                    </div>
                    <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                      <p className="text-[9px] uppercase tracking-wider text-[#5A5C64]">Nodes Processed</p>
                      <p className="text-base font-bold text-white mt-1">{selected.nodes.length}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#5A5C64] px-1">Node Activity Stream</p>
                  {selected.nodes.map((node) => (
                    <div
                      key={node.nodeId}
                      className="p-3 rounded-xl bg-[#0E0F12] border border-white/[0.06] space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor[node.status] }} />
                          <span className="text-xs font-semibold text-white">{node.nodeLabel}</span>
                        </div>
                        <span className="text-xs font-mono text-[#5A5C64]">{node.executionTime}ms</span>
                      </div>
                      {node.error && (
                        <div className="p-2.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/25 text-xs font-mono text-[#EF4444] break-words">
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