import { useEffect, useRef, useState } from 'react'
import { getSocket } from '../../services/socketService'
import {
  Terminal,
  X,
  Trash2,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Zap,
  CircleDot,
  Info,
} from 'lucide-react'

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
    ].slice(-60))
  }

  useEffect(() => {
    const socket = getSocket()

    socket.on('execution_start', () => {
      setIsRunning(true)
      setLogs([])
      addLog({ type: 'start', message: 'Workflow execution initialized' })
    })

    socket.on('node_update', (data: any) => {
      if (data.status === 'running') {
        addLog({
          type: data.retryCount ? 'retry' : 'info',
          message: data.retryCount ? `Retrying node (Attempt ${data.retryCount + 1})` : `Executing node...`,
          nodeLabel: data.nodeLabel || data.nodeId,
        })
      }

      if (data.status === 'success') {
        addLog({
          type: data.fromCache ? 'cache' : 'success',
          message: data.fromCache ? `Response served from Redis cache` : `Node executed successfully`,
          nodeLabel: data.nodeLabel || data.nodeId,
          duration: data.executionTime,
        })
      }

      if (data.status === 'error') {
        addLog({
          type: 'error',
          message: data.error ?? 'Node execution failed',
          nodeLabel: data.nodeLabel || data.nodeId,
          duration: data.executionTime,
        })
      }
    })

    socket.on('execution_complete', (data: { totalTime: number; status: string }) => {
      setIsRunning(false)
      addLog({
        type: data.status === 'success' ? 'complete' : 'error',
        message: `Graph execution ${data.status} • Total duration ${data.totalTime}ms`,
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

  return (
    <div className="absolute bottom-5 right-5 w-[420px] max-h-[380px] h-[360px] bg-[#0E0F12]/95 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col z-50 shadow-[0_24px_60px_rgba(0,0,0,0.8)] overflow-hidden font-sans select-none animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <Terminal size={14} className="text-[#3ECF8E]" />
          <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
            Console Output
          </span>
          <div className="flex items-center gap-1.5 ml-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-mono text-[#93959D]">
            <CircleDot size={9} className={isRunning ? 'text-[#8B7CF6] animate-pulse' : 'text-[#3ECF8E]'} />
            <span>{isRunning ? 'RUNNING' : `${logs.length} logs`}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setLogs([])}
            title="Clear logs"
            className="p-1.5 rounded-lg text-[#5A5C64] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close console"
            className="p-1.5 rounded-lg text-[#5A5C64] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Logs Viewport */}
      <div className="flex-1 p-3.5 overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-2 leading-relaxed">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-[#5A5C64] py-8">
            <Terminal size={24} className="mb-2 opacity-30 text-[#3ECF8E]" />
            <p className="text-xs font-medium text-[#93959D]">No console output yet</p>
            <p className="text-[10px] mt-1 text-[#5A5C64]">Execute a workflow or node to stream live logs</p>
          </div>
        ) : (
          logs.map((log) => {
            const isError = log.type === 'error'
            const isSuccess = log.type === 'success' || log.type === 'complete'
            const isCache = log.type === 'cache'
            const isStart = log.type === 'start'
            const isRetry = log.type === 'retry'

            return (
              <div
                key={log.id}
                className="flex items-start gap-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/10 transition-colors"
              >
                <span className="text-[10px] text-[#5A5C64] shrink-0 pt-0.5">{log.timestamp}</span>

                <div className="shrink-0 pt-0.5">
                  {isSuccess && <CheckCircle2 size={12} className="text-[#3ECF8E]" />}
                  {isCache && <Zap size={12} className="text-[#3ECF8E]" />}
                  {isError && <XCircle size={12} className="text-[#E24B4A]" />}
                  {isStart && <Play size={12} className="text-[#8B7CF6] fill-current" />}
                  {isRetry && <RotateCcw size={12} className="text-[#EF9F27]" />}
                  {!isSuccess && !isCache && !isError && !isStart && !isRetry && (
                    <Info size={12} className="text-[#93959D]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {log.nodeLabel && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 text-[#3ECF8E]">
                        {log.nodeLabel}
                      </span>
                    )}
                    <span
                      className={`break-words ${
                        isError
                          ? 'text-[#E24B4A]'
                          : isSuccess || isCache
                          ? 'text-[#F2F3F5]'
                          : 'text-[#93959D]'
                      }`}
                    >
                      {log.message}
                    </span>
                    {log.duration !== undefined && (
                      <span className="ml-auto text-[10px] text-[#5A5C64]">{log.duration}ms</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}