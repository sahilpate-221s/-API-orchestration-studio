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

type Execution = {
  executionId: string
  status: 'queued' | 'running' | 'success' | 'error'
  totalTime: number
  triggeredAt: string
  completedAt?: string
  nodes: NodeResult[]
}

type Props = {
  onClose: () => void
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
      .get(`/execution/${workflowId}/history`, {
        params: { skip, limit: 15 },
      })
      .then((r) => {
        if (skip === 0) {
          setExecutions(r.data.executions)
        } else {
          setExecutions((prev) => [...prev, ...r.data.executions])
        }
        setHasMore(r.data.pagination.hasMore)
        setTotal(r.data.pagination.total)
      })
      .finally(() => method(false))
  }

  useEffect(() => {
    fetchHistory(0)
  }, [workflowId])

  const statusColor: Record<string, string> = {
    success: '#34d399',
    error: '#f87171',
    running: '#60a5fa',
    queued: '#9ca3af',
    skipped: '#fbbf24',
  }

  const statusBg: Record<string, string> = {
    success: 'rgba(52,211,153,0.1)',
    error: 'rgba(248,113,113,0.1)',
    running: 'rgba(96,165,250,0.1)',
    queued: 'rgba(156,163,175,0.1)',
    skipped: 'rgba(251,191,36,0.1)',
  }

  const handleSelect = (ex: Execution) => {
    setSelected(ex)
    setView('detail')
  }

  return (
    <div className="absolute inset-0 z-50 flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Premium Compact Sidebar */}
      <div 
        style={{
          width: '400px',
          height: '100%',
          background: 'rgba(13, 13, 13, 0.95)',
          backdropFilter: 'blur(16px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
        }}
        className="animate-in slide-in-from-right duration-300 ease-out"
      >
        {/* Header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{ 
                width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: 0 }}>History</h2>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{total} runs total</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '6px', 
              color: 'rgba(255,255,255,0.4)', transition: 'all 0.2s' 
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Views */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          
          {/* List View */}
          <div 
            style={{ 
              position: 'absolute', inset: 0, padding: '20px', overflowY: 'auto', 
              transform: view === 'list' ? 'translateX(0)' : 'translateX(-100%)',
              opacity: view === 'list' ? 1 : 0,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: view === 'list' ? 'auto' : 'none'
            }}
          >
            {loading && executions.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#ffffff', borderRadius: '50%' }} className="animate-spin" />
              </div>
            ) : executions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                <p style={{ fontSize: '13px' }}>No runs recorded yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {executions.map((ex, i) => (
                  <button
                    key={ex.executionId}
                    onClick={() => handleSelect(ex)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '14px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Run #{total - i}</span>
                      <div style={{ 
                        fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', 
                        padding: '3px 8px', borderRadius: '4px', background: statusBg[ex.status], color: statusColor[ex.status]
                      }}>
                        {ex.status}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
                      <span style={{ fontSize: '11px', color: '#fff' }}>
                        {new Date(ex.triggeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span style={{ fontSize: '11px', color: '#fff', fontFamily: 'monospace' }}>{ex.totalTime}ms</span>
                    </div>
                  </button>
                ))}
                
                {hasMore && (
                  <button
                    onClick={() => fetchHistory(executions.length)}
                    disabled={loadingMore}
                    style={{ 
                      padding: '12px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.1)', 
                      borderRadius: '10px', color: 'rgba(255,255,255,0.3)', fontSize: '11px', cursor: 'pointer', marginTop: '10px' 
                    }}
                  >
                    {loadingMore ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Detail View */}
          <div 
            style={{ 
              position: 'absolute', inset: 0, padding: '20px', overflowY: 'auto',
              transform: view === 'detail' ? 'translateX(0)' : 'translateX(100%)',
              opacity: view === 'detail' ? 1 : 0,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: view === 'detail' ? 'auto' : 'none'
            }}
          >
            {selected && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Back Button */}
                <button 
                  onClick={() => setView('list')}
                  style={{ 
                    alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', 
                    background: 'transparent', border: 'none', color: '#ffffff', fontSize: '12px', 
                    fontWeight: 600, cursor: 'pointer', padding: '4px 0' 
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  Back to list
                </button>

                {/* Summary Card */}
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Run Summary</h3>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0' }}>{new Date(selected.triggeredAt).toLocaleString()}</p>
                    </div>
                    <div style={{ 
                      fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', 
                      padding: '4px 10px', borderRadius: '6px', background: statusBg[selected.status], color: statusColor[selected.status]
                    }}>
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

                {/* Node Activity List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px 4px' }}>Node Activity</h4>
                  {selected.nodes.map((node) => (
                    <div 
                      key={node.nodeId}
                      style={{ 
                        padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', 
                        borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor[node.status] }} />
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#eee' }}>{node.nodeLabel}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{node.executionTime}ms</span>
                      </div>
                      
                      {node.error && (
                        <div style={{ 
                          marginTop: '4px', padding: '8px 10px', background: 'rgba(248, 113, 113, 0.05)', 
                          border: '1px solid rgba(248, 113, 113, 0.1)', borderRadius: '6px',
                          fontSize: '11px', color: '#fca5a5', fontFamily: 'monospace', wordBreak: 'break-word', whiteSpace: 'pre-wrap'
                        }}>
                          {node.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}