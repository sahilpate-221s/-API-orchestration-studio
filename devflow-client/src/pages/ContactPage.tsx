import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Footer from '../components/ui/Footer'
import {
  ArrowLeft,
  Mail,
  Send,
  Check,
  Copy,
  ShieldCheck,
  Building2,
  MessageSquare,
  Sparkles,
} from 'lucide-react'

export default function ContactPage() {
  const { isAuth } = useAuthStore()
  const home = isAuth ? '/dashboard' : '/'

  const [copied, setCopied] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
  })

  const copyEmail = () => {
    navigator.clipboard.writeText('support@devflow.app')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.message) return
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
    setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' })
  }

  return (
    <div className="relative min-h-screen bg-[#0B0C0E] text-[#F2F3F5] font-sans overflow-x-hidden selection:bg-[#3ECF8E]/20 selection:text-white">
      {/* Background Ambient Glow */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[10%] w-[50vw] h-[50vw] max-w-[680px] rounded-full bg-[#3ECF8E]/[0.06] blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[40vw] h-[40vw] max-w-[520px] rounded-full bg-[#8B7CF6]/[0.05] blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:26px_26px] opacity-40 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_30%,transparent_85%)]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-8 pb-20">
        {/* Back Link */}
        <Link
          to={home}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs font-medium text-[#93959D] hover:text-white hover:border-white/20 transition-all duration-150 mb-10"
        >
          <ArrowLeft size={14} className="text-[#3ECF8E]" />
          <span>{isAuth ? 'Back to dashboard' : 'Back to home'}</span>
        </Link>

        {/* Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono font-medium tracking-[0.14em] text-[#3ECF8E] uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse" />
            Engineering Support
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-display text-white">
            Get in touch with engineering.
          </h1>
        </div>

        {/* 3 Visual Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {/* Email Box */}
          <div className="p-5 rounded-2xl bg-[#0E0F12] border border-white/10 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 flex items-center justify-center text-[#3ECF8E] mb-3">
                <Mail size={16} />
              </div>
              <h3 className="text-sm font-semibold text-white">Direct Email</h3>
              <p className="text-xs text-[#93959D] mt-0.5">Response within 24h</p>
            </div>
            <button
              type="button"
              onClick={copyEmail}
              className="mt-4 flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-xs font-mono text-white transition-colors cursor-pointer"
            >
              <span className="truncate">support@devflow.app</span>
              {copied ? <Check size={13} className="text-[#3ECF8E] shrink-0" /> : <Copy size={13} className="text-[#5A5C64] shrink-0" />}
            </button>
          </div>

          {/* Community Box */}
          <div className="p-5 rounded-2xl bg-[#0E0F12] border border-white/10 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-[#8B7CF6]/10 border border-[#8B7CF6]/25 flex items-center justify-center text-[#8B7CF6] mb-3">
                <MessageSquare size={16} />
              </div>
              <h3 className="text-sm font-semibold text-white">Community Chat</h3>
              <p className="text-xs text-[#93959D] mt-0.5">Discord & GitHub Discussions</p>
            </div>
            <div className="mt-4 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono text-[#3ECF8E] flex items-center gap-1.5">
              <Sparkles size={13} /> Active Core Devs
            </div>
          </div>

          {/* Enterprise Box */}
          <div className="p-5 rounded-2xl bg-[#0E0F12] border border-white/10 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 flex items-center justify-center text-[#3ECF8E] mb-3">
                <Building2 size={16} />
              </div>
              <h3 className="text-sm font-semibold text-white">Enterprise SLA</h3>
              <p className="text-xs text-[#93959D] mt-0.5">Self-Host Docker setup</p>
            </div>
            <div className="mt-4 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono text-[#93959D] flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[#3ECF8E]" /> Dedicated Concurrency
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="max-w-2xl mx-auto p-7 sm:p-9 rounded-3xl bg-[#0E0F12] border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
          {submitted ? (
            <div className="p-6 rounded-2xl bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 text-center space-y-2">
              <Check size={28} className="mx-auto text-[#3ECF8E]" />
              <h3 className="text-base font-bold text-white">Message Delivered</h3>
              <p className="text-xs text-[#C9CBD1]">Thank you for reaching out. An engineer will respond shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#93959D] mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-[#3ECF8E]/60 focus:bg-[#3ECF8E]/[0.03] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all placeholder:text-[#5A5C64]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#93959D] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@company.com"
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-[#3ECF8E]/60 focus:bg-[#3ECF8E]/[0.03] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all placeholder:text-[#5A5C64]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#93959D] mb-1">
                  Topic / Category
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-[#131417] border border-white/10 focus:border-[#3ECF8E]/60 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all cursor-pointer"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Enterprise Self-Host">Enterprise Self-Host Deployment</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Feature Request">Feature Request</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#93959D] mb-1">
                  Message
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your request..."
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-[#3ECF8E]/60 focus:bg-[#3ECF8E]/[0.03] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all placeholder:text-[#5A5C64] resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 rounded-full bg-[#3ECF8E] hover:bg-[#5BDA9F] text-[#06110C] font-semibold text-xs transition-all active:scale-[0.98] shadow-[0_0_0_1px_rgba(62,207,142,0.3),0_8px_20px_-4px_rgba(62,207,142,0.45)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={13} />
                <span>Send Message</span>
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
