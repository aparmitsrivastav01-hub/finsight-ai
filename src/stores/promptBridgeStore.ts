import { create } from 'zustand';

/** Fills FinGPT input from prompt cards (and optional auto-submit). */
type PromptAction = { id: number; text: string; autoSubmit: boolean };

type PromptBridgeState = {
  action: PromptAction | null;
  publishPrompt: (text: string, autoSubmit?: boolean) => void;
  clearAction: () => void;
};

export const usePromptBridgeStore = create<PromptBridgeState>((set) => ({
  action: null,
  publishPrompt: (text, autoSubmit = true) =>
    set((s) => ({
      action: {
        id: (s.action?.id ?? 0) + 1,
        text,
        autoSubmit: Boolean(autoSubmit),
      },
    })),
  clearAction: () => set({ action: null }),
}));
