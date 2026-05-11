import React, { useState } from 'react'
import api from '../services/api'
import { useFlowStore } from '../store/flowStore'
import { saveWorkflow, createWorkflow } from '../services/workflowService'

type BenchmarkResult = {
  runNumber: number
  totalTime: number
  nodeCount: number
  status: 'success' | 'error'
  avgNodeTime: number
}

export default function BenchmarkPage({ onClose }: { onClose: () => void }) {
  const { nodes, edges, workflowId, workflowName, workspace, setWorkflowMeta } = useFlowStore()
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<BenchmarkResult[]>([])
  const [progress, setProgress] = useState(0)
  const [concurrency] = useState(5)

  const runBenchmark = async () => {
    if (nodes.length === 0) return
    setRunning(true)
    setResults([])
    setProgress(0)

    let id = workflowId
    try {
      if (!id) {
        const wf = await createWorkflow(workflowName, workspace, nodes, edges)
        id = wf._id
        setWorkflowMeta(wf._id, wf.name, wf.workspace)
      } else {
        await saveWorkflow(id, workflowName, nodes, edges)
      }

      const totalRuns = 20
      const batchSize = concurrency
      const allResults: BenchmarkResult[] = []

      for (let batch = 0; batch < totalRuns / batchSize; batch++) {
        const batchPromises = Array.from({ length: batchSize }, async (_, i) => {
          const runNumber = batch * batchSize + i + 1
          if (runNumber > totalRuns) return null
          
          const start = Date.now()
          try {
            await api.post(`/execution/${id}/run`, {}, {
              headers: { 'x-idempotency-key': `bench-${Date.now()}-${runNumber}` }
            })
            const totalTime = Date.now() - start
            return {
              runNumber,
              totalTime,
              nodeCount: nodes.length,
              status: 'success' as const,
              avgNodeTime: Math.round(totalTime / Math.max(nodes.length, 1)),
            }
          } catch (err) {
            return {
              runNumber,
              totalTime: Date.now() - start,
              nodeCount: nodes.length,
              status: 'error' as const,
              avgNodeTime: 0,
            }
          }
        })

        const batchResults = (await Promise.all(batchPromises)).filter(Boolean) as BenchmarkResult[]
        allResults.push(...batchResults)
        setResults([...allResults])
        setProgress(Math.round((allResults.length / totalRuns) * 100))

        if (batch < totalRuns / batchSize - 1) {
          await new Promise((r) => setTimeout(r, 500))
        }
      }
    } catch (err) {
      console.error('Benchmark failed:', err)
      alert('Failed to start benchmark. Make sure the workflow is saved.')
    } finally {
      setRunning(false)
    }
  }

  const avgTime = results.length
    ? Math.round(results.reduce((a, b) => a + b.totalTime, 0) / results.length)
    : 0

  const successRate = results.length
    ? Math.round((results.filter((r) => r.status === 'success').length / results.length) * 100)
    : 0

  const maxTime = results.length ? Math.max(...results.map((r) => r.totalTime)) : 0
  const minTime = results.length ? Math.min(...results.map((r) => r.totalTime)) : 0

  return (
    <div 
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        overflow: 'hidden',
      }}
    >
      {/* Backdrop */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          animation: 'fadeIn 0.3s ease-out',
        }}
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '85vh',
          background: '#0f0f0f',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          boxShadow: '0 50px 100px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          animation: 'modalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Performance Benchmark</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
              Load testing: 20 sequential batches · 5 parallel requests
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Action Header (if not running) */}
          {!running && results.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed rgba(255, 255, 255, 0.15)', borderRadius: '20px' }}>
               <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff' }}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
               </div>
               <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: '0 0 8px' }}>Ready to Benchmark?</h3>
               <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', margin: '0 0 24px' }}>This will execute the workflow 20 times to measure latency and stability.</p>
               <button
                 onClick={runBenchmark}
                 disabled={nodes.length === 0}
                 style={{
                   padding: '12px 28px',
                   borderRadius: '12px',
                   background: '#fff',
                   color: '#000',
                   fontSize: '14px',
                   fontWeight: 700,
                   border: 'none',
                   cursor: nodes.length === 0 ? 'not-allowed' : 'pointer',
                   boxShadow: '0 8px 20px rgba(255, 255, 255, 0.12)',
                   transition: 'all 0.2s',
                   opacity: nodes.length === 0 ? 0.5 : 1,
                 }}
               >
                 Launch Test
               </button>
            </div>
          )}

          {/* Stats Grid */}
          {results.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {[
                { label: 'Avg Latency', value: `${avgTime}ms`, color: '#fff', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                { label: 'Min Latency', value: `${minTime}ms`, color: '#34d399', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
                { label: 'Max Latency', value: `${maxTime}ms`, color: '#fbbf24', icon: 'M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6' },
                { label: 'Success Rate', value: `${successRate}%`, color: successRate === 100 ? '#34d399' : '#f87171', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              ].map((stat) => (
                <div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d={stat.icon}/>
                    </svg>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Progress / Chart Section */}
          {(running || results.length > 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Execution Timeline</span>
                {running && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Processing run {results.length}/20...</span>
                    <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: '#fff', transition: 'all 0.3s' }} />
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ height: '160px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px 24px 12px', display: 'flex', alignItems: 'end', gap: '6px' }}>
                {results.map((r, i) => {
                  const height = maxTime > 0 ? (r.totalTime / maxTime) * 100 : 0
                  return (
                    <div 
                      key={i} 
                      style={{ 
                        flex: 1, 
                        height: `${Math.max(height, 5)}%`, 
                        background: r.status === 'error' ? 'linear-gradient(to top, #ef4444, #f87171)' : 'linear-gradient(to top, rgba(255,255,255,0.1), rgba(255,255,255,0.3))',
                        borderRadius: '4px 4px 0 0',
                        opacity: 0.8,
                        position: 'relative',
                        transition: 'all 0.4s ease-out',
                      }}
                    />
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.15)' }}>RUN #1</span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.15)' }}>RUN #20</span>
              </div>
            </div>
          )}

          {/* Details Table */}
          {results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Detailed Metrics</h3>
               <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                 <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr', padding: '12px 20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['#', 'STATUS', 'LATENCY', 'AVG/NODE'].map((h) => (
                      <span key={h} style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>{h}</span>
                    ))}
                 </div>
                 <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {results.slice().reverse().map((r) => (
                      <div key={r.runNumber} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{r.runNumber}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: r.status === 'success' ? '#10b981' : '#ef4444' }} />
                          <span style={{ fontSize: '11px', color: r.status === 'success' ? '#34d399' : '#f87171', fontWeight: 600 }}>{r.status}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>{r.totalTime}ms</span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{r.avgNodeTime}ms</span>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          )}

          {/* Action Footer (if results exist but not running) */}
          {!running && results.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
               <button
                 onClick={runBenchmark}
                 style={{
                   padding: '10px 24px',
                   borderRadius: '10px',
                   background: 'rgba(255,255,255,0.05)',
                   border: '1px solid rgba(255,255,255,0.1)',
                   color: '#fff',
                   fontSize: '13px',
                   fontWeight: 600,
                   cursor: 'pointer',
                   transition: 'all 0.2s',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '8px',
                 }}
               >
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                 Run New Test
               </button>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}