import { useExecution } from '../../hooks/useExecution'
import { useFlowStore } from '../../store/flowStore'
import { saveWorkflow, createWorkflow } from '../../services/workflowService'
import { useState, useEffect, useRef, useCallback } from 'react'

export default function Navbar({ 
  onHome, 
  onHistoryClick, 
  onLogClick, 
  onPaletteClick,
  onBenchmarkClick,
  logOpen 
}: { 
  onHome?: () => void; 
  onHistoryClick?: () => void; 
  onLogClick?: () => void;
  onPaletteClick?: () => void;
  onBenchmarkClick?: () => void;
  logOpen?: boolean;
}) {
  const { runWorkflow, resetWorkflow, remaining } = useExecution()
  const { nodes, edges, workflowId, workflowName, workspace, setWorkflowMeta } = useFlowStore()
  const isRunning = nodes?.some((n) => n.data.status === 'running') ?? false
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Always keep a ref to the latest save function so the debounced effect never captures stale values
  const latestSaveRef = useRef<() => Promise<void>>(async () => {})

  const handleSave = useCallback(async () => {
    setSaveStatus('saving')
    try {
      if (workflowId) {
        await saveWorkflow(workflowId, workflowName, nodes, edges)
      } else {
        const wf = await createWorkflow(workflowName, workspace, nodes, edges)
        setWorkflowMeta(wf.id || wf._id, wf.name, wf.workspace)
      }
      setSaveStatus('saved')
      // Reset back to idle after 2 s so the indicator fades
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('Save failed', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [workflowId, workflowName, workspace, nodes, edges, setWorkflowMeta])

  // Keep the ref up-to-date with the latest handleSave
  useEffect(() => {
    latestSaveRef.current = handleSave
  }, [handleSave])

  // Auto-save: 5-second debounce after nodes/edges change
  // Uses the ref so the timeout always calls the freshest version of handleSave
  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    // Don't auto-save during execution (nodes have transient status states)
    if (!workflowId || isRunning) return

    const timer = setTimeout(() => {
      latestSaveRef.current()
    }, 5000)

    return () => clearTimeout(timer)
  }, [nodes, edges, workflowId, isRunning])

  return (
    <div
      style={{
        height: '48px',
        width: '100%',
        background: 'rgba(10,10,10,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        zIndex: 10,
        backdropFilter: 'blur(12px)',
        gap: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* ── Left: Logo + breadcrumb ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        {/* Logo mark + Brand */}
        <div
          onClick={onHome}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: onHome ? 'pointer' : 'default',
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={(e) => { if(onHome) e.currentTarget.style.opacity = '0.8' }}
          onMouseLeave={(e) => { if(onHome) e.currentTarget.style.opacity = '1' }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '9px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle background glow */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 70%)',
            }} />
            
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path 
                d="M12 3L4 9V21L12 15L20 21V9L12 3Z" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                opacity="0.9"
              />
              <path 
                d="M12 15V3" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round"
                opacity="0.4"
              />
              <circle cx="12" cy="15" r="2" fill="white" />
            </svg>
          </div>

          <span
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: 'rgba(255,255,255,0.96)',
              letterSpacing: '-0.02em',
              flexShrink: 0,
            }}
          >
            DevFlow
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.09)', flexShrink: 0 }} />

        {/* Breadcrumb */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '3px 6px',
            borderRadius: '5px',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none' }}
        >
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>{workspace}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>{workflowName}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Cmd+K Palette Trigger */}
        <button
          onClick={onPaletteClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: '110px',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.07)'
            el.style.borderColor = 'rgba(255,255,255,0.3)'
            el.style.boxShadow = '0 0 15px rgba(255,255,255,0.1)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.04)'
            el.style.borderColor = 'rgba(255,255,255,0.08)'
            el.style.boxShadow = 'none'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>Search</span>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)', marginLeft: 'auto' }}>⌘K</span>
        </button>
      </div>

      {/* ── Center: graph stats ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 14px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isRunning ? '#60a5fa' : '#4ade80',
              boxShadow: isRunning ? '0 0 8px rgba(96,165,250,0.6)' : '0 0 8px rgba(74,222,128,0.4)',
              flexShrink: 0,
              animation: isRunning ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}
          />
          <span style={{ fontSize: '11px', fontWeight: 600, color: isRunning ? '#93c5fd' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
            {isRunning ? 'RUNNING' : 'IDLE'}
          </span>
        </div>
        
        <div style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.1)' }} />
        
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {nodes?.length ?? 0} nodes · {edges?.length ?? 0} edges
        </span>

        <div style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.1)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: remaining < 10 ? '#f87171' : '#ffffff' }}>{remaining}</span>
          <span style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase' }}>Credits</span>
        </div>
      </div>

      {/* ── Right: actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Reset button */}
        <button
          onClick={resetWorkflow}
          disabled={isRunning}
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: isRunning ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            padding: '5px 12px',
            borderRadius: '8px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (isRunning) return
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.06)'
            el.style.borderColor = 'rgba(255,255,255,0.12)'
            el.style.color = 'rgba(255,255,255,0.8)'
          }}
          onMouseLeave={(e) => {
            if (isRunning) return
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.03)'
            el.style.borderColor = 'rgba(255,255,255,0.06)'
            el.style.color = 'rgba(255,255,255,0.4)'
          }}
        >
          Reset
        </button>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: saveStatus === 'saved' ? '#34d399' : saveStatus === 'error' ? '#f87171' : 'rgba(255,255,255,0.4)',
            background: saveStatus === 'saved' ? 'rgba(52,211,153,0.08)' : saveStatus === 'error' ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.03)',
            border: '1px solid',
            borderColor: saveStatus === 'saved' ? 'rgba(52,211,153,0.2)' : saveStatus === 'error' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.06)',
            cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
            padding: '5px 12px',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (saveStatus === 'saving') return
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.06)'
            el.style.borderColor = 'rgba(255,255,255,0.12)'
            el.style.color = 'rgba(255,255,255,0.8)'
          }}
          onMouseLeave={(e) => {
            if (saveStatus === 'saving') return
            const el = e.currentTarget as HTMLElement
            el.style.background = saveStatus === 'saved' ? 'rgba(52,211,153,0.08)' : saveStatus === 'error' ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.03)'
            el.style.borderColor = saveStatus === 'saved' ? 'rgba(52,211,153,0.2)' : saveStatus === 'error' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.06)'
            el.style.color = saveStatus === 'saved' ? '#34d399' : saveStatus === 'error' ? '#f87171' : 'rgba(255,255,255,0.4)'
          }}
        >
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error' : 'Save'}
        </button>

        {/* History button */}
        <button
          onClick={onHistoryClick}
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            padding: '5px 12px',
            borderRadius: '8px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.06)'
            el.style.borderColor = 'rgba(255,255,255,0.12)'
            el.style.color = 'rgba(255,255,255,0.8)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.03)'
            el.style.borderColor = 'rgba(255,255,255,0.06)'
            el.style.color = 'rgba(255,255,255,0.4)'
          }}
        >
          History
        </button>

        {/* Log toggle button */}
        <button
          onClick={onLogClick}
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: logOpen ? '#ffffff' : 'rgba(255,255,255,0.4)',
            background: logOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
            border: '1px solid',
            borderColor: logOpen ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)',
            cursor: 'pointer',
            padding: '5px 12px',
            borderRadius: '8px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            if (!logOpen) {
              el.style.background = 'rgba(255,255,255,0.06)'
              el.style.borderColor = 'rgba(255,255,255,0.12)'
              el.style.color = 'rgba(255,255,255,0.8)'
            }
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            if (!logOpen) {
              el.style.background = 'rgba(255,255,255,0.03)'
              el.style.borderColor = 'rgba(255,255,255,0.06)'
              el.style.color = 'rgba(255,255,255,0.4)'
            }
          }}
        >
          Log
        </button>

        {/* Benchmark button */}
        <button
          onClick={onBenchmarkClick}
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            padding: '5px 12px',
            borderRadius: '8px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.08)'
            el.style.borderColor = 'rgba(255,255,255,0.2)'
            el.style.color = '#ffffff'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.03)'
            el.style.borderColor = 'rgba(255,255,255,0.06)'
            el.style.color = 'rgba(255,255,255,0.4)'
          }}
        >
          Benchmark
        </button>



        {/* Divider */}
        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.09)' }} />

        {/* Run button */}
        <button
          onClick={runWorkflow}
          disabled={isRunning}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            background: isRunning ? 'rgba(255,255,255,0.7)' : '#ffffff',
            border: 'none',
            borderRadius: '7px',
            padding: '5px 14px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            color: '#000000',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.01em',
            boxShadow: '0 4px 12px rgba(255,255,255,0.15)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isRunning ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (isRunning) return
            const el = e.currentTarget as HTMLElement
            el.style.background = '#f4f4f5'
            el.style.boxShadow = '0 6px 20px rgba(255,255,255,0.25)'
            el.style.transform = 'translateY(-1px) scale(1.02)'
          }}
          onMouseLeave={(e) => {
            if (isRunning) return
            const el = e.currentTarget as HTMLElement
            el.style.background = '#ffffff'
            el.style.boxShadow = '0 4px 12px rgba(255,255,255,0.15)'
            el.style.transform = 'translateY(0) scale(1)'
          }}
        >
          {isRunning ? (
            <>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" opacity="0.75" />
              </svg>
              Running
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 10 12" fill="currentColor">
                <path d="M0 0L10 6L0 12V0Z" />
              </svg>
              Run Workflow
            </>
          )}
        </button>
      </div>

      {/* Inline keyframes for pulse and spin animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
