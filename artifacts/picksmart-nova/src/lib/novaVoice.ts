/**
 * NOVA Voice Loop — novaVoice.ts
 *
 * Module-level recognition state: one instance per page, shared across re-renders.
 *
 * Pattern:
 *   continuous = true      →  always listening; session never ends between phrases
 *   interimResults = true  →  partial text for faster wake detection
 *   maxAlternatives = 1    →  simpler, lower latency
 *   getUserMedia           →  echo/noise/AGC constraints primed before SR starts
 *   isSpeaking gate        →  onresult ignored while NOVA talks; mic stays open
 *   lastSpeakTime cooldown →  500 ms post-TTS echo guard after isSpeaking flips
 *   wake word              →  "hey nova" / "oye nova" on any result (interim ok)
 *   resetSleepTimer()      →  4 s auto-sleep after last activity
 *   commands (final only)  →  result.isFinal gate — no partial noise
 *   safeStart retry        →  start() throws → retry once after 500 ms
 *   onend recovery         →  session drops → restart after 500 ms
 */

import { novaRecogLang } from "./novaSpeech";

// ── Module state ───────────────────────────────────────────────────────────────

let recognition: any = null;
let isListening  = false;
let isSpeaking   = false;
let isAwake      = false;
let muteFlag     = false;
let lastSpeakTime = 0;
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
  if (!v) lastSpeakTime = Date.now(); // 🔥 mark end of TTS
};

/** Start the continuous recognition session. Guards: already running / speaking / muted.
 *  If start() throws (audio session still busy after TTS), retries once after 500 ms. */
export const startListening = (): void => {
  if (!recognition || isListening || isSpeaking || muteFlag) return;
  try {
    recognition.start();
    setListening(true);
  } catch {
    console.debug("NOVA: start() failed, retrying in 500 ms…");
    setTimeout(() => {
      if (!recognition || isListening || isSpeaking || muteFlag) return;
      try {
        recognition.start();
        setListening(true);
      } catch { /* give up this cycle — onend recovery will retry */ }
    }, 500);
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
  lastSpeakTime = 0;

  // 🔥 Prime the audio pipeline with echo/noise constraints so the browser's
  //    audio session is configured before SpeechRecognition takes over.
  //    This significantly reduces NOVA's own TTS voice bleeding into the mic.
  navigator.mediaDevices?.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl:  true,
    },
  }).catch(() => { /* permission denied handled by onerror */ });

  const rec = new SR();
  rec.continuous      = true;   // 🔥 always listening — no per-phrase restart
  rec.interimResults  = true;   // 🔥 partial results for early wake detection
  rec.lang            = novaRecogLang(lang);
  rec.maxAlternatives = 1;      // simpler + lower latency

  rec.onstart = () => setListening(true);

  rec.onresult = (event: any) => {
    // ❌ Ignore while NOVA is speaking — mic stays open, output is gated
    if (isSpeaking) return;

    // 🔥 500 ms post-TTS echo guard — catches the brief window after
    //    isSpeaking flips false but mic may still be picking up TTS echo
    if (Date.now() - lastSpeakTime < 500) return;

    const result = event.results[event.results.length - 1];
    const text   = result[0].transcript.toLowerCase();

    console.debug("Heard:", text);

    // 🟡 WAKE WORD
    if (!isAwake && (text.includes("hey nova") || text.includes("oye nova"))) {
      isAwake = true;
      console.debug("⚡ NOVA ACTIVATED");
      (window as any).handleNovaWake?.();
      resetSleepTimer();
      return;
    }

    // 🔵 COMMAND MODE — final results only
    if (isAwake && result.isFinal) {
      (window as any).handleNovaCommand?.(text);
      resetSleepTimer();
    }
  };

  // ── onend: recovery restart ───────────────────────────────────────────────
  // With continuous=true this fires only if the session drops unexpectedly
  // (browser idle timeout, network error, or explicit stop() during TTS).
  // Always restart unless muted — the isSpeaking guard in startListening()
  // prevents the mic from reopening while NOVA is talking.
  rec.onend = () => {
    setListening(false);
    if (!isSpeaking && !muteFlag) {
      setTimeout(() => startListening(), 500);
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
  onListeningChange = undefined;
  if (wakeTimeout) { clearTimeout(wakeTimeout); wakeTimeout = null; }
};
