import { Upload, Cpu, LineChart } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload Your Financial Statements',
    description:
      'Drag and drop any financial document — 10-K, 10-Q, annual report, or earnings release. We support PDF, XBRL, HTML, and plain-text filings from SEC EDGAR and beyond.',
    detail: 'Supports PDF, XBRL, HTML, TXT',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'We analyze the numbers for you',
    description:
      'No finance background needed. FinSight explains everything in simple terms.',
    detail: 'Avg. processing time: < 8 seconds',
  },
  {
    number: '03',
    icon: LineChart,
    title: 'Get Clear Insights Understand what’s good, risky, and what to do next',
    description:
      'Receive a structured intelligence report with risk flags, performance metrics, trend analysis, and plain-English summaries. Ask follow-up questions via FinGPT for deeper dives.',
    detail: 'Exportable to PDF, CSV, Notion',
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative py-24 lg:py-32 bg-obsidian overflow-hidden"
      aria-label="How it works section"
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 bg-grid-teal bg-grid opacity-50 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-core/30 bg-teal-core/5 mb-5">
            <span className="font-mono text-xs text-teal-core tracking-widest uppercase">
              Process
            </span>
          </div>
          <h2 className="font-sans font-bold text-4xl sm:text-5xl text-soft-white mb-4 tracking-tight">
            From financial statements to clear insights{' '}
            <span className="text-teal-gradient">in seconds</span>
          </h2>
          <p className="font-body text-muted-ink text-lg max-w-xl mx-auto leading-relaxed">
            No more digging through numbers — get what actually matters, instantly.          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop only) */}
          <div
            className="hidden lg:block absolute top-[52px] left-[calc(16.666%+40px)] right-[calc(16.666%+40px)] h-px pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(0,212,170,0.3) 20%, rgba(0,212,170,0.3) 80%, transparent 100%)',
            }}
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.number}
                  className="relative flex flex-col items-start lg:items-center text-left lg:text-center group"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  {/* Step number bubble */}
                  <div className="relative mb-6 flex-shrink-0">
                    {/* Outer ring */}
                    <div className="absolute inset-0 rounded-2xl border border-teal-core/20 scale-[1.15] group-hover:scale-[1.25] group-hover:border-teal-core/40 transition-all duration-300" />
                    <div className="w-[72px] h-[72px] rounded-2xl border border-border-mist bg-surface-dark flex flex-col items-center justify-center gap-0.5 group-hover:border-teal-core/30 group-hover:bg-teal-core/5 transition-all duration-300">
                      <Icon className="w-5 h-5 text-teal-core" />
                      <span className="font-mono text-[10px] text-muted-ink">{step.number}</span>
                    </div>
                  </div>

                  {/* Text content */}
                  <div className="flex-1">
                    <h3 className="font-sans font-semibold text-xl text-soft-white mb-3 tracking-tight">
                      {step.title}
                    </h3>
                    <p className="font-body text-sm text-muted-ink leading-relaxed mb-4">
                      {step.description}
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-mist bg-surface-dark/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-core" />
                      <span className="font-mono text-xs text-muted-ink">{step.detail}</span>
                    </div>
                  </div>

                  {/* Mobile connector */}
                  {index < steps.length - 1 && (
                    <div
                      className="lg:hidden my-6 w-px h-8 mx-auto self-center"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(0,212,170,0.4), rgba(0,212,170,0.1))',
                      }}
                      aria-hidden="true"
                    />
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
