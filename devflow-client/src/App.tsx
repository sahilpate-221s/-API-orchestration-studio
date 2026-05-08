import { ReactFlowProvider } from 'reactflow'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/ui/Navbar'
import Sidebar from './components/ui/Sidebar'
import FlowCanvas from './components/canvas/FlowCanvas'
import NodePanel from './components/ui/NodePanel'
import LandingPage from './components/ui/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import { useFlowStore } from './store/flowStore'
import { useAuthStore } from './store/authStore'

/* ── Canvas page ── */
function CanvasPage() {
  const { workflowId } = useParams<{ workflowId: string }>()
  const navigate = useNavigate()
  const { selectedNodeId, workflowId: storedId } = useFlowStore()
  const { isAuth } = useAuthStore()

  // If not auth, redirect to login
  useEffect(() => {
    if (!isAuth) navigate('/login', { replace: true })
  }, [isAuth])

  // If there's no workflow loaded in the store (e.g. after page refresh), go back to dashboard
  useEffect(() => {
    if (isAuth && workflowId && !storedId) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuth, workflowId, storedId])

  return (
    <div className="canvas-root">
      <Navbar onHome={() => navigate('/dashboard')} />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <FlowCanvas />
        {selectedNodeId && <NodePanel />}
      </div>
    </div>
  )
}

/* ── Dashboard page wrapper ── */
function DashboardRoute() {
  const { isAuth } = useAuthStore()
  const { setWorkflowMeta, setFlow } = useFlowStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuth) navigate('/login', { replace: true })
  }, [isAuth])

  const handleOpenWorkflow = (id: string, name: string, workspace: string, nodes: any[], edges: any[]) => {
    setWorkflowMeta(id, name, workspace)
    setFlow(nodes, edges)
    navigate(`/canvas/${id}`)
  }

  return (
    <div className="dashboard-root">
      <DashboardPage onOpenWorkflow={handleOpenWorkflow} />
    </div>
  )
}

/* ── Landing page wrapper ── */
function LandingRoute() {
  const { isAuth } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuth) navigate('/dashboard', { replace: true })
  }, [isAuth])

  return (
    <div style={{ height: '100vh', overflowY: 'auto' }}>
      <LandingPage onAction={(mode) => navigate(`/${mode}`)} />
    </div>
  )
}

/* ── Login/Register page wrapper ── */
function LoginRoute({ mode }: { mode: 'login' | 'register' }) {
  const { isAuth } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuth) navigate('/dashboard', { replace: true })
  }, [isAuth])

  return (
    <LoginPage
      initialMode={mode}
      onBack={() => navigate('/')}
    />
  )
}

/* ── Root App ── */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/login" element={<LoginRoute mode="login" />} />
        <Route path="/register" element={<LoginRoute mode="register" />} />
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route
          path="/canvas/:workflowId"
          element={
            <ReactFlowProvider>
              <CanvasPage />
            </ReactFlowProvider>
          }
        />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}