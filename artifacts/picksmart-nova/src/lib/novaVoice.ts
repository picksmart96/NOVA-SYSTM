/**
 * NOVA Voice Loop — novaVoice.ts
 *
 * Module-level recognition state: one instance per page, shared across re-renders.
 *
 * Pattern (matches user's canonical design):
 *   continuous = false  →  one phrase per session
 *   onend               →  always restart unless speaking or muted
 *   speak()             →  stops mic, TTS plays, msg.onend restarts mic at 200 ms
 *   wake word           →  "hey nova" / "oye nova" arms NOVA for 5 seconds
 *   window.handleNovaCommand / window.handleNovaWake  →  React bridge
 */

import { novaRecogLang } from "./novaSpeech";

// ── Module state ───────────────────────────────────────────────────────────────

let recognition: any = null;
let isListening  = false;
let isSpeaking   = false;
let isAwake      = false;
let muteFlag     = false;
let wakeTimeout: ReturnType<typeof setTimeout> | null = null;

type VoiceOpts = {
  onListeningChange?: (v: boolean) => void;
};
let onListeningChange: ((v: boolean) => void) | undefined;

// ── Internal helpers ───────────────────────────────────────────────────────────

function setListening(v: boolean) {
  isListening = v;
  onListeningChange?.(v);
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Mark speaking state so onend does NOT restart the mic during TTS.
 * Called by the portal's speak() BEFORE and AFTER each utterance.
 */
export const voiceSpeaking = (v: boolean): void => {
  isSpeaking = v;
};

/** Start one recognition session. Guards: listening / speaking / muted. */
export const startListening = (): void => {
  if (!recognition || isListening || isSpeaking || muteFlag) return;
  try {
    recognition.start();
    setListening(true);
  } catch {
    // start() threw (audio session still busy) — onend loop will retry
  }
};

/** Stop the current session cleanly (triggers onend → restart logic). */
export const stopListening = (): void => {
  try { recognition?.stop(); } catch { /* ignore */ }
  setListening(false);
};

/** Mute / unmute — stops or restarts the recognition loop. */
export const setVoiceMuted = (muted: boolean): void => {
  muteFlag = muted;
  if (muted) {
    stopListening();
  } else {
    startListening();
  }
};

/**
 * Create (or recreate) the recognition instance for a given language.
 * Call once on mount and again on language change.
 */
export const initVoice = (lang: string, opts?: VoiceOpts): void => {
  const SR =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
  if (!SR) return;

  destroyVoice(); // tear down any previous instance first

  onListeningChange = opts?.onListeningChange;
  isAwake   = false;
  muteFlag  = false;

  const rec = new SR();
  rec.continuous      = false;  // one phrase per session; onend auto-restarts
  rec.interimResults  = false;
  rec.lang            = novaRecogLang(lang);
  rec.maxAlternatives = 3;      // top-3 alternatives for accent tolerance

  rec.onstart = () => setListening(true);

  rec.onresult = (event: any) => {
    // Flatten all hypotheses → widest accent coverage
    const text = Array.from(event.results as any[])
      .flatMap((r: any) =>
        Array.from(r as any[]).map((alt: any) => alt.transcript?.toLowerCase() ?? "")
      )
      .join(" ")
      .trim();

    const confidence = (event.results?.[0]?.[0]?.confidence ?? 1) as number;
    if (!text || confidence < 0.35) return;

    // Wake word — English + Spanish phonetic variants
    const isWake =
      text.includes("hey nova")  || text.includes("oye nova")  ||
      text.includes("ey nova")   || text.includes("hola nova") ||
      text.includes("ok nova")   || text.includes("okay nova") ||
      text.includes("a nova")    || text.includes("hey noba")  ||
      text.includes("nova")      && text.split(" ").length <= 2; // bare "nova"

    if (!isAwake && isWake) {
      isAwake = true;
      if (wakeTimeout) clearTimeout(wakeTimeout);
      wakeTimeout = setTimeout(() => { isAwake = false; }, 5000);
      (window as any).handleNovaWake?.();
      return;
    }

    if (isAwake) {
      // Reset 5-second sleep timer after each command
      if (wakeTimeout) clearTimeout(wakeTimeout);
      wakeTimeout = setTimeout(() => { isAwake = false; }, 5000);
      (window as any).handleNovaCommand?.(text);
    }
  };

  // ⭐ THE KEY — matches the canonical pattern exactly:
  //   onend fires after every phrase, after stop(), and after errors.
  //   If NOVA is not speaking and not muted → always restart.
  rec.onend = () => {
    setListening(false);
    if (!isSpeaking && !muteFlag) {
      setTimeout(() => startListening(), 300);
    }
  };

  rec.onerror = (e: any) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      setListening(false);
      muteFlag = true; // permanent — don't retry
    }
    // aborted / no-speech / network → onend fires next and handles restart
  };

  recognition = rec;
};

/** Fully tear down the recognition instance. */
export const destroyVoice = (): void => {
  try { recognition?.abort(); } catch { /* ignore */ }
  recognition  = null;
  isListening  = false;
  isSpeaking   = false;
  isAwake      = false;
  onListeningChange = undefined;
  if (wakeTimeout) { clearTimeout(wakeTimeout); wakeTimeout = null; }
};
