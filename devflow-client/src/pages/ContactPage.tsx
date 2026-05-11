import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Footer from '../components/ui/Footer'

export default function ContactPage() {
  const { isAuth } = useAuthStore()
  const home = isAuth ? '/dashboard' : '/'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#000', fontFamily: '"Outfit", "Inter", sans-serif' }}>
      <div style={{ flex: 1, padding: '100px 40px', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow orbs */}
        <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', top: '-200px', left: '-100px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', bottom: '10%', right: '-100px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Link
            to={home}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: 'rgba(255,255,255,0.55)',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 48,
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
          >
            ← {isAuth ? 'Back to dashboard' : 'Back to home'}
          </Link>

          <h1 style={{ fontSize: '56px', fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', marginBottom: 24 }}>
            Contact Us
          </h1>
          
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '48px', backdropFilter: 'blur(20px)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            <p style={{ fontSize: '20px', lineHeight: 1.8, color: 'rgba(255,255,255,0.7)', marginBottom: 40 }}>
              Have questions, feedback, or enterprise partnership ideas? Reach out to our engineering and support team directly.
            </p>
            
            <a
              href="mailto:support@devflow.app?subject=DevFlow%20inquiry"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: 18,
                fontWeight: 700,
                color: '#000000',
                textDecoration: 'none',
                padding: '16px 32px',
                borderRadius: '12px',
                background: '#ffffff',
                boxShadow: '0 8px 24px rgba(255,255,255,0.15)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(255,255,255,0.2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,255,255,0.15)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              support@devflow.app
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
