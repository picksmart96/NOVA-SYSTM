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
  /** Which recognition mode to restart after speaking. Default "wake". */
  after?: "wake" | "active";
  /** Compat alias — treated same as after:"active" */
  restartAfterSpeak?: boolean;
  onEnd?: () => void;
};

type UseVoiceEngineOptions = {
  onHeard?: (heard: string, raw: string) => void | Promise<void>;
  lang?: string;
  silenceTimeoutMs?: number;
  /** Compat — accepted but the new engine restarts automatically */
  autoRestart?: boolean;
  /** Compat — accepted but ignored (engine restarts silently on no-speech) */
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
  // Refs — stable across renders, never stale inside callbacks
  const recognitionRef = useRef<AnyRecognition>(null);
  const shouldRunRef = useRef(false);
  const speakingRef = useRef(false);
  const restartingRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ttsWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRef = useRef<"wake" | "active">("wake");
  const onHeardRef = useRef(onHeard);
  useEffect(() => {
    onHeardRef.current = onHeard;
  });

  const [status, setStatus] = useState<StatusValue>(STATUS.IDLE);
  const [supported, setSupported] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [micPermission, setMicPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [error, setError] = useState("");
  const [lastHeard, setLastHeard] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [transcript, setTranscript] = useState("");

  // ── Silence timer ─────────────────────────────────────────────────────────
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
        try {
          recognitionRef.current?.stop();
        } catch {
          // ignore
        }
      }
    }, silenceTimeoutMs);
  }, [clearSilenceTimer, silenceTimeoutMs]);

  // ── Recognition control ────────────────────────────────────────────────────
  const stopRecognition = useCallback(() => {
    clearSilenceTimer();
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  }, [clearSilenceTimer]);

  const abortRecognition = useCallback(() => {
    clearSilenceTimer();
    try {
      recognitionRef.current?.abort();
    } catch {
      // ignore
    }
  }, [clearSilenceTimer]);

  const startRecognition = useCallback(
    (mode: "wake" | "active" = "wake") => {
      if (!recognitionRef.current || !shouldRunRef.current || speakingRef.current) {
        console.log("[NOVA voice] startRecognition blocked", { hasRec: !!recognitionRef.current, shouldRun: shouldRunRef.current, speaking: speakingRef.current });
        return;
      }
      if (restartingRef.current) {
        console.log("[NOVA voice] startRecognition blocked (already restarting)");
        return;
      }

      restartingRef.current = true;
      modeRef.current = mode;
      setError("");
      setStatus(mode === "active" ? STATUS.ACTIVE_LISTENING : STATUS.WAKE_LISTENING);
      console.log("[NOVA voice] recognition starting →", mode);

      try {
        recognitionRef.current.start();
        startSilenceTimer();
      } catch (err) {
        console.warn("[NOVA voice] recognition.start() threw:", err);
        restartingRef.current = false;
      }
    },
    [startSilenceTimer],
  );

  // ── Speak ──────────────────────────────────────────────────────────────────
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
      // Clear any previous TTS watchdog
      if (ttsWatchdogRef.current) clearTimeout(ttsWatchdogRef.current);
      stopRecognition();
      setStatus(STATUS.SPEAKING);
      console.log("[NOVA voice] TTS speaking →", text.slice(0, 60));

      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }

      // Chrome bug: speechSynthesis can get stuck in paused state after cancel()
      try {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      } catch {
        // ignore
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 1;
      utterance.pitch = 1;
      const voice = pickPreferredVoice(lang);
      if (voice) utterance.voice = voice;

      const handleTTSDone = (reason: string) => {
        if (!speakingRef.current) return; // already handled
        console.log("[NOVA voice] TTS done →", reason);
        if (ttsWatchdogRef.current) clearTimeout(ttsWatchdogRef.current);
        speakingRef.current = false;
        onEnd?.();
        if (shouldRunRef.current) {
          // 150ms delay: Chrome keeps audio pipeline busy just long enough to
          // reject an immediate recognition.start() with InvalidStateError
          setTimeout(() => startRecognition(after), 150);
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
          setTimeout(() => startRecognition(after), 150);
        } else {
          setError("Speech playback failed.");
          setStatus(STATUS.ERROR);
        }
      };

      try {
        window.speechSynthesis.speak(utterance);

        // Watchdog: if onend never fires within 15s, force-restart mic
        ttsWatchdogRef.current = setTimeout(() => {
          console.warn("[NOVA voice] TTS watchdog fired — onend never fired, forcing restart");
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
    [clearSilenceTimer, lang, startRecognition, stopRecognition],
  );

  // ── Initialize ────────────────────────────────────────────────────────────
  const initialize = useCallback(async (): Promise<boolean> => {
    // ── IDEMPOTENT GUARD: already have a working recognition → just ensure running ──
    if (recognitionRef.current && micPermission === "granted") {
      shouldRunRef.current = true;
      if (!speakingRef.current && !restartingRef.current) {
        startRecognition(modeRef.current);
      }
      return true;
    }

    const Recognition = getRecognitionClass();
    if (!Recognition) {
      setSupported(false);
      setError("This browser does not fully support live voice mode. Try Chrome.");
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

    const recognition: AnyRecognition = new Recognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      restartingRef.current = false;
      console.log("[NOVA voice] recognition started ✓ mode:", modeRef.current);
      startSilenceTimer();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = async (event: any) => {
      clearSilenceTimer();
      const raw: string = event?.results?.[0]?.[0]?.transcript ?? "";
      const heard = raw.toLowerCase().trim();
      console.log("[NOVA voice] heard:", JSON.stringify(heard));
      setLastHeard(heard);
      setTranscript(heard);

      if (heard && onHeardRef.current) {
        setStatus(STATUS.THINKING);
        await onHeardRef.current(heard, raw);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      clearSilenceTimer();
      restartingRef.current = false;
      const code: string = event?.error ?? "unknown";
      console.log("[NOVA voice] recognition error:", code);

      if (code === "not-allowed" || code === "service-not-allowed") {
        setMicPermission("denied");
        setError("Microphone permission was denied.");
        setStatus(STATUS.ERROR);
        shouldRunRef.current = false;
        return;
      }

      if (code === "no-speech" || code === "aborted") {
        if (shouldRunRef.current && !speakingRef.current) {
          setTimeout(() => startRecognition(modeRef.current), 150);
        }
        return;
      }

      setError(`Recognition error: ${code}`);
      if (shouldRunRef.current && !speakingRef.current) {
        setTimeout(() => startRecognition(modeRef.current), 300);
      } else {
        setStatus(STATUS.ERROR);
      }
    };

    recognition.onend = () => {
      clearSilenceTimer();
      restartingRef.current = false;
      console.log("[NOVA voice] recognition ended — speaking:", speakingRef.current, "shouldRun:", shouldRunRef.current);
      if (shouldRunRef.current && !speakingRef.current) {
        setTimeout(() => startRecognition(modeRef.current), 150);
      }
    };

    recognitionRef.current = recognition;
    shouldRunRef.current = true;
    setInitialized(true);
    setStatus(STATUS.WAKE_LISTENING);
    console.log("[NOVA voice] initialized — starting wake recognition");
    startRecognition("wake");
    return true;
  }, [clearSilenceTimer, lang, micPermission, startRecognition, startSilenceTimer]);

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
    clearSilenceTimer();
    abortRecognition();
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // ignore
    }
    speakingRef.current = false;
    setStatus(STATUS.STOPPED);
  }, [abortRecognition, clearSilenceTimer]);

  const retryMic = useCallback(async () => {
    // Force full re-init by clearing the recognition ref
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setInitialized(false);
    setMicPermission("unknown");
    shouldRunRef.current = false;
    return initialize();
  }, [initialize]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, [stopAll]);

  // ── Compat aliases (used by NovaTrainerPage + my-assignments) ─────────────
  /** Speak then restart active listening. Alias for speak(text, { after:"active" }) */
  const askAndListen = useCallback(
    (text: string) => speak(text, { after: "active" }),
    [speak],
  );
  /** Start active-mode recognition. Alias for startActiveMode(). */
  const startListening = useCallback(() => startActiveMode(), [startActiveMode]);
  /** Stop all. Alias for stopAll(). */
  const stopListening = useCallback(() => stopAll(), [stopAll]);
  /** Stop all. Alias for stopAll(). */
  const shutdown = useCallback(() => stopAll(), [stopAll]);
  /** Compat: restart recognition. Maps to startActiveMode(). */
  const scheduleRestart = useCallback(
    (_delayMs?: number) => startActiveMode(),
    [startActiveMode],
  );
  /** Compat: hard stop. Maps to stopAll(). */
  const hardStopListening = useCallback(() => stopAll(), [stopAll]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const listening =
    status === STATUS.WAKE_LISTENING || status === STATUS.ACTIVE_LISTENING;
  const speaking = status === STATUS.SPEAKING;
  const thinking = status === STATUS.THINKING;

  return useMemo(
    () => ({
      // New API
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
      // Compat aliases — keep old pages working without changes
      askAndListen,
      startListening,
      stopListening,
      shutdown,
      scheduleRestart,
      hardStopListening,
      processing: thinking,
      isSpeaking: speaking,
      idle: status === STATUS.IDLE || status === STATUS.STOPPED,
      stop: stopAll,
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
