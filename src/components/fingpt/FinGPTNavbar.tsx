import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Cpu, Menu, Settings, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import logo from '../../assets/logo.png';
import FinGPTNotificationsMenu from './FinGPTNotificationsMenu';
import FinGPTSettingsModal from './FinGPTSettingsModal';
import { useAuthStore, userInitials } from '@/stores/authStore';

type FinGPTNavbarProps = {
  /** Opens the documents drawer on small screens (< md). */
  onMobileMenuClick?: () => void;
};

export default function FinGPTNavbar({ onMobileMenuClick }: FinGPTNavbarProps) {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const initials = userInitials(user);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Could not sign out');
    }
  };

  return (
    <>
      <FinGPTSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      <header className="fixed top-0 left-0 right-0 z-50 h-16 lg:h-20 bg-obsidian/95 backdrop-blur-xl border-b border-border-mist flex items-center">
        <div className="w-full min-w-0 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: menu (mobile) + brand + breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {onMobileMenuClick && (
              <button
                type="button"
                onClick={onMobileMenuClick}
                className="md:hidden flex-shrink-0 w-10 h-10 rounded-lg border border-border-mist bg-surface-dark/60 flex items-center justify-center text-muted-ink hover:text-teal-core hover:border-teal-core/40 transition-all duration-200 z-[60] relative"
                aria-label="Open documents menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link
              to="/"
              className="flex items-start gap-2 sm:gap-2.5 group flex-shrink-0 min-w-0"
              aria-label="Back to FinSight Home"
            >
              <div className="mt-0.5 w-8 h-8 rounded-lg bg-teal-core/10 border border-teal-core/30 flex items-center justify-center overflow-hidden group-hover:bg-teal-core/20 group-hover:border-teal-core/60 transition-all duration-200 flex-shrink-0">
                <img src={logo} alt="FinSight Logo" className="w-5 h-5 object-contain" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-sans font-bold text-base sm:text-lg leading-tight text-soft-white tracking-tight truncate">
                  Fin<span className="text-teal-core">Sight</span>
                </span>
                <span className="font-body text-[10px] text-muted-ink leading-tight tracking-wide hidden sm:block">
                  Finance Made Easy
                </span>
              </div>
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 text-muted-ink min-w-0">
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-lg border border-border-mist bg-surface-dark/60 min-w-0">
                <Cpu className="w-3.5 h-3.5 text-teal-core flex-shrink-0" />
                <span className="font-mono text-xs text-teal-core font-medium truncate">FinGPT</span>
                <span className="font-mono text-[10px] text-muted-ink hidden lg:inline whitespace-nowrap">
                  · Analysis Engine
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-shrink-0 items-center gap-2 px-3 py-1.5 rounded-full border border-teal-core/20 bg-teal-core/5 max-w-[40%] lg:max-w-none">
            <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-core opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-core" />
            </span>
            <span className="font-mono text-xs text-teal-core truncate">Model Ready · GPT-4o</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <FinGPTNotificationsMenu />

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex w-9 h-9 rounded-lg border border-border-mist bg-surface-dark/60 items-center justify-center text-muted-ink hover:text-teal-core hover:border-teal-core/40 transition-all duration-200"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-core/20 border border-teal-core/40 flex items-center justify-center flex-shrink-0 font-mono text-xs text-teal-core font-semibold hover:bg-teal-core/30 transition-colors"
                  aria-label="Account menu"
                >
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 border-border-mist bg-deep-slate text-soft-white"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-soft-white flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-teal-core" />
                      {user?.username ?? 'Account'}
                    </span>
                    <span className="text-xs text-muted-ink truncate">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border-mist" />
                <DropdownMenuItem
                  className="focus:bg-surface-dark cursor-pointer"
                  onSelect={() => setSettingsOpen(true)}
                >
                  <Settings className="w-4 h-4 mr-2 text-muted-ink" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border-mist" />
                <DropdownMenuItem
                  className="focus:bg-error/10 text-error cursor-pointer"
                  onSelect={() => void handleLogout()}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}
