/**
 * selectorVoiceSystem.ts
 *
 * Mode-based voice system for the Selector Portal.
 *
 * boot → safety → briefing → trainer → help
 *
 * Pattern:
 *   speak(text, callback)   →  TTS with isSpeaking flag
 *   isSpeaking gate         →  onresult ignored while NOVA talks
 *   lastSpeakTime < 400 ms  →  post-TTS echo cooldown
 *   wake word for help      →  "hey nova help" / "nova help" only
 *   trainer mode            →  ready / repeat / confirm commands
 */

import { novaSpeak } from "./novaSpeech";

// ── Types ──────────────────────────────────────────────────────────────────────

export type SelectorMode = "boot" | "safety" | "briefing" | "trainer" | "help";

type VoiceCallbacks = {
  onModeChange?:      (mode: SelectorMode) => void;
  onSpeakingChange?:  (speaking: boolean)  => void;
  onListeningChange?: (listening: boolean) => void;
};

// ── Module state ───────────────────────────────────────────────────────────────

let recognition:   any          = null;
let isSpeaking                  = false;
let currentMode: SelectorMode   = "boot";
let lastSpeakTime               = 0;
let lang                        = "en";
let callbacks: VoiceCallbacks   = {};

// ── Internal helpers ───────────────────────────────────────────────────────────

function setMode(m: SelectorMode) {
  currentMode = m;
  callbacks.onModeChange?.(m);
}

// ── Voice output ───────────────────────────────────────────────────────────────

function speak(text: string, callback?: () => void) {
  isSpeaking = true;
  callbacks.onSpeakingChange?.(true);

  novaSpeak(text, lang, () => {
    isSpeaking    = false;
    lastSpeakTime = Date.now();
    callbacks.onSpeakingChange?.(false);
    callback?.();
  }, { rate: 1.15 });
}

// ── Boot sequence ──────────────────────────────────────────────────────────────

function startSequence() {
  setMode("safety");
  speak(
    lang === "es"
      ? "Verificación de seguridad. Confirma frenos, batería, bocina, ruedas y controles."
      : "Safety check. Confirm brakes, battery, horn, wheels, and controls.",
    startBriefing
  );
}

function startBriefing() {
  setMode("briefing");
  speak(
    lang === "es"
      ? "Resumen de hoy. Enfócate en precisión y ritmo constante. Observa los pasillos mixtos y mantén las tarimas estables."
      : "Today's briefing. Focus on accuracy and steady pace. Watch mixed aisles and keep pallets stable.",
    startTrainer
  );
}

function startTrainer() {
  setMode("trainer");
  speak(
    lang === "es"
      ? "Entrenamiento listo. Di listo cuando estés preparado."
      : "Training ready. Say ready when you are."
  );
}

// ── Help mode ──────────────────────────────────────────────────────────────────

function handleHelp(cmd: string) {
  setMode("help");

  if (cmd.includes("pallet") || cmd.includes("tarima")) {
    speak(
      lang === "es"
        ? "Comienza con cajas pesadas y construye una base plana."
        : "Start with heavy cases and build a flat base.",
      returnToTrainer
    );
  } else if (cmd.includes("safety") || cmd.includes("seguridad")) {
    speak(
      lang === "es"
        ? "Siempre verifica frenos, bocina y batería antes de moverte."
        : "Always check brakes, horn, and battery before moving.",
      returnToTrainer
    );
  } else {
    speak(
      lang === "es" ? "¿En qué te puedo ayudar?" : "How can I help?",
      returnToTrainer
    );
  }
}

function returnToTrainer() {
  setMode("trainer");
  speak(
    lang === "es" ? "Regresando al entrenamiento." : "Returning to training."
  );
}

// ── Trainer mode ───────────────────────────────────────────────────────────────

function handleTrainer(cmd: string) {
  if (cmd.includes("ready") || cmd.includes("listo")) {
    speak(
      lang === "es"
        ? "Pasillo 17. Ranura 66. Recoger 10."
        : "Aisle 17. Slot 66. Pick 10."
    );
  } else if (cmd.includes("repeat") || cmd.includes("repetir") || cmd.includes("repite")) {
    speak(
      lang === "es"
        ? "Repitiendo. Pasillo 17. Ranura 66. Recoger 10."
        : "Repeating. Aisle 17. Slot 66. Pick 10."
    );
  } else if (cmd.includes("confirm") || cmd.includes("confirmar") || cmd.includes("confirma")) {
    speak(
      lang === "es" ? "Verificación confirmada." : "Check confirmed."
    );
  }
}

// ── Main voice engine — onresult ───────────────────────────────────────────────

function onResult(event: any) {
  const result = event.results[event.results.length - 1];
  const text   = result[0].transcript.toLowerCase();
  const now    = Date.now();

  // 🔥 Ignore while speaking or right after speaking
  if (isSpeaking) return;
  if (now - lastSpeakTime < 400) return;

  console.debug("Heard:", text);

  // 🔥 WAKE WORD FOR HELP
  if (text.includes("hey nova help") || text.includes("nova help") ||
      text.includes("hey nova ayuda") || text.includes("nova ayuda")) {
    handleHelp(text);
    return;
  }

  // 🔥 NORMAL FLOW
  if (currentMode === "trainer" && result.isFinal) {
    handleTrainer(text);
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/** Start the selector voice system — recognition + boot sequence. */
export function startSelectorVoice(
  language: string,
  opts?: VoiceCallbacks
): void {
  const SR =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
  if (!SR) return;

  lang      = language;
  callbacks = opts ?? {};

  // Tear down any previous instance
  stopSelectorVoice();

  const rec             = new SR();
  rec.continuous        = true;
  rec.interimResults    = true;
  rec.lang              = language.startsWith("es") ? "es-US" : "en-US";
  rec.maxAlternatives   = 1;

  rec.onstart  = () => callbacks.onListeningChange?.(true);
  rec.onresult = onResult;
  rec.onend    = () => {
    callbacks.onListeningChange?.(false);
    // Recovery restart unless unmounted
    if (recognition) setTimeout(() => { try { recognition.start(); } catch { /* ignore */ } }, 500);
  };
  rec.onerror  = (e: any) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      stopSelectorVoice();
    }
    // aborted / no-speech → onend handles restart
  };

  recognition = rec;

  try {
    recognition.start();
  } catch {
    setTimeout(() => { try { recognition?.start(); } catch { /* ignore */ } }, 500);
  }

  // Kick off the boot sequence
  setMode("boot");
  startSequence();
}

/** Stop recognition and tear down. */
export function stopSelectorVoice(): void {
  try { recognition?.abort(); } catch { /* ignore */ }
  recognition = null;
  callbacks.onListeningChange?.(false);
}

/** Get current mode (for UI reads without a callback). */
export function getSelectorMode(): SelectorMode {
  return currentMode;
}

/**
 * Gate the onresult handler from outside (e.g. when the portal's own
 * TTS — coaching messages, greetings — is playing).
 */
export function setSelectorSpeaking(v: boolean): void {
  isSpeaking    = v;
  if (!v) lastSpeakTime = Date.now();
  callbacks.onSpeakingChange?.(v);
}
