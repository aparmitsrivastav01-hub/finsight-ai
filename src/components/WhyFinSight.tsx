import { Check, X } from 'lucide-react';

const comparisonRows = [
  {
    feature: 'Time to Understand',
    finsight: '< 8 seconds',
    traditional: '1-2 hours',
  },
  {
    feature: 'Understanding',
    finsight: 'Simple explanations',
    traditional: 'Confusing numbers',
  },
  {
    feature: 'Risk Detection',
    finsight: 'Clearly highlighted',
    traditional: 'Hard to notice',
  },
  {
    feature: 'Decision Making',
    finsight: 'What to do next',
    traditional: 'No clear direction',
  },
  {
    feature: 'Learning',
    finsight: 'Beginner-friendly',
    traditional: 'Requires experience',
  },
];

const advantages = [
  { label: 'Speed', finsight: true, traditional: false },
  { label: 'Scale', finsight: true, traditional: false },
  { label: 'Consistency', finsight: true, traditional: false },
  { label: 'Cost Efficiency', finsight: true, traditional: false },
  { label: 'Audit Trail', finsight: true, traditional: false },
];

export default function WhyFinSight() {
  return (
    <section
      id="why-finsight"
      className="relative py-24 lg:py-32 bg-deep-slate overflow-hidden"
      aria-label="Why FinSight comparison section"
    >
      {/* Ambient glow */}
      <div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at bottom right, rgba(0,212,170,0.07) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-core/30 bg-teal-core/5 mb-5">
            <span className="font-mono text-xs text-teal-core tracking-widest uppercase">
              Comparison
            </span>
          </div>
          <h2 className="font-sans font-bold text-4xl sm:text-5xl text-soft-white mb-4 tracking-tight">
            Why
            <span className="text-teal-gradient"> FinSight </span>
            is built for real users
          </h2>
          <p className="font-body text-muted-ink text-lg max-w-xl mx-auto leading-relaxed">
            Whether you're learning, analyzing, or investing — FinSight helps you understand financial data faster.          </p>
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl border border-border-mist overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.4)] mb-10">
          {/* Table header */}
          <div className="grid grid-cols-3 bg-obsidian/80 border-b border-border-mist">
            <div className="px-6 py-4">
              <span className="font-body text-xs text-muted-ink uppercase tracking-widest">
                Dimension
              </span>
            </div>
            <div className="px-6 py-4 border-l border-border-mist bg-teal-core/5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-core" />
                <span className="font-sans font-semibold text-sm text-teal-core">FinSight AI</span>
              </div>
            </div>
            <div className="px-6 py-4 border-l border-border-mist">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-muted-ink" />
                <span className="font-sans font-semibold text-sm text-muted-ink">
                Without FinSight
                </span>
              </div>
            </div>
          </div>

          {/* Table rows */}
          {comparisonRows.map((row, index) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 border-b border-border-mist last:border-b-0 group hover:bg-teal-core/3 transition-colors duration-150 ${index % 2 === 0 ? 'bg-surface-dark/40' : 'bg-surface-dark/20'
                }`}
            >
              <div className="px-6 py-4 flex items-center">
                <span className="font-body text-sm text-soft-white/80">{row.feature}</span>
              </div>
              <div className="px-6 py-4 border-l border-border-mist bg-teal-core/3 group-hover:bg-teal-core/5 transition-colors">
                <span className="font-mono text-sm text-teal-core">{row.finsight}</span>
              </div>
              <div className="px-6 py-4 border-l border-border-mist">
                <span className="font-body text-sm text-muted-ink">{row.traditional}</span>
              </div>
            </div>
          ))}
          
        </div>
            
        {/* Advantage pills row */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {advantages.map((adv) => (
            <div
              key={adv.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border-mist bg-surface-dark"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center">
                  <Check className="w-3 h-3 text-success" />
                </span>
                <span className="font-body text-xs text-soft-white">{adv.label}</span>
              </div>
              <span className="w-px h-4 bg-border-mist" />
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-error/15 flex items-center justify-center">
                  <X className="w-3 h-3 text-error" />
                </span>
                <span className="font-body text-xs text-muted-ink">Manual</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
