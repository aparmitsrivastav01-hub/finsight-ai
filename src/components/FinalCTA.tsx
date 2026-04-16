import { ArrowRight, Sparkles } from 'lucide-react';

const stats = [
  { value: '10+', label: 'Analyses Generated' },
  { value: '99.2%', label: 'Accuracy Rate' },
  { value: '4.9★', label: 'User Rating' },
];

export default function FinalCTA() {
  return (
    <section
      id="get-started"
      className="relative py-24 lg:py-32 bg-obsidian overflow-hidden"
      aria-label="Final call to action"
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,212,170,0.1) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 bg-grid-teal bg-grid pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-core/30 bg-teal-core/5 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-teal-core" />
          <span className="font-mono text-xs text-teal-core tracking-widest uppercase">
            Get Started Today
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-sans font-bold text-4xl sm:text-5xl lg:text-6xl text-soft-white mb-5 tracking-tight leading-[1.1]">
          Stop reading reports.{' '}
          <span className="text-teal-gradient">Start understanding them.</span>
        </h2>

        {/* Supporting copy */}
        <p className="font-body text-lg text-muted-ink max-w-2xl mx-auto mb-10 leading-relaxed">
          Join over 12,000 financial professionals who've replaced hours of manual analysis with
          FinSight's AI-powered insights. Free to start. No credit card required.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <a
            href="#signup"
            className="group inline-flex items-center gap-2.5 px-8 py-4 bg-teal-core text-obsidian font-sans font-semibold text-base rounded-xl hover:bg-electric-teal transition-all duration-200 shadow-teal-glow hover:shadow-teal-glow-lg animate-glow-pulse"
          >
            Create Free Account
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </a>
          <a
            href="#login"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-white/5 text-soft-white font-sans font-semibold text-base rounded-xl border border-border-mist hover:border-teal-core/40 hover:bg-white/8 transition-all duration-200"
          >
            Already have an account? Login
          </a>
        </div>

        {/* Stats bar */}
        <div className="inline-flex flex-col sm:flex-row items-center justify-center divide-y sm:divide-y-0 sm:divide-x divide-border-mist rounded-2xl border border-border-mist bg-surface-dark/60 backdrop-blur overflow-hidden">
          {stats.map((stat) => (
            <div key={stat.label} className="px-8 py-4 text-center">
              <div className="font-mono text-2xl font-semibold text-teal-core mb-0.5">
                {stat.value}
              </div>
              <div className="font-body text-xs text-muted-ink tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Trust note */}
        <p className="mt-6 font-body text-xs text-muted-ink/60">
          SOC 2 Type II Certified · GDPR Compliant · 256-bit Encryption
        </p>
      </div>
    </section>
  );
}
