export function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#08090a]/80 backdrop-blur-xl">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* TikTok-esque logo mark */}
          <div className="relative w-7 h-7">
            <div className="absolute inset-0 rounded-md bg-gradient-to-br from-[#FE2C55] to-[#ff7043]" />
            <div className="absolute inset-0 rounded-md bg-gradient-to-br from-[#25F4EE] to-transparent opacity-60 mix-blend-screen" style={{ transform: 'translate(-1.5px, 1.5px)' }} />
            <svg className="absolute inset-0 w-full h-full p-1.5" viewBox="0 0 24 24" fill="white">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.55a8.27 8.27 0 004.83 1.55V7.67a4.85 4.85 0 01-1.06-.98z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
              TikTok Live Monitor
            </h1>
            <p className="text-[10px] text-white/30 leading-none mt-0.5">Real-time chat tracker</p>
          </div>
        </div>
        {children}
      </div>
    </header>
  );
}
