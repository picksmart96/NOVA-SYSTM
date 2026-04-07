import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const STATUS = {
  IDLE: "idle",
  LISTENING: "listening",
  SPEAKING: "speaking",
  PROCESSING: "processing",
  ERROR: "error",
} as const;

type StatusValue = typeof STATUS[keyof typeof STATUS];

function normalizeText(text = ""): string {
  return text.toLowerCase().trim();
}

function getSpeechRecognition(): typeof SpeechRecognition | null {
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
}

interface UseVoiceEngineOptions {
  onHeard?: (heard: string, raw: string) => void;
  autoRestart?: boolean;
  silencePrompt?: string;
  lang?: string;
}

export interface UseVoiceEngineReturn {
  initialize: () => Promise<boolean>;
  startListening: () => void;
  stopListening: () => void;
  hardStopListening: () => void;
  speak: (text: string, opts?: SpeakOptions) => void;
  askAndListen: (text: string, opts?: SpeakOptions) => void;
  retryMic: () => Promise<boolean>;
  shutdown: () => void;

  status: StatusValue;
  transcript: string;
  lastHeard: string;
  currentPrompt: string;
  error: string;
  micPermission: "unknown" | "granted" | "denied";
  supported: boolean;
  initialized: boolean;

  listening: boolean;
  speaking: boolean;
  processing: boolean;
  idle: boolean;

  // Legacy compat
  isSpeaking: boolean;
  stop: () => void;
}

interface SpeakOptions {
  onEnd?: () => void;
  interrupt?: boolean;
  restartAfterSpeak?: boolean;
  rate?: number;
  pitch?: number;
}

export function useVoiceEngine({
  onHeard,
  autoRestart = true,
  silencePrompt = "No input received.",
  lang = "en-US",
}: UseVoiceEngineOptions = {}): UseVoiceEngineReturn {
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const manuallyStoppedRef = useRef(false);
  const isStartingRef = useRef(false);

  const [status, setStatus] = useState<StatusValue>(STATUS.IDLE);
  const [transcript, setTranscript] = useState("");
  const [lastHeard, setLastHeard] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [error, setError] = useState("");
  const [micPermission, setMicPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [supported, setSupported] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const clearRestartTimeout = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, []);

  const safeStartRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (isStartingRef.current) return;
    try {
      isStartingRef.current = true;
      recognition.start();
    } catch {
      isStartingRef.current = false;
    }
  }, []);

  const scheduleRestart = useCallback(
    (delay = 300) => {
      if (!autoRestart) return;
      if (!shouldKeepListeningRef.current) return;
      clearRestartTimeout();
      restartTimeoutRef.current = setTimeout(() => {
        safeStartRecognition();
      }, delay);
    },
    [autoRestart, safeStartRecognition, clearRestartTimeout]
  );

  const stopListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    manuallyStoppedRef.current = true;
    clearRestartTimeout();
    try { recognitionRef.current?.stop(); } catch {}
  }, [clearRestartTimeout]);

  const hardStopListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    manuallyStoppedRef.current = true;
    clearRestartTimeout();
    try { recognitionRef.current?.abort(); } catch {}
  }, [clearRestartTimeout]);

  const startListening = useCallback(() => {
    if (!supported) {
      setError("Speech recognition is not supported in this browser.");
      setStatus(STATUS.ERROR);
      return;
    }
    manuallyStoppedRef.current = false;
    shouldKeepListeningRef.current = true;
    clearRestartTimeout();
    safeStartRecognition();
  }, [safeStartRecognition, supported, clearRestartTimeout]);

  const speak = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      const {
        onEnd,
        interrupt = true,
        restartAfterSpeak = true,
        rate = 1,
        pitch = 1,
      } = opts;

      if (!("speechSynthesis" in window)) {
        onEnd?.();
        if (restartAfterSpeak && shouldKeepListeningRef.current) scheduleRestart(250);
        return;
      }

      clearRestartTimeout();
      setCurrentPrompt(text);
      setStatus(STATUS.SPEAKING);
      setError("");

      try { recognitionRef.current?.stop(); } catch {}

      if (interrupt) {
        try { window.speechSynthesis.cancel(); } catch {}
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.lang = lang;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => /samantha|zira|karen|female|aria|ava/i.test(v.name)) ||
        voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => {
        setStatus(STATUS.IDLE);
        onEnd?.();
        if (restartAfterSpeak && shouldKeepListeningRef.current) scheduleRestart(250);
      };

      utterance.onerror = () => {
        setError("Speech playback failed.");
        setStatus(STATUS.ERROR);
        if (restartAfterSpeak && shouldKeepListeningRef.current) scheduleRestart(400);
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        setError("Unable to start speech playback.");
        setStatus(STATUS.ERROR);
        if (restartAfterSpeak && shouldKeepListeningRef.current) scheduleRestart(400);
      }
    },
    [lang, scheduleRestart, clearRestartTimeout]
  );

  const askAndListen = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      speak(text, { ...opts, restartAfterSpeak: true });
    },
    [speak]
  );

  const initialize = useCallback(async (): Promise<boolean> => {
    const SpeechRecognitionClass = getSpeechRecognition();

    if (!SpeechRecognitionClass) {
      setSupported(false);
      setError("Speech recognition is not supported in this browser.");
      setStatus(STATUS.ERROR);
      return false;
    }

    setSupported(true);
    setError("");

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermission("granted");
      } else {
        setMicPermission("unknown");
      }
    } catch {
      setMicPermission("denied");
      setError("Microphone permission was denied.");
      setStatus(STATUS.ERROR);
      return false;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isStartingRef.current = false;
      setStatus(STATUS.LISTENING);
      setError("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const raw = event?.results?.[0]?.[0]?.transcript || "";
      const heard = normalizeText(raw);

      setTranscript(raw);
      setLastHeard(heard);
      setStatus(STATUS.PROCESSING);
      setError("");

      if (!heard) {
        speak(silencePrompt, { restartAfterSpeak: true });
        return;
      }

      onHeard?.(heard, raw);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      isStartingRef.current = false;
      const errType = (event as any)?.error || "unknown";

      if (errType === "not-allowed" || errType === "service-not-allowed") {
        setMicPermission("denied");
        setError("Microphone permission was denied.");
        setStatus(STATUS.ERROR);
        shouldKeepListeningRef.current = false;
        return;
      }

      if (errType === "no-speech") {
        speak(silencePrompt, { restartAfterSpeak: true });
        return;
      }

      setError(`Recognition error: ${errType}`);
      setStatus(STATUS.ERROR);

      if (shouldKeepListeningRef.current && autoRestart) {
        scheduleRestart(500);
      }
    };

    recognition.onend = () => {
      isStartingRef.current = false;

      if (manuallyStoppedRef.current) {
        setStatus(STATUS.IDLE);
        return;
      }

      if (shouldKeepListeningRef.current && autoRestart) {
        scheduleRestart(250);
      } else {
        setStatus(STATUS.IDLE);
      }
    };

    recognitionRef.current = recognition;
    setInitialized(true);
    setStatus(STATUS.IDLE);
    return true;
  }, [autoRestart, lang, onHeard, scheduleRestart, silencePrompt, speak]);

  const shutdown = useCallback(() => {
    stopListening();
    clearRestartTimeout();
    try { window.speechSynthesis.cancel(); } catch {}
    recognitionRef.current = null;
    setInitialized(false);
    setStatus(STATUS.IDLE);
  }, [stopListening, clearRestartTimeout]);

  const retryMic = useCallback(async () => {
    setError("");
    setStatus(STATUS.IDLE);
    return initialize();
  }, [initialize]);

  useEffect(() => {
    return () => { shutdown(); };
  }, [shutdown]);

  const api = useMemo(
    () => ({
      initialize, startListening, stopListening, hardStopListening,
      speak, askAndListen, retryMic, shutdown,
      status, transcript, lastHeard, currentPrompt, error,
      micPermission, supported, initialized,
      listening: status === STATUS.LISTENING,
      speaking: status === STATUS.SPEAKING,
      processing: status === STATUS.PROCESSING,
      idle: status === STATUS.IDLE,
      isSpeaking: status === STATUS.SPEAKING,
      stop: stopListening,
    }),
    [
      initialize, startListening, stopListening, hardStopListening,
      speak, askAndListen, retryMic, shutdown,
      status, transcript, lastHeard, currentPrompt, error,
      micPermission, supported, initialized,
    ]
  );

  return api;
}
