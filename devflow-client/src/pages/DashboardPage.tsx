import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import type { FlowWorkflow } from '../types'
import Footer from '../components/ui/Footer'

type Props = { onOpenWorkflow: (id: string, name: string, workspace: string, nodes: any[], edges: any[]) => void }

const getHour = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const uniqueNames = (names: string[]) =>
  Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)))

type WorkspaceEntry = { id: string; name: string }

function dedupeWorkspaceEntries(rows: WorkspaceEntry[]): WorkspaceEntry[] {
  const m = new Map<string, WorkspaceEntry>()
  for (const r of rows) {
    if (r.id && r.name) m.set(r.id, { id: r.id, name: r.name })
  }
  return Array.from(m.values())
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

@keyframes spin { to { transform: rotate(360deg) } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@keyframes drift-a {
  0%, 100% { transform: translate(0%, 0%) scale(1); }
  50% { transform: translate(4%, -3%) scale(1.05); }
}
@keyframes drift-b {
  0%, 100% { transform: translate(0%, 0%) scale(1); }
  50% { transform: translate(-4%, 3%) scale(1.05); }
}

.db-shell {
  min-height: 100vh;
  background: #0B0C0E;
  color: #F2F3F5;
  font-family: 'Inter', system-ui, sans-serif;
  position: relative;
  overflow-x: hidden;
}

.db-bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.db-bg-dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px);
  background-size: 26px 26px;
  mask-image: radial-gradient(ellipse 80% 55% at 50% 0%, black 30%, transparent 85%);
  -webkit-mask-image: radial-gradient(ellipse 80% 55% at 50% 0%, black 30%, transparent 85%);
  opacity: 0.6;
}

.db-bg-orb--a {
  position: absolute;
  width: min(50vw, 640px);
  height: min(50vw, 640px);
  top: -18%;
  left: -8%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(62,207,142,0.08) 0%, transparent 70%);
  filter: blur(60px);
  animation: drift-a 30s ease-in-out infinite;
}

.db-bg-orb--b {
  position: absolute;
  width: min(42vw, 560px);
  height: min(42vw, 560px);
  bottom: -14%;
  right: -10%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139,124,246,0.06) 0%, transparent 70%);
  filter: blur(60px);
  animation: drift-b 34s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .db-bg-orb--a, .db-bg-orb--b { animation: none; }
}

.db-topbar-wrap {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding: 16px 16px 0;
}

.db-topbar {
  width: 100%;
  max-width: 1320px;
  height: 60px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(11,12,14,0.72);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 0 16px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.45);
}

.db-topbar-inner {
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(0, 1fr) minmax(0, auto);
  align-items: center;
  width: 100%;
  min-width: 0;
  gap: 12px 16px;
}

.db-topbar-links {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 2px;
  min-width: 0;
}

.db-nav-link {
  color: #93959D;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  padding: 8px 14px;
  border-radius: 999px;
  white-space: nowrap;
  transition: color 0.16s ease, background 0.16s ease;
}

.db-nav-link:hover {
  color: #F2F3F5;
  background: rgba(255,255,255,0.06);
}

.db-brand {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #131417;
  border: 1px solid rgba(255,255,255,0.1);
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;
  flex: 0 0 auto;
}

.db-brand::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 20%, rgba(62,207,142,0.25) 0%, transparent 65%);
}

.db-user {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 999px;
  padding: 4px 6px 4px 4px;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.03);
}

.db-avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: rgba(62,207,142,0.14);
  border: 1px solid rgba(62,207,142,0.3);
  color: #3ECF8E;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  flex: 0 0 auto;
}

.db-btn {
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: #C9CBD1;
  border-radius: 999px;
  padding: 9px 15px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.16s ease;
  white-space: nowrap;
}

.db-btn:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.2);
  color: #ffffff;
}

.db-btn-primary {
  background: #3ECF8E;
  border-color: #3ECF8E;
  color: #06110C;
  box-shadow: 0 0 0 1px rgba(62,207,142,0.3), 0 8px 22px -8px rgba(62,207,142,0.5);
}

.db-btn-primary:hover:not(:disabled) {
  background: #5BDA9F;
  border-color: #5BDA9F;
  color: #06110C;
}

.db-btn-danger {
  border-color: rgba(226,75,74,0.35);
  color: #F09595;
}

.db-btn-danger:hover {
  background: rgba(226,75,74,0.1);
  border-color: rgba(226,75,74,0.5);
  color: #F7C1C1;
}

.db-page {
  max-width: 1320px;
  margin: 0 auto;
  padding: 56px 24px 80px;
  animation: fadeUp 0.4s ease;
  position: relative;
  z-index: 5;
}

.db-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #3ECF8E;
}

.db-eyebrow-dot {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: #3ECF8E;
}

.db-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: end;
  margin-bottom: 40px;
}

.db-title {
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 42px;
  line-height: 1.08;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 10px 0 12px;
  color: #F2F3F5;
}

.db-hero-lead {
  max-width: 620px;
  font-size: 15.5px;
  line-height: 1.7;
  color: #93959D;
}

.db-muted { color: #5A5C64; }
.db-soft { color: #93959D; }

.db-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.db-stat {
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.07);
  background: #0E0F12;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: border-color 0.2s ease;
}

.db-stat:hover {
  border-color: rgba(62,207,142,0.25);
}

.db-stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.03);
  color: #3ECF8E;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.db-stat-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.1;
  color: #F2F3F5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.db-stat-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5A5C64;
  margin-top: 4px;
}

.db-grid {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
  height: clamp(460px, calc(100svh - 300px), 860px);
}

.db-panel {
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.07);
  background: #0E0F12;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.db-panel-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
}

.db-panel-header {
  min-height: 58px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.db-panel-title {
  font-size: 13px;
  font-weight: 700;
  color: #F2F3F5;
}

.db-panel-sub {
  font-size: 11px;
  color: #5A5C64;
  margin-top: 2px;
}

.db-input-wrap {
  position: relative;
  padding: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.db-input {
  width: 100%;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  color: #F2F3F5;
  border-radius: 10px;
  outline: none;
  font: inherit;
  font-size: 13px;
  padding: 10px 12px 10px 36px;
  transition: all 0.16s ease;
  box-sizing: border-box;
}

.db-input::placeholder { color: #5A5C64; }
.db-input:focus {
  background: rgba(62,207,142,0.05);
  border-color: rgba(62,207,142,0.5);
  box-shadow: 0 0 0 3px rgba(62,207,142,0.1);
}

.db-workspace-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
}

.db-workspace-row {
  width: 100%;
  border-radius: 12px;
  padding: 4px 6px 4px 8px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  border: 1px solid transparent;
  transition: all 0.16s ease;
}

.db-workspace-row:hover {
  background: rgba(255,255,255,0.03);
}

.db-workspace-row.is-active {
  background: rgba(62,207,142,0.08);
  border-color: rgba(62,207,142,0.25);
}

.db-workspace-select {
  min-width: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  padding: 9px 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.db-workspace-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: #93959D;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  flex: 0 0 auto;
}

.db-workspace-row.is-active .db-workspace-icon {
  color: #3ECF8E;
  background: rgba(62,207,142,0.1);
  border-color: rgba(62,207,142,0.3);
}

.db-workspace-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.db-count {
  min-width: 24px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  display: grid;
  place-items: center;
  color: #5A5C64;
  font-size: 11px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}

.db-workspace-row.is-active .db-count {
  color: #3ECF8E;
  border-color: rgba(62,207,142,0.3);
  background: rgba(62,207,142,0.1);
}

.db-main-head {
  padding: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
}

.db-folder {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(62,207,142,0.25);
  background: rgba(62,207,142,0.08);
  color: #3ECF8E;
  flex: 0 0 auto;
}

.db-workflow-list {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.db-workflow-row {
  border-radius: 12px;
  padding: 12px 14px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  border: 1px solid transparent;
  transition: all 0.16s ease;
}

.db-workflow-row:hover {
  background: rgba(255,255,255,0.03);
  border-color: rgba(255,255,255,0.09);
}

.db-row-open {
  min-width: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  padding: 0;
  text-align: left;
  cursor: pointer;
}

.db-action {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.03);
  color: #93959D;
  cursor: pointer;
  display: inline-grid;
  place-items: center;
  transition: all 0.16s ease;
}

.db-action:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.16);
  color: #F2F3F5;
}

.db-empty {
  margin: 10px;
  border-radius: 14px;
  padding: 44px 18px;
  text-align: center;
  background: rgba(255,255,255,0.015);
  border: 1px dashed rgba(255,255,255,0.08);
}

.db-modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 20px;
}

.db-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.72);
  backdrop-filter: blur(8px);
}

.db-modal-panel {
  position: relative;
  width: min(100%, 420px);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.1);
  background: #131417;
  box-shadow: 0 32px 80px rgba(0,0,0,0.6);
  padding: 24px;
}

.db-modal-title {
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 19px;
  font-weight: 700;
  margin: 0 0 6px;
  color: #F2F3F5;
}

@media (max-width: 860px) {
  .db-topbar { padding: 0 8px 0 12px; }
  .db-user-text { display: none; }
  .db-topbar-inner {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .db-topbar-inner > div:first-of-type { order: 1; }
  .db-topbar-links {
    order: 2;
    grid-column: 1 / -1;
    justify-content: flex-start;
    display: none;
  }
  .db-topbar-inner > div:last-of-type {
    order: 3;
    justify-self: end;
    width: 100%;
    justify-content: flex-end;
  }
  .db-hero, .db-main-head { grid-template-columns: 1fr; }
  .db-title { font-size: 32px; }
  .db-stats { grid-template-columns: 1fr; }
  .db-grid {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 0;
  }
  .db-panel {
    height: clamp(400px, 56vh, 600px);
    min-height: clamp(400px, 56vh, 600px);
  }
}
`

export default function DashboardPage({ onOpenWorkflow }: Props) {
  const { user, clearAuth } = useAuthStore()
  const [workflows, setWorkflows] = useState<FlowWorkflow[]>([])
  const [workspaceEntries, setWorkspaceEntries] = useState<WorkspaceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newWsName, setNewWsName] = useState('')
  const [renameModal, setRenameModal] = useState<null | { id: string; name: string }>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [deleteModal, setDeleteModal] = useState<null | { id: string; name: string }>(null)
  const [selectedWs, setSelectedWs] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const ensureWorkspaceId = useCallback(async (name: string): Promise<string | null> => {
    const n = name.trim()
    if (!n) return null
    const existing = workspaceEntries.find(e => e.name === n)
    if (existing) return existing.id
    try {
      const res = await api.post('/workflows/workspaces', { name: n })
      const w = res.data.workspace
      const id = String(w?._id ?? w?.id ?? '')
      const nm = typeof w?.name === 'string' ? w.name.trim() : n
      if (!id) return null
      setWorkspaceEntries(prev => dedupeWorkspaceEntries([...prev, { id, name: nm }]))
      return id
    } catch {
      return null
    }
  }, [workspaceEntries])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const workflowRes = await api.get('/workflows')
      setWorkflows(workflowRes.data.workflows.map(normalizeWorkflow))

      const workspaceRes = await api.get('/workflows/workspaces')
      const rows = (workspaceRes.data.workspaces as any[]).map((w) => ({
        id: String(w._id ?? w.id ?? ''),
        name: String(w.name ?? '').trim(),
      })).filter((e): e is WorkspaceEntry => Boolean(e.id && e.name))
      setWorkspaceEntries(dedupeWorkspaceEntries(rows))
    } catch {
      /* keep the current dashboard state if the request fails */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const createWorkflow = async (ws: string) => {
    try {
      const res = await api.post('/workflows', { name: 'New Workflow', workspace: ws })
      const wf = normalizeWorkflow(res.data.workflow)
      void ensureWorkspaceId(wf.workspace || 'My Workspace')
      onOpenWorkflow(wf.id, wf.name, wf.workspace || 'My Workspace', wf.nodes, wf.edges)
    } catch {
      /* ignore */
    }
  }

  const handleRenameWorkflow = async (id: string, name: string) => {
    try {
      const res = await api.put(`/workflows/${id}`, { name: name.trim() })
      const updated = normalizeWorkflow(res.data.workflow)
      setWorkflows(prev => prev.map(w => w.id === id ? updated : w))
    } catch {
      /* ignore */
    }
  }

  const handleDeleteWorkflow = async (id: string) => {
    try {
      await api.delete(`/workflows/${id}`)
      setWorkflows(prev => prev.filter(w => w.id !== id))
    } catch {
      /* ignore */
    }
  }

  const handleCreateWs = async () => {
    const name = newWsName.trim()
    if (!name) return

    try {
      const res = await api.post('/workflows/workspaces', { name })
      const w = res.data.workspace
      const workspaceName = (typeof w?.name === 'string' ? w.name.trim() : '') || name
      const id = String(w?._id ?? w?.id ?? '')
      if (id) {
        setWorkspaceEntries(prev => dedupeWorkspaceEntries([...prev, { id, name: workspaceName }]))
      }
      setSelectedWs(workspaceName)
      setNewWsName('')
      setShowModal(false)
    } catch {
      /* ignore */
    }
  }

  const openRenameWorkspace = (ws: string) => {
    void (async () => {
      const id = await ensureWorkspaceId(ws)
      if (!id) return
      setRenameModal({ id, name: ws })
      setRenameDraft(ws)
    })()
  }

  const handleConfirmRenameWorkspace = async () => {
    if (!renameModal) return
    const next = renameDraft.trim()
    if (!next) return
    if (next === renameModal.name) {
      setRenameModal(null)
      return
    }
    try {
      const res = await api.put(`/workflows/workspaces/${renameModal.id}`, { name: next })
      const w = res.data.workspace
      const newName = (typeof w?.name === 'string' ? w.name.trim() : '') || next
      const oldName = renameModal.name
      setWorkspaceEntries(prev => prev.map(e => (e.id === renameModal.id ? { ...e, name: newName } : e)))
      setWorkflows(prev => prev.map(wf => ((wf.workspace || 'My Workspace') === oldName ? { ...wf, workspace: newName } : wf)))
      setSelectedWs(cur => (cur === oldName ? newName : cur))
      setRenameModal(null)
    } catch {
      /* ignore */
    }
  }

  const openDeleteWorkspace = (ws: string) => {
    if (ws === 'My Workspace') return
    void (async () => {
      const id = await ensureWorkspaceId(ws)
      if (!id) return
      setDeleteModal({ id, name: ws })
    })()
  }

  const handleConfirmDeleteWorkspace = async () => {
    if (!deleteModal) return
    try {
      await api.delete(`/workflows/workspaces/${deleteModal.id}`)
      const gone = deleteModal.name
      setWorkspaceEntries(prev => prev.filter(e => e.id !== deleteModal.id))
      setWorkflows(prev => prev.map(wf => ((wf.workspace || 'My Workspace') === gone ? { ...wf, workspace: 'My Workspace' } : wf)))
      setSelectedWs(cur => (cur === gone ? 'My Workspace' : cur))
      setDeleteModal(null)
    } catch {
      /* ignore */
    }
  }

  const workspaces = useMemo(() => {
    return uniqueNames([
      ...workspaceEntries.map(e => e.name),
      ...workflows.map(w => w.workspace || 'My Workspace'),
    ])
  }, [workspaceEntries, workflows])

  const filteredWorkspaces = useMemo(() => {
    if (!search.trim()) return workspaces
    const q = search.toLowerCase()
    return workspaces.filter(ws =>
      ws.toLowerCase().includes(q) ||
      workflows.some(wf => (wf.workspace || 'My Workspace') === ws && wf.name.toLowerCase().includes(q))
    )
  }, [workspaces, workflows, search])

  useEffect(() => {
    if (!filteredWorkspaces.length) {
      setSelectedWs(null)
      return
    }
    if (!selectedWs || !filteredWorkspaces.includes(selectedWs)) {
      setSelectedWs(filteredWorkspaces[0])
    }
  }, [filteredWorkspaces, selectedWs])

  const selectedWorkflows = useMemo(() => {
    if (!selectedWs) return []
    return workflows.filter(w => (w.workspace || 'My Workspace') === selectedWs)
  }, [workflows, selectedWs])

  const firstName = user?.name?.split(' ')[0] || 'User'
  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const recentDate = workflows[0]?.updatedAt ? new Date(workflows[0].updatedAt).toLocaleDateString() : 'No activity'

  return (
    <div className="db-shell">
      <style>{CSS}</style>

      <div className="db-bg-layer" aria-hidden="true">
        <div className="db-bg-dots" />
        <div className="db-bg-orb--a" />
        <div className="db-bg-orb--b" />
      </div>

      <div className="db-topbar-wrap">
        <nav className="db-topbar">
          <div className="db-topbar-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div className="db-brand" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: 'relative' }}>
                  <path d="M12 3L4 9V21L12 15L20 21V9L12 3Z" stroke="#3ECF8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="15" r="1.8" fill="#3ECF8E" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', color: '#F2F3F5', fontFamily: "'Inter Tight', 'Inter', sans-serif" }}>DevFlow</div>
                <div className="db-muted" style={{ fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace" }}>dashboard</div>
              </div>
            </div>

            <div className="db-topbar-links" role="navigation" aria-label="Site pages">
              <Link className="db-nav-link" to="/">Home</Link>
              <Link className="db-nav-link" to="/about">About</Link>
              <Link className="db-nav-link" to="/contact">Contact</Link>
              <Link className="db-nav-link" to="/pricing">Pricing</Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
              <div className="db-user">
                <div className="db-avatar">{initials}</div>
                <div className="db-user-text" style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{firstName}</div>
                  <div className="db-muted" style={{ fontSize: 10.5, maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                </div>
              </div>
              <button className="db-btn" onClick={clearAuth}>Sign out</button>
            </div>
          </div>
        </nav>
      </div>

      <main className="db-page">
        <section className="db-hero">
          <div>
            <span className="db-eyebrow">
              <span className="db-eyebrow-dot" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
              {getHour()}, {firstName}
            </span>
            <h1 className="db-title">Your workflow command center</h1>
            <p className="db-hero-lead">
              Browse workspaces, open active flows, and keep your API automation work organized from one focused view.
            </p>
          </div>

          <button className="db-btn db-btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <PlusIcon />
            Create workspace
          </button>
        </section>

        <section className="db-stats" aria-label="Dashboard summary">
          <Stat icon={<FolderIcon />} label="Workspaces" value={workspaces.length || 0} />
          <Stat icon={<BoltIcon />} label="Workflows" value={workflows.length || 0} />
          <Stat icon={<ClockIcon />} label="Last updated" value={recentDate} />
        </section>

        <section className="db-grid">
          <aside className="db-panel">
            <div className="db-panel-header">
              <div>
                <div className="db-panel-title">Workspaces</div>
                <div className="db-panel-sub">Select a workspace</div>
              </div>
              <button className="db-action" onClick={() => setShowModal(true)} title="Create workspace">
                <PlusIcon />
              </button>
            </div>

            <div className="db-input-wrap">
              <SearchIcon style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: '#5A5C64' }} />
              <input
                className="db-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search workspaces or workflows"
              />
            </div>

            <div className="db-panel-scroll custom-scrollbar">
              {loading ? (
                <LoadingState label="Loading workspaces..." />
              ) : filteredWorkspaces.length === 0 ? (
                <div className="db-empty">
                  <div style={{ fontWeight: 700, marginBottom: 6, color: '#F2F3F5' }}>No workspaces found</div>
                  <div className="db-muted" style={{ fontSize: 13 }}>Create a workspace to start organizing workflows.</div>
                </div>
              ) : (
                <div className="db-workspace-list">
                  {filteredWorkspaces.map(ws => {
                    const count = workflows.filter(w => (w.workspace || 'My Workspace') === ws).length
                    const active = ws === selectedWs
                    const canDelete = ws !== 'My Workspace'
                    return (
                      <div key={ws} className={`db-workspace-row${active ? ' is-active' : ''}`}>
                        <button type="button" className="db-workspace-select" onClick={() => setSelectedWs(ws)}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <span className="db-workspace-icon"><FolderIcon /></span>
                            <span style={{ minWidth: 0 }}>
                              <span style={{ display: 'block', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#F2F3F5' }}>{ws}</span>
                              <span className="db-muted" style={{ display: 'block', fontSize: 11 }}>{count} workflow{count === 1 ? '' : 's'}</span>
                            </span>
                          </span>
                          <span className="db-count">{count}</span>
                        </button>
                        <div className="db-workspace-actions">
                          <button
                            type="button"
                            className="db-action"
                            title="Rename workspace"
                            onClick={(e) => { e.stopPropagation(); openRenameWorkspace(ws) }}
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            className="db-action"
                            title={canDelete ? 'Delete workspace' : 'Default workspace cannot be deleted'}
                            disabled={!canDelete}
                            onClick={(e) => { e.stopPropagation(); if (canDelete) openDeleteWorkspace(ws) }}
                            style={{ opacity: canDelete ? 1 : 0.35, cursor: canDelete ? 'pointer' : 'not-allowed' }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </aside>

          <section className="db-panel">
            <div className="db-main-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                <div className="db-folder">
                  <FolderIcon />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontSize: 20, lineHeight: 1.2, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Inter Tight', 'Inter', sans-serif", color: '#F2F3F5' }}>
                    {selectedWs || 'No workspace selected'}
                  </h2>
                  <div className="db-muted" style={{ fontSize: 12, marginTop: 5 }}>
                    {selectedWorkflows.length} workflow{selectedWorkflows.length === 1 ? '' : 's'} in this workspace
                  </div>
                </div>
              </div>

              <button
                className="db-btn db-btn-primary"
                onClick={() => selectedWs && createWorkflow(selectedWs)}
                disabled={!selectedWs}
                style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: selectedWs ? 1 : 0.45, cursor: selectedWs ? 'pointer' : 'not-allowed' }}
              >
                <PlusIcon />
                New workflow
              </button>
            </div>

            <div className="db-panel-scroll custom-scrollbar">
              {loading ? (
                <LoadingState label="Loading workflows..." />
              ) : selectedWs && selectedWorkflows.length === 0 ? (
                <div className="db-empty">
                  <div className="db-folder" style={{ margin: '0 auto 14px' }}>
                    <BoltIcon />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#F2F3F5' }}>No workflows yet</div>
                  <div className="db-muted" style={{ fontSize: 13, marginBottom: 18 }}>Create the first workflow inside this workspace.</div>
                  <button className="db-btn db-btn-primary" onClick={() => createWorkflow(selectedWs)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <PlusIcon />
                    Create workflow
                  </button>
                </div>
              ) : selectedWs ? (
                <div className="db-workflow-list">
                  {selectedWorkflows.map(wf => (
                    <WorkflowRow
                      key={wf.id}
                      wf={wf}
                      onOpen={() => onOpenWorkflow(wf.id, wf.name, wf.workspace || 'My Workspace', wf.nodes, wf.edges)}
                      onRenameWorkflow={handleRenameWorkflow}
                      onDeleteWorkflow={handleDeleteWorkflow}
                    />
                  ))}
                </div>
              ) : (
                <div className="db-empty">
                  <div style={{ fontWeight: 700, marginBottom: 6, color: '#F2F3F5' }}>Select a workspace</div>
                  <div className="db-muted" style={{ fontSize: 13 }}>Your workflows will appear here.</div>
                </div>
              )}
            </div>
          </section>
        </section>
      </main>

      {showModal && (
        <div className="db-modal">
          <div className="db-modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="db-modal-panel">
            <h2 className="db-modal-title">Create workspace</h2>
            <p className="db-muted" style={{ fontSize: 13, marginBottom: 18 }}>Group related workflows under a permanent workspace.</p>
            <input
              autoFocus
              className="db-input"
              value={newWsName}
              style={{ paddingLeft: 12, marginBottom: 14 }}
              onChange={e => setNewWsName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateWs()}
              placeholder="e.g. Payment Integrations"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="db-btn" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
              <button className="db-btn db-btn-primary" onClick={handleCreateWs} style={{ flex: 1.4 }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {renameModal && (
        <div className="db-modal">
          <div className="db-modal-backdrop" onClick={() => setRenameModal(null)} />
          <div className="db-modal-panel">
            <h2 className="db-modal-title">Rename workspace</h2>
            <p className="db-muted" style={{ fontSize: 13, marginBottom: 18 }}>All workflows in this workspace move to the new name.</p>
            <input
              autoFocus
              className="db-input"
              value={renameDraft}
              style={{ paddingLeft: 12, marginBottom: 14 }}
              onChange={e => setRenameDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirmRenameWorkspace()}
              placeholder="Workspace name"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="db-btn" onClick={() => setRenameModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="db-btn db-btn-primary" onClick={() => void handleConfirmRenameWorkspace()} style={{ flex: 1.4 }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="db-modal">
          <div className="db-modal-backdrop" onClick={() => setDeleteModal(null)} />
          <div className="db-modal-panel">
            <h2 className="db-modal-title">Delete workspace</h2>
            <p className="db-muted" style={{ fontSize: 13, marginBottom: 18 }}>
              <strong style={{ color: '#F2F3F5' }}>{deleteModal.name}</strong>
              {' '}will be removed. Workflows in it are moved to <strong style={{ color: '#F2F3F5' }}>My Workspace</strong>.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="db-btn" onClick={() => setDeleteModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button
                className="db-btn db-btn-danger"
                onClick={() => void handleConfirmDeleteWorkspace()}
                style={{ flex: 1.4 }}
              >
                Delete workspace
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

function normalizeWorkflow(workflow: any): FlowWorkflow {
  return {
    id: workflow.id || workflow._id || '',
    name: workflow.name,
    workspace: workflow.workspace || 'My Workspace',
    nodes: workflow.nodes || [],
    edges: workflow.edges || [],
    updatedAt: workflow.updatedAt || workflow.createdAt || '',
  }
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="db-stat">
      <div className="db-stat-icon">{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div className="db-stat-value">{value}</div>
        <div className="db-stat-label">{label}</div>
      </div>
    </div>
  )
}

function LoadingState({ label }: { label: string }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', padding: 48, gap: 12 }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.10)', borderTopColor: '#3ECF8E', animation: 'spin 0.8s linear infinite' }} />
      <div className="db-muted" style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
    </div>
  )
}

function WorkflowRow({ wf, onOpen, onRenameWorkflow, onDeleteWorkflow }: {
  wf: FlowWorkflow
  onOpen: () => void
  onRenameWorkflow: (id: string, name: string) => Promise<void>
  onDeleteWorkflow: (id: string) => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(wf.name)

  const saveEdit = async () => {
    const value = editValue.trim()
    if (!value) return
    await onRenameWorkflow(wf.id, value)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="db-workflow-row">
        <input
          className="db-input"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') saveEdit()
            if (e.key === 'Escape') {
              setEditValue(wf.name)
              setIsEditing(false)
            }
          }}
          style={{ paddingLeft: 12 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="db-btn db-btn-primary" type="button" onClick={saveEdit}>Save</button>
          <button className="db-btn" type="button" onClick={() => { setEditValue(wf.name); setIsEditing(false) }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="db-workflow-row">
      <button className="db-row-open" onClick={onOpen}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: '#3ECF8E', boxShadow: '0 0 8px rgba(62,207,142,0.6)', flex: '0 0 auto' }} />
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#F2F3F5' }}>{wf.name}</span>
            <span className="db-muted" style={{ display: 'block', fontSize: 11.5, marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>
              Updated {wf.updatedAt ? new Date(wf.updatedAt).toLocaleDateString() : 'recently'}
            </span>
          </span>
        </span>
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="db-action" type="button" onClick={() => setIsEditing(true)} title="Rename workflow">
          <EditIcon />
        </button>
        <button className="db-action" type="button" onClick={() => onDeleteWorkflow(wf.id)} title="Delete workflow" style={{ color: '#E24B4A' }}>
          <TrashIcon />
        </button>

      </div>
    </div>
  )
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function SearchIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M10 11v6M14 11v6" />
      <path d="m5 6 1 14h12l1-14" />
    </svg>
  )
}
