import { useState } from 'react';
import { FileText, Upload, CheckCircle2, Clock, FilePlus } from 'lucide-react';
import type { Document } from '../../pages/FinGPT';

type Props = {
  documents: Document[];
  activeDoc: string | null;
  onDocSelect: (id: string) => void;
};

const docIcons: Record<string, string> = {
  balance: '📊',
  pnl: '📋',
  cashflow: '💵',
};

export default function FinGPTSidebar({ documents, activeDoc, onDocSelect }: Props) {
  // Local state: tracks upload hover
  const [uploadHover, setUploadHover] = useState(false);

  return (
    <aside
      className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 border-r border-border-mist bg-deep-slate overflow-y-auto"
      aria-label="Document panel"
    >
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-border-mist">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-teal-core flex-shrink-0" />
          <h2 className="font-sans font-semibold text-sm text-soft-white tracking-wide">
            Documents
          </h2>
        </div>
        <p className="font-body text-xs text-muted-ink pl-6">
          Upload / View financial filings
        </p>
      </div>

      {/* Document list */}
      <div className="flex-1 px-3 pt-4 pb-4 space-y-2">
        <p className="px-2 font-mono text-[10px] text-muted-ink uppercase tracking-widest mb-3">
          Loaded · Q4 2024
        </p>

        {documents.map((doc) => {
          const isActive = activeDoc === doc.id;
          return (
            <button
              key={doc.id}
              onClick={() => onDocSelect(doc.id)}
              className={`group w-full text-left rounded-xl border p-3.5 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-core ${
                isActive
                  ? 'border-teal-core/50 bg-teal-core/8 shadow-teal-glow'
                  : 'border-border-mist bg-surface-dark hover:border-teal-core/30 hover:bg-teal-core/5 hover:shadow-[0_0_16px_rgba(0,212,170,0.08)]'
              }`}
              aria-pressed={isActive}
              aria-label={`Select ${doc.label}`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 transition-all duration-200 ${
                    isActive
                      ? 'bg-teal-core/20 border border-teal-core/40'
                      : 'bg-border-mist/50 border border-border-mist group-hover:bg-teal-core/10 group-hover:border-teal-core/20'
                  }`}
                >
                  {docIcons[doc.id]}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="font-sans font-medium text-sm text-soft-white truncate mb-1">
                    {doc.label}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                        isActive
                          ? 'text-teal-core border-teal-core/40 bg-teal-core/10'
                          : 'text-muted-ink border-border-mist bg-obsidian/40'
                      }`}
                    >
                      {doc.tag}
                    </span>
                    <span className="font-body text-[10px] text-muted-ink">{doc.size}</span>
                  </div>
                </div>

                {/* Status */}
                {isActive ? (
                  <CheckCircle2 className="w-4 h-4 text-teal-core flex-shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-ink/40 flex-shrink-0 mt-0.5 group-hover:text-muted-ink/70 transition-colors" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Divider + additional section */}
      <div className="px-3 pb-2">
        <div className="h-px bg-border-mist mb-3" />
        <p className="px-2 font-mono text-[10px] text-muted-ink uppercase tracking-widest mb-3">
          History
        </p>
        {['MSFT_10K_2024.pdf', 'NVDA_Q3_2024.pdf'].map((name) => (
          <button
            key={name}
            className="group w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 text-muted-ink hover:text-soft-white hover:bg-white/5 transition-all duration-200"
          >
            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-body text-xs truncate">{name}</span>
          </button>
        ))}
      </div>

      {/* Upload button */}
      <div className="px-3 pb-5 pt-2">
        <button
          onMouseEnter={() => setUploadHover(true)}
          onMouseLeave={() => setUploadHover(false)}
          className={`group w-full rounded-xl border-2 border-dashed p-4 flex flex-col items-center gap-2 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-core ${
            uploadHover
              ? 'border-teal-core/60 bg-teal-core/5 shadow-teal-glow'
              : 'border-border-mist bg-surface-dark/40 hover:border-teal-core/40'
          }`}
          aria-label="Upload a new financial document"
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
              uploadHover ? 'bg-teal-core/20 border border-teal-core/40' : 'bg-border-mist/50'
            }`}
          >
            <FilePlus className={`w-4 h-4 transition-colors duration-200 ${uploadHover ? 'text-teal-core' : 'text-muted-ink'}`} />
          </div>
          <div className="text-center">
            <div className={`font-sans font-medium text-xs transition-colors duration-200 ${uploadHover ? 'text-teal-core' : 'text-muted-ink'}`}>
              Upload Document
            </div>
            <div className="font-body text-[10px] text-muted-ink/60 mt-0.5">PDF, XBRL, HTML</div>
          </div>
          <Upload className={`w-3 h-3 transition-colors duration-200 ${uploadHover ? 'text-teal-core' : 'text-muted-ink/40'}`} />
        </button>
      </div>
    </aside>
  );
}
