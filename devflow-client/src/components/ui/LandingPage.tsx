import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion, useInView } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Braces,
  ChevronDown,
  CircleDot,
  Command,
  CornerDownLeft,
  GitMerge,
  Layers,
  Lock,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
  Webhook,
  X,
  Zap,
} from 'lucide-react'
import Footer from './Footer'

/**
 * ── Design tokens ──────────────────────────────────────────────
 * bg / void        #0B0C0E   base canvas
 * bg / raised      #131417   cards
 * bg / raised-2    #17181C   hover / nested
 * border           rgba(255,255,255,.08)   / hover rgba(255,255,255,.16)
 * text / primary   #F2F3F5
 * text / secondary #93959D
 * text / faint     #5A5C64
 * accent / emerald #3ECF8E   (Supabase signature — used for state, actions, focus)
 * accent / violet  #8B7CF6   (single gradient partner, hero headline only)
 * display   Inter Tight  700/800, tight tracking
 * body      Inter        400/500
 * mono      JetBrains Mono  — anything that is data: stats, code, status
 * ──────────────────────────────────────────────────────────────
 */

type Mode = 'login' | 'register'

function LogoMark() {
  return (
    <div className="relative w-7 h-7 rounded-lg bg-[#131417] border border-white/10 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(62,207,142,0.25)_0%,transparent_65%)]" />
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="relative">
        <path d="M12 3L4 9V21L12 15L20 21V9L12 3Z" stroke="#3ECF8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="15" r="1.8" fill="#3ECF8E" />
      </svg>
    </div>
  )
}

type BtnVariant = 'primary' | 'secondary' | 'ghost'

function Btn({
  variant,
  children,
  className = '',
  onClick,
}: {
  variant: BtnVariant
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3ECF8E]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0C0E]'
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-[#3ECF8E] text-[#06110C] hover:bg-[#5BDA9F] shadow-[0_0_0_1px_rgba(62,207,142,0.3),0_10px_30px_-8px_rgba(62,207,142,0.45)]',
    secondary: 'bg-white/[0.04] text-white border border-white/10 hover:bg-white/[0.08] hover:border-white/20',
    ghost: 'text-[#93959D] hover:text-white',
  }
  return (
    <button type="button" onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-[11px] font-mono font-medium tracking-[0.14em] text-[#3ECF8E] uppercase">
      <span className="w-1 h-1 rounded-full bg-[#3ECF8E]" />
      {children}
    </div>
  )
}

/* ── Hero signature: command palette resolving into the Kahn's-algorithm DAG ── */
function CommandPaletteDemo() {
  const [active, setActive] = useState(0)
  const results = [
    { icon: Webhook, label: 'Stripe Webhook Trigger', meta: 'node · trigger' },
    { icon: Braces, label: 'Validate order.paid schema', meta: 'node · validate' },
    { icon: GitMerge, label: 'Run fulfillment_v2', meta: 'workflow · 4 nodes' },
  ]

  useEffect(() => {
    const id = setInterval(() => setActive((n) => (n + 1) % results.length), 2200)
    return () => clearInterval(id)
  }, [results.length])

  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#0E0F12] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
        <Search size={15} className="text-[#5A5C64]" />
        <span className="text-sm text-[#5A5C64] font-mono">Search workflows, nodes, runs…</span>
        <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-[#5A5C64] border border-white/10 rounded px-1.5 py-0.5">
          <Command size={10} /> K
        </span>
      </div>

      <div className="p-2">
        {results.map((r, i) => (
          <div
            key={r.label}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-300 ${
              active === i ? 'bg-[#3ECF8E]/10' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-md flex items-center justify-center border transition-colors duration-300 ${
                active === i ? 'border-[#3ECF8E]/30 bg-[#3ECF8E]/10 text-[#3ECF8E]' : 'border-white/10 bg-white/[0.03] text-[#93959D]'
              }`}
            >
              <r.icon size={13} />
            </div>
            <span className={`text-sm font-medium ${active === i ? 'text-white' : 'text-[#93959D]'}`}>{r.label}</span>
            <span className="ml-auto text-[10px] font-mono text-[#5A5C64]">{r.meta}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.06] px-5 py-4 bg-black/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#5A5C64]">Resolves to execution graph</span>
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#3ECF8E]">
            <CircleDot size={10} className="animate-pulse" /> live
          </span>
        </div>
        <div className="flex items-center justify-between">
          {[
            { label: 'A', sub: 'level 0' },
            { label: 'B · C', sub: 'level 1 · parallel' },
            { label: 'D', sub: 'level 2' },
          ].map((n, i) => (
            <div key={n.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-11 h-11 rounded-xl border border-[#3ECF8E]/25 bg-[#3ECF8E]/[0.06] flex items-center justify-center text-xs font-mono font-bold text-[#3ECF8E]">
                  {n.label}
                </div>
                <span className="text-[9px] font-mono text-[#5A5C64]">{n.sub}</span>
              </div>
              {i < 2 && <div className="w-6 md:w-10 h-px bg-gradient-to-r from-[#3ECF8E]/40 to-[#3ECF8E]/10 mx-1 md:mx-2 mb-4" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Code panel with tabs, sourced from the real API reference ── */
function CodePanel() {
  const [tab, setTab] = useState<'run' | 'socket'>('run')
  const runSnippet = `await fetch('/api/execution/wf_92k1/run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Idempotency-Key': crypto.randomUUID(),
  },
})
// duplicate keys return the existing
// executionId instead of a new run`

  const socketSnippet = `socket.emit('join_workflow', workflowId)

socket.on('node_update', ({ nodeId, status, executionTime, fromCache }) => {
  // status: idle | running | success | error
  updateNode(nodeId, { status, executionTime, fromCache })
})`

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0E0F12] overflow-hidden">
      <div className="flex items-center border-b border-white/[0.06]">
        {(['run', 'socket'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3.5 text-xs font-mono font-medium transition-colors relative ${
              tab === t ? 'text-white' : 'text-[#5A5C64] hover:text-[#93959D]'
            }`}
          >
            {t === 'run' ? 'run-workflow.ts' : 'live-updates.ts'}
            {tab === t && <span className="absolute left-0 right-0 -bottom-px h-px bg-[#3ECF8E]" />}
          </button>
        ))}
        <span className="ml-auto mr-4 flex items-center gap-1 text-[10px] font-mono text-[#5A5C64]">
          <span className="w-2 h-2 rounded-full bg-[#3ECF8E]/70" /> 200 OK
        </span>
      </div>
      <pre className="p-5 text-[12.5px] leading-relaxed font-mono text-[#C9CBD1] overflow-x-auto">
        <code>{tab === 'run' ? runSnippet : socketSnippet}</code>
      </pre>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  copy,
  detail,
  className = '',
}: {
  icon: React.ElementType
  title: string
  copy: string
  detail: string
  className?: string
}) {
  return (
    <div
      className={`group rounded-2xl border border-white/[0.07] bg-[#0E0F12] p-6 hover:border-[#3ECF8E]/25 transition-colors duration-300 ${className}`}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-[#93959D] group-hover:text-[#3ECF8E] group-hover:border-[#3ECF8E]/25 transition-colors duration-300">
          <Icon size={16} />
        </div>
        <span className="text-[10px] font-mono text-[#5A5C64]">{detail}</span>
      </div>
      <h3 className="text-[15px] font-semibold text-white tracking-tight">{title}</h3>
      <p className="text-sm text-[#93959D] mt-2 leading-relaxed">{copy}</p>
    </div>
  )
}

function useCountUp(to: number, start: boolean, decimals = 0, duration = 1100) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!start) return
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setV(Number((to * eased).toFixed(decimals)))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start, to, decimals, duration])
  return v
}

export default function LandingPage({ onAction }: { onAction: (mode: Mode) => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(0)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const statsRef = useRef<HTMLDivElement>(null)
  const statsInView = useInView(statsRef, { once: true, amount: 0.4 })
  const cold = useCountUp(2700, statsInView)
  const warm = useCountUp(193, statsInView)
  const improvement = useCountUp(93, statsInView)
  const success = useCountUp(100, statsInView)

  const navLink = 'text-[13px] font-medium text-[#93959D] hover:text-white transition-colors'

  const fadeUp = reducedMotion
    ? {}
    : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 }, transition: { duration: 0.5, ease: 'easeOut' as const } }

  const features = [
    { icon: Layers, title: 'Infinite canvas', copy: 'Drag nodes onto a pan-and-zoom canvas built on React Flow. Connect by dragging handles, watch edges animate the direction of data.', detail: 'react-flow' },
    { icon: Braces, title: 'Postman-like editor', copy: 'Method, headers, auth helpers, body types, and {{ENV_VAR}} interpolation — configure a request the way you already know how.', detail: 'node config' },
    { icon: GitMerge, title: 'JSONPath field mapping', copy: 'Pipe a response field from any upstream node straight into the next URL, header, or body — resolved at execution time.', detail: '$.id → body.userId' },
    { icon: Boxes, title: 'Kahn\u2019s-algorithm DAG', copy: 'Nodes are topologically sorted into levels. Independent nodes in the same level run together with Promise.all.', detail: 'O(V + E)' },
    { icon: RefreshCw, title: 'BullMQ job queue', copy: 'Every run is a Redis-backed job with exponential-backoff retries, a dead-letter queue, and idempotency keys against double-runs.', detail: 'redis · bullmq' },
    { icon: Zap, title: 'Live socket streaming', copy: 'Each workflow gets its own Socket.io room. Node status, timing, and cache hits stream to the canvas as they happen.', detail: 'socket.io' },
  ]

  const useCases = [
    { icon: Lock, title: 'Auth flow', copy: 'Register → verify → issue token, chained as one testable graph instead of three manual Postman calls.' },
    { icon: GitMerge, title: 'Data chain', copy: 'Fetch a user, pipe their id into an orders lookup, pipe the order total into a billing call.' },
    { icon: Layers, title: 'Parallel fetch', copy: 'Hit five independent endpoints in the same level, fan the results back into one aggregation node.' },
    { icon: Webhook, title: 'Webhook validator', copy: 'Verify a signature, check a JSON schema, and continue-on-failure so one bad payload doesn\u2019t kill the run.' },
  ]

  const faqs = [
    { q: 'Why is a warm run 14x faster than a cold one?', a: 'Every node config is hashed with SHA256 (method + URL + headers + body) and the response is cached in Redis for 5 minutes. A cache hit returns in 0ms and skips the real HTTP call entirely — that\u2019s the 2700ms \u2192 193ms difference below.' },
    { q: 'What happens if I click Run twice?', a: 'Every run request carries a client-generated idempotency key. If DevFlow has already seen that key, it returns the existing execution instead of starting a duplicate one — covers double-clicks, network retries, and refreshes mid-run.' },
    { q: 'Can steps actually run in parallel?', a: 'Yes. Workflows are topologically sorted with Kahn\u2019s algorithm into execution levels. Everything in a level has no dependency on anything else in it, so the level runs as one Promise.all batch.' },
    { q: 'What happens when a node fails?', a: 'Per-node retry with exponential backoff (1s \u2192 2s \u2192 4s) and a 15s timeout. If it still fails, continue-on-failure marks that node and keeps executing the rest of the graph.' },
    { q: 'Can I self-host it?', a: 'Yes \u2014 docker-compose.yml ships Mongo, Redis, the API server, the worker process, and the client as separate services. The worker scales horizontally on its own.' },
  ]

  return (
    <div className="relative min-h-screen bg-[#0B0C0E] text-white font-sans overflow-x-hidden selection:bg-[#3ECF8E]/20 selection:text-white">
      {/* Ambient background */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 devflow2-dots opacity-[0.5]" />
        <div className="absolute top-[-10%] left-[10%] w-[50vw] h-[50vw] max-w-[720px] rounded-full bg-[#3ECF8E]/[0.06] blur-[130px]" />
        <div className="absolute top-[30%] right-[-10%] w-[40vw] h-[40vw] max-w-[600px] rounded-full bg-[#8B7CF6]/[0.04] blur-[140px]" />
        <div className="absolute inset-0 devflow2-grain opacity-[0.025] mix-blend-overlay" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 flex justify-center px-4 pt-4">
        <div
          className={`w-full max-w-6xl flex items-center justify-between px-5 py-2.5 rounded-full border backdrop-blur-xl transition-all duration-300 ${
            scrolled ? 'bg-[#0B0C0E]/85 border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.5)]' : 'bg-[#0B0C0E]/40 border-white/[0.06]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-[15px] font-bold tracking-tight">DevFlow</span>
          </div>

          <nav className="hidden md:flex items-center gap-7">
            <a href="#features" className={navLink}>Features</a>
            <a href="#engine" className={navLink}>Engine</a>
            <Link to="/pricing" className={navLink}>Pricing</Link>
            <Link to="/about" className={navLink}>About</Link>
            <Link to="/contact" className={navLink}>Contact</Link>
          </nav>

          <div className="hidden md:flex items-center gap-2">

            <Btn variant="ghost" className="px-3 py-1.5 text-[13px]" onClick={() => onAction('login')}>Sign in</Btn>
            <Btn variant="primary" className="px-4 py-1.5 text-[13px]" onClick={() => onAction('register')}>
              Start free <ArrowRight size={14} />
            </Btn>
          </div>

          <button aria-label="Toggle menu" onClick={() => setMobileMenuOpen((v) => !v)} className="md:hidden p-1.5 text-[#93959D]">
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden bg-[#0B0C0E]/98 backdrop-blur-xl flex flex-col px-8 pt-28 gap-7"
          >
            {['features', 'engine', 'pricing', 'faq'].map((id) => (
              <a key={id} href={`#${id}`} onClick={() => setMobileMenuOpen(false)} className="text-2xl font-bold capitalize text-center">
                {id}
              </a>
            ))}
            <div className="h-px bg-white/10 my-2" />
            <Btn variant="secondary" className="w-full py-3.5" onClick={() => { onAction('login'); setMobileMenuOpen(false) }}>Sign in</Btn>
            <Btn variant="primary" className="w-full py-3.5" onClick={() => { onAction('register'); setMobileMenuOpen(false) }}>Start free</Btn>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pt-20 md:pt-28 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
          <motion.div {...fadeUp}>
            <Eyebrow>Visual API orchestration</Eyebrow>
            <h1 className="text-[44px] sm:text-[56px] lg:text-[64px] font-extrabold tracking-tight leading-[1.02] mt-5">
              Chain your APIs.
              <br />
              <span className="bg-gradient-to-r from-[#3ECF8E] to-[#8B7CF6] bg-clip-text text-transparent">Watch them run live.</span>
            </h1>
            <p className="text-[17px] text-[#93959D] leading-relaxed mt-6 max-w-lg">
              Design workflows on an infinite canvas, execute them as a real DAG with parallel branches, and watch every node update over a live socket connection — no glue code.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-9">
              <Btn variant="primary" className="px-6 py-3.5 text-[15px]" onClick={() => onAction('register')}>
                Open the canvas <ArrowRight size={16} />
              </Btn>
              <Btn variant="secondary" className="px-6 py-3.5 text-[15px]" onClick={() => onAction('login')}>
                Sign in
              </Btn>
            </div>
            <div className="flex items-center gap-5 mt-9 text-[13px] text-[#5A5C64] font-mono">
              <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-[#3ECF8E]" /> encrypted credentials</span>
              <span className="flex items-center gap-1.5"><Terminal size={13} className="text-[#3ECF8E]" /> self-hostable</span>
            </div>
          </motion.div>

          <motion.div {...(reducedMotion ? {} : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.1, ease: 'easeOut' as const } })}>
            <CommandPaletteDemo />
          </motion.div>
        </div>
      </section>

      {/* Real benchmark stats — grounded, not filler */}
      <section ref={statsRef} className="relative z-10 border-y border-white/[0.06] bg-[#0E0F12]/60">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#5A5C64]">Benchmark — 8-node workflow, 20 concurrent runs</span>
            <ArrowUpRight size={13} className="text-[#5A5C64]" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Cold run', value: `${cold}ms`, sub: 'no cache' },
              { label: 'Warm run', value: `${warm}ms`, sub: 'all cached' },
              { label: 'Latency reduction', value: `${improvement}%`, sub: 'cache vs. cold' },
              { label: 'Success rate', value: `${success}%`, sub: 'across 20 runs' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tight">{s.value}</div>
                <div className="text-[13px] font-semibold text-[#3ECF8E] mt-1.5">{s.label}</div>
                <div className="text-[12px] text-[#5A5C64] mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-4 py-24">
        <motion.div {...fadeUp} className="max-w-xl mb-14">
          <Eyebrow>Everything the engine does</Eyebrow>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-4">Built like infrastructure, not a form builder.</h2>
          <p className="text-[#93959D] mt-4 leading-relaxed">Six pieces that add up to a real execution engine — not just a pretty canvas on top of a single HTTP call.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div key={f.title} {...fadeUp} transition={{ ...(fadeUp as any).transition, delay: i * 0.05 }}>
              <FeatureCard {...f} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Engine — Kahn's algorithm + code, grounded directly in the README */}
      <section id="engine" className="relative z-10 border-y border-white/[0.06] bg-[#0E0F12]/40 py-24">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp} className="max-w-xl mb-14">
            <Eyebrow>How execution actually works</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-4">Topological sort, not a for-loop.</h2>
            <p className="text-[#93959D] mt-4 leading-relaxed">
              Workflows are directed acyclic graphs. DevFlow builds an in-degree map, groups nodes with no unmet dependencies into levels, and runs each level with <code className="font-mono text-[#3ECF8E]">Promise.all</code>.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div {...fadeUp} className="rounded-2xl border border-white/[0.07] bg-[#0E0F12] p-7">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#5A5C64]">Example graph</span>
              <div className="mt-2 font-mono text-sm text-[#93959D]">
                A → B → D<br />A → C → D
              </div>
              <div className="mt-8 space-y-4">
                {[
                  { level: 'Level 0', nodes: 'A', note: 'no dependencies — runs first', width: '33%' },
                  { level: 'Level 1', nodes: 'B, C', note: 'independent — Promise.all([B, C])', width: '66%' },
                  { level: 'Level 2', nodes: 'D', note: 'waits on both B and C', width: '100%' },
                ].map((row) => (
                  <div key={row.level}>
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="text-[#3ECF8E]">{row.level}</span>
                      <span className="text-white font-semibold">{row.nodes}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full bg-[#3ECF8E]/60" style={{ width: row.width }} />
                    </div>
                    <div className="text-[11px] text-[#5A5C64] mt-1.5">{row.note}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-7 pt-5 border-t border-white/[0.06] text-[11px] font-mono text-[#5A5C64]">
                <span>time: O(V + E)</span>
                <span>space: O(V)</span>
              </div>
            </motion.div>

            <motion.div {...fadeUp} transition={{ ...(fadeUp as any).transition, delay: 0.08 }}>
              <CodePanel />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Use cases — Node Templates from the README */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-24">
        <motion.div {...fadeUp} className="max-w-xl mb-14">
          <Eyebrow>Starter templates</Eyebrow>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-4">Four graphs to fork on day one.</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {useCases.map((u, i) => (
            <motion.div
              key={u.title}
              {...fadeUp}
              transition={{ ...(fadeUp as any).transition, delay: i * 0.05 }}
              className="flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-[#0E0F12] p-6 hover:border-[#3ECF8E]/25 transition-colors"
            >
              <div className="w-9 h-9 shrink-0 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-[#3ECF8E]">
                <u.icon size={16} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-white">{u.title}</h3>
                <p className="text-sm text-[#93959D] mt-1.5 leading-relaxed">{u.copy}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing — tiers grounded in the real rate-limit numbers */}
      <section id="pricing" className="relative z-10 border-y border-white/[0.06] bg-[#0E0F12]/40 py-24">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp} className="max-w-xl mb-14">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-4">Priced the way the engine works.</h2>
            <p className="text-[#93959D] mt-4 leading-relaxed">Limits map directly to the queue — no vague "credits."</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[
              {
                tier: 'Free',
                price: '$0',
                copy: 'For prototyping a graph before you wire it into anything real.',
                items: ['3 active workflows', '100 executions / hour', 'Community support'],
                cta: 'Start free',
                variant: 'secondary' as BtnVariant,
              },
              {
                tier: 'Team',
                price: '$49',
                copy: 'For production workflows with real concurrency.',
                items: ['Unlimited workflows', '5 concurrent worker jobs', '100 executions / hour, per account', 'Priority Slack support'],
                cta: 'Go Team',
                variant: 'primary' as BtnVariant,
                highlighted: true,
              },
              {
                tier: 'Enterprise',
                price: 'Custom',
                copy: 'Self-hosted or dedicated infra with contractual SLAs.',
                items: ['Dedicated worker concurrency', 'Self-hosted via Docker Compose', 'SSO + audit log', '99.99% uptime SLA'],
                cta: 'Contact sales',
                variant: 'secondary' as BtnVariant,
              },
            ].map((p) => (
              <motion.div
                key={p.tier}
                {...fadeUp}
                className={`rounded-2xl p-7 flex flex-col justify-between ${
                  p.highlighted
                    ? 'border border-[#3ECF8E]/30 bg-[#0E0F12] shadow-[0_20px_60px_-20px_rgba(62,207,142,0.25)]'
                    : 'border border-white/[0.07] bg-[#0E0F12]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{p.tier}</span>
                    {p.highlighted && <span className="text-[10px] font-mono uppercase tracking-widest text-[#3ECF8E]">most used</span>}
                  </div>
                  <p className="text-[13px] text-[#93959D] mt-2 leading-relaxed">{p.copy}</p>
                  <div className="text-4xl font-extrabold tracking-tight text-white mt-6">
                    {p.price}
                    {p.price !== 'Custom' && <span className="text-sm font-medium text-[#5A5C64]"> /mo</span>}
                  </div>
                  <div className="h-px bg-white/[0.06] my-6" />
                  <ul className="space-y-3">
                    {p.items.map((it) => (
                      <li key={it} className="flex items-center gap-2.5 text-[13px] text-[#C9CBD1] font-mono">
                        <span className="w-1 h-1 rounded-full bg-[#3ECF8E]" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
                <Btn variant={p.variant} className="w-full py-3 mt-8 text-sm" onClick={() => onAction('register')}>
                  {p.cta}
                </Btn>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 max-w-3xl mx-auto px-4 py-24">
        <motion.h2 {...fadeUp} className="text-3xl md:text-5xl font-extrabold tracking-tight text-center mb-14">
          Questions, answered plainly.
        </motion.h2>
        <div className="flex flex-col gap-3">
          {faqs.map((f, idx) => {
            const isOpen = activeFaq === idx
            return (
              <div key={f.q} className="rounded-xl border border-white/[0.07] bg-[#0E0F12] overflow-hidden">
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-[14px] font-semibold text-white">{f.q}</span>
                  <ChevronDown size={16} className={`shrink-0 text-[#5A5C64] transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#3ECF8E]' : ''}`} />
                </button>
                <div className={`transition-[max-height,opacity] duration-300 overflow-hidden ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="px-5 pb-4 text-[13.5px] text-[#93959D] leading-relaxed">{f.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-24">
        <motion.div {...fadeUp} className="relative rounded-[28px] border border-white/10 bg-[#0E0F12] overflow-hidden px-8 py-16 md:py-20 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(62,207,142,0.10)_0%,transparent_60%)]" />
          <div className="relative">
            <Eyebrow>Ready when you are</Eyebrow>
            <h2 className="text-3xl md:text-6xl font-extrabold tracking-tight mt-5 leading-tight">
              Your next graph is <span className="text-[#3ECF8E]">three minutes</span> away.
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-9">
              <Btn variant="primary" className="px-8 py-4 text-[15px]" onClick={() => onAction('register')}>
                Open the canvas <ArrowRight size={16} />
              </Btn>
              <Btn variant="secondary" className="px-8 py-4 text-[15px]" onClick={() => onAction('login')}>
                <CornerDownLeft size={15} /> Sign in
              </Btn>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .font-sans { font-family: 'Inter', system-ui, sans-serif; }
        h1, h2, h3 { font-family: 'Inter Tight', 'Inter', system-ui, sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }

        .devflow2-dots {
          background-image: radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px);
          background-size: 26px 26px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 90%);
        }
        .devflow2-grain {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 180px 180px;
        }
      `}</style>
    </div>
  )
}