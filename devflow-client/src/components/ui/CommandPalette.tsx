import { useEffect, useState, useRef, useCallback } from 'react'
import { useFlowStore } from '../../store/flowStore'
import { useExecution } from '../../hooks/useExecution'

type Command = {
  id: string
  label: string
  description: string
  shortcut?: string
  action: () => void
  icon: string
}

type Props = {
  onClose: () => void
  onHistoryClick: () => void
  onLogClick: () => void
}

export default function CommandPalette({ onClose, onHistoryClick, onLogClick }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { addNode, exportWorkflow, importWorkflow } = useFlowStore()
  const { runWorkflow, resetWorkflow } = useExecution()

  const commands: Command[] = [
    {
      id: 'run',
      label: 'Run Workflow',
      description: 'Execute all nodes in order',
      shortcut: 'Ctrl+R',
      icon: 'M5 3l14 9-14 9V3z',
      action: () => { runWorkflow(); onClose() },
    },
    {
      id: 'reset',
      label: 'Reset Workflow',
      description: 'Clear all node results',
      shortcut: 'Ctrl+Q',
      icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      action: () => { resetWorkflow(); onClose() },
    },
    {
      id: 'history',
      label: 'View History',
      description: 'See past execution runs',
      shortcut: 'Ctrl+H',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      action: () => { onHistoryClick(); onClose() },
    },
    {
      id: 'log',
      label: 'Toggle Console',
      description: 'Show/hide execution log',
      shortcut: 'Ctrl+L',
      icon: 'M4 6h16M4 12h16M4 18h16',
      action: () => { onLogClick(); onClose() },
    },
    {
      id: 'add-get',
      label: 'Add GET Node',
      description: 'Add a new GET request node',
      shortcut: 'Ctrl+G',
      icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      action: () => {
        addNode('GET', { x: 300, y: 200 })
        onClose()
      },
    },
    {
      id: 'add-post',
      label: 'Add POST Node',
      description: 'Add a new POST request node',
      shortcut: 'Ctrl+P',
      icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      action: () => {
        addNode('POST', { x: 300, y: 200 })
        onClose()
      },
    },
    {
      id: 'export',
      label: 'Export JSON',
      description: 'Download workflow as JSON',
      shortcut: 'Ctrl+S',
      icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
      action: () => {
        const json = exportWorkflow()
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'workflow.json'
        a.click()
        URL.revokeObjectURL(url)
        onClose()
      },
    },
    {
      id: 'clear',
      label: 'Clear Canvas',
      description: 'Remove all nodes and edges',
      shortcut: 'Ctrl+Shift+X',
      icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      action: () => {
        importWorkflow(JSON.stringify({ name: 'New Workflow', nodes: [], edges: [] }))
        onClose()
      },
    },
  ]

  const filtered = commands.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.description.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setSelected(0)
  }, [query])

  // Global shortcut handler
  const handleGlobalKeys = useCallback((e: KeyboardEvent) => {
    if (!e.ctrlKey) return

    const key = e.key.toLowerCase()
    const shift = e.shiftKey

    if (key === 'r') { e.preventDefault(); commands.find(c => c.id === 'run')?.action() }
    if (key === 'q') { e.preventDefault(); commands.find(c => c.id === 'reset')?.action() }
    if (key === 'h') { e.preventDefault(); commands.find(c => c.id === 'history')?.action() }
    if (key === 'l') { e.preventDefault(); commands.find(c => c.id === 'log')?.action() }
    if (key === 'g') { e.preventDefault(); commands.find(c => c.id === 'add-get')?.action() }
    if (key === 'p') { e.preventDefault(); commands.find(c => c.id === 'add-post')?.action() }
    if (key === 's') { e.preventDefault(); commands.find(c => c.id === 'export')?.action() }
    if (key === 'x' && shift) { e.preventDefault(); commands.find(c => c.id === 'clear')?.action() }
  }, [commands])

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeys)
    return () => window.removeEventListener('keydown', handleGlobalKeys)
  }, [handleGlobalKeys])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, filtered.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    }
    if (e.key === 'Enter' && filtered[selected]) {
      filtered[selected].action()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="absolute inset-0 z-[100] flex items-start justify-center pt-[15vh] overflow-hidden">
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(6px)',
        }}
        onClick={onClose}
      />

      {/* Palette Container */}
      <div 
        style={{
          width: '600px',
          background: 'rgba(12, 12, 12, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          animation: 'paletteIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Search Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or use shortcuts..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '16px',
            }}
          />
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', fontWeight: 600 }}>ESC</span>
          </div>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '12px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
              <p style={{ fontSize: '14px' }}>No commands matching "{query}"</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filtered.map((cmd, i) => {
                const isActive = selected === i
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelected(i)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: isActive ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                      border: '1px solid',
                      borderColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                  >
                    <div 
                      style={{ 
                        width: '36px', height: '36px', borderRadius: '10px', 
                        background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.03)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.4)'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={cmd.icon}/>
                      </svg>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: isActive ? '#fff' : 'rgba(255,255,255,0.8)' }}>{cmd.label}</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{cmd.description}</p>
                    </div>

                    {cmd.shortcut && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <span style={{ fontSize: '10px', color: isActive ? '#fff' : 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', fontWeight: 700 }}>
                          {cmd.shortcut}
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
               <span style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>Navigate</span>
               <div style={{ display: 'flex', gap: '2px' }}>
                 <kbd style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '2px 4px', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>↑</kbd>
                 <kbd style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '2px 4px', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>↓</kbd>
               </div>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
               <span style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>Select</span>
               <kbd style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>↵</kbd>
             </div>
          </div>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>
            {filtered.length} commands
          </span>
        </div>
      </div>
      <style>{`
        @keyframes paletteIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}