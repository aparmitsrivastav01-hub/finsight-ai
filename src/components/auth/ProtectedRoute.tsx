import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/stores/authStore';

/**
 * Wraps routes that require a valid JWT. Redirects unauthenticated users to /login.
 * Uses zustand persist's onFinishHydration so loading never hangs if onRehydrateStorage callbacks are skipped.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const clearSession = useAuthStore((s) => s.clearSession);
  const location = useLocation();

  const [persistReady, setPersistReady] = useState(() => useAuthStore.persist.hasHydrated());
  const [sessionReady, setSessionReady] = useState(false);

  // Sync with zustand-persist hydration (authoritative; survives StrictMode / storage edge cases)
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setPersistReady(true);
      console.info('[auth] persist already hydrated');
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setPersistReady(true);
      console.info('[auth] onFinishHydration — persist rehydration complete');
    });
    return unsub;
  }, []);

  // Hard fallback: never spin forever if persist APIs misfire
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!useAuthStore.persist.hasHydrated()) {
        console.warn('[auth] persist hydration timeout — forcing persistReady');
      }
      setPersistReady(true);
    }, 4000);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!persistReady) return;

    let cancelled = false;

    (async () => {
      try {
        if (!accessToken) {
          console.info('[auth] ProtectedRoute — no token, skip /me');
          return;
        }
        if (!user) {
          console.info('[auth] ProtectedRoute — validating token via /me');
          await fetchMe();
        } else {
          console.info('[auth] ProtectedRoute — user already in memory');
        }
      } catch (e) {
        console.warn('[auth] ProtectedRoute session check error', e);
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) {
          setSessionReady(true);
          console.info('[auth] ProtectedRoute — session gate finished');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [persistReady, accessToken, user, fetchMe, clearSession]);

  if (!persistReady || !sessionReady) {
    return (
      <div className="min-h-[100dvh] bg-obsidian flex flex-col items-center justify-center gap-3 text-teal-core px-4">
        <div
          className="h-10 w-10 border-2 border-teal-core/25 border-t-teal-core rounded-full animate-spin"
          aria-hidden
        />
        <span className="font-mono text-xs text-muted-ink text-center">Loading session…</span>
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
