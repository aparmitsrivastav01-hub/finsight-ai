import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { authApi } from '@/lib/authApi';

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  auth_provider?: string;
  avatar_url?: string | null;
};

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
  login: (identifier: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,

      setSession: (token, user) => set({ accessToken: token, user }),

      clearSession: () => set({ accessToken: null, user: null }),

      login: async (identifier, password) => {
        const { access_token } = await authApi.login(identifier, password);
        set({ accessToken: access_token });
        await get().fetchMe();
      },

      loginWithGoogle: async (credential) => {
        const { access_token, user } = await authApi.loginWithGoogle(credential);
        set({ accessToken: access_token, user });
      },

      register: async (username, email, password) => {
        await authApi.register(username, email, password);
        await get().login(email, password);
      },

      fetchMe: async () => {
        const token = get().accessToken;
        if (!token) {
          set({ user: null });
          // console.info('[auth] fetchMe skipped — no access token');
          return;
        }
        try {
          // console.info('[auth] fetchMe → GET /me');
          const user = await authApi.me(token);
          set({ user });
          // console.info('[auth] fetchMe ok', { userId: user.id, username: user.username });
        } catch (e) {
          console.warn('[auth] fetchMe failed — clearing session', e);
          set({ accessToken: null, user: null });
        }
      },

      logout: async () => {
        const token = get().accessToken;
        if (token) {
          try {
            await authApi.logout(token);
          } catch {
            /* ignore network errors on logout */
          }
        }
        get().clearSession();
        // console.info('[auth] logout — session cleared');
      },
    }),
    {
      name: 'finsight-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ accessToken: s.accessToken, user: s.user }),
    }
  )
);

export function userInitials(user: AuthUser | null): string {
  if (!user) return '?';
  const parts = user.username.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const u = user.username;
  return (u.slice(0, 2) || 'U').toUpperCase();
}
