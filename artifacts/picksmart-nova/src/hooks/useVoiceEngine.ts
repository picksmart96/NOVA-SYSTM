import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── Status constants ───────────────────────────────────────────────────────
export const STATUS = {
  IDLE: "idle",
  WAKE_LISTENING: "wake_listening",
  ACTIVE_LISTENING: "active_listening",
  THINKING: "thinking",
  SPEAKING: "speaking",
  STOPPED: "stopped",
  ERROR: "error",
} as const;

type StatusValue = (typeof STATUS)[keyof typeof STATUS];

// ─── Types ───────────────────────────────────────────────────────────────────
type SpeakOptions = {
  after?: "wake" | "active";
  restartAfterSpeak?: boolean;
  onEnd?: () => void;
};

type UseVoiceEngineOptions = {
  onHeard?: (heard: string, raw: string) => void | Promise<void>;
  lang?: string;
  silenceTimeoutMs?: number;
  autoRestart?: boolean;
  silencePrompt?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

function getRecognitionClass(): (new () => AnyRecognition) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function pickPreferredVoice(lang: string): SpeechSynthesisVoice | null {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const langRoot = lang.split("-")[0];
  return (
    voices.find(
      (v) => /samantha|aria|ava|zira|karen/i.test(v.name) && v.lang.startsWith(langRoot),
    ) ||
    voices.find((v) => /samantha|aria|ava|zira|karen/i.test(v.name)) ||
    voices.find((v) => /female/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith(langRoot) && v.default) ||
    voices[0]
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useVoiceEngine({
  onHeard,
  lang = "en-US",
  silenceTimeoutMs = 7000,
}: UseVoiceEngineOptions = {}) {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const recognitionRef = useRef<AnyRecognition>(null);
  const shouldRunRef = useRef(false);
  const speakingRef = useRef(false);
  const restartingRef = useRef(false);
  const recognitionActiveRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ttsWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Counts consecutive service errors (network + aborted) — drives backoff
  const serviceRetryRef = useRef(0);
  const modeRef = useRef<"wake" | "active">("wake");
  const langRef = useRef(lang);
  const onHeardRef = useRef(onHeard);
  // Self-reference so handlers inside fresh recognition instances can call
  // the latest startRecognition without capturing a stale closure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startRecognitionRef = useRef<((mode: "wake" | "active") => void) | null>(null);

  useEffect(() => { onHeardRef.current = onHeard; });
  useEffect(() => { langRef.current = lang; }, [lang]);

  // ── State ─────────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<StatusValue>(STATUS.IDLE);
  const [supported, setSupported] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [micPermission, setMicPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [error, setError] = useState("");
  const [lastHeard, setLastHeard] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [transcript, setTranscript] = useState("");

  // ── Timers ────────────────────────────────────────────────────────────────
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      if (shouldRunRef.current && !speakingRef.current) {
        try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      }
    }, silenceTimeoutMs);
  }, [clearSilenceTimer, silenceTimeoutMs]);

  // ── Kill current recognition instance cleanly ─────────────────────────────
  const killCurrentRecognition = useCallback(() => {
    clearSilenceTimer();
    const old = recognitionRef.current;
    if (!old) return;
    // Detach handlers first so stale onend can't trigger a restart
    old.onstart = null;
    old.onresult = null;
    old.onerror = null;
    old.onend = null;
    recognitionRef.current = null;
    restartingRef.current = false;
    recognitionActiveRef.current = false;
    try { old.abort(); } catch { /* ignore */ }
  }, [clearSilenceTimer]);

  // ── Core: create a brand-new recognition instance and start it ────────────
  // Chrome strongly prefers fresh instances — reusing one object across many
  // start() calls causes "aborted" errors after the first session.
  const startRecognition = useCallback(
    (mode: "wake" | "active" = "wake") => {
      if (!shouldRunRef.current || speakingRef.current) return;
      if (restartingRef.current || recognitionActiveRef.current) return;

      const Recognition = getRecognitionClass();
      if (!Recognition) return;

      // Discard the previous instance before creating a new one
      if (recognitionRef.current) {
        const old = recognitionRef.current;
        old.onstart = null;
        old.onresult = null;
        old.onerror = null;
        old.onend = null;
        recognitionRef.current = null;
        try { old.abort(); } catch { /* ignore */ }
      }

      const rec: AnyRecognition = new Recognition();
      rec.lang = langRef.current;
      rec.interimResults = false;
      rec.continuous = false;
      rec.maxAlternatives = 1;

      // ── Event handlers (all use stable refs — no stale closures) ──────────
      rec.onstart = () => {
        restartingRef.current = false;
        recognitionActiveRef.current = true;
        console.log("[NOVA voice] recognition started ✓ mode:", modeRef.current);
        startSilenceTimer();
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = async (event: any) => {
        clearSilenceTimer();
        serviceRetryRef.current = 0; // successful transcript — reset backoff
        const raw: string = event?.results?.[0]?.[0]?.transcript ?? "";
        const heard = raw.toLowerCase().trim();
        console.log("[NOVA voice] heard:", JSON.stringify(heard));
        setLastHeard(heard);
        setTranscript(heard);
        if (heard && onHeardRef.current) {
          setStatus(STATUS.THINKING);
          await onHeardRef.current(heard, raw);
        }
        // onend fires next and handles restart
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onerror = (event: any) => {
        clearSilenceTimer();
        restartingRef.current = false;
        const code: string = event?.error ?? "unknown";
        console.log("[NOVA voice] recognition error:", code);

        if (code === "not-allowed" || code === "service-not-allowed") {
          setMicPermission("denied");
          setError("Microphone permission was denied.");
          setStatus(STATUS.ERROR);
          shouldRunRef.current = false;
          return; // onend fires but shouldRunRef is false
        }

        // "network" and "aborted" are both service-level failures
        // — treat equally with exponential backoff
        if (code === "network" || code === "aborted") {
          serviceRetryRef.current++;
          return; // onend handles restart with backoff
        }

        // no-speech → user just didn't speak, not a service error
        if (code === "no-speech") {
          serviceRetryRef.current = 0;
          return; // onend restarts at normal 150ms
        }

        // Other errors — show to user but still let onend restart
        setError(`Voice error: ${code}`);
      };

      rec.onend = () => {
        clearSilenceTimer();
        restartingRef.current = false;
        recognitionActiveRef.current = false;
        recognitionRef.current = null; // instance is done — will be replaced on next start
        const retries = serviceRetryRef.current;
        console.log("[NOVA voice] recognition ended — speaking:", speakingRef.current, "shouldRun:", shouldRunRef.current, "retries:", retries);

        if (!shouldRunRef.current || speakingRef.current) return;

        // Exponential backoff for service errors: 500ms → 1s → 2s → … cap 30s
        const delay = retries > 0
          ? Math.min(500 * Math.pow(2, Math.min(retries - 1, 5)), 30_000)
          : 150;

        if (retries > 0) {
          console.log(`[NOVA voice] service backoff ${delay}ms (retry #${retries})`);
        }

        setTimeout(() => startRecognitionRef.current?.(modeRef.current), delay);
      };

      recognitionRef.current = rec;
      restartingRef.current = true;
      modeRef.current = mode;
      setError("");
      setStatus(mode === "active" ? STATUS.ACTIVE_LISTENING : STATUS.WAKE_LISTENING);
      console.log("[NOVA voice] recognition starting →", mode);

      try {
        rec.start();
      } catch (err) {
        console.warn("[NOVA voice] recognition.start() threw:", err);
        recognitionRef.current = null;
        restartingRef.current = false;
      }
    },
    [clearSilenceTimer, startSilenceTimer],
  );

  // Keep the self-reference always fresh
  useEffect(() => { startRecognitionRef.current = startRecognition; }, [startRecognition]);

  // ── Stop current recognition (graceful — onend fires, will restart) ───────
  const stopRecognition = useCallback(() => {
    clearSilenceTimer();
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
  }, [clearSilenceTimer]);

  // ── Abort current recognition (hard stop — onend fires, no restart) ───────
  const abortRecognition = useCallback(() => {
    killCurrentRecognition();
  }, [killCurrentRecognition]);

  // ── Speak ─────────────────────────────────────────────────────────────────
  const speak = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      const { onEnd, restartAfterSpeak } = options;
      const after: "wake" | "active" =
        restartAfterSpeak ? "active" : options.after ?? "wake";

      setCurrentPrompt(text);
      setTranscript(text);

      if (!("speechSynthesis" in window)) {
        onEnd?.();
        if (shouldRunRef.current) startRecognition(after);
        return;
      }

      speakingRef.current = true;
      clearSilenceTimer();
      if (ttsWatchdogRef.current) clearTimeout(ttsWatchdogRef.current);

      // Stop current recognition cleanly (onend fires but speakingRef=true → no restart)
      stopRecognition();
      setStatus(STATUS.SPEAKING);
      console.log("[NOVA voice] TTS speaking →", text.slice(0, 60));

      try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
      // Chrome bug: may be stuck paused after cancel()
      try { if (window.speechSynthesis.paused) window.speechSynthesis.resume(); } catch { /* ignore */ }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langRef.current;
      utterance.rate = 1;
      utterance.pitch = 1;
      const voice = pickPreferredVoice(langRef.current);
      if (voice) utterance.voice = voice;

      const handleTTSDone = (reason: string) => {
        if (!speakingRef.current) return;
        console.log("[NOVA voice] TTS done →", reason);
        if (ttsWatchdogRef.current) clearTimeout(ttsWatchdogRef.current);
        speakingRef.current = false;
        onEnd?.();
        if (shouldRunRef.current) {
          serviceRetryRef.current = 0; // TTS success — reset backoff
          setTimeout(() => startRecognition(after), 300);
        } else {
          setStatus(STATUS.STOPPED);
        }
      };

      utterance.onend = () => handleTTSDone("onend");
      utterance.onerror = (e) => {
        console.warn("[NOVA voice] TTS error:", e);
        if (!speakingRef.current) return;
        if (ttsWatchdogRef.current) clearTimeout(ttsWatchdogRef.current);
        speakingRef.current = false;
        if (shouldRunRef.current) {
          setTimeout(() => startRecognition(after), 300);
        } else {
          setError("Speech playback failed.");
          setStatus(STATUS.ERROR);
        }
      };

      try {
        window.speechSynthesis.speak(utterance);
        ttsWatchdogRef.current = setTimeout(() => {
          console.warn("[NOVA voice] TTS watchdog — forcing restart");
          try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
          handleTTSDone("watchdog");
        }, 15_000);
      } catch (err) {
        console.error("[NOVA voice] speechSynthesis.speak threw:", err);
        speakingRef.current = false;
        setStatus(STATUS.ERROR);
        setError("Unable to start speech playback.");
      }
    },
    [clearSilenceTimer, startRecognition, stopRecognition],
  );

  // ── Initialize (mic permission + first start) ─────────────────────────────
  const initialize = useCallback(async (): Promise<boolean> => {
    // Already have mic — just ensure recognition is running
    if (micPermission === "granted" && initialized) {
      shouldRunRef.current = true;
      if (!speakingRef.current && !restartingRef.current && !recognitionActiveRef.current) {
        startRecognition(modeRef.current);
      }
      return true;
    }

    const Recognition = getRecognitionClass();
    if (!Recognition) {
      setSupported(false);
      setError("This browser does not support voice mode. Try Chrome.");
      setStatus(STATUS.ERROR);
      return false;
    }

    setSupported(true);
    setError("");

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission("granted");
    } catch {
      setMicPermission("denied");
      setError("Microphone permission was denied.");
      setStatus(STATUS.ERROR);
      return false;
    }

    shouldRunRef.current = true;
    setInitialized(true);
    serviceRetryRef.current = 0;
    console.log("[NOVA voice] initialized");
    // Don't call startRecognition here — caller will call speak() which handles it
    return true;
  }, [initialized, micPermission, startRecognition]);

  // ── Mode switches ─────────────────────────────────────────────────────────
  const startWakeMode = useCallback(() => {
    shouldRunRef.current = true;
    startRecognition("wake");
  }, [startRecognition]);

  const startActiveMode = useCallback(() => {
    shouldRunRef.current = true;
    startRecognition("active");
  }, [startRecognition]);

  // ── Stop / shutdown ────────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    shouldRunRef.current = false;
    killCurrentRecognition();
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    speakingRef.current = false;
    setStatus(STATUS.STOPPED);
  }, [killCurrentRecognition]);

  const retryMic = useCallback(async () => {
    killCurrentRecognition();
    setInitialized(false);
    setMicPermission("unknown");
    shouldRunRef.current = false;
    serviceRetryRef.current = 0;
    return initialize();
  }, [initialize, killCurrentRecognition]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => { stopAll(); };
  }, [stopAll]);

  // ── Compat aliases ────────────────────────────────────────────────────────
  const askAndListen = useCallback(
    (text: string) => speak(text, { after: "active" }),
    [speak],
  );
  const startListening = useCallback(() => startActiveMode(), [startActiveMode]);
  const stopListening = useCallback(() => stopAll(), [stopAll]);
  const shutdown = useCallback(() => stopAll(), [stopAll]);
  const scheduleRestart = useCallback(
    (_delayMs?: number) => startActiveMode(),
    [startActiveMode],
  );
  const hardStopListening = useCallback(() => stopAll(), [stopAll]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const listening =
    status === STATUS.WAKE_LISTENING || status === STATUS.ACTIVE_LISTENING;
  const speaking = status === STATUS.SPEAKING;
  const thinking = status === STATUS.THINKING;

  return useMemo(
    () => ({
      STATUS,
      status,
      supported,
      initialized,
      micPermission,
      error,
      lastHeard,
      currentPrompt,
      transcript,
      initialize,
      speak,
      startWakeMode,
      startActiveMode,
      stopAll,
      retryMic,
      listening,
      speaking,
      thinking,
      askAndListen,
      startListening,
      stopListening,
      shutdown,
      scheduleRestart,
      hardStopListening,
      processing: thinking,
    }),
    [
      status,
      supported,
      initialized,
      micPermission,
      error,
      lastHeard,
      currentPrompt,
      transcript,
      initialize,
      speak,
      startWakeMode,
      startActiveMode,
      stopAll,
      retryMic,
      listening,
      speaking,
      thinking,
      askAndListen,
      startListening,
      stopListening,
      shutdown,
      scheduleRestart,
      hardStopListening,
    ],
  );
}

export type UseVoiceEngineReturn = ReturnType<typeof useVoiceEngine>;
export default useVoiceEngine;
