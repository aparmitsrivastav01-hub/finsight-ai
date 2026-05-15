import { Bell, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/stores/notificationsStore';
import { unreadNotificationCount, useNotificationsStore } from '@/stores/notificationsStore';

function iconFor(type: AppNotification['type']) {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-teal-core flex-shrink-0" />;
    case 'error':
      return <AlertTriangle className="w-4 h-4 text-error flex-shrink-0" />;
    default:
      return <Info className="w-4 h-4 text-muted-ink flex-shrink-0" />;
  }
}

/**
 * Navbar bell: lists recent in-app notifications (uploads, analysis, backend status, errors).
 */
export default function FinGPTNotificationsMenu() {
  const items = useNotificationsStore((s) => s.items);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const clear = useNotificationsStore((s) => s.clear);
  const unread = unreadNotificationCount(items);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) markAllRead();
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative w-9 h-9 rounded-lg border border-border-mist bg-surface-dark/60 flex items-center justify-center text-muted-ink hover:text-teal-core hover:border-teal-core/40 transition-all duration-200"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-teal-core text-[10px] font-mono font-bold text-obsidian flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(22rem,calc(100vw-2rem))] p-0 border-border-mist bg-deep-slate text-soft-white"
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs font-mono text-muted-ink uppercase tracking-widest">
          Notifications
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border-mist" />
        {items.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-ink">No notifications yet</div>
        ) : (
          <ScrollArea className="max-h-72">
            <ul className="py-1">
              {items.map((n) => (
                <li key={n.id} className="px-2">
                  <div
                    className={cn(
                      'flex gap-2 rounded-lg px-2 py-2 text-left',
                      n.read ? 'opacity-70' : 'bg-teal-core/5'
                    )}
                  >
                    {iconFor(n.type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-soft-white leading-snug">{n.title}</p>
                      {n.body && (
                        <p className="text-[11px] text-muted-ink mt-0.5 break-words leading-snug">{n.body}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
        {items.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-border-mist" />
            <div className="p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-ink hover:text-teal-core"
                onClick={() => clear()}
              >
                Clear all
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
