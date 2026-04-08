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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getRecognitionClass(): typeof SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as { SpeechRecognition?: typeof SpeechRecognition })
      .SpeechRecognition ||
    (
      window as unknown as {
        webkitSpeechRecognition?: typeof SpeechRecognition;
      }
    ).webkitSpeechRecognition ||
    null
  );
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
  // Refs — never stale inside callbacks
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldRunRef = useRef(false);
  const speakingRef = useRef(false);
  const restartingRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      if (!recognitionRef.current || !shouldRunRef.current || speakingRef.current) return;
      if (restartingRef.current) return;

      restartingRef.current = true;
      modeRef.current = mode;
      setError("");
      setStatus(mode === "active" ? STATUS.ACTIVE_LISTENING : STATUS.WAKE_LISTENING);

      try {
        recognitionRef.current.start();
        startSilenceTimer();
      } catch {
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
      stopRecognition();
      setStatus(STATUS.SPEAKING);

      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 1;
      utterance.pitch = 1;
      const voice = pickPreferredVoice(lang);
      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        speakingRef.current = false;
        onEnd?.();
        if (shouldRunRef.current) {
          startRecognition(after);
        } else {
          setStatus(STATUS.STOPPED);
        }
      };

      utterance.onerror = () => {
        speakingRef.current = false;
        setError("Speech playback failed.");
        if (shouldRunRef.current) {
          startRecognition(after);
        } else {
          setStatus(STATUS.ERROR);
        }
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        speakingRef.current = false;
        setStatus(STATUS.ERROR);
        setError("Unable to start speech playback.");
      }
    },
    [clearSilenceTimer, lang, startRecognition, stopRecognition],
  );

  // ── Initialize ────────────────────────────────────────────────────────────
  const initialize = useCallback(async (): Promise<boolean> => {
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

    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      restartingRef.current = false;
      startSilenceTimer();
    };

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      clearSilenceTimer();
      const raw = event?.results?.[0]?.[0]?.transcript ?? "";
      const heard = raw.toLowerCase().trim();
      setLastHeard(heard);
      setTranscript(heard);

      if (heard && onHeardRef.current) {
        setStatus(STATUS.THINKING);
        await onHeardRef.current(heard, raw);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      clearSilenceTimer();
      restartingRef.current = false;
      const code = (event as SpeechRecognitionErrorEvent).error ?? "unknown";

      if (code === "not-allowed" || code === "service-not-allowed") {
        setMicPermission("denied");
        setError("Microphone permission was denied.");
        setStatus(STATUS.ERROR);
        shouldRunRef.current = false;
        return;
      }

      if (code === "no-speech" || code === "aborted") {
        if (shouldRunRef.current && !speakingRef.current) {
          startRecognition(modeRef.current);
        }
        return;
      }

      setError(`Recognition error: ${code}`);
      if (shouldRunRef.current && !speakingRef.current) {
        startRecognition(modeRef.current);
      } else {
        setStatus(STATUS.ERROR);
      }
    };

    recognition.onend = () => {
      clearSilenceTimer();
      restartingRef.current = false;
      if (shouldRunRef.current && !speakingRef.current) {
        startRecognition(modeRef.current);
      }
    };

    recognitionRef.current = recognition;
    shouldRunRef.current = true;
    setInitialized(true);
    setStatus(STATUS.WAKE_LISTENING);
    startRecognition("wake");
    return true;
  }, [clearSilenceTimer, lang, startRecognition, startSilenceTimer]);

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
    stopAll();
    return initialize();
  }, [initialize, stopAll]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, [stopAll]);

  // ── Compat aliases (used by NovaTrainerPage + my-assignments) ─────────────
  /** Speak text then restart active listening. Compat alias for speak(text, { after:"active" }) */
  const askAndListen = useCallback(
    (text: string) => speak(text, { after: "active" }),
    [speak],
  );
  /** Start active-mode recognition. Compat alias for startActiveMode(). */
  const startListening = useCallback(() => startActiveMode(), [startActiveMode]);
  /** Stop all. Compat alias for stopAll(). */
  const stopListening = useCallback(() => stopAll(), [stopAll]);
  /** Stop all. Compat alias for stopAll(). */
  const shutdown = useCallback(() => stopAll(), [stopAll]);
  /** Restart recognition after a manual stop. Compat alias for startActiveMode(). */
  const scheduleRestart = useCallback(
    (_delayMs?: number) => startActiveMode(),
    [startActiveMode],
  );
  /** Restart recognition silently. Compat alias for startActiveMode(). */
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
