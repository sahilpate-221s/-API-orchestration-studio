import { useState, useEffect, useRef } from 'react'

interface GSAP {
  timeline(): any
  from(target: any, vars: any): any
  fromTo(target: any, fromVars: any, toVars: any): any
}

export default function LandingPage({ onAction }: { onAction: (mode: 'login' | 'register') => void }) {
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)
  const btnsRef = useRef<HTMLDivElement>(null)
  const visualRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)

    // Load GSAP from CDN
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js'
    script.async = true
    script.onload = () => {
    const gsap = (window as { gsap?: GSAP } & typeof globalThis).gsap
      if (gsap && titleRef.current) {
        // Hero entry animation
        const tl = gsap.timeline()
        tl.fromTo(titleRef.current, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power4.out', delay: 0.2 })
          .fromTo(descRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.6')
          .fromTo(btnsRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.4')
          .fromTo(visualRef.current, { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out' }, '-=0.5')

        // Scroll reveal animations
        const revealEls = document.querySelectorAll('.gsap-reveal')
        revealEls.forEach((el) => {
          gsap.fromTo(el, { y: 40, opacity: 0 }, {
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none none'
            },
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out'
          })
        })
      }
    }
    document.head.appendChild(script)

    // ScrollTrigger script
    const stScript = document.createElement('script')
    stScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js'
    stScript.async = true
    document.head.appendChild(stScript)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: '#000000',
        color: '#ffffff',
        fontFamily: '"Outfit", "Inter", sans-serif',
        overflow: 'visible',
        scrollBehavior: 'smooth',
      }}
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
          
          .glass-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(16px);
            border-radius: 32px;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .glass-card:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.15);
            transform: translateY(-12px);
            box-shadow: 0 40px 80px rgba(0,0,0,0.7);
          }
          .gradient-text-gold {
            background: linear-gradient(135deg, #fff 0%, #fbbf24 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .nav-link {
            font-size: 14px;
            fontWeight: 500;
            color: rgba(255,255,255,0.5);
            text-decoration: none;
            transition: color 0.2s;
          }
          .nav-link:hover {
            color: #fff;
          }
          .primary-btn {
            background: #ffffff;
            color: #000000;
            padding: 16px 36px;
            border-radius: 14px;
            font-weight: 700;
            font-size: 16px;
            border: none;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 10px 20px rgba(255,255,255,0.1);
          }
          .primary-btn:hover {
            background: #f4f4f5;
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 20px 40px rgba(255,255,255,0.2);
          }
          .code-block {
            background: #0a0a0a;
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 16px;
            padding: 24px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
            color: #a5b4fc;
            line-height: 1.6;
            box-shadow: inset 0 0 40px rgba(0,0,0,0.5);
          }
        `}
      </style>

      {/* Navigation */}
      <nav style={{
        height: '80px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 80px',
        position: 'fixed',
        top: 0,
        zIndex: 1000,
        background: scrolled ? 'rgba(0,0,0,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        transition: 'all 0.4s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '11px', 
            background: 'rgba(255, 255, 255, 0.05)', 
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}>
             <div style={{
               position: 'absolute',
               width: '100%',
               height: '100%',
               background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 70%)',
             }} />
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
               <path d="M12 3L4 9V21L12 15L20 21V9L12 3Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
               <path d="M12 15V3" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
               <circle cx="12" cy="15" r="2" fill="white" />
             </svg>
          </div>
          <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.04em' }}>DevFlow</span>
        </div>
        <div style={{ display: 'flex', gap: '48px', alignItems: 'center' }}>
          <a href="#features" className="nav-link">Features</a>
          <a href="#engine" className="nav-link">The Engine</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              className="nav-link" 
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => onAction('login')}
            >
              Sign In
            </button>
            <button 
              className="primary-btn" 
              style={{ padding: '10px 24px', fontSize: '14px' }} 
              onClick={() => onAction('register')}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} style={{
        padding: '240px 20px 160px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'radial-gradient(circle at 50% 10%, rgba(255,255,255,0.05) 0%, transparent 50%)',
      }}>
        <h1 ref={titleRef} style={{
          fontSize: '110px',
          fontWeight: 800,
          lineHeight: 0.95,
          maxWidth: '1100px',
          marginBottom: '32px',
          letterSpacing: '-0.06em',
          background: 'linear-gradient(to bottom, #fff 50%, rgba(255,255,255,0.2))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Automate APIs <br /> with visual logic.
        </h1>

        <p ref={descRef} style={{
          fontSize: '24px',
          color: 'rgba(255,255,255,0.45)',
          maxWidth: '740px',
          lineHeight: 1.6,
          marginBottom: '64px',
          fontWeight: 400,
        }}>
          DevFlow is the powerful workflow engine for modern engineering teams. 
          Build, test, and scale mission-critical API flows in record time.
        </p>

        <div ref={btnsRef} style={{ display: 'flex', gap: '24px' }}>
          <button className="primary-btn" onClick={() => onAction('register')}>
             Launch App — It's Free
          </button>
          <button 
            onClick={() => onAction('login')}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '14px', padding: '16px 40px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
             Sign In
          </button>
        </div>

        {/* Hero Dashboard Visual */}
        <div ref={visualRef} style={{
          marginTop: '120px',
          width: '100%',
          maxWidth: '1300px',
          borderRadius: '40px',
          padding: '2px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%)',
          boxShadow: '0 80px 160px rgba(0,0,0,0.9)',
          position: 'relative',
        }}>
          <div style={{ borderRadius: '38px', overflow: 'hidden', position: 'relative', background: '#0a0a0a' }}>
            <div style={{ width: '100%', height: '500px', background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.03) 0%, transparent 50%)' }} />
              <div style={{ position: 'relative', zIndex: 2, padding: '40px', color: '#fff', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', opacity: 0.9 }}>DevFlow Dashboard Preview</div>
                <div style={{ fontSize: '14px', opacity: 0.6, maxWidth: '300px' }}>Drag & drop workflow nodes, real-time execution preview, and seamless API orchestration interface.</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 1: The Engine (Text Heavy) */}
      <section id="engine" style={{ padding: '160px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '100px', alignItems: 'center' }}>
           <div className="gsap-reveal">
              <h2 style={{ fontSize: '64px', fontWeight: 800, marginBottom: '32px', lineHeight: 1.1, letterSpacing: '-0.04em' }}>
                Engineered for <br /> massive scale.
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: 'rgba(255,255,255,0.5)', fontSize: '18px', lineHeight: 1.7 }}>
                 <p>
                    Most workflow tools are built for simple automations. DevFlow is different. We built a custom execution engine from the ground up to handle high-throughput production environments.
                 </p>
                 <p>
                    Whether you are processing 10 webhooks per day or 10,000 requests per second, DevFlow scales elastically across our global edge network. Your logic is executed as close to your users as possible, ensuring sub-20ms latency.
                 </p>
                 <p>
                    With built-in circuit breakers, automatic retries with exponential backoff, and stateful error handling, your API infrastructure has never been more resilient.
                 </p>
              </div>
           </div>
           <div className="gsap-reveal" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="code-block">
                <div style={{ color: '#ffffff', opacity: 0.4, marginBottom: '8px' }}>// Initialize Flow Engine</div>
                <div>const engine = new DevFlow('v2.0');</div>
                <br />
                <div style={{ color: '#ffffff' }}>engine.on('webhook_received', async (ctx) =&gt; &#123;</div>
                <div style={{ paddingLeft: '20px' }}>
                  await ctx.validate(); <br />
                  await ctx.transform('user_data'); <br />
                  await ctx.dispatch('crm_sync');
                </div>
                <div style={{ color: '#818cf8' }}>&#125;);</div>
              </div>
              <div className="glass-card" style={{ padding: '32px' }}>
                 <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>99.999% Reliability</div>
                 <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>Enterprise-grade SLA guaranteed for all mission-critical production workflows.</div>
              </div>
           </div>
        </div>
      </section>

      {/* Section 2: Features Grid (Bento) */}
      <section id="features" style={{ padding: '160px 20px', background: '#050505' }}>
        <div style={{ textAlign: 'center', marginBottom: '100px' }} className="gsap-reveal">
           <h2 style={{ fontSize: '72px', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.04em' }}>Built for builders.</h2>
           <p style={{ fontSize: '22px', color: 'rgba(255,255,255,0.4)', maxWidth: '600px', margin: '0 auto' }}>Every feature you need to orchestrate the modern web.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: 'repeat(2, 400px)',
          gap: '24px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
           {/* Bento 1: Visual Canvas */}
           <div className="glass-card gsap-reveal" style={{ gridColumn: 'span 8', padding: '50px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ maxWidth: '400px' }}>
                <h3 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '20px' }}>The Visual-First Canvas</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px', lineHeight: 1.6 }}>
                   Stop wrestling with JSON configuration files. Our high-performance canvas allows you to map out complex logic with intuitive drag-and-drop nodes.
                </p>
              </div>
              <div style={{ position: 'absolute', right: '-40px', bottom: '-40px', width: '400px', height: '300px', background: 'rgba(255,255,255,0.02)', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)' }} />
           </div>
           
           {/* Bento 2: Latency */}
           <div className="glass-card gsap-reveal" style={{ gridColumn: 'span 4', padding: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(rgba(139,92,246,0.1), transparent)' }}>
              <div style={{ fontSize: '64px', fontWeight: 800, color: '#a78bfa', marginBottom: '12px' }}>12ms</div>
              <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Edge Execution</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px' }}>Distributed across 40+ global regions for instant responsiveness.</p>
           </div>

           {/* Bento 3: Monitoring */}
           <div className="glass-card gsap-reveal" style={{ gridColumn: 'span 5', padding: '50px' }}>
              <h3 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px' }}>Real-time Observability</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Granular logs for every request. Watch your data flow through nodes in real-time with our live debug mode.</p>
              <div style={{ marginTop: '40px', display: 'flex', gap: '8px' }}>
                 {[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: '4px', background: i < 4 ? '#34d399' : 'rgba(255,255,255,0.1)', borderRadius: '2px' }} />)}
              </div>
           </div>

           {/* Bento 4: Integrations */}
           <div className="glass-card gsap-reveal" style={{ gridColumn: 'span 7', padding: '50px', display: 'flex', gap: '60px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '20px' }}>Native Integrations</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '17px' }}>Connect to Stripe, Slack, Twilio, and 500+ other services out of the box. Or use our HTTP node for everything else.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                 {[1,2,3,4,5,6,7,8,9].map(i => <div key={i} style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />)}
              </div>
           </div>
        </div>
      </section>

      {/* New Section: How it Works */}
      <section style={{ padding: '160px 20px', background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }} className="gsap-reveal">
           <h2 style={{ fontSize: '56px', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.04em' }}>How it works.</h2>
           <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.4)', maxWidth: '600px', margin: '0 auto' }}>From concept to production in three simple steps.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', maxWidth: '1200px', margin: '0 auto' }}>
           {[
             { step: '01', title: 'Connect Your Data', desc: 'Drag and drop nodes to connect to your databases, SaaS apps, and internal APIs securely.' },
             { step: '02', title: 'Define Logic', desc: 'Use visual conditional branching, loops, and data transformation nodes without writing boilerplate.' },
             { step: '03', title: 'Deploy & Monitor', desc: 'Hit publish to deploy instantly to the edge. Monitor executions with real-time logging.' },
           ].map((s, i) => (
             <div key={i} className="gsap-reveal glass-card" style={{ padding: '40px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: '80px', fontWeight: 800, color: 'rgba(255,255,255,0.03)', position: 'absolute', top: '-10px', right: '10px', lineHeight: 1 }}>{s.step}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', position: 'relative', zIndex: 1 }}>{s.title}</div>
                <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, position: 'relative', zIndex: 1 }}>{s.desc}</p>
             </div>
           ))}
        </div>
      </section>

      {/* New Section: Use Cases */}
      <section style={{ padding: '160px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '100px' }} className="gsap-reveal">
           <h2 style={{ fontSize: '56px', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.04em' }}>Endless possibilities.</h2>
           <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.4)', maxWidth: '700px', margin: '0 auto' }}>Whether you are a startup or a Fortune 500, DevFlow adapts to your needs.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px' }}>
           {[
             { title: 'Automated Onboarding', content: 'Sync user data across your CRM, marketing platform, and internal databases the second they sign up.', color: '#8b5cf6' },
             { title: 'Real-time Payment Processing', content: 'Listen for Stripe webhooks, validate inventory, and trigger fulfillment logic instantly.', color: '#3b82f6' },
             { title: 'Data Aggregation', content: 'Fetch data from multiple disparate REST APIs, transform the payload, and cache it in Redis.', color: '#10b981' },
             { title: 'Alerting & Monitoring', content: 'Set up complex thresholds that trigger multi-channel alerts (Slack, SMS, Email) when anomalies occur.', color: '#f43f5e' },
           ].map((uc, i) => (
             <div key={i} className="gsap-reveal" style={{ 
               padding: '40px', 
               background: 'rgba(255,255,255,0.02)', 
               borderRadius: '24px', 
               borderLeft: `4px solid ${uc.color}`,
               transition: 'transform 0.3s ease',
               cursor: 'default'
             }}
             onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(10px)'}
             onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
             >
                <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>{uc.title}</div>
                <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{uc.content}</p>
             </div>
           ))}
        </div>
      </section>

      {/* Section 3: Deep Dive Text Section */}
      <section style={{ padding: '160px 20px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
         <h2 className="gsap-reveal" style={{ fontSize: '56px', fontWeight: 800, marginBottom: '40px' }}>Why DevFlow?</h2>
         <div className="gsap-reveal" style={{ display: 'flex', flexDirection: 'column', gap: '48px', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontSize: '20px', lineHeight: 1.8 }}>
            <p>
              The digital landscape is becoming increasingly fragmented. Modern applications aren't single monoliths anymore; they are orchestrations of dozens of third-party APIs, microservices, and serverless functions.
            </p>
            <p>
              Traditional integration tools force you to choose between two extremes: complex, hard-to-maintain code or rigid, "no-code" platforms that don't scale. DevFlow bridges this gap. 
            </p>
            <p>
              We provide the flexibility of code with the speed of a visual interface. Our "Visual Logic" approach allows your entire team—from developers to product managers—to understand exactly how data moves through your system.
            </p>
            <blockquote style={{ paddingLeft: '32px', borderLeft: '4px solid #ffffff', color: '#fff', fontSize: '24px', fontWeight: 600, fontStyle: 'italic', margin: '20px 0' }}>
              "DevFlow has reduced our integration cycle from weeks to hours. It is the most important tool in our stack."
            </blockquote>
            <p>
              Join thousands of teams who have already made the switch. Whether you are building an automated customer onboarding flow, a real-time data sync, or a multi-step financial transaction engine, DevFlow is built for you.
            </p>
         </div>
      </section>

      {/* Section 4: Pricing */}
      <section id="pricing" style={{ padding: '160px 20px', background: 'linear-gradient(to bottom, #000, #080808)' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }} className="gsap-reveal">
           <h2 style={{ fontSize: '64px', fontWeight: 800, marginBottom: '20px' }}>Scale with us.</h2>
           <p style={{ fontSize: '22px', color: 'rgba(255,255,255,0.4)' }}>Flexible plans for every stage of your growth.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
           {[
             { name: 'Developer', price: '$0', desc: 'Perfect for side projects.', features: ['3 Workflows', '10k Runs/mo', 'Standard Support', 'Core HTTP Nodes'] },
             { name: 'Professional', price: '$99', desc: 'For growing startups.', features: ['Unlimited Workflows', '250k Runs/mo', 'Priority Support', 'Advanced Logic', 'Custom Webhooks'], featured: true },
             { name: 'Enterprise', price: 'Custom', desc: 'Built for the Fortune 500.', features: ['Unlimited Everything', 'SLA Guarantee', 'Dedicated Manager', 'SSO & IAM', 'On-premise Host'] },
           ].map(p => (
             <div key={p.name} className="gsap-reveal glass-card" style={{ padding: '50px', border: p.featured ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
                {p.featured && <div style={{ position: 'absolute', top: '20px', right: '20px', background: '#6366f1', color: '#fff', padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Popular</div>}
                <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>{p.name}</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', marginBottom: '32px' }}>{p.desc}</div>
                <div style={{ fontSize: '56px', fontWeight: 800, marginBottom: '40px' }}>{p.price}<span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.2)' }}>{p.price !== 'Custom' ? '/mo' : ''}</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '50px' }}>
                   {p.features.map(f => (
                     <div key={f} style={{ display: 'flex', gap: '12px', fontSize: '15px', color: 'rgba(255,255,255,0.5)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={p.featured ? '#ffffff' : '#444'} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        {f}
                     </div>
                   ))}
                </div>
                <button 
                  onClick={() => onAction('register')}
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', background: p.featured ? '#fff' : 'rgba(255,255,255,0.05)', color: p.featured ? '#000' : '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease' }}>
                  Get Started
                </button>
             </div>
           ))}
        </div>
      </section>

      {/* Section 5: FAQ */}
      <section style={{ padding: '160px 20px' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
           <h2 className="gsap-reveal" style={{ fontSize: '48px', fontWeight: 800, marginBottom: '64px', textAlign: 'center' }}>Questions?</h2>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { q: 'How is DevFlow different from Zapier?', a: 'Zapier is built for non-technical business automation. DevFlow is built for engineers. We provide lower latency, more granular control over logic, and professional debugging tools.' },
                { q: 'Can I use my own API keys?', a: 'Absolutely. We never store your clear-text keys. Everything is encrypted at the hardware level using HSMs.' },
                { q: 'What is your uptime guarantee?', a: 'Our Professional and Enterprise plans come with a 99.99% uptime SLA. We are globally distributed to prevent single points of failure.' },
                { q: 'Does it support version control?', a: 'Yes. Every change you make is versioned. You can roll back to any previous state of your workflow with a single click.' },
              ].map((f, i) => (
                <div key={i} className="gsap-reveal" style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
                   <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>{f.q}</div>
                   <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, fontSize: '16px' }}>{f.a}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '160px 20px', textAlign: 'center' }}>
         <div className="gsap-reveal" style={{
           maxWidth: '1100px',
           margin: '0 auto',
           background: 'linear-gradient(135deg, #111 0%, #000 100%)',
           padding: '120px 60px',
           borderRadius: '60px',
           border: '1px solid rgba(255,255,255,0.1)',
           position: 'relative',
           overflow: 'hidden'
         }}>
            <h2 style={{ fontSize: '72px', fontWeight: 800, marginBottom: '32px', letterSpacing: '-0.04em' }}>Build the future.</h2>
            <p style={{ fontSize: '24px', color: 'rgba(255,255,255,0.4)', marginBottom: '64px' }}>Stop building plumbing. Start building product.</p>
            <button className="primary-btn" style={{ padding: '20px 60px', fontSize: '20px' }} onClick={() => onAction('register')}>
               Get Started — It's Free
            </button>
         </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '120px 100px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '100px', maxWidth: '1400px', margin: '0 auto' }}>
           <div>
              <div style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>DevFlow</div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '15px', lineHeight: 1.7, maxWidth: '280px' }}>
                The world's most powerful visual API orchestration engine. Built for performance, designed for scale.
              </p>
           </div>
           {[
             { t: 'Product', l: ['Features', 'Engine', 'Templates', 'Pricing', 'Security'] },
             { t: 'Company', l: ['About Us', 'Careers', 'Blog', 'News', 'Contact'] },
             { t: 'Resources', l: ['Documentation', 'SDKs', 'Status', 'Open Source', 'Support'] },
           ].map(c => (
             <div key={c.t}>
               <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '32px' }}>{c.t}</div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {c.l.map(link => <a key={link} href="#" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>{link}</a>)}
               </div>
             </div>
           ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', marginTop: '100px', paddingTop: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
           © 2026 DevFlow Inc. Made with precision for the modern engineer.
        </div>
      </footer>
    </div>
  )
}
