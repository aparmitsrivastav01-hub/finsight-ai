import { useState, useEffect, useRef } from 'react';
import { Cpu, Sparkles, Copy, Download, RotateCcw, Lock } from 'lucide-react';
import type { Prompt } from '../../pages/FinGPT';

type Props = {
  activePrompt: Prompt | null;
  activeDoc: string | null;
};

// Converts basic markdown-like formatting in the mock response to JSX-friendly structure
function ResponseBlock({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 font-body text-sm text-soft-white/90 leading-relaxed">
      {lines.map((line, i) => {
        // Bold heading lines starting with **...**
        if (/^\*\*.*\*\*$/.test(line.trim())) {
          return (
            <p key={i} className="font-sans font-semibold text-soft-white text-base mt-4 mb-1 first:mt-0">
              {line.replace(/\*\*/g, '')}
            </p>
          );
        }
        // Table rows (| col | col |)
        if (line.trim().startsWith('|')) {
          const cells = line.split('|').filter(Boolean).map((c) => c.trim());
          const isSeparator = cells.every((c) => /^[-:]+$/.test(c));
          if (isSeparator) return null;
          return (
            <div key={i} className="grid gap-px" style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
              {cells.map((cell, ci) => (
                <div
                  key={ci}
                  className={`px-3 py-1.5 font-mono text-xs rounded ${
                    i === 0
                      ? 'bg-teal-core/10 text-teal-core font-medium border border-teal-core/20'
                      : 'bg-surface-dark text-soft-white/80 border border-border-mist'
                  }`}
                >
                  {cell}
                </div>
              ))}
            </div>
          );
        }
        // Numbered list
        if (/^\d+\./.test(line.trim())) {
          return (
            <div key={i} className="flex gap-2.5 items-start">
              <span className="font-mono text-xs text-teal-core mt-0.5 flex-shrink-0 w-5">
                {line.trim().match(/^\d+/)?.[0]}.
              </span>
              <span className="text-soft-white/80 text-sm"
                dangerouslySetInnerHTML={{
                  __html: line.replace(/^\d+\.\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-soft-white">$1</strong>'),
                }}
              />
            </div>
          );
        }
        // Bullet lines
        if (line.trim().startsWith('-')) {
          return (
            <div key={i} className="flex gap-2.5 items-start pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-core flex-shrink-0 mt-1.5" />
              <span
                className="text-soft-white/80 text-sm"
                dangerouslySetInnerHTML={{
                  __html: line.replace(/^-\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-soft-white">$1</strong>'),
                }}
              />
            </div>
          );
        }
        // Empty line
        if (!line.trim()) return <div key={i} className="h-1" />;
        // Regular paragraph with inline bold
        return (
          <p
            key={i}
            className="text-soft-white/80"
            dangerouslySetInnerHTML={{
              __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-soft-white font-semibold">$1</strong>'),
            }}
          />
        );
      })}
    </div>
  );
}

export default function FinGPTOutput({ activePrompt, activeDoc }: Props) {
  // Local state: streaming animation
  const [isStreaming, setIsStreaming] = useState(false);
  const [displayedPromptId, setDisplayedPromptId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activePrompt) return;
    if (activePrompt.id === displayedPromptId) return;

    setIsStreaming(true);
    setDisplayedPromptId(null);

    const timer = setTimeout(() => {
      setDisplayedPromptId(activePrompt.id);
      setIsStreaming(false);
    }, 900);

    return () => clearTimeout(timer);
  }, [activePrompt]);

  // Scroll to top when new prompt loads
  useEffect(() => {
    if (displayedPromptId && outputRef.current) {
      outputRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [displayedPromptId]);

  const handleCopy = () => {
    if (activePrompt) {
      navigator.clipboard.writeText(activePrompt.response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-obsidian relative overflow-hidden">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 bg-grid-teal bg-grid opacity-40 pointer-events-none"
        aria-hidden="true"
      />

      {/* Ambient glow behind content */}
      {activePrompt && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none transition-opacity duration-700"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,212,170,0.05) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Top action bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-border-mist bg-obsidian/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-teal-core" />
          <span className="font-mono text-xs text-muted-ink">Output</span>
          {activeDoc && (
            <>
              <span className="font-mono text-xs text-muted-ink/40">·</span>
              <span className="font-mono text-xs text-teal-core/70">{activeDoc}_Q4_2024.pdf</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {activePrompt && (
            <>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-mist bg-surface-dark/60 text-muted-ink hover:text-teal-core hover:border-teal-core/40 transition-all duration-200 text-xs font-body"
                aria-label="Copy response"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-mist bg-surface-dark/60 text-muted-ink hover:text-teal-core hover:border-teal-core/40 transition-all duration-200 text-xs font-body"
                aria-label="Export response"
              >
                <Download className="w-3 h-3" />
                <span>Export</span>
              </button>
              <button
                onClick={() => { setDisplayedPromptId(null); setIsStreaming(false); }}
                className="w-7 h-7 rounded-lg border border-border-mist bg-surface-dark/60 text-muted-ink hover:text-teal-core hover:border-teal-core/40 transition-all duration-200 flex items-center justify-center"
                aria-label="Clear output"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Output scroll area */}
      <div ref={outputRef} className="relative z-10 flex-1 overflow-y-auto px-6 lg:px-10 xl:px-16 py-8">
        {/* Empty state */}
        {!activePrompt && !isStreaming && (
          <div className="h-full flex flex-col items-center justify-center text-center min-h-[400px]">
            <div className="w-16 h-16 rounded-2xl bg-teal-core/10 border border-teal-core/20 flex items-center justify-center mb-5">
              <Sparkles className="w-7 h-7 text-teal-core" />
            </div>
            <h3 className="font-sans font-semibold text-xl text-soft-white mb-2 tracking-tight">
              Ready to Analyze
            </h3>
            <p className="font-body text-sm text-muted-ink max-w-xs leading-relaxed">
              Select a document from the left panel, then choose a prompt from the right to generate AI-powered insights.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {['← Select a document', 'Choose a prompt →'].map((hint) => (
                <span
                  key={hint}
                  className="px-3 py-1.5 rounded-full border border-border-mist bg-surface-dark/60 font-mono text-xs text-muted-ink"
                >
                  {hint}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Streaming skeleton */}
        {isStreaming && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-teal-core/20 border border-teal-core/40 flex items-center justify-center flex-shrink-0">
                <Cpu className="w-4 h-4 text-teal-core" />
              </div>
              <div>
                <div className="font-mono text-xs text-teal-core mb-0.5">FinGPT · Generating</div>
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-teal-core animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
            {[80, 60, 90, 50, 75, 40].map((w, i) => (
              <div
                key={i}
                className="h-3 rounded-full bg-surface-dark animate-pulse"
                style={{ width: `${w}%`, animationDelay: `${i * 0.08}s` }}
              />
            ))}
          </div>
        )}

        {/* AI Response */}
        {!isStreaming && activePrompt && displayedPromptId === activePrompt.id && (
          <div className="animate-fade-up max-w-3xl mx-auto">
            {/* Prompt echo */}
            <div className="flex items-start gap-3 mb-6">
              <div className="w-7 h-7 rounded-full bg-teal-core/20 border border-teal-core/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="font-mono text-[10px] text-teal-core font-bold">FA</span>
              </div>
              <div className="flex-1 px-4 py-3 rounded-xl bg-surface-dark/60 border border-border-mist">
                <p className="font-body text-sm text-soft-white/90">
                  {activePrompt.icon} {activePrompt.label}
                </p>
              </div>
            </div>

            {/* AI response card */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-teal-core/20 border border-teal-core/40 flex items-center justify-center flex-shrink-0 mt-0.5 flex-shrink-0">
                <Cpu className="w-3.5 h-3.5 text-teal-core" />
              </div>
              <div className="flex-1">
                {/* Response header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-xs text-teal-core font-medium">FinGPT</span>
                  <span className="font-mono text-[10px] text-muted-ink">· Analysis Complete</span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-success/30 bg-success/10">
                    <span className="w-1 h-1 rounded-full bg-success" />
                    <span className="font-mono text-[10px] text-success">Live</span>
                  </span>
                </div>

                {/* Response body */}
                <div className="px-5 py-5 rounded-2xl border border-border-mist bg-surface-dark/60 backdrop-blur">
                  <ResponseBlock text={activePrompt.response} />
                </div>

                {/* Footer note */}
                <div className="mt-3 flex items-center gap-2 px-1">
                  <div className="w-1 h-1 rounded-full bg-muted-ink/40" />
                  <span className="font-body text-xs text-muted-ink/60">
                    Generated from uploaded documents · FinSight AI v2.4.1 · Not financial advice
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom input bar */}
      <div className="relative z-10 border-t border-border-mist bg-obsidian/90 backdrop-blur-xl px-4 lg:px-8 xl:px-14 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border border-border-mist bg-surface-dark/40 opacity-60 cursor-not-allowed">
            <Lock className="w-3.5 h-3.5 text-muted-ink flex-shrink-0" />
            <span className="font-body text-sm text-muted-ink/60 flex-1">
              Type your prompt (coming soon...)
            </span>
          </div>
          <button
            disabled
            className="px-4 py-3 rounded-xl bg-teal-core/20 border border-teal-core/20 text-teal-core/40 font-sans font-medium text-sm cursor-not-allowed flex items-center gap-2 flex-shrink-0"
            aria-label="Send prompt (disabled)"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:block">Ask</span>
          </button>
        </div>
        <p className="text-center font-mono text-[10px] text-muted-ink/40 mt-2">
          Custom prompt input · Coming in v3.0
        </p>
      </div>
    </main>
  );
}
