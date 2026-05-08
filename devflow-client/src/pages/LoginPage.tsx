import { useState } from 'react'
import { login, register } from '../services/authService'
import { useAuthStore } from '../store/authStore'

interface LoginPageProps {
  initialMode?: 'login' | 'register'
  onBack?: () => void
}

export default function LoginPage({ initialMode = 'login', onBack }: LoginPageProps) {
  const { setAuth } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const data = mode === 'login'
        ? await login({ email: form.email, password: form.password })
        : await register(form)
      setAuth(data.user, data.token)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m: 'login' | 'register') => {
    setMode(m)
    setError('')
    setForm({ email: '', password: '', name: '' })
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#000000',
      display: 'flex',
      fontFamily: '"Outfit", "Inter", sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

        .auth-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 15px;
          color: #ffffff;
          outline: none;
          transition: all 0.2s ease;
          font-family: inherit;
          box-sizing: border-box;
        }
        .auth-input::placeholder {
          color: rgba(255,255,255,0.2);
        }
        .auth-input:focus {
          border-color: rgba(99,102,241,0.6);
          background: rgba(99,102,241,0.05);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .auth-tab {
          flex: 1;
          padding: 8px 0;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .auth-tab-active {
          background: rgba(255,255,255,0.08);
          color: #ffffff;
        }
        .auth-tab-inactive {
          background: transparent;
          color: rgba(255,255,255,0.3);
        }
        .auth-tab-inactive:hover {
          color: rgba(255,255,255,0.6);
        }
        .auth-submit-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: #ffffff;
          color: #000000;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
          letter-spacing: -0.01em;
        }
        .auth-submit-btn:hover:not(:disabled) {
          background: #f4f4f5;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(255,255,255,0.15);
        }
        .auth-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .auth-submit-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .back-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          font-size: 14px;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s ease;
          padding: 0;
        }
        .back-btn:hover {
          color: rgba(255,255,255,0.7);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-3deg); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .orb1 {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
          top: -200px;
          right: -100px;
          pointer-events: none;
        }
        .orb2 {
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%);
          bottom: -100px;
          left: -100px;
          pointer-events: none;
        }
        .node-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          animation: float 6s ease-in-out infinite;
        }
        .node-card-b {
          animation: floatB 8s ease-in-out infinite;
          animation-delay: -2s;
        }
        .node-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
      `}</style>

      {/* Background glow orbs */}
      <div className="orb1" />
      <div className="orb2" />

      {/* Left: Decorative Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        position: 'relative',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '80px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: '#ffffff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: '0 0 20px rgba(255,255,255,0.2)',
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#000">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>DevFlow</span>
        </div>

        {/* Hero text */}
        <h2 style={{
          fontSize: '48px', fontWeight: 800, color: '#fff',
          lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: '20px',
        }}>
          Build APIs<br />
          <span style={{
            background: 'linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>visually.</span>
        </h2>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, maxWidth: '360px', marginBottom: '64px' }}>
          Design, test and deploy complex API workflows with a drag-and-drop canvas. No YAML. No guesswork.
        </p>

        {/* Decorative flow cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '380px' }}>
          {[
            { color: '#34d399', method: 'GET', label: 'Fetch User Profile', time: '12ms' },
            { color: '#60a5fa', method: 'POST', label: 'Send Notification', time: '38ms' },
            { color: '#f472b6', method: 'PUT', label: 'Update Order Status', time: '25ms' },
          ].map((node, i) => (
            <div key={i} className={`node-card ${i === 1 ? 'node-card-b' : ''}`}
              style={{ animationDelay: `${i * 1.5}s` }}>
              <div className="node-dot" style={{ background: node.color, boxShadow: `0 0 8px ${node.color}80` }} />
              <div style={{
                fontSize: '11px', fontWeight: 700, color: node.color,
                background: `${node.color}18`, padding: '3px 8px',
                borderRadius: '6px', flexShrink: 0,
              }}>{node.method}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', flex: 1 }}>{node.label}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{node.time}</div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '40px', marginTop: '64px' }}>
          {[['10k+', 'Workflows Built'], ['99.9%', 'Uptime'], ['<20ms', 'Avg Latency']].map(([val, label]) => (
            <div key={label}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{val}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Auth Form */}
      <div style={{
        width: '480px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 56px',
        position: 'relative',
      }}>
        {/* Back button */}
        {onBack && (
          <button className="back-btn" onClick={onBack} style={{ marginBottom: '40px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to home
          </button>
        )}

        {/* Heading */}
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginBottom: '8px', letterSpacing: '-0.03em' }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>
            {mode === 'login'
              ? 'Sign in to continue to your workspace.'
              : 'Start automating your APIs in minutes.'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '4px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '12px',
          marginBottom: '28px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              className={`auth-tab ${mode === m ? 'auth-tab-active' : 'auth-tab-inactive'}`}
              onClick={() => switchMode(m)}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', fontWeight: 500 }}>
                Full Name
              </label>
              <input
                className="auth-input"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', fontWeight: 500 }}>
              Email Address
            </label>
            <input
              className="auth-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', fontWeight: 500 }}>
              Password
            </label>
            <input
              className="auth-input"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '10px', padding: '12px 14px',
            marginBottom: '16px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: '13px', color: '#f87171' }}>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          className="auth-submit-btn"
          onClick={handleSubmit}
          disabled={loading}
          style={{ marginBottom: '24px' }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg style={{ animation: 'spin-slow 0.8s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.2)" strokeWidth="4"/>
                <path fill="rgba(0,0,0,0.6)" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              {mode === 'login' ? 'Signing in...' : 'Creating account...'}
            </span>
          ) : (
            mode === 'login' ? 'Sign In →' : 'Create Account →'
          )}
        </button>

        {/* Switch mode */}
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            style={{
              background: 'none', border: 'none', color: 'rgba(165,180,252,0.8)',
              cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
              fontWeight: 600, padding: 0,
              textDecoration: 'underline', textUnderlineOffset: '3px',
            }}
          >
            {mode === 'login' ? 'Sign up for free' : 'Sign in instead'}
          </button>
        </p>

        {/* Terms note */}
        {mode === 'register' && (
          <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.15)', marginTop: '20px', lineHeight: 1.6 }}>
            By creating an account you agree to our<br />Terms of Service and Privacy Policy.
          </p>
        )}
      </div>
    </div>
  )
}