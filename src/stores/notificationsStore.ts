import { create } from 'zustand';

export type NotificationType = 'success' | 'info' | 'error';

export type AppNotification = {
  id: string;
  title: string;
  body?: string;
  type: NotificationType;
  createdAt: number;
  read: boolean;
};

type NotificationsState = {
  items: AppNotification[];
  add: (input: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markAllRead: () => void;
  clear: () => void;
};

export const useNotificationsStore = create<NotificationsState>((set) => ({
  items: [],
  add: (input) =>
    set((s) => ({
      items: [
        {
          ...input,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          read: false,
        },
        ...s.items,
      ].slice(0, 50),
    })),
  markAllRead: () =>
    set((s) => ({
      items: s.items.map((n) => ({ ...n, read: true })),
    })),
  clear: () => set({ items: [] }),
}));

export function unreadNotificationCount(items: AppNotification[]): number {
  return items.filter((n) => !n.read).length;
}
