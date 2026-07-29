import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Footer from '../components/ui/Footer'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleDot,
  HelpCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react'

export default function PricingPage() {
  const { isAuth } = useAuthStore()
  const home = isAuth ? '/dashboard' : '/'

  const [annual, setAnnual] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(0)

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      copy: 'For prototyping visual graphs before you wire them into production infra.',
      features: [
        '3 active workflows',
        '100 executions / hour',
        'Community support',
        'Redis 5-min caching',
        'Standard node templates',
      ],
      cta: 'Start Free',
      variant: 'secondary' as const,
    },
    {
      name: 'Team',
      price: annual ? '$39' : '$49',
      period: '/month',
      copy: 'For production engineering teams requiring real concurrency and SLAs.',
      features: [
        'Unlimited active workflows',
        '5 concurrent worker jobs',
        '1,000 executions / hour',
        'Priority Slack support',
        'Custom template library',
        'JSONPath field mapping',
        'Socket.io live streaming',
      ],
      cta: 'Go Team',
      variant: 'primary' as const,
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contractual SLA',
      copy: 'Self-hosted or dedicated infra with custom security and compliance.',
      features: [
        'Dedicated worker concurrency',
        'Self-hosted via Docker Compose',
        'SSO + audit log exports',
        '99.99% uptime SLA',
        'Custom node development',
        'Dedicated Slack channel',
      ],
      cta: 'Contact Sales',
      variant: 'secondary' as const,
    },
  ]

  const faqs = [
    {
      q: 'Why is a warm run 14x faster than a cold one?',
      a: 'Every node config is hashed with SHA256 (method + URL + headers + body) and the response is cached in Redis for 5 minutes. A cache hit skips the real HTTP call entirely — that’s how executions drop from 2700ms down to 193ms.',
    },
    {
      q: 'What happens if I click Run twice?',
      a: 'Every run request carries a client-generated idempotency key. If DevFlow has already seen that key, it returns the existing execution instead of starting a duplicate one.',
    },
    {
      q: 'Can steps actually run in parallel?',
      a: 'Yes. Workflows are topologically sorted with Kahn’s algorithm into execution levels. Independent nodes in the same level execute together as a single Promise.all batch.',
    },
    {
      q: 'Can I self-host DevFlow?',
      a: 'Yes — docker-compose.yml ships MongoDB, Redis, the API server, the BullMQ worker process, and the React client as decoupled services.',
    },
  ]

  return (
    <div className="relative min-h-screen bg-[#0B0C0E] text-[#F2F3F5] font-sans overflow-x-hidden selection:bg-[#3ECF8E]/20 selection:text-white">
      {/* Background Ambient Lighting */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[15%] w-[45vw] h-[45vw] max-w-[650px] rounded-full bg-[#3ECF8E]/[0.06] blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] max-w-[550px] rounded-full bg-[#8B7CF6]/[0.05] blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:26px_26px] opacity-40 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_30%,transparent_85%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-8 pb-20">
        {/* Back Link */}
        <Link
          to={home}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs font-medium text-[#93959D] hover:text-white hover:border-white/20 transition-all duration-150 mb-12"
        >
          <ArrowLeft size={14} className="text-[#3ECF8E]" />
          <span>{isAuth ? 'Back to dashboard' : 'Back to home'}</span>
        </Link>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono font-medium tracking-[0.14em] text-[#3ECF8E] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse" />
            Infrastructure Pricing
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.08] font-display text-white">
            Priced the way execution actually works.
          </h1>
          <p className="text-base sm:text-lg text-[#93959D] mt-4 leading-relaxed">
            No credit gymnastics. Limits map directly to job queue concurrency, Redis caching, and worker slots.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 mt-8 p-1.5 rounded-full bg-[#0E0F12] border border-white/10">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                !annual ? 'bg-white/[0.1] text-white' : 'text-[#93959D] hover:text-white'
              }`}
            >
              Monthly billing
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                annual ? 'bg-[#3ECF8E]/15 text-[#3ECF8E] border border-[#3ECF8E]/30' : 'text-[#93959D] hover:text-white'
              }`}
            >
              <span>Annual billing</span>
              <span className="text-[9px] font-mono uppercase bg-[#3ECF8E] text-[#06110C] font-bold px-1.5 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-20">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-200 ${
                t.highlighted
                  ? 'bg-[#0E0F12] border-2 border-[#3ECF8E]/40 shadow-[0_20px_60px_-15px_rgba(62,207,142,0.25)] relative'
                  : 'bg-[#0E0F12] border border-white/10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white font-display">{t.name}</span>
                  {t.highlighted && (
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#3ECF8E] bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 px-2.5 py-1 rounded-full font-bold">
                      Most Popular
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#93959D] mt-2 leading-relaxed">{t.copy}</p>

                <div className="text-4xl font-extrabold tracking-tight text-white mt-6 font-mono">
                  {t.price}
                  <span className="text-xs font-normal text-[#5A5C64]">{t.period}</span>
                </div>

                <div className="h-px bg-white/[0.06] my-6" />

                <ul className="space-y-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-xs text-[#C9CBD1] font-mono">
                      <Check size={14} className="text-[#3ECF8E] shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to={isAuth ? '/dashboard' : '/register'}
                className={`w-full py-3.5 mt-8 text-xs font-semibold rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  t.variant === 'primary'
                    ? 'bg-[#3ECF8E] text-[#06110C] hover:bg-[#5BDA9F] shadow-[0_0_0_1px_rgba(62,207,142,0.3),0_8px_20px_-4px_rgba(62,207,142,0.45)]'
                    : 'bg-white/[0.04] text-white border border-white/10 hover:bg-white/[0.08]'
                }`}
              >
                <span>{t.cta}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl font-extrabold tracking-tight font-display text-white text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((f, idx) => {
              const isOpen = activeFaq === idx
              return (
                <div key={f.q} className="rounded-2xl border border-white/[0.08] bg-[#0E0F12] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-white">{f.q}</span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-[#5A5C64] transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#3ECF8E]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-xs sm:text-sm text-[#93959D] leading-relaxed border-t border-white/[0.04] pt-3">
                      {f.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
