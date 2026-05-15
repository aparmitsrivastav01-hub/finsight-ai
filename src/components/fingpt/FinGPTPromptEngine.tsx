import { Zap, ChevronRight, FileText } from 'lucide-react';
import type { Prompt } from '../../pages/FinGPT';
import { selectActiveDocument, useDocumentStore } from '@/stores/documentStore';

type Props = {
  prompts: Prompt[];
  activePrompt: Prompt | null;
  /** Shift+click = fill input only (no auto-submit). */
  onPromptSelect: (prompt: Prompt, options?: { fillOnly?: boolean }) => void;
};

const promptCategories = [
  { label: 'Investment', ids: ['invest', 'health'] },
  { label: 'Risk', ids: ['bankruptcy', 'flags'] },
  { label: 'Analysis', ids: ['assets', 'simple', 'expert'] },
];

export default function FinGPTPromptEngine({ prompts, activePrompt, onPromptSelect }: Props) {
  const activeDocument = useDocumentStore(selectActiveDocument);
  const promptMap = Object.fromEntries(prompts.map((p) => [p.id, p]));

  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0 min-h-0 min-w-0 w-full md:w-48 lg:w-64 xl:w-72 2xl:w-80 border-l border-border-mist bg-deep-slate overflow-y-auto overflow-x-hidden"
      aria-label="Prompt engine panel"
    >
      <div className="px-3 sm:px-5 pt-5 sm:pt-6 pb-4 border-b border-border-mist flex-shrink-0">
        <div className="flex items-center gap-2 mb-1 min-w-0">
          <Zap className="w-4 h-4 text-teal-core flex-shrink-0" />
          <h2 className="font-sans font-semibold text-sm text-soft-white tracking-wide truncate">
            Try FinGPT
          </h2>
        </div>
        <p className="font-body text-xs text-muted-ink pl-6 break-words">
          Pre-built prompts — click to run.{' '}
          <span className="text-teal-core/80">Shift+click</span> to paste only.
        </p>
        {activeDocument ? (
          <div className="mt-3 ml-6 flex items-center gap-1.5 min-w-0 rounded-lg border border-teal-core/25 bg-teal-core/5 px-2 py-1.5">
            <FileText className="w-3 h-3 text-teal-core flex-shrink-0" />
            <span className="font-mono text-[10px] text-teal-core/90 truncate">
              {activeDocument.name}
            </span>
          </div>
        ) : (
          <p className="mt-3 ml-6 font-mono text-[10px] text-amber-400/90">
            Select a document to enable analysis
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 px-2 sm:px-3 pt-4 pb-6 space-y-5">
        {promptCategories.map((cat) => (
          <div key={cat.label} className="min-w-0">
            <p className="px-2 font-mono text-[10px] text-muted-ink uppercase tracking-widest mb-2">
              {cat.label}
            </p>
            <div className="space-y-1.5">
              {cat.ids.map((id) => {
                const prompt = promptMap[id];
                if (!prompt) return null;
                const isActive = activePrompt?.id === prompt.id;

                return (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={(e) => onPromptSelect(prompt, { fillOnly: e.shiftKey })}
                    className={`group w-full max-w-full min-w-0 text-left rounded-xl border p-3 sm:p-3.5 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-core active:scale-[0.99] ${
                      isActive
                        ? 'border-teal-core/60 bg-teal-core/8 shadow-teal-glow'
                        : 'border-border-mist bg-surface-dark hover:border-teal-core/30 hover:bg-teal-core/5 hover:shadow-[0_0_16px_rgba(0,212,170,0.07)]'
                    }`}
                    aria-pressed={isActive}
                    aria-label={`Run prompt: ${prompt.label}. Hold Shift to paste only.`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                      <span
                        className={`text-base flex-shrink-0 leading-none mt-0.5 transition-transform duration-200 ${
                          isActive ? 'scale-110' : 'group-hover:scale-105'
                        }`}
                      >
                        {prompt.icon}
                      </span>

                      <div className="flex-1 min-w-0">
                        <span
                          className={`font-body text-xs leading-relaxed transition-colors duration-200 break-words ${
                            isActive ? 'text-soft-white font-medium' : 'text-muted-ink group-hover:text-soft-white'
                          }`}
                        >
                          {prompt.label}
                        </span>
                      </div>

                      <ChevronRight
                        className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 transition-all duration-200 ${
                          isActive
                            ? 'text-teal-core translate-x-0.5'
                            : 'text-muted-ink/30 group-hover:text-teal-core/60 group-hover:translate-x-0.5'
                        }`}
                      />
                    </div>

                    {isActive && (
                      <div className="mt-2.5 pt-2.5 border-t border-teal-core/20 flex items-center gap-1.5 min-w-0">
                        <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-core opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-core" />
                        </span>
                        <span className="font-mono text-[10px] text-teal-core truncate">Active · Analyzing</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-2 sm:px-3 pb-4 sm:pb-5 flex-shrink-0">
        <div className="h-px bg-border-mist mb-4" />
        <div className="rounded-xl border border-teal-core/20 bg-teal-core/5 p-3 sm:p-4 min-w-0">
          <div className="flex items-center gap-2 mb-2 min-w-0">
            <Zap className="w-3.5 h-3.5 text-teal-core flex-shrink-0" />
            <span className="font-mono text-xs text-teal-core font-medium truncate">FinGPT Engine</span>
          </div>
          <p className="font-body text-xs text-muted-ink leading-relaxed break-words">
            Powered by GPT-4o with FinSight's proprietary financial reasoning layer. All responses are grounded in your uploaded documents.
          </p>
          <div className="mt-3 flex items-center gap-1.5 min-w-0">
            <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-core opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-core" />
            </span>
            <span className="font-mono text-[10px] text-muted-ink truncate">Model Ready · v2.4.1</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
