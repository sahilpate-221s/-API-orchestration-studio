import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="w-full bg-[#0B0C0E] border-t border-white/[0.08] px-6 py-12 font-sans select-none">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#131417] border border-white/10 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(62,207,142,0.25)_0%,transparent_65%)]" />
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L4 9V21L12 15L20 21V9L12 3Z" stroke="#3ECF8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="15" r="1.8" fill="#3ECF8E" />
              </svg>
            </div>
            <span className="text-base font-bold text-white tracking-tight font-display">DevFlow</span>
          </div>
          <p className="text-xs text-[#93959D] leading-relaxed max-w-xs">
            The visual API orchestration engine built for performance, scale, and topological parallel execution.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-4">Product</h4>
          <ul className="space-y-2.5 text-xs text-[#93959D]">
            <li><Link to="/#features" className="hover:text-white transition-colors">Features</Link></li>
            <li><Link to="/#engine" className="hover:text-white transition-colors">DAG Engine</Link></li>
            <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-4">Company</h4>
          <ul className="space-y-2.5 text-xs text-[#93959D]">
            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact Engineering</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-4">System Status</h4>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-[#3ECF8E]">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse" /> Operational</span>
              <span>100% Uptime</span>
            </div>
            <p className="text-[10px] text-[#5A5C64]">Redis Cache · BullMQ Worker · API Engine</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto border-t border-white/[0.06] mt-10 pt-6 text-center text-xs font-mono text-[#5A5C64]">
        © {new Date().getFullYear()} DevFlow Inc. All rights reserved.
      </div>
    </footer>
  )
}
