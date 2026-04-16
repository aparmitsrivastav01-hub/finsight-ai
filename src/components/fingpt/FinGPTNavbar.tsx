import { TrendingUp, ChevronRight, Cpu, Bell, Settings } from 'lucide-react';
import logo from "../../assets/logo.png";

export default function FinGPTNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 lg:h-20 bg-obsidian/95 backdrop-blur-xl border-b border-border-mist flex items-center">
      <div className="w-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Brand + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <a href="/assets/logo.png" className="flex items-start gap-2.5 group flex-shrink-0" aria-label="Back to FinSight Home">
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-teal-core/10 border border-teal-core/30 flex items-center justify-center overflow-hidden group-hover:bg-teal-core/20 group-hover:border-teal-core/60 transition-all duration-200">
              <img
                src={logo}
                alt="FinSight Logo"
                className="w-5 h-5 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-bold text-lg leading-tight text-soft-white tracking-tight">
                Fin<span className="text-teal-core">Sight</span>
              </span>
              <span className="font-body text-[10px] text-muted-ink leading-tight tracking-wide hidden sm:block">
                Finance Made Easy
              </span>
            </div>
          </a>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-muted-ink">
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border-mist bg-surface-dark/60">
              <Cpu className="w-3.5 h-3.5 text-teal-core flex-shrink-0" />
              <span className="font-mono text-xs text-teal-core font-medium">FinGPT</span>
              <span className="font-mono text-[10px] text-muted-ink">· Analysis Engine</span>
            </div>
          </div>
        </div>

        {/* Center: Live status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-core/20 bg-teal-core/5">
          <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-core opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-core" />
          </span>
          <span className="font-mono text-xs text-teal-core">Model Ready · GPT-4o</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            className="w-9 h-9 rounded-lg border border-border-mist bg-surface-dark/60 flex items-center justify-center text-muted-ink hover:text-teal-core hover:border-teal-core/40 transition-all duration-200"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            className="w-9 h-9 rounded-lg border border-border-mist bg-surface-dark/60 flex items-center justify-center text-muted-ink hover:text-teal-core hover:border-teal-core/40 transition-all duration-200"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-full bg-teal-core/20 border border-teal-core/40 flex items-center justify-center">
            <span className="font-mono text-xs text-teal-core font-semibold">FA</span>
          </div>
        </div>
      </div>
    </header>
  );
}
