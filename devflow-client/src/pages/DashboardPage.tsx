import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

type WorkspaceEntry = { id: string; name: string }

function dedupeWorkspaceEntries(rows: WorkspaceEntry[]): WorkspaceEntry[] {
  const m = new Map<string, WorkspaceEntry>()
  for (const r of rows) {
    if (r.id && r.name) m.set(r.id, { id: r.id, name: r.name })
  }
  return Array.from(m.values())
}

const CSS = `
@keyframes spin { to { transform: rotate(360deg) } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes ink-breathe {
  0%, 100% { opacity: 0.72; transform: scale(1) translate(0, 0); }
  50% { opacity: 0.96; transform: scale(1.04) translate(1%, -0.6%); }
}
@keyframes orb-a {
  0%, 100% { transform: translate(0%, 0%) scale(1); }
  33% { transform: translate(7%, -5%) scale(1.06); }
  66% { transform: translate(-4%, 3%) scale(0.98); }
}
@keyframes orb-b {
  0%, 100% { transform: translate(0%, 0%) scale(1); }
  40% { transform: translate(-9%, 6%) scale(1.07); }
  70% { transform: translate(5%, -7%) scale(1); }
}
@keyframes orb-c {
  0%, 100% { transform: translate(-50%, -50%) translate(0, 0) scale(1); }
  50% { transform: translate(-50%, -50%) translate(3%, 4%) scale(1.1); }
}
@keyframes glint-orbit {
  0% { transform: rotate(0turn) scale(1); opacity: 0.5; }
  50% { opacity: 0.88; }
  100% { transform: rotate(1turn) scale(1.05); opacity: 0.5; }
}
@keyframes sheen-slide {
  0% { transform: translateX(-55%) skewX(-12deg); opacity: 0; }
  12% { opacity: 1; }
  55% { opacity: 1; }
  70% { transform: translateX(55%) skewX(-12deg); opacity: 0; }
  100% { transform: translateX(55%) skewX(-12deg); opacity: 0; }
}
@keyframes pulse-edge {
  0%, 100% { opacity: 0.34; }
  50% { opacity: 0.62; }
}

.db-bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.db-shell {
  min-height: 100vh;
  background:
    radial-gradient(ellipse 110% 72% at 50% -8%, #111111 0%, transparent 58%),
    radial-gradient(ellipse 90% 55% at 108% 28%, #0b0b0b 0%, transparent 48%),
    radial-gradient(ellipse 75% 70% at -8% 85%, #060606 0%, transparent 52%),
    linear-gradient(168deg, #000000 0%, #050505 38%, #020202 72%, #0a0a0a 100%);
  color: #ffffff;
  font-family: Inter, system-ui, sans-serif;
  position: relative;
  overflow: hidden;
}

.db-bg-ink {
  position: absolute;
  inset: -18%;
  background:
    radial-gradient(ellipse 58% 48% at 22% 32%, #141414 0%, transparent 58%),
    radial-gradient(ellipse 52% 42% at 82% 24%, #0a0a0a 0%, transparent 55%),
    radial-gradient(ellipse 48% 55% at 64% 88%, #0d0d0d 0%, transparent 50%);
  animation: ink-breathe 22s ease-in-out infinite;
  filter: blur(1.5px);
}

.db-bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  mix-blend-mode: normal;
  opacity: 0.55;
  will-change: transform;
}
.db-bg-orb--a {
  width: min(74vw, 640px);
  height: min(74vw, 640px);
  top: -14%;
  left: -10%;
  background: radial-gradient(circle, #1c1c1c 0%, #080808 42%, transparent 72%);
  animation: orb-a 32s ease-in-out infinite;
}
.db-bg-orb--b {
  width: min(68vw, 560px);
  height: min(68vw, 560px);
  bottom: -8%;
  right: -14%;
  background: radial-gradient(circle, #101010 0%, #030303 48%, transparent 74%);
  animation: orb-b 36s ease-in-out infinite;
  animation-delay: -8s;
}
.db-bg-orb--c {
  width: min(52vw, 440px);
  height: min(52vw, 440px);
  top: 44%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, #181818 0%, #050505 50%, transparent 70%);
  animation: orb-c 26s ease-in-out infinite;
  animation-delay: -12s;
}

.db-bg-glint {
  position: absolute;
  inset: -40%;
  display: grid;
  place-items: center;
  opacity: 0.78;
}
.db-bg-glint::before {
  content: "";
  width: 55vmax;
  height: 55vmax;
  border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 0deg, transparent 55deg, rgba(255,255,255,0.16) 90deg, transparent 125deg, transparent 360deg);
  filter: blur(56px);
  animation: glint-orbit 48s linear infinite;
}

.db-bg-sheen {
  position: absolute;
  inset: 0;
  overflow: hidden;
  mask-image: radial-gradient(ellipse 85% 70% at 50% 42%, black 0%, transparent 72%);
  -webkit-mask-image: radial-gradient(ellipse 85% 70% at 50% 42%, black 0%, transparent 72%);
}
.db-bg-sheen::after {
  content: "";
  position: absolute;
  top: 18%;
  left: 50%;
  width: 45%;
  height: 140%;
  margin-left: -22%;
  background: linear-gradient(
    105deg,
    transparent 0%,
    rgba(255,255,255,0.1) 42%,
    rgba(255,255,255,0.16) 50%,
    rgba(255,255,255,0.1) 58%,
    transparent 100%
  );
  filter: blur(1px);
  animation: sheen-slide 11s ease-in-out infinite;
  animation-delay: 1.5s;
}

.db-bg-vignette {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 120px rgba(0,0,0,0.68), inset 0 0 280px rgba(0,0,0,0.48);
  animation: pulse-edge 14s ease-in-out infinite;
  pointer-events: none;
}

.db-bg-noise {
  position: absolute;
  inset: 0;
  opacity: 0.13;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 180px 180px;
}

@media (prefers-reduced-motion: reduce) {
  .db-bg-layer .db-bg-ink,
  .db-bg-layer .db-bg-orb,
  .db-bg-layer .db-bg-glint::before,
  .db-bg-layer .db-bg-sheen::after,
  .db-bg-layer .db-bg-vignette,
  .db-topbar-bg .db-bg-ink,
  .db-topbar-bg .db-bg-orb,
  .db-topbar-bg .db-bg-glint::before,
  .db-topbar-bg .db-bg-sheen::after,
  .db-topbar-bg .db-bg-vignette {
    animation: none !important;
  }
  .db-bg-layer .db-bg-ink,
  .db-topbar-bg .db-bg-ink { opacity: 0.85; transform: none; }
  .db-bg-layer .db-bg-orb { opacity: 0.28; }
  .db-topbar-bg .db-bg-orb { opacity: 0.28; }
  .db-bg-layer .db-bg-orb--c,
  .db-topbar-bg .db-bg-orb--c { transform: translate(-50%, -50%); }
  .db-bg-layer .db-bg-glint::before,
  .db-topbar-bg .db-bg-glint::before { transform: none; opacity: 0.48; }
  .db-bg-layer .db-bg-sheen::after,
  .db-topbar-bg .db-bg-sheen::after { transform: none; opacity: 0; }
  .db-bg-layer .db-bg-vignette,
  .db-topbar-bg .db-bg-vignette { opacity: 0.48; }
}

.db-topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  height: 64px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: rgba(5, 5, 5, 0.62);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  overflow: hidden;
}

.db-topbar-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.db-topbar-bg .db-bg-ink {
  inset: -35%;
  filter: blur(1px);
}

.db-topbar-bg .db-bg-orb {
  filter: blur(38px);
  opacity: 0.62;
}

.db-topbar-bg .db-bg-orb--a {
  width: 200px;
  height: 200px;
  top: -55%;
  left: -8%;
}

.db-topbar-bg .db-bg-orb--b {
  width: 180px;
  height: 180px;
  bottom: -45%;
  right: -5%;
}

.db-topbar-bg .db-bg-orb--c {
  width: 160px;
  height: 160px;
  top: 50%;
  left: 72%;
}

.db-topbar-bg .db-bg-glint {
  inset: -25%;
  opacity: 0.82;
}

.db-topbar-bg .db-bg-glint::before {
  width: 22vmax;
  height: 22vmax;
  filter: blur(22px);
}

.db-topbar-bg .db-bg-sheen {
  mask-image: radial-gradient(ellipse 95% 120% at 50% 50%, black 0%, transparent 78%);
  -webkit-mask-image: radial-gradient(ellipse 95% 120% at 50% 50%, black 0%, transparent 78%);
}

.db-topbar-bg .db-bg-sheen::after {
  top: -20%;
  height: 180%;
  width: 55%;
  margin-left: -28%;
}

.db-topbar-bg .db-bg-vignette {
  box-shadow: inset 0 0 48px rgba(0,0,0,0.58), inset 0 0 90px rgba(0,0,0,0.38);
}

.db-topbar-bg .db-bg-noise {
  opacity: 0.11;
}

.db-topbar-inner {
  position: relative;
  z-index: 1;
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
  gap: 4px 8px;
  min-width: 0;
}

.db-nav-link {
  color: rgba(255, 255, 255, 0.52);
  font-size: 13px;
  font-weight: 650;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;
  white-space: nowrap;
  transition: color 0.16s ease, background 0.16s ease;
}

.db-nav-link:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.07);
}

.db-brand, .db-user, .db-stat, .db-panel, .db-workspace-row, .db-workflow-row, .db-empty {
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(15, 15, 15, 0.7);
  backdrop-filter: blur(24px);
  box-shadow: 0 12px 36px rgba(0,0,0,0.4);
}

.db-brand {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: grid;
  place-items: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  position: relative;
  overflow: hidden;
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
  max-width: 1400px;
  margin: 0 auto;
  padding: 48px 64px 80px;
  animation: fadeUp 0.35s ease;
  position: relative;
  z-index: 5;
}

.db-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: end;
  margin-bottom: 22px;
}

.db-title {
  font-size: 44px;
  line-height: 1.06;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 8px 0 12px;
}

.db-hero-greeting {
  font-size: 15px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(255, 255, 255, 0.48);
}

.db-hero-lead {
  max-width: 680px;
  font-size: 17px;
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.66);
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
  background: rgba(255,255,255,0.05);
  color: #ffffff;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.db-grid {
  display: grid;
  grid-template-columns: 352px minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
  height: clamp(460px, calc(100svh - 224px), 900px);
}

.db-panel {
  border-radius: 10px;
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
  background: rgba(255,255,255,0.03);
  border-color: rgba(255,255,255,0.3);
  box-shadow: 0 0 0 3px rgba(255,255,255,0.05);
}

.db-workspace-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
}

.db-workspace-row {
  width: 100%;
  border-radius: 8px;
  padding: 5px 6px 5px 8px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  transition: background 0.16s ease, border-color 0.16s ease;
}

.db-workspace-row:hover,
.db-workspace-row.is-active {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.14);
}

.db-workspace-select {
  min-width: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  padding: 8px 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.db-workspace-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
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

.db-workspace-row.is-active .db-count {
  color: #ffffff;
  border-color: rgba(255,255,255,0.2);
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
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  color: #ffffff;
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
  .db-topbar-inner {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .db-topbar-inner > div:first-of-type {
    order: 1;
  }
  .db-topbar-links {
    order: 2;
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
  .db-topbar-inner > div:last-of-type {
    order: 3;
    justify-self: end;
    width: 100%;
    justify-content: flex-end;
  }
  .db-hero, .db-main-head { grid-template-columns: 1fr; }
  .db-title { font-size: 34px; }
  .db-hero-greeting { font-size: 14px; }
  .db-hero-lead { font-size: 16px; }
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
        <div className="db-bg-ink" />
        <div className="db-bg-orb db-bg-orb--a" />
        <div className="db-bg-orb db-bg-orb--b" />
        <div className="db-bg-orb db-bg-orb--c" />
        <div className="db-bg-glint" />
        <div className="db-bg-sheen" />
        <div className="db-bg-noise" />
        <div className="db-bg-vignette" />
      </div>

      <nav className="db-topbar">
        <div className="db-topbar-bg" aria-hidden="true">
          <div className="db-bg-ink" />
          <div className="db-bg-orb db-bg-orb--a" />
          <div className="db-bg-orb db-bg-orb--b" />
          <div className="db-bg-orb db-bg-orb--c" />
          <div className="db-bg-glint" />
          <div className="db-bg-sheen" />
          <div className="db-bg-noise" />
          <div className="db-bg-vignette" />
        </div>

        <div className="db-topbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div className="db-brand" aria-hidden="true">
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 70%)',
              }} />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L4 9V21L12 15L20 21V9L12 3Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 15V3" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                <circle cx="12" cy="15" r="2" fill="white" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.96)' }}>DevFlow</div>
              <div className="db-muted" style={{ fontSize: 11 }}>Dashboard</div>
            </div>
          </div>

          <div className="db-topbar-links" role="navigation" aria-label="Site pages">
            <Link className="db-nav-link" to="/">Home</Link>
            <Link className="db-nav-link" to="/about">About</Link>
            <Link className="db-nav-link" to="/contact">Contact</Link>
            <Link className="db-nav-link" to="/#pricing">Pricing</Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
            <div className="db-user">
              <div className="db-avatar">{initials}</div>
              <div className="db-user-text" style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{firstName}</div>
                <div className="db-muted" style={{ fontSize: 11, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
            </div>
            <button className="db-btn" onClick={clearAuth}>Sign out</button>
          </div>
        </div>
      </nav>

      <main className="db-page">
        <section className="db-hero">
          <div>
            <div className="db-hero-greeting">
              {getHour()}, {firstName}
            </div>
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

            <div className="db-panel-scroll custom-scrollbar">
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
                    const canDelete = ws !== 'My Workspace'
                    return (
                      <div key={ws} className={`db-workspace-row${active ? ' is-active' : ''}`}>
                        <button type="button" className="db-workspace-select" onClick={() => setSelectedWs(ws)}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <FolderIcon />
                            <span style={{ minWidth: 0 }}>
                              <span style={{ display: 'block', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws}</span>
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

            <div className="db-panel-scroll custom-scrollbar">
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
            </div>
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

      {renameModal && (
        <div className="db-modal">
          <div className="db-modal-backdrop" onClick={() => setRenameModal(null)} />
          <div className="db-modal-panel">
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>Rename workspace</h2>
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
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>Delete workspace</h2>
            <p className="db-muted" style={{ fontSize: 13, marginBottom: 18 }}>
              <strong style={{ color: 'rgba(255,255,255,0.88)' }}>{deleteModal.name}</strong>
              {' '}will be removed. Workflows in it are moved to <strong style={{ color: 'rgba(255,255,255,0.88)' }}>My Workspace</strong>.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="db-btn" onClick={() => setDeleteModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button
                className="db-btn"
                onClick={() => void handleConfirmDeleteWorkspace()}
                style={{ flex: 1.4, borderColor: 'rgba(248,113,113,0.45)', color: '#fecaca' }}
              >
                Delete workspace
              </button>
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
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.10)', borderTopColor: '#ffffff', animation: 'spin 0.8s linear infinite' }} />
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
