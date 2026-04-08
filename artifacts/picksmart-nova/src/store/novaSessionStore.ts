/**
 * NOVA Session Store (Zustand + localStorage persistence)
 * Tracks the full live NOVA Trainer session so it survives page refresh.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NovaSessionState {
  // Identity
  selectorId: string | null;
  novaId: string | null;
  selectorName: string | null;

  // Language & mode
  language: "en" | "es";
  currentMode: "idle" | "help" | "workflow";

  // Equipment sign-on
  equipmentId: string;
  maxPalletCount: string;

  // Safety
  safetyIndex: number;
  safetyComplete: boolean;
  failedSafetyItem: string;

  // Assignment / picking
  currentAssignmentId: string | null;
  currentStopIndex: number;
  currentPhase: string;
  invalidAttempts: number;

  // Help
  helpCount: number;
  lastHelpTopic: string | null;

  // Meta
  sessionStartedAt: string | null;
}

interface NovaSessionActions {
  setSession: (updates: Partial<NovaSessionState>) => void;
  clearSession: () => void;
  bumpInvalidAttempts: () => void;
  bumpHelpCount: () => void;
  setLastHelpTopic: (topic: string) => void;
  hasActiveSession: () => boolean;
}

const DEFAULT_STATE: NovaSessionState = {
  selectorId: null,
  novaId: null,
  selectorName: null,
  language: "en",
  currentMode: "idle",
  equipmentId: "",
  maxPalletCount: "2",
  safetyIndex: 0,
  safetyComplete: false,
  failedSafetyItem: "",
  currentAssignmentId: null,
  currentStopIndex: 0,
  currentPhase: "IDLE",
  invalidAttempts: 0,
  helpCount: 0,
  lastHelpTopic: null,
  sessionStartedAt: null,
};

export const useNovaSessionStore = create<NovaSessionState & NovaSessionActions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      setSession: (updates) => set((state) => ({ ...state, ...updates })),

      clearSession: () =>
        set({
          ...DEFAULT_STATE,
          language: get().language, // preserve language choice
        }),

      bumpInvalidAttempts: () =>
        set((state) => ({ invalidAttempts: state.invalidAttempts + 1 })),

      bumpHelpCount: () =>
        set((state) => ({ helpCount: state.helpCount + 1 })),

      setLastHelpTopic: (topic) => set({ lastHelpTopic: topic }),

      hasActiveSession: () => {
        const s = get();
        return (
          s.selectorId !== null &&
          s.currentPhase !== "IDLE" &&
          s.currentPhase !== "SAFETY_FAILED"
        );
      },
    }),
    {
      name: "nova-session-v1",
      partialize: (state) => ({
        selectorId: state.selectorId,
        novaId: state.novaId,
        selectorName: state.selectorName,
        language: state.language,
        currentMode: state.currentMode,
        equipmentId: state.equipmentId,
        maxPalletCount: state.maxPalletCount,
        safetyIndex: state.safetyIndex,
        safetyComplete: state.safetyComplete,
        currentAssignmentId: state.currentAssignmentId,
        currentStopIndex: state.currentStopIndex,
        currentPhase: state.currentPhase,
        invalidAttempts: state.invalidAttempts,
        helpCount: state.helpCount,
        lastHelpTopic: state.lastHelpTopic,
        sessionStartedAt: state.sessionStartedAt,
      }),
    },
  ),
);
