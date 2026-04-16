export type MistakeType = "check_error" | "stacking_error" | "movement_delay";
export type Severity    = "low" | "medium" | "high";

export interface MistakePayload {
  companyId?:      string;
  selectorId?:     string;
  sessionId?:      string;
  mistakeType:     MistakeType;
  description:     string;
  expectedAction?: string;
  actualAction?:   string;
  severity:        Severity;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export async function logMistake(token: string, payload: MistakePayload): Promise<void> {
  try {
    await fetch(`${API_BASE}/log-mistake`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // non-blocking — voice session should never crash due to logging
  }
}

// ── NOVA coaching responses keyed by mistake type ─────────────────────────────

export const NOVA_COACHING: Record<MistakeType, { en: string; es: string }> = {
  check_error: {
    en: "Invalid. Slow down. Look at the slot. Confirm the check digit before speaking.",
    es: "Inválido. Más despacio. Mira la ranura. Confirma el dígito antes de hablar.",
  },
  stacking_error: {
    en: "Stop. Your base is weak. Fix the pallet before continuing.",
    es: "Para. Tu base está débil. Arregla el pallet antes de continuar.",
  },
  movement_delay: {
    en: "You paused too long between picks. Think ahead and move immediately.",
    es: "Tardaste demasiado entre picks. Anticipa y muévete de inmediato.",
  },
};

export function getCoachingLine(type: MistakeType, lang: "en" | "es" = "en"): string {
  return NOVA_COACHING[type]?.[lang] ?? NOVA_COACHING.check_error[lang];
}

// ── Selector struggling threshold ─────────────────────────────────────────────
export const STRUGGLING_THRESHOLD = 10;

export function isStruggling(mistakeCount: number): boolean {
  return mistakeCount >= STRUGGLING_THRESHOLD;
}
