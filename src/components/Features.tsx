import { BarChart3, ShieldAlert, MessageSquareText } from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    tag: 'Core',
    title: 'Deep-Dive Analysis',
    description:
      'Automatically parse and structure complex financial statements — balance sheets, income statements, and cash flow reports — into clean, queryable insight layers in under 10 seconds.',
    highlights: ['10-K & 10-Q parsing', 'XBRL data extraction', 'Multi-period comparison'],
    accent: 'from-teal-core/20 to-teal-core/0',
    tagColor: 'text-teal-core border-teal-core/40 bg-teal-core/10',
  },
  {
    icon: ShieldAlert,
    tag: 'Risk Engine',
    title: 'Intelligent Risk Detection',
    description:
      'Surface hidden financial risks before they surface in the market. Our risk model flags debt anomalies, earnings manipulation signals, and covenant breaches across hundreds of data points.',
    highlights: ['Altman Z-Score model', 'Fraud pattern detection', 'Covenant breach alerts'],
    accent: 'from-warning/20 to-warning/0',
    tagColor: 'text-warning border-warning/40 bg-warning/10',
  },
  {
    icon: MessageSquareText,
    tag: 'FinGPT',
    title: 'Plain-English Explanations',
    description:
      'Ask any question about a financial document and receive clear, contextual answers backed by the source data. No financial jargon, no hallucinations — just grounded analysis.',
    highlights: ['Natural language Q&A', 'Source-cited answers', 'Analyst-grade summaries'],
    accent: 'from-deep-emerald/20 to-deep-emerald/0',
    tagColor: 'text-deep-emerald border-deep-emerald/40 bg-deep-emerald/10',
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="relative py-24 lg:py-32 bg-deep-slate overflow-hidden"
      aria-label="Features section"
    >
      {/* Subtle ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(0,212,170,0.06) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-core/30 bg-teal-core/5 mb-5">
            <span className="font-mono text-xs text-teal-core tracking-widest uppercase">
              Capabilities
            </span>
          </div>
          <h2 className="font-sans font-bold text-4xl sm:text-5xl text-soft-white mb-4 tracking-tight">
            Everything you need to{' '}
            <span className="text-teal-gradient">analyze faster</span>
          </h2>
          <p className="font-body text-muted-ink text-lg max-w-xl mx-auto leading-relaxed">
            Three core engines built for financial professionals who demand precision and speed.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="group relative flex flex-col rounded-2xl border border-border-mist bg-surface-dark p-7 hover:border-teal-core/30 hover:shadow-card-hover transition-all duration-300 cursor-default overflow-hidden"
              >
                {/* Bottom gradient line reveal */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-core/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Tag badge */}
                <div className="flex items-center justify-between mb-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md font-mono text-xs font-medium border ${feature.tagColor}`}
                  >
                    {feature.tag}
                  </span>
                </div>

                {/* Icon container */}
                <div className="mb-5">
                  <div className="w-12 h-12 rounded-xl bg-teal-core/10 border border-teal-core/20 flex items-center justify-center group-hover:bg-teal-core/15 group-hover:border-teal-core/40 transition-all duration-300">
                    <Icon className="w-6 h-6 text-teal-core" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-sans font-semibold text-xl text-soft-white mb-3 tracking-tight">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="font-body text-muted-ink text-sm leading-relaxed mb-6 flex-1">
                  {feature.description}
                </p>

                {/* Highlights */}
                <ul className="space-y-2">
                  {feature.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-core flex-shrink-0" />
                      <span className="font-body text-xs text-muted-ink">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
