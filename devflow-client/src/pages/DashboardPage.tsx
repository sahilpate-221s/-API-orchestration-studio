import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import type { FlowWorkflow } from '../types'

type Props = { onOpenWorkflow: (id: string, name: string, workspace: string, nodes: any[], edges: any[]) => void }

const getHour = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const uniqueNames = (names: string[]) =>
  Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)))

const CSS = `
@keyframes spin { to { transform: rotate(360deg) } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }

.db-shell {
  min-height: 100vh;
  background: #0a0a0a;
  color: #ffffff;
  font-family: Inter, system-ui, sans-serif;
}

.db-topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  height: 64px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  background: rgba(10,10,10,0.96);
  backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.db-brand, .db-user, .db-stat, .db-panel, .db-workspace-item, .db-workflow-row, .db-empty {
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.03);
  box-shadow: 0 12px 36px rgba(0,0,0,0.28);
}

.db-brand {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: grid;
  place-items: center;
  box-shadow: 0 0 0 1px rgba(99,102,241,0.35), 0 8px 22px rgba(99,102,241,0.22);
}

.db-user {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 999px;
  padding: 5px 10px 5px 5px;
}

.db-avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #ffffff;
  color: #0a0a0a;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 800;
}

.db-btn {
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.78);
  border-radius: 7px;
  padding: 9px 12px;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, transform 0.16s ease;
}

.db-btn:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.14);
  color: #ffffff;
  transform: translateY(-1px);
}

.db-btn-primary {
  background: #ffffff;
  border-color: #ffffff;
  color: #000000;
  box-shadow: 0 8px 20px rgba(255,255,255,0.12);
}

.db-btn-primary:hover {
  background: #f4f4f5;
  border-color: #f4f4f5;
  color: #000000;
}

.db-page {
  max-width: 1260px;
  margin: 0 auto;
  padding: 34px 24px 80px;
  animation: fadeUp 0.35s ease;
}

.db-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: end;
  margin-bottom: 22px;
}

.db-title {
  font-size: 36px;
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: 0;
  margin: 6px 0 10px;
}

.db-muted { color: rgba(255,255,255,0.45); }
.db-soft { color: rgba(255,255,255,0.62); }

.db-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}

.db-stat {
  border-radius: 8px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.db-stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 7px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(99,102,241,0.10);
  color: #a5b4fc;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.db-grid {
  display: grid;
  grid-template-columns: 318px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.db-panel {
  border-radius: 8px;
  overflow: hidden;
}

.db-panel-header {
  min-height: 56px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.db-input-wrap {
  position: relative;
  padding: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.db-input {
  width: 100%;
  background: rgba(0,0,0,0.24);
  border: 1px solid rgba(255,255,255,0.07);
  color: #ffffff;
  border-radius: 7px;
  outline: none;
  font: inherit;
  font-size: 13px;
  padding: 10px 12px 10px 36px;
  transition: background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}

.db-input::placeholder { color: rgba(255,255,255,0.24); }
.db-input:focus {
  background: rgba(99,102,241,0.06);
  border-color: rgba(99,102,241,0.55);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.14);
}

.db-workspace-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  max-height: calc(100vh - 280px);
  overflow: auto;
}

.db-workspace-item {
  width: 100%;
  border-radius: 8px;
  padding: 11px 12px;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  transition: background 0.16s ease, border-color 0.16s ease;
}

.db-workspace-item:hover,
.db-workspace-item.is-active {
  background: rgba(99,102,241,0.10);
  border-color: rgba(99,102,241,0.34);
}

.db-count {
  min-width: 26px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  display: grid;
  place-items: center;
  color: rgba(255,255,255,0.58);
  font-size: 11px;
  font-weight: 750;
}

.db-workspace-item.is-active .db-count {
  color: #c7d2fe;
  border-color: rgba(99,102,241,0.34);
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
  border-radius: 8px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(99,102,241,0.28);
  background: rgba(99,102,241,0.11);
  color: #a5b4fc;
  flex: 0 0 auto;
}

.db-workflow-list {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.db-workflow-row {
  border-radius: 8px;
  padding: 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  transition: background 0.16s ease, border-color 0.16s ease;
}

.db-workflow-row:hover {
  background: rgba(255,255,255,0.055);
  border-color: rgba(255,255,255,0.12);
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
  width: 32px;
  height: 32px;
  border-radius: 7px;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.62);
  cursor: pointer;
  display: inline-grid;
  place-items: center;
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.db-action:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.14);
  color: #ffffff;
}

.db-empty {
  margin: 10px;
  border-radius: 8px;
  padding: 42px 18px;
  text-align: center;
  background: rgba(255,255,255,0.02);
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
  background: rgba(0,0,0,0.78);
  backdrop-filter: blur(10px);
}

.db-modal-panel {
  position: relative;
  width: min(100%, 420px);
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.10);
  background: #101010;
  box-shadow: 0 32px 80px rgba(0,0,0,0.62);
  padding: 22px;
}

@media (max-width: 860px) {
  .db-topbar { padding: 0 14px; }
  .db-user-text { display: none; }
  .db-hero, .db-main-head { grid-template-columns: 1fr; }
  .db-title { font-size: 30px; }
  .db-stats { grid-template-columns: 1fr; }
  .db-grid { grid-template-columns: 1fr; }
  .db-workspace-list { max-height: none; }
}
`

export default function DashboardPage({ onOpenWorkflow }: Props) {
  const { user, clearAuth } = useAuthStore()
  const [workflows, setWorkflows] = useState<FlowWorkflow[]>([])
  const [savedWorkspaces, setSavedWorkspaces] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newWsName, setNewWsName] = useState('')
  const [selectedWs, setSelectedWs] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const workflowRes = await api.get('/workflows')
      setWorkflows(workflowRes.data.workflows.map(normalizeWorkflow))

      const workspaceRes = await api.get('/workflows/workspaces')
      setSavedWorkspaces(uniqueNames(workspaceRes.data.workspaces.map((workspace: any) => workspace.name)))
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
      setSavedWorkspaces((prev) => uniqueNames([...prev, wf.workspace || 'My Workspace']))
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
      const workspaceName = res.data.workspace?.name || name
      setSavedWorkspaces(prev => uniqueNames([...prev, workspaceName]))
      setSelectedWs(workspaceName)
      setNewWsName('')
      setShowModal(false)
    } catch {
      /* ignore */
    }
  }

  const workspaces = useMemo(() => {
    return uniqueNames([
      ...savedWorkspaces,
      ...workflows.map(w => w.workspace || 'My Workspace'),
    ])
  }, [savedWorkspaces, workflows])

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

      <nav className="db-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div className="db-brand" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h10M4 18h7" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="19" cy="18" r="3" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 760, letterSpacing: 0 }}>DevFlow</div>
            <div className="db-muted" style={{ fontSize: 11 }}>Dashboard</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="db-user">
            <div className="db-avatar">{initials}</div>
            <div className="db-user-text" style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{firstName}</div>
              <div className="db-muted" style={{ fontSize: 11, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
          <button className="db-btn" onClick={clearAuth}>Sign out</button>
        </div>
      </nav>

      <main className="db-page">
        <section className="db-hero">
          <div>
            <div className="db-muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              {getHour()}, {firstName}
            </div>
            <h1 className="db-title">Your workflow command center</h1>
            <p className="db-soft" style={{ maxWidth: 660, fontSize: 14, lineHeight: 1.7 }}>
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
                <div style={{ fontSize: 13, fontWeight: 760 }}>Workspaces</div>
                <div className="db-muted" style={{ fontSize: 11 }}>Select a workspace</div>
              </div>
              <button className="db-action" onClick={() => setShowModal(true)} title="Create workspace">
                <PlusIcon />
              </button>
            </div>

            <div className="db-input-wrap">
              <SearchIcon style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.36)' }} />
              <input
                className="db-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search workspaces or workflows"
              />
            </div>

            {loading ? (
              <LoadingState label="Loading workspaces..." />
            ) : filteredWorkspaces.length === 0 ? (
              <div className="db-empty">
                <div style={{ fontWeight: 760, marginBottom: 6 }}>No workspaces found</div>
                <div className="db-muted" style={{ fontSize: 13 }}>Create a workspace to start organizing workflows.</div>
              </div>
            ) : (
              <div className="db-workspace-list">
                {filteredWorkspaces.map(ws => {
                  const count = workflows.filter(w => (w.workspace || 'My Workspace') === ws).length
                  const active = ws === selectedWs
                  return (
                    <button
                      key={ws}
                      className={`db-workspace-item${active ? ' is-active' : ''}`}
                      onClick={() => setSelectedWs(ws)}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <FolderIcon />
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws}</span>
                          <span className="db-muted" style={{ display: 'block', fontSize: 11 }}>{count} workflow{count === 1 ? '' : 's'}</span>
                        </span>
                      </span>
                      <span className="db-count">{count}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </aside>

          <section className="db-panel">
            <div className="db-main-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                <div className="db-folder">
                  <FolderIcon />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontSize: 22, lineHeight: 1.2, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

            {loading ? (
              <LoadingState label="Loading workflows..." />
            ) : selectedWs && selectedWorkflows.length === 0 ? (
              <div className="db-empty">
                <div className="db-folder" style={{ margin: '0 auto 14px' }}>
                  <BoltIcon />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>No workflows yet</div>
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
                <div style={{ fontWeight: 760, marginBottom: 6 }}>Select a workspace</div>
                <div className="db-muted" style={{ fontSize: 13 }}>Your workflows will appear here.</div>
              </div>
            )}
          </section>
        </section>
      </main>

      {showModal && (
        <div className="db-modal">
          <div className="db-modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="db-modal-panel">
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>Create workspace</h2>
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
        <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
        <div className="db-muted" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  )
}

function LoadingState({ label }: { label: string }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', padding: 48, gap: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.10)', borderTopColor: '#a5b4fc', animation: 'spin 0.8s linear infinite' }} />
      <div className="db-muted" style={{ fontSize: 13 }}>{label}</div>
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
          <span style={{ width: 8, height: 8, borderRadius: 999, background: '#4ade80', boxShadow: '0 0 10px rgba(74,222,128,0.55)', flex: '0 0 auto' }} />
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 740, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wf.name}</span>
            <span className="db-muted" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
              Updated {wf.updatedAt ? new Date(wf.updatedAt).toLocaleDateString() : 'recently'}
            </span>
          </span>
        </span>
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="db-action" type="button" onClick={() => setIsEditing(true)} title="Rename workflow">
          <EditIcon />
        </button>
        <button className="db-action" type="button" onClick={() => onDeleteWorkflow(wf.id)} title="Delete workflow" style={{ color: '#f87171' }}>
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
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
