/**
 * NOVA Session Storage
 * Thin helpers for saving, loading, and clearing NOVA session data
 * from localStorage. The Zustand store (novaSessionStore) handles
 * the persist middleware automatically — these are standalone helpers
 * for any component that needs to read/write session data directly.
 */

const STORAGE_KEY = "nova-session-v1";

export interface StoredNovaSession {
  selectorId: string | null;
  novaId: string | null;
  selectorName: string | null;
  language: "en" | "es";
  currentMode: "idle" | "help" | "workflow";
  equipmentId: string;
  maxPalletCount: string;
  safetyIndex: number;
  safetyComplete: boolean;
  currentAssignmentId: string | null;
  currentStopIndex: number;
  currentPhase: string;
  invalidAttempts: number;
  helpCount: number;
  lastHelpTopic: string | null;
  sessionStartedAt: string | null;
}

/** Save NOVA session data to localStorage. */
export function saveNovaSession(data: Partial<StoredNovaSession>): void {
  try {
    const existing = loadNovaSession() ?? {};
    const merged = { ...existing, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // localStorage may be unavailable in private browsing
  }
}

/** Load NOVA session data from localStorage. Returns null if none found. */
export function loadNovaSession(): StoredNovaSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    // Zustand persist wraps the state in { state: {...}, version: 0 }
    const parsed = JSON.parse(raw);
    const data = parsed?.state ?? parsed;
    if (!data || typeof data !== "object") return null;
    return data as StoredNovaSession;
  } catch {
    return null;
  }
}

/** Clear NOVA session data from localStorage. */
export function clearNovaSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Returns true if a resumable session exists in storage. */
export function hasResumableSession(): boolean {
  const session = loadNovaSession();
  if (!session) return false;
  return (
    session.selectorId !== null &&
    session.currentPhase !== "IDLE" &&
    session.currentPhase !== "SAFETY_FAILED" &&
    session.currentPhase !== ""
  );
}
