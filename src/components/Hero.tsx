import { ArrowRight, Zap, Play } from 'lucide-react';

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-obsidian"
      aria-label="Hero section"
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 bg-grid-teal bg-grid opacity-100 pointer-events-none"
        aria-hidden="true"
      />

      {/* Radial glow blobs */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,212,170,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,212,170,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,166,126,0.08) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
        {/* Live badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-core/30 bg-teal-core/5 mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-core opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-core" />
          </span>
          <Zap className="w-3 h-3 text-teal-core" />
          <span className="font-mono text-xs text-teal-core tracking-wider uppercase">
            Detailed Insights · Live
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-sans font-bold text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[1.05] tracking-tight mb-6 animate-fade-up">
          <span className="text-soft-white">Understand Financial</span>
          <br />
          <span className="text-soft-white">Statements.</span>{' '}
          <span className="text-teal-gradient">Instantly.</span>
        </h1>

        {/* Subtitle */}
        <p className="font-body text-lg sm:text-xl text-muted-ink max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          Turn complex financial data into simple, actionable insights.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
          <a
            href="#get-started"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-teal-core text-obsidian font-sans font-semibold text-base rounded-xl hover:bg-electric-teal transition-all duration-200 shadow-teal-glow hover:shadow-teal-glow-lg"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </a>
          <a
            href="#how-it-works"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-white/5 text-soft-white font-sans font-semibold text-base rounded-xl border border-border-mist hover:border-teal-core/40 hover:bg-white/8 transition-all duration-200"
          >
            <Play className="w-4 h-4 text-teal-core" />
            See How It Works
          </a>
        </div>

        {/* Social proof */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
          {[
            { value: '10+', label: 'Analyses Generated' },
            { value: '99.2%', label: 'Accuracy Rate' },
            { value: '<8s', label: 'Avg. Parse Time' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-mono text-2xl font-semibold text-teal-core">
                {stat.value}
              </div>
              <div className="font-body text-xs text-muted-ink mt-0.5 tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Terminal preview card */}
        <div className="mt-16 max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
          <div className="rounded-2xl border border-border-mist bg-surface-dark/80 backdrop-blur-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
            {/* Terminal header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-mist bg-obsidian/60">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-error/70" />
                <span className="w-3 h-3 rounded-full bg-warning/70" />
                <span className="w-3 h-3 rounded-full bg-success/70" />
              </div>
              <span className="font-mono text-xs text-muted-ink">FinSight Analysis Engine · v2.4.1</span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-core opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-core" />
                </span>
                <span className="font-mono text-xs text-teal-core">LIVE</span>
              </div>
            </div>
            {/* Terminal body */}
            <div className="p-6 text-left space-y-2 font-mono text-sm">
              <div className="flex gap-3">
                <span className="text-muted-ink select-none">$</span>
                <span className="text-electric-teal">analyze</span>
                <span className="text-soft-white">AAPL_10K_2024.pdf</span>
              </div>
              <div className="text-muted-ink text-xs pl-4">→ Parsing 284 pages...</div>
              <div className="text-muted-ink text-xs pl-4">→ Extracting financial tables...</div>
              <div className="text-muted-ink text-xs pl-4">
                → Running risk detection model{' '}
                <span className="text-teal-core">[✓ Complete]</span>
              </div>
              <div className="mt-4 p-4 rounded-xl bg-teal-core/5 border border-teal-core/20 space-y-2">
                <div className="text-teal-core text-xs font-semibold uppercase tracking-widest mb-3">
                  Analysis Output
                </div>
                {[
                  { key: 'Revenue Growth YoY', val: '+8.3%', color: 'text-success' },
                  { key: 'Debt/Equity Ratio', val: '1.73 ⚠', color: 'text-warning' },
                  { key: 'Operating Margin', val: '29.8%', color: 'text-teal-core' },
                  { key: 'Risk Level', val: 'LOW', color: 'text-success' },
                ].map((row) => (
                  <div key={row.key} className="flex items-center justify-between">
                    <span className="text-muted-ink text-xs">{row.key}</span>
                    <span className={`${row.color} text-xs font-semibold`}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
