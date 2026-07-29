import { useExecution } from '../../hooks/useExecution'
import { useFlowStore } from '../../store/flowStore'
import { saveWorkflow, createWorkflow, fetchWorkflows } from '../../services/workflowService'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Home,
  Folder,
  ChevronDown,
  Search,
  CircleDot,
  RotateCcw,
  Save,
  Clock,
  Terminal,
  Zap,
  Play,
  Check,
  AlertCircle,
  Loader2,
  Command,
} from 'lucide-react'

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
  const [workflows, setWorkflows] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (workspace) {
      fetchWorkflows().then(wfs => {
        setWorkflows(wfs.filter((w: any) => w.workspace === workspace))
      }).catch(console.error)
    }
  }, [workspace])

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
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('Save failed', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [workflowId, workflowName, workspace, nodes, edges, setWorkflowMeta])

  useEffect(() => {
    latestSaveRef.current = handleSave
  }, [handleSave])

  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    if (!workflowId || isRunning) return

    const timer = setTimeout(() => {
      latestSaveRef.current()
    }, 5000)

    return () => clearTimeout(timer)
  }, [nodes, edges, workflowId, isRunning])

  const activeWfName = workflows.find(w => w._id === workflowId)?.name || workflowName || 'Untitled Workflow'

  return (
    <header className="h-[52px] w-full bg-[#0B0C0E] border-b border-white/[0.08] flex items-center justify-between px-4 shrink-0 z-30 gap-3 select-none font-sans">
      {/* ── Left Section: Dashboard Home + Premium Workspace Breadcrumb ── */}
      <div className="flex items-center gap-2.5 min-w-0 shrink">
        {/* Home / Dashboard Link */}
        <button
          type="button"
          onClick={onHome}
          title="Return to Dashboard"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] hover:border-white/20 text-[#93959D] hover:text-white transition-all duration-150 shrink-0 cursor-pointer"
        >
          <Home size={14} className="text-[#3ECF8E]" />
          <span className="text-xs font-medium hidden sm:inline">Dashboard</span>
        </button>

        <div className="w-px h-4 bg-white/10 shrink-0" />

        {/* Workspace & Workflow Breadcrumb Dropdown */}
        <div ref={dropdownRef} className="relative min-w-0">
          <button
            type="button"
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-150 max-w-[260px] sm:max-w-[380px] cursor-pointer"
          >
            <div className="flex items-center gap-1.5 shrink-0 text-[#93959D]">
              <Folder size={13} className="text-[#3ECF8E]" />
              <span className="text-[11px] font-mono font-medium text-[#93959D] truncate max-w-[100px]">
                {workspace || 'My Workspace'}
              </span>
            </div>

            <span className="text-[#5A5C64] font-mono text-xs font-light shrink-0">/</span>

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[13px] font-semibold text-white truncate tracking-tight">
                {activeWfName}
              </span>
              <ChevronDown size={12} className={`text-[#5A5C64] transition-transform duration-200 shrink-0 ${showDropdown ? 'rotate-180 text-[#3ECF8E]' : ''}`} />
            </div>
          </button>

          {/* Workflow Picker Dropdown */}
          {showDropdown && (
            <div className="absolute top-[calc(100%+6px)] left-0 w-64 bg-[#131417] border border-white/10 rounded-xl p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.6)] z-50">
              <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-widest text-[#5A5C64] border-b border-white/[0.06] mb-1">
                Workflows in {workspace}
              </div>

              <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-0.5">
                {workflows.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-[#93959D] italic">
                    {activeWfName} (Current)
                  </div>
                ) : (
                  workflows.map((w) => {
                    const isActive = w._id === workflowId
                    return (
                      <button
                        key={w._id}
                        type="button"
                        onClick={() => {
                          setShowDropdown(false)
                          if (w._id !== workflowId) {
                            window.location.href = `/canvas/${w._id}`
                          }
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#3ECF8E]/10 text-[#3ECF8E] font-medium'
                            : 'text-[#C9CBD1] hover:bg-white/[0.05] hover:text-white'
                        }`}
                      >
                        <span className="truncate">{w.name}</span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] shrink-0" />}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Command Palette Button */}
        <button
          type="button"
          onClick={onPaletteClick}
          className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] text-[#5A5C64] hover:text-white transition-all text-xs font-mono shrink-0 cursor-pointer"
        >
          <Search size={12} className="text-[#93959D]" />
          <span className="text-[11px] text-[#93959D]">Search</span>
          <span className="flex items-center gap-0.5 text-[9px] text-[#5A5C64] bg-white/[0.04] border border-white/10 rounded px-1.5 py-0.5">
            <Command size={9} /> K
          </span>
        </button>
      </div>

      {/* ── Center Section: Live Status & Telemetry Badge ── */}
      <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.07] shrink-0 text-[11px] font-mono">
        <div className="flex items-center gap-1.5">
          <CircleDot size={10} className={isRunning ? 'text-[#8B7CF6] animate-pulse' : 'text-[#3ECF8E]'} />
          <span className={`font-semibold tracking-wider ${isRunning ? 'text-[#8B7CF6]' : 'text-[#3ECF8E]'}`}>
            {isRunning ? 'RUNNING' : 'IDLE'}
          </span>
        </div>

        <div className="w-px h-3 bg-white/10" />

        <span className="text-[#93959D]">
          {nodes?.length ?? 0} nodes · {edges?.length ?? 0} edges
        </span>

        <div className="w-px h-3 bg-white/10" />

        <div className="flex items-center gap-1">
          <span className={`font-bold ${remaining < 10 ? 'text-[#E24B4A]' : 'text-[#3ECF8E]'}`}>
            {remaining}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-[#5A5C64]">Credits</span>
        </div>
      </div>

      {/* ── Right Section: Action Controls & Primary Run CTA ── */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Reset */}
        <button
          type="button"
          onClick={resetWorkflow}
          disabled={isRunning}
          title="Reset Execution State"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] hover:border-white/20 text-[#93959D] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <RotateCcw size={13} />
          <span className="hidden xl:inline">Reset</span>
        </button>

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          title="Save Workflow"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            saveStatus === 'saved'
              ? 'bg-[#3ECF8E]/10 border-[#3ECF8E]/30 text-[#3ECF8E]'
              : saveStatus === 'error'
              ? 'bg-[#E24B4A]/10 border-[#E24B4A]/30 text-[#E24B4A]'
              : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20 text-[#93959D] hover:text-white'
          }`}
        >
          {saveStatus === 'saving' ? (
            <Loader2 size={13} className="animate-spin text-[#3ECF8E]" />
          ) : saveStatus === 'saved' ? (
            <Check size={13} />
          ) : saveStatus === 'error' ? (
            <AlertCircle size={13} />
          ) : (
            <Save size={13} />
          )}
          <span className="hidden xl:inline">
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error' : 'Save'}
          </span>
        </button>

        {/* History */}
        <button
          type="button"
          onClick={onHistoryClick}
          title="Execution History"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] hover:border-white/20 text-[#93959D] hover:text-white transition-all cursor-pointer"
        >
          <Clock size={13} />
          <span className="hidden xl:inline">History</span>
        </button>

        {/* Console Log */}
        <button
          type="button"
          onClick={onLogClick}
          title="Console Execution Logs"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            logOpen
              ? 'bg-[#3ECF8E]/10 border-[#3ECF8E]/40 text-[#3ECF8E]'
              : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20 text-[#93959D] hover:text-white'
          }`}
        >
          <Terminal size={13} />
          <span className="hidden xl:inline">Console</span>
        </button>

        {/* Load Test / Benchmark */}
        <button
          type="button"
          onClick={onBenchmarkClick}
          title="Load Test Benchmark"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] hover:border-white/20 text-[#93959D] hover:text-white transition-all cursor-pointer"
        >
          <Zap size={13} className="text-[#3ECF8E]" />
          <span className="hidden xl:inline">Benchmark</span>
        </button>

        <div className="w-px h-4 bg-white/10 mx-0.5" />

        {/* Primary Run Workflow Button */}
        <button
          type="button"
          onClick={runWorkflow}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3ECF8E] text-[#06110C] hover:bg-[#5BDA9F] font-semibold text-xs transition-all active:scale-[0.97] shadow-none hover:shadow-[0_0_0_1px_rgba(62,207,142,0.4),0_8px_20px_-4px_rgba(62,207,142,0.5)] disabled:opacity-60 disabled:cursor-not-allowed shrink-0 cursor-pointer"
        >
          {isRunning ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Play size={12} className="fill-current" />
          )}
          <span>{isRunning ? 'Running…' : 'Run Workflow'}</span>
        </button>
      </div>
    </header>
  )
}
