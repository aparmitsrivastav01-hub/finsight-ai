import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

function normalizeBase(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export type AppModelId = 'gpt-4o' | 'gpt-4o-mini' | 'deepseek-r1';

type SettingsState = {
  /** Optional override; empty = use VITE_API_URL / default */
  apiBaseUrl: string;
  model: AppModelId;
  temperature: number;
  setApiBaseUrl: (url: string) => void;
  setModel: (m: AppModelId) => void;
  setTemperature: (t: number) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiBaseUrl: '',
      model: 'gpt-4o',
      temperature: 0.7,
      setApiBaseUrl: (url) => set({ apiBaseUrl: normalizeBase(url) }),
      setModel: (model) => set({ model }),
      setTemperature: (temperature) => set({ temperature }),
    }),
    {
      name: 'finsight-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * API base URL for FinGPT backend.
 * Production (HF Spaces): set VITE_API_URL=https://YOUR-SPACE.hf.space (no trailing slash).
 * Local backend: http://127.0.0.1:8000 — HF Spaces Docker: http://127.0.0.1:7860
 */
export function getResolvedApiBase(): string {
  const custom = useSettingsStore.getState().apiBaseUrl?.trim();
  if (custom) return normalizeBase(custom);
  const env = import.meta.env.VITE_API_URL?.trim();
  if (env) return normalizeBase(env);
  return 'http://127.0.0.1:8000';
}
