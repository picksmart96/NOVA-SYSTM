/**
 * NOVA Voice Loop — novaVoice.ts
 *
 * Module-level recognition state: one instance per page, shared across re-renders.
 *
 * Pattern (v3 — matches user's latest design):
 *   continuous = true       →  always listening; no per-phrase restart needed
 *   interimResults = true   →  partial text fires early → faster wake detection
 *   maxAlternatives = 1     →  simpler, lower latency
 *   cleanText()             →  strip noise chars before matching
 *   wake word (interim)     →  "hey nova" / "hey no" / "anova" caught mid-phrase
 *   lastWakeTime debounce   →  1500 ms guard against double-trigger
 *   resetSleepTimer()       →  4 s auto-sleep after last activity
 *   commands (final only)   →  result.isFinal gate — no interim command noise
 *   speak() restart         →  100 ms after TTS ends (down from 200 ms)
 *   onend recovery          →  restart after 300 ms if session drops unexpectedly
 */

import { novaRecogLang } from "./novaSpeech";

// ── Module state ───────────────────────────────────────────────────────────────

let recognition: any = null;
let isListening  = false;
let isSpeaking   = false;
let isAwake      = false;
let muteFlag     = false;
let lastWakeTime = 0;
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

/** Strip punctuation / noise chars before matching. */
function cleanText(raw: string): string {
  return raw.replace(/[^\w\s]/gi, "").trim();
}

/** Arm/re-arm the 4-second sleep timer. */
function resetSleepTimer(): void {
  if (wakeTimeout) clearTimeout(wakeTimeout);
  wakeTimeout = setTimeout(() => {
    isAwake = false;
    console.debug("😴 NOVA SLEEP");
  }, 4000);
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Mark speaking state so onend does NOT restart the mic during TTS.
 * Called by the portal's speak() BEFORE and AFTER each utterance.
 */
export const voiceSpeaking = (v: boolean): void => {
  isSpeaking = v;
};

/** Start the continuous recognition session. Guards: already running / speaking / muted. */
export const startListening = (): void => {
  if (!recognition || isListening || isSpeaking || muteFlag) return;
  try {
    recognition.start();
    setListening(true);
  } catch {
    // start() threw synchronously (audio session still busy after TTS)
    // onend recovery or the next startListening() call will retry
  }
};

/** Stop the session cleanly (onend fires → recovery restart if not muted). */
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
  isAwake      = false;
  muteFlag     = false;
  lastWakeTime = 0;

  const rec = new SR();
  rec.continuous      = true;   // 🔥 always listening — no per-phrase restart
  rec.interimResults  = true;   // 🔥 partial results for early wake detection
  rec.lang            = novaRecogLang(lang);
  rec.maxAlternatives = 1;      // simpler + lower latency

  rec.onstart = () => setListening(true);

  rec.onresult = (event: any) => {
    // Always inspect the LATEST result only
    const result = event.results[event.results.length - 1];
    const raw    = result[0].transcript.toLowerCase();
    const text   = cleanText(raw);
    const now    = Date.now();

    console.debug("Heard:", text, result.isFinal ? "(final)" : "(interim)");

    // ── Wake word — on INTERIM too for instant response ───────────────────
    // Catches "hey nova" as the user is still speaking it.
    const isWake =
      text.includes("hey nova")  || text.includes("oye nova")  ||
      text.includes("hey no")    ||                               // early partial
      text.includes("anova")     || text.includes("hey noba")  || // mishear
      text.includes("ey nova")   || text.includes("hola nova") ||
      text.includes("ok nova")   || text.includes("okay nova") ||
      (text === "nova");                                          // bare "nova"

    if (!isAwake && isWake) {
      // 1500 ms debounce — ignore if we just woke
      if (now - lastWakeTime < 1500) return;
      lastWakeTime = now;
      isAwake = true;
      console.debug("⚡ NOVA ACTIVATED");
      (window as any).handleNovaWake?.();
      resetSleepTimer();
      return;
    }

    // ── Commands — FINAL results only (ignore partial noise) ─────────────
    if (isAwake && result.isFinal) {
      (window as any).handleNovaCommand?.(text);
      resetSleepTimer(); // keep NOVA awake after each command
    }
  };

  // ── onend: recovery restart ───────────────────────────────────────────────
  // With continuous=true this fires only if the session drops unexpectedly
  // (browser idle timeout, network error, or explicit stop() during TTS).
  // Always restart unless muted — the isSpeaking guard in startListening()
  // prevents the mic from reopening while NOVA is talking.
  rec.onend = () => {
    setListening(false);
    if (!muteFlag) {
      setTimeout(() => startListening(), 300);
    }
  };

  rec.onerror = (e: any) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      setListening(false);
      muteFlag = true; // permanent — do not retry
      return;
    }
    // aborted / no-speech / network → onend fires next and handles restart
  };

  recognition = rec;
};

/** Fully tear down the recognition instance (unmount / lang change). */
export const destroyVoice = (): void => {
  try { recognition?.abort(); } catch { /* ignore */ }
  recognition  = null;
  isListening  = false;
  isSpeaking   = false;
  isAwake      = false;
  lastWakeTime = 0;
  onListeningChange = undefined;
  if (wakeTimeout) { clearTimeout(wakeTimeout); wakeTimeout = null; }
};
