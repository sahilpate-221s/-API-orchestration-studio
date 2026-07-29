import { ReactFlowProvider } from "reactflow";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./components/ui/Navbar";
import Sidebar from "./components/ui/Sidebar";
import FlowCanvas from "./components/canvas/FlowCanvas";
import NodePanel from "./components/ui/NodePanel";
import LandingPage from "./components/ui/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import PricingPage from "./pages/PricingPage";
import ExecutionHistory from "./components/ui/ExecutionHistory";
import ExecutionLog from "./components/ui/ExecutionLog";
import BenchmarkPage from "./pages/BenchmarkPage";
import { useFlowStore } from "./store/flowStore";
import { useExecution } from "./hooks/useExecution";
import { useAuthStore } from "./store/authStore";
import api from "./services/api";

/* ── Canvas page ── */
function CanvasPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const {
    selectedNodeId,
    workflowId: storedId,
    setWorkflowMeta,
    setFlow,
  } = useFlowStore();
  const { runWorkflow, resetWorkflow } = useExecution();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Run Workflow: Ctrl + R
      if (e.ctrlKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        runWorkflow();
      }

      // Toggle Console: Ctrl + L
      if (e.ctrlKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setShowLog((v) => !v);
      }

      // View History: Ctrl + H
      if (e.ctrlKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        setShowHistory(true);
      }

      // Reset Workflow: Ctrl + Q
      if (e.ctrlKey && e.key.toLowerCase() === "q") {
        e.preventDefault();
        resetWorkflow();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [runWorkflow, resetWorkflow]);

  const { isAuth } = useAuthStore();
  const [showHistory, setShowHistory] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [loading, setLoading] = useState(false);

  // If not auth, redirect to login
  useEffect(() => {
    if (!isAuth) navigate("/login", { replace: true });
  }, [isAuth]);

  // Fetch workflow data if missing from store but present in URL
  useEffect(() => {
    if (!workflowId) return;
    if (workflowId === storedId) return;

    setLoading(true);
    api
      .get(`/workflows/${workflowId}`)
      .then((r) => {
        const wf = r.data.workflow;
        setWorkflowMeta(wf._id, wf.name, wf.workspace);
        setFlow(wf.nodes ?? [], wf.edges ?? []);
      })
      .catch((err) => {
        console.error("Failed to load workflow", err);
      })
      .finally(() => setLoading(false));
  }, [workflowId, storedId, setWorkflowMeta, setFlow]);

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col overflow-hidden bg-[#0B0C0E] z-10">
      <Navbar
        onHome={() => navigate("/dashboard")}
        onHistoryClick={() => setShowHistory(true)}
        onLogClick={() => setShowLog((v) => !v)}
        logOpen={showLog}
        onBenchmarkClick={() => setShowBenchmark(true)}
      />
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#0B0C0E]">
          <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#3ECF8E] animate-spin" />
          <span className="text-sm text-white/40 font-medium font-mono">
            Loading workflow...
          </span>
        </div>
      ) : (
        <div className="flex flex-1 w-full h-[calc(100vh-52px)] overflow-hidden relative bg-[#0B0C0E]">
          <Sidebar />
          <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative bg-[#0B0C0E]">
            <FlowCanvas />
            <ExecutionLog isOpen={showLog} onClose={() => setShowLog(false)} />
          </div>
          {selectedNodeId && <NodePanel />}
          {showHistory && (
            <ExecutionHistory onClose={() => setShowHistory(false)} />
          )}
          {showBenchmark && (
            <BenchmarkPage onClose={() => setShowBenchmark(false)} />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Dashboard page wrapper ── */
function DashboardRoute() {
  const { isAuth } = useAuthStore();
  const { setWorkflowMeta, setFlow } = useFlowStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuth) navigate("/login", { replace: true });
  }, [isAuth]);

  const handleOpenWorkflow = (
    id: string,
    name: string,
    workspace: string,
    nodes: any[],
    edges: any[],
  ) => {
    setWorkflowMeta(id, name, workspace);
    setFlow(nodes, edges);
    navigate(`/canvas/${id}`);
  };

  return (
    <div className="w-full min-h-screen bg-[#0B0C0E] overflow-y-auto overflow-x-hidden">
      <DashboardPage onOpenWorkflow={handleOpenWorkflow} />
    </div>
  );
}

/* ── Landing page wrapper ── */
function LandingRoute() {
  const { isAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuth) navigate("/dashboard", { replace: true });
  }, [isAuth]);

  return (
    <div className="w-full min-h-screen bg-[#0B0C0E] overflow-y-auto overflow-x-hidden">
      <LandingPage onAction={(mode) => navigate(`/${mode}`)} />
    </div>
  );
}

/* ── Login/Register page wrapper ── */
function LoginRoute({ mode }: { mode: "login" | "register" }) {
  const { isAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuth) navigate("/dashboard", { replace: true });
  }, [isAuth]);

  return (
    <div className="w-full min-h-screen bg-[#0B0C0E] overflow-y-auto overflow-x-hidden">
      <LoginPage initialMode={mode} onBack={() => navigate("/")} />
    </div>
  );
}

/* ── Root App ── */
export default function App() {
  useEffect(() => {
    api
      .get("/health")
      .then(() => {
        console.log("Backend awake");
      })
      .catch(() => {
        console.log("Backend wake-up failed");
      });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/login" element={<LoginRoute mode="login" />} />
        <Route path="/register" element={<LoginRoute mode="register" />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/pricing" element={<PricingPage />} />
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
  );
}
