import { useEffect, useRef, useState } from 'react'
import { getSocket } from '../../services/socketService'

type LogEntry = {
  id: string
  timestamp: string
  nodeLabel?: string
  type: 'info' | 'success' | 'error' | 'start' | 'complete' | 'retry' | 'cache'
  message: string
  duration?: number
}

type Props = {
  isOpen: boolean
  onClose: () => void
}

export default function ExecutionLog({ isOpen, onClose }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs((prev) => [
      ...prev,
      {
        ...entry,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      },
    ].slice(-50)) // Keep last 50 logs for performance
  }

  useEffect(() => {
    const socket = getSocket()

    socket.on('execution_start', () => {
      setIsRunning(true)
      setLogs([])
      addLog({ type: 'start', message: 'Workflow initialized' })
    })

    socket.on('node_update', (data: any) => {
      if (data.status === 'running') {
        addLog({
          type: data.retryCount ? 'retry' : 'info',
          message: data.retryCount ? `Retrying... (Attempt ${data.retryCount + 1})` : `Executing...`,
          nodeLabel: data.nodeLabel || data.nodeId,
        })
      }

      if (data.status === 'success') {
        addLog({
          type: data.fromCache ? 'cache' : 'success',
          message: data.fromCache ? `Result served from cache` : `Completed successfully`,
          nodeLabel: data.nodeLabel || data.nodeId,
          duration: data.executionTime,
        })
      }

      if (data.status === 'error') {
        addLog({
          type: 'error',
          message: data.error ?? 'Execution failed',
          nodeLabel: data.nodeLabel || data.nodeId,
          duration: data.executionTime,
        })
      }
    })

    socket.on('execution_complete', (data: { totalTime: number; status: string }) => {
      setIsRunning(false)
      addLog({
        type: data.status === 'success' ? 'complete' : 'error',
        message: `Workflow ${data.status} • Total ${data.totalTime}ms`,
      })
    })

    return () => {
      socket.off('execution_start')
      socket.off('node_update')
      socket.off('execution_complete')
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  if (!isOpen) return null

  const config = {
    info:     { color: '#a1a1aa', icon: '○' },
    success:  { color: '#10b981', icon: '✓' },
    error:    { color: '#ef4444', icon: '✗' },
    start:    { color: '#fff',    icon: '▶' },
    complete: { color: '#10b981', icon: '■' },
    retry:    { color: '#f59e0b', icon: '↻' },
    cache:    { color: '#3b82f6', icon: '⚡' },
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        width: '400px',
        height: '320px',
        background: 'rgba(12, 12, 12, 0.8)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        animation: 'slideIn 0.3s ease-out',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isRunning ? '#60a5fa' : '#3f3f46',
              boxShadow: isRunning ? '0 0 10px #60a5fa' : 'none',
              animation: isRunning ? 'pulse 2s infinite' : 'none',
            }}
          />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Console Output
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setLogs([])}
            style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.3)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
          >
            Clear
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.5)',
              padding: '4px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Logs */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: '11px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          scrollbarWidth: 'none',
        }}
      >
        {logs.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
            No output detected. Execute a node to see results...
          </div>
        )}
        {logs.map((log) => {
          const c = config[log.type] || config.info
          return (
            <div key={log.id} style={{ display: 'flex', gap: '12px', opacity: 0, animation: 'fadeIn 0.2s forwards' }}>
              <span style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0, width: '45px' }}>{log.timestamp}</span>
              <span style={{ color: c.color, flexShrink: 0 }}>{c.icon}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
                {log.nodeLabel && (
                  <span style={{
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '9px',
                    fontWeight: 600,
                  }}>
                    {log.nodeLabel}
                  </span>
                )}
                <span style={{ color: log.type === 'error' ? '#ef4444' : 'rgba(255,255,255,0.8)', lineBreak: 'anywhere' }}>
                  {log.message}
                </span>
                {log.duration !== undefined && (
                  <span style={{ color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>{log.duration}ms</span>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(96, 165, 250, 0); }
          100% { box-shadow: 0 0 0 0 rgba(96, 165, 250, 0); }
        }
      `}</style>
    </div>
  )
}