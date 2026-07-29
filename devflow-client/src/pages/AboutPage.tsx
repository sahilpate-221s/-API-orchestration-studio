import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Footer from '../components/ui/Footer'
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Cpu,
  GitMerge,
  Layers,
  RefreshCw,
  ShieldCheck,
  Terminal,
  Zap,
  CheckCircle2,
  Workflow,
} from 'lucide-react'

export default function AboutPage() {
  const { isAuth } = useAuthStore()
  const home = isAuth ? '/dashboard' : '/'

  return (
    <div className="relative min-h-screen bg-[#0B0C0E] text-[#F2F3F5] font-sans overflow-x-hidden selection:bg-[#3ECF8E]/20 selection:text-white">
      {/* Background Glow Orbs */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[15%] w-[45vw] h-[45vw] max-w-[650px] rounded-full bg-[#3ECF8E]/[0.06] blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] max-w-[550px] rounded-full bg-[#8B7CF6]/[0.05] blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:26px_26px] opacity-40 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_30%,transparent_85%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-8 pb-20">
        {/* Back Link */}
        <Link
          to={home}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs font-medium text-[#93959D] hover:text-white hover:border-white/20 transition-all duration-150 mb-10"
        >
          <ArrowLeft size={14} className="text-[#3ECF8E]" />
          <span>{isAuth ? 'Back to dashboard' : 'Back to home'}</span>
        </Link>

        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono font-medium tracking-[0.14em] text-[#3ECF8E] uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse" />
            Visual API Engine
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.08] font-display text-white">
            Visual infrastructure for modern API graphs.
          </h1>
        </div>

        {/* 4 Metric Boxes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { metric: '<20ms', label: 'Redis Latency', icon: Zap, color: '#3ECF8E' },
            { metric: 'O(V+E)', label: 'DAG Sort Speed', icon: GitMerge, color: '#8B7CF6' },
            { metric: '99.99%', label: 'Queue Uptime', icon: ShieldCheck, color: '#3ECF8E' },
            { metric: '100%', label: 'Typesafe Pipelines', icon: Workflow, color: '#8B7CF6' },
          ].map((m) => (
            <div key={m.label} className="p-5 rounded-2xl bg-[#0E0F12] border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <m.icon size={18} style={{ color: m.color }} />
                <span className="w-2 h-2 rounded-full bg-white/20" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">{m.metric}</div>
                <div className="text-xs font-semibold text-[#93959D] mt-1">{m.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Visual 3-Step Process Flow Diagram */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-display text-white">How DevFlow Executes Graphs</h2>
            <p className="text-xs text-[#93959D] mt-1">From visual node canvas to distributed parallel worker resolution</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: '01',
                title: 'Canvas Graph',
                tag: 'React Flow Canvas',
                desc: 'Drag & drop nodes, configure Postman-like parameters, and bind JSONPath dynamic variables.',
                color: '#3ECF8E',
              },
              {
                step: '02',
                title: 'DAG & Cache Engine',
                tag: 'Kahn\'s DAG + Redis SHA256',
                desc: 'Topological sort builds level batches. Warm requests resolve instantly from Redis cache.',
                color: '#8B7CF6',
              },
              {
                step: '03',
                title: 'Live WebSocket Stream',
                tag: 'Promise.all + Socket.io',
                desc: 'Parallel worker jobs stream live status updates, timings, and console logs back to your viewport.',
                color: '#3ECF8E',
              },
            ].map((s) => (
              <div
                key={s.step}
                className="relative p-6 rounded-2xl bg-[#0E0F12] border border-white/10 hover:border-[#3ECF8E]/30 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-white/[0.04] text-white">
                    STEP {s.step}
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-[#5A5C64] uppercase">{s.tag}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-xs text-[#93959D] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 6 Feature Visual Cards Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold font-display text-white mb-6">Engine Specifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Layers, title: 'Parallel Execution', label: 'Promise.all Level Batching' },
              { icon: Zap, title: 'SHA256 Caching', label: 'Redis Response Invalidation' },
              { icon: RefreshCw, title: 'BullMQ Queues', label: 'Exponential Retries & Backoff' },
              { icon: Terminal, title: 'Live Logs', label: 'Real-time Socket.io Stream' },
              { icon: GitMerge, title: 'JSONPath Pipeline', label: 'Dynamic Payload Bindings' },
              { icon: Cpu, title: 'Docker Infra', label: 'Decoupled Microservice Stack' },
            ].map((f) => (
              <div key={f.title} className="p-5 rounded-xl bg-[#0E0F12] border border-white/[0.07] hover:border-[#3ECF8E]/25 transition-all flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#3ECF8E] shrink-0">
                  <f.icon size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{f.title}</h4>
                  <p className="text-[11px] font-mono text-[#5A5C64] mt-0.5">{f.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual CTA Box */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#0E0F12] border border-white/10 text-center relative overflow-hidden">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">Ready to build API workflows?</h2>
          <div className="flex justify-center gap-4 mt-6">
            <Link
              to={isAuth ? '/dashboard' : '/register'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#3ECF8E] text-[#06110C] font-semibold text-sm hover:bg-[#5BDA9F] transition-all shadow-[0_0_0_1px_rgba(62,207,142,0.3),0_8px_20px_-4px_rgba(62,207,142,0.45)]"
            >
              <span>{isAuth ? 'Open Dashboard' : 'Get Started Free'}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
