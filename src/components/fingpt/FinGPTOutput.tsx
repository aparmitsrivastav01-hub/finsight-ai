import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Cpu,
  Sparkles,
  Copy,
  Download,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

import type { Prompt } from '../../pages/FinGPT';

import { askQuestion } from '@/lib/api';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { selectActiveDocument, useDocumentStore } from '@/stores/documentStore';
import { usePromptBridgeStore } from '@/stores/promptBridgeStore';

type Props = {
  activePrompt: Prompt | null;
};

function ResponseBlock({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 font-body text-sm text-soft-white/90 leading-relaxed break-words">
      {lines.map((line, i) => {
        if (/^\*\*.*\*\*$/.test(line.trim())) {
          return (
            <p
              key={i}
              className="font-sans font-semibold text-soft-white text-base mt-4 mb-1 first:mt-0"
            >
              {line.replace(/\*\*/g, '')}
            </p>
          );
        }

        if (line.trim().startsWith('-')) {
          return (
            <div key={i} className="flex gap-2.5 items-start pl-1 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-core flex-shrink-0 mt-1.5" />
              <span
                className="text-soft-white/80 text-sm min-w-0 break-words"
                dangerouslySetInnerHTML={{
                  __html: line
                    .replace(/^-\s*/, '')
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-soft-white">$1</strong>'),
                }}
              />
            </div>
          );
        }

        if (!line.trim()) {
          return <div key={i} className="h-1" />;
        }

        return (
          <p
            key={i}
            className="text-soft-white/80 break-words"
            dangerouslySetInnerHTML={{
              __html: line.replace(
                /\*\*(.*?)\*\*/g,
                '<strong class="text-soft-white font-semibold">$1</strong>'
              ),
            }}
          />
        );
      })}
    </div>
  );
}

export default function FinGPTOutput({ activePrompt }: Props) {
  const activeDocument = useDocumentStore(selectActiveDocument);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const lastBridgeId = useRef<number | null>(null);

  const action = usePromptBridgeStore((s) => s.action);
  const clearAction = usePromptBridgeStore((s) => s.clearAction);

  const askWithText = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q) return;
    if (!activeDocument) {
      const msg = 'Select or upload a document before asking questions.';
      toast.error(msg);
      setResponse(`**No document selected**\n\n${msg}`);
      return;
    }
    setLoading(true);
    try {
      const data = await askQuestion(q);
      setResponse(data.answer);
      useNotificationsStore.getState().add({
        title: 'Analysis completed',
        body: 'FinGPT finished generating a response.',
        type: 'success',
      });
      toast.success('Analysis complete');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      setResponse(`**Error**\n\n${msg}`);
      useNotificationsStore.getState().add({
        title: 'Analysis failed',
        body: msg,
        type: 'error',
      });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [activeDocument]);

  useEffect(() => {
    if (!action) return;
    if (lastBridgeId.current === action.id) return;
    lastBridgeId.current = action.id;
    const { text, autoSubmit } = action;
    setQuery(text);
    clearAction();
    if (autoSubmit) void askWithText(text);
  }, [action?.id, askWithText, clearAction]);

  const handleAsk = async () => {
    await askWithText(query);
  };

  useEffect(() => {
    if (!activePrompt) return;
    outputRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePrompt?.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!response.trim()) {
      toast.message('Nothing to export yet');
      return;
    }
    const blob = new Blob([response], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fingpt-export-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Download started');
  };

  return (
    <main className="flex flex-1 flex-col min-h-0 min-w-0 w-full max-w-full bg-obsidian relative overflow-hidden">
      <div
        className="absolute inset-0 bg-grid-teal bg-grid opacity-40 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 sm:px-6 py-2.5 sm:py-3 border-b border-border-mist bg-obsidian/80 backdrop-blur-sm flex-shrink-0 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1 basis-[min(100%,12rem)]">
          <Cpu className="w-3.5 h-3.5 text-teal-core flex-shrink-0" />
          <span className="font-mono text-xs text-muted-ink truncate">Output</span>
          {activeDocument && (
            <>
              <span className="font-mono text-xs text-muted-ink/40 flex-shrink-0">·</span>
              <span className="font-mono text-xs text-teal-core/70 truncate max-w-[40vw] sm:max-w-[12rem]">
                {activeDocument.name}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 min-w-0 flex-wrap justify-end">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-border-mist bg-surface-dark/60 text-muted-ink hover:text-teal-core transition-all duration-200 text-xs flex-shrink-0"
          >
            <Copy className="w-3 h-3 flex-shrink-0" />
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-border-mist bg-surface-dark/60 text-muted-ink hover:text-teal-core transition-all duration-200 text-xs flex-shrink-0"
          >
            <Download className="w-3 h-3 flex-shrink-0" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={() => setResponse('')}
            className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg border border-border-mist bg-surface-dark/60 text-muted-ink hover:text-teal-core transition-all duration-200 flex items-center justify-center flex-shrink-0"
            aria-label="Clear response"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div
        ref={outputRef}
        className="relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain px-3 sm:px-6 lg:px-10 xl:px-16 py-6 sm:py-8"
      >
        {!response && !loading && (
          <div className="min-h-[min(400px,50dvh)] flex flex-col items-center justify-center text-center px-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-teal-core/10 border border-teal-core/20 flex items-center justify-center mb-4 sm:mb-5 flex-shrink-0">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-teal-core" />
            </div>
            <h3 className="font-sans font-semibold text-lg sm:text-xl text-soft-white mb-2 tracking-tight px-1">
              Ready to Analyze
            </h3>
            <p className="font-body text-sm text-muted-ink max-w-xs leading-relaxed">
              {activeDocument
                ? `Ask anything about ${activeDocument.name}. Use prompt cards — Shift+click to paste only.`
                : 'Upload and select a document in the sidebar, then ask questions or use prompt cards.'}
            </p>
          </div>
        )}

        {loading && (
          <div className="space-y-4 animate-fade-in max-w-full">
            {[80, 60, 90, 50].map((w, i) => (
              <div
                key={i}
                className="h-3 rounded-full bg-surface-dark animate-pulse max-w-full"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        )}

        {!loading && response && (
          <div className="animate-fade-up w-full max-w-3xl mx-auto min-w-0">
            <div className="px-3 sm:px-5 py-4 sm:py-5 rounded-2xl border border-border-mist bg-surface-dark/60 backdrop-blur min-w-0">
              <ResponseBlock text={response} />
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 border-t border-border-mist bg-obsidian/90 backdrop-blur-xl px-3 sm:px-4 lg:px-8 xl:px-14 py-3 sm:py-4 flex-shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto w-full min-w-0 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) void handleAsk();
            }}
            placeholder="Ask financial questions..."
            className="w-full min-w-0 flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-border-mist bg-surface-dark/40 text-soft-white text-sm outline-none placeholder:text-muted-ink/70"
          />
          <button
            type="button"
            onClick={() => void handleAsk()}
            disabled={loading}
            className="w-full sm:w-auto shrink-0 px-4 py-2.5 sm:py-3 rounded-xl bg-teal-core/20 border border-teal-core/20 text-teal-core font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>Ask</span>
          </button>
        </div>
      </div>
    </main>
  );
}
