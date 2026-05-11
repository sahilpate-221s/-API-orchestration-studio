import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Footer from '../components/ui/Footer'

export default function AboutPage() {
  const { isAuth } = useAuthStore()
  const home = isAuth ? '/dashboard' : '/'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#000', fontFamily: '"Outfit", "Inter", sans-serif' }}>
      <div style={{ flex: 1, padding: '100px 40px', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow orbs */}
        <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', top: '-200px', right: '-100px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', bottom: '10%', left: '-100px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
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
            About DevFlow
          </h1>
          
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '48px', backdropFilter: 'blur(20px)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            <p style={{ fontSize: '20px', lineHeight: 1.8, color: 'rgba(255,255,255,0.7)', marginBottom: 32 }}>
              DevFlow is a visual workspace for designing and running API workflows. Connect nodes, map data between steps,
              and execute flows with a clear view of what each request is doing.
            </p>
            <p style={{ fontSize: '18px', lineHeight: 1.8, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
              Our mission is to reduce guesswork in software engineering. With DevFlow, you can see the graph, the workspace organization, and execution history in one single unified place so teams can iterate on complex integrations orders of magnitude faster.
            </p>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '32px', marginTop: '32px' }}>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'rgba(255,255,255,0.3)' }}>
                This page is informational. Product details and roadmap evolve with the project. <br/> Built for the modern engineer.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
