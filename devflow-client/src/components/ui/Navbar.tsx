import { useExecution } from '../../hooks/useExecution'
import { useFlowStore } from '../../store/flowStore'
import { saveWorkflow, createWorkflow } from '../../services/workflowService'
import { useState, useEffect, useRef, useCallback } from 'react'

export default function Navbar({ onHome }: { onHome?: () => void }) {
  const { runWorkflow, resetWorkflow, remaining } = useExecution()
  const { nodes, edges, workflowId, workflowName, workspace, setWorkflowMeta } = useFlowStore()
  const isRunning = nodes.some((n) => n.data.status === 'running')
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
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 0 1px rgba(99,102,241,0.4), 0 4px 12px rgba(99,102,241,0.25)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h10M4 18h7" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="19" cy="18" r="3" fill="white" fillOpacity="0.9" />
            </svg>
          </div>

          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.92)',
              letterSpacing: '-0.01em',
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
      </div>

      {/* ── Center: graph stats ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '6px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isRunning ? '#60a5fa' : '#4ade80',
            boxShadow: isRunning
              ? '0 0 6px rgba(96,165,250,0.7)'
              : '0 0 6px rgba(74,222,128,0.7)',
            flexShrink: 0,
            animation: isRunning ? 'pulse 1.5s ease-in-out infinite' : 'none',
          }}
        />
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
          {isRunning ? 'Running...' : `${nodes.length} nodes · ${edges.length} edges`}
          {' · '}
          {remaining} remaining
        </span>
      </div>

      {/* ── Right: actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Reset button */}
        <button
          onClick={resetWorkflow}
          disabled={isRunning}
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: isRunning ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.45)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            padding: '5px 12px',
            borderRadius: '6px',
            transition: 'all 0.15s ease',
            opacity: isRunning ? 0.4 : 1,
          }}
          onMouseEnter={(e) => {
            if (isRunning) return
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.08)'
            el.style.borderColor = 'rgba(255,255,255,0.12)'
            el.style.color = 'rgba(255,255,255,0.9)'
          }}
          onMouseLeave={(e) => {
            if (isRunning) return
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.03)'
            el.style.borderColor = 'rgba(255,255,255,0.06)'
            el.style.color = 'rgba(255,255,255,0.45)'
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
            color: saveStatus === 'saved'
              ? '#4ade80'
              : saveStatus === 'error'
              ? '#f87171'
              : saveStatus === 'saving'
              ? 'rgba(255,255,255,0.2)'
              : 'rgba(255,255,255,0.45)',
            background: saveStatus === 'saved'
              ? 'rgba(74,222,128,0.08)'
              : saveStatus === 'error'
              ? 'rgba(248,113,113,0.08)'
              : 'rgba(255,255,255,0.03)',
            border: saveStatus === 'saved'
              ? '1px solid rgba(74,222,128,0.25)'
              : saveStatus === 'error'
              ? '1px solid rgba(248,113,113,0.25)'
              : '1px solid rgba(255,255,255,0.06)',
            cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
            padding: '5px 12px',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            opacity: saveStatus === 'saving' ? 0.4 : 1,
          }}
          onMouseEnter={(e) => {
            if (saveStatus === 'saving') return
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.08)'
            el.style.borderColor = 'rgba(255,255,255,0.12)'
            el.style.color = 'rgba(255,255,255,0.9)'
          }}
          onMouseLeave={(e) => {
            if (saveStatus === 'saving') return
            const el = e.currentTarget as HTMLElement
            el.style.background = saveStatus === 'saved' ? 'rgba(74,222,128,0.08)' : saveStatus === 'error' ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.03)'
            el.style.borderColor = saveStatus === 'saved' ? 'rgba(74,222,128,0.25)' : saveStatus === 'error' ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.06)'
            el.style.color = saveStatus === 'saved' ? '#4ade80' : saveStatus === 'error' ? '#f87171' : 'rgba(255,255,255,0.45)'
          }}
        >
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? '✕ Failed' : 'Save'}
        </button>

        {/* History button */}
        <button
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.45)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            padding: '5px 12px',
            borderRadius: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.08)'
            el.style.borderColor = 'rgba(255,255,255,0.12)'
            el.style.color = 'rgba(255,255,255,0.9)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.03)'
            el.style.borderColor = 'rgba(255,255,255,0.06)'
            el.style.color = 'rgba(255,255,255,0.45)'
          }}
        >
          History
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
