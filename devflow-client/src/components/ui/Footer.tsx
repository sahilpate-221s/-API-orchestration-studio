export default function Footer() {
  return (
    <footer style={{ padding: '40px 60px 30px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#000', fontFamily: '"Outfit", "Inter", sans-serif', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '60px', maxWidth: '1400px', margin: '0 auto' }}>
         <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ 
                width: '28px', height: '28px', borderRadius: '8px', 
                background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'
              }}>
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                   <path d="M12 3L4 9V21L12 15L20 21V9L12 3Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                   <path d="M12 15V3" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                   <circle cx="12" cy="15" r="2" fill="white" />
                 </svg>
              </div>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>DevFlow</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', lineHeight: 1.7, maxWidth: '280px' }}>
              The world's most powerful visual API orchestration engine. Built for performance, designed for scale.
            </p>
         </div>
         {[
           { t: 'Product', l: ['Features', 'Engine', 'Templates', 'Pricing', 'Security'] },
           { t: 'Company', l: ['About Us', 'Careers', 'Blog', 'News', 'Contact'] },
           { t: 'Resources', l: ['Documentation', 'SDKs', 'Status', 'Open Source', 'Support'] },
         ].map(c => (
           <div key={c.t}>
             <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '24px', color: '#fff' }}>{c.t}</div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
               {c.l.map(link => (
                 <a key={link} href={link === 'Pricing' ? '/#pricing' : link === 'About Us' ? '/about' : link === 'Contact' ? '/contact' : '#'} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s ease' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                 >
                   {link}
                 </a>
               ))}
             </div>
           </div>
         ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: '80px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>
         © {new Date().getFullYear()} DevFlow Inc. All rights reserved.
      </div>
    </footer>
  )
}
