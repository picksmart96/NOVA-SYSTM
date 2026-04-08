import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const STATUS = {
  IDLE: "idle",
  WAKE_LISTENING: "wake_listening",
  ACTIVE_LISTENING: "active_listening",
  THINKING: "thinking",
  SPEAKING: "speaking",
  STOPPED: "stopped",
  ERROR: "error",
  PTT_READY: "ptt_ready",
  PTT_RECORDING: "ptt_recording",
} as const;

type StatusValue = (typeof STATUS)[keyof typeof STATUS];

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

// ── Transcribe via server ─────────────────────────────────────────────────────
async function transcribeBlob(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", blob, "recording.webm");
  const res = await fetch("/api/transcribe", { method: "POST", body: formData });
  if (!res.ok) return "";
  const data = await res.json() as { text?: string };
  return (data.text ?? "").toLowerCase().trim();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useVoiceEngine({
  onHeard,
  lang = "en-US",
  silenceTimeoutMs = 7000,
}: UseVoiceEngineOptions = {}) {
  const recognitionRef = useRef<AnyRecognition>(null);
  const shouldRunRef = useRef(false);
  const speakingRef = useRef(false);
  const restartingRef = useRef(false);
  const recognitionActiveRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ttsWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serviceRetryRef = useRef(0);
  const modeRef = useRef<"wake" | "active">("wake");
  const langRef = useRef(lang);
  const onHeardRef = useRef(onHeard);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startRecognitionRef = useRef<((mode: "wake" | "active") => void) | null>(null);

  // PTT refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const micStreamRef = useRef<MediaStream | null>(null);
  const pttProcessingRef = useRef(false);

  useEffect(() => { onHeardRef.current = onHeard; });
  useEffect(() => { langRef.current = lang; }, [lang]);

  const [status, setStatus] = useState<StatusValue>(STATUS.IDLE);
  const [supported, setSupported] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [micPermission, setMicPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [error, setError] = useState("");
  const [lastHeard, setLastHeard] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [transcript, setTranscript] = useState("");
  // PTT mode — activated when SpeechRecognition keeps aborting
  const [pttMode, setPttMode] = useState(false);
  const [pttRecording, setPttRecording] = useState(false);
  const pttModeRef = useRef(false);

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

  const killCurrentRecognition = useCallback(() => {
    clearSilenceTimer();
    const old = recognitionRef.current;
    if (!old) return;
    old.onstart = null;
    old.onresult = null;
    old.onerror = null;
    old.onend = null;
    recognitionRef.current = null;
    restartingRef.current = false;
    recognitionActiveRef.current = false;
    try { old.abort(); } catch { /* ignore */ }
  }, [clearSilenceTimer]);

  // ── Switch to PTT mode permanently ───────────────────────────────────────
  const activatePTT = useCallback(() => {
    if (pttModeRef.current) return;
    pttModeRef.current = true;
    setPttMode(true);
    shouldRunRef.current = false;
    killCurrentRecognition();
    setStatus(STATUS.PTT_READY);
    console.log("[NOVA voice] switching to push-to-talk mode (SpeechRecognition unavailable)");
  }, [killCurrentRecognition]);

  // ── Core: create recognition instance ────────────────────────────────────
  const startRecognition = useCallback(
    (mode: "wake" | "active" = "wake") => {
      if (pttModeRef.current) return;
      if (!shouldRunRef.current || speakingRef.current) return;
      if (restartingRef.current || recognitionActiveRef.current) return;

      const Recognition = getRecognitionClass();
      if (!Recognition) {
        activatePTT();
        return;
      }

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

      rec.onstart = () => {
        restartingRef.current = false;
        recognitionActiveRef.current = true;
        console.log("[NOVA voice] recognition started ✓ mode:", modeRef.current);
        startSilenceTimer();
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = async (event: any) => {
        clearSilenceTimer();
        serviceRetryRef.current = 0;
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
          return;
        }

        if (code === "network" || code === "aborted") {
          serviceRetryRef.current++;
          // After 3 consecutive aborts, switch permanently to PTT
          if (serviceRetryRef.current >= 3) {
            activatePTT();
            return;
          }
          return;
        }

        if (code === "no-speech") {
          serviceRetryRef.current = 0;
          return;
        }

        setError(`Voice error: ${code}`);
      };

      rec.onend = () => {
        clearSilenceTimer();
        restartingRef.current = false;
        recognitionActiveRef.current = false;
        recognitionRef.current = null;
        const retries = serviceRetryRef.current;
        console.log("[NOVA voice] recognition ended — speaking:", speakingRef.current, "shouldRun:", shouldRunRef.current, "retries:", retries);

        if (pttModeRef.current) return;
        if (!shouldRunRef.current || speakingRef.current) return;

        const delay = retries > 0
          ? Math.min(500 * Math.pow(2, Math.min(retries - 1, 5)), 30_000)
          : 50;

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
    [clearSilenceTimer, startSilenceTimer, activatePTT],
  );

  useEffect(() => { startRecognitionRef.current = startRecognition; }, [startRecognition]);

  const stopRecognition = useCallback(() => {
    clearSilenceTimer();
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
  }, [clearSilenceTimer]);

  const abortRecognition = useCallback(() => {
    killCurrentRecognition();
  }, [killCurrentRecognition]);

  // ── PTT: start recording ─────────────────────────────────────────────────
  const startPTT = useCallback(async () => {
    if (!pttModeRef.current || speakingRef.current || pttProcessingRef.current) return;
    if (mediaRecorderRef.current?.state === "recording") return;

    try {
      let stream = micStreamRef.current;
      if (!stream || stream.getTracks().every((t) => t.readyState === "ended")) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
      }

      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(100);
      setPttRecording(true);
      setStatus(STATUS.PTT_RECORDING);
      console.log("[NOVA voice] PTT recording started");
    } catch (err) {
      console.error("[NOVA voice] PTT start failed:", err);
      setError("Could not access microphone.");
      setStatus(STATUS.ERROR);
    }
  }, []);

  // ── PTT: stop recording and transcribe ───────────────────────────────────
  const stopPTT = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    if (pttProcessingRef.current) return;

    pttProcessingRef.current = true;
    setPttRecording(false);
    setStatus(STATUS.THINKING);

    recorder.stop();

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      setTimeout(resolve, 1000);
    });

    const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
    audioChunksRef.current = [];
    mediaRecorderRef.current = null;

    console.log("[NOVA voice] PTT transcribing blob", blob.size, "bytes");

    if (blob.size < 1000) {
      console.log("[NOVA voice] PTT blob too small — no speech detected");
      setPttRecording(false);
      setStatus(STATUS.PTT_READY);
      pttProcessingRef.current = false;
      return;
    }

    try {
      const text = await transcribeBlob(blob);
      console.log("[NOVA voice] PTT heard:", JSON.stringify(text));
      if (text) {
        setLastHeard(text);
        setTranscript(text);
        if (onHeardRef.current) {
          await onHeardRef.current(text, text);
        }
      }
    } catch (err) {
      console.error("[NOVA voice] PTT transcription error:", err);
      setError("Transcription failed. Try again.");
    }

    pttProcessingRef.current = false;
    setStatus(STATUS.PTT_READY);
  }, []);

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
        if (shouldRunRef.current && !pttModeRef.current) startRecognition(after);
        return;
      }

      speakingRef.current = true;
      clearSilenceTimer();
      if (ttsWatchdogRef.current) clearTimeout(ttsWatchdogRef.current);

      if (!pttModeRef.current) stopRecognition();
      setStatus(STATUS.SPEAKING);
      console.log("[NOVA voice] TTS speaking →", text.slice(0, 60));

      try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
      try { if (window.speechSynthesis.paused) window.speechSynthesis.resume(); } catch { /* ignore */ }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langRef.current;
      utterance.rate = 1.35;
      utterance.pitch = 1;
      const voice = pickPreferredVoice(langRef.current);
      if (voice) utterance.voice = voice;

      const handleTTSDone = (reason: string) => {
        if (!speakingRef.current) return;
        console.log("[NOVA voice] TTS done →", reason);
        if (ttsWatchdogRef.current) clearTimeout(ttsWatchdogRef.current);
        speakingRef.current = false;
        onEnd?.();
        if (pttModeRef.current) {
          setStatus(STATUS.PTT_READY);
        } else if (shouldRunRef.current) {
          serviceRetryRef.current = 0;
          setTimeout(() => startRecognition(after), 80);
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
        onEnd?.();
        if (pttModeRef.current) {
          setStatus(STATUS.PTT_READY);
        } else if (shouldRunRef.current) {
          setTimeout(() => startRecognition(after), 80);
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
        onEnd?.();
        if (pttModeRef.current) {
          setStatus(STATUS.PTT_READY);
        } else {
          setStatus(STATUS.ERROR);
          setError("Unable to start speech playback.");
        }
      }
    },
    [clearSilenceTimer, startRecognition, stopRecognition],
  );

  // ── Initialize ────────────────────────────────────────────────────────────
  const initialize = useCallback(async (): Promise<boolean> => {
    if (micPermission === "granted" && initialized) {
      if (pttModeRef.current) {
        setStatus(STATUS.PTT_READY);
        return true;
      }
      shouldRunRef.current = true;
      if (!speakingRef.current && !restartingRef.current && !recognitionActiveRef.current) {
        startRecognition(modeRef.current);
      }
      return true;
    }

    const Recognition = getRecognitionClass();
    if (!Recognition) {
      setSupported(false);
      // No SpeechRecognition at all — go straight to PTT if mic available
    } else {
      setSupported(true);
    }

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

    setInitialized(true);
    serviceRetryRef.current = 0;
    console.log("[NOVA voice] initialized");

    if (!Recognition) {
      activatePTT();
    } else {
      shouldRunRef.current = true;
    }

    return true;
  }, [initialized, micPermission, startRecognition, activatePTT]);

  const startWakeMode = useCallback(() => {
    if (pttModeRef.current) return;
    shouldRunRef.current = true;
    startRecognition("wake");
  }, [startRecognition]);

  const startActiveMode = useCallback(() => {
    if (pttModeRef.current) return;
    shouldRunRef.current = true;
    startRecognition("active");
  }, [startRecognition]);

  const stopAll = useCallback(() => {
    shouldRunRef.current = false;
    killCurrentRecognition();
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    speakingRef.current = false;
    if (pttModeRef.current) {
      setStatus(STATUS.PTT_READY);
    } else {
      setStatus(STATUS.STOPPED);
    }
  }, [killCurrentRecognition]);

  const retryMic = useCallback(async () => {
    killCurrentRecognition();
    setInitialized(false);
    setMicPermission("unknown");
    shouldRunRef.current = false;
    serviceRetryRef.current = 0;
    pttModeRef.current = false;
    setPttMode(false);
    return initialize();
  }, [initialize, killCurrentRecognition]);

  useEffect(() => {
    return () => { stopAll(); };
  }, [stopAll]);

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
      // PTT
      pttMode,
      pttRecording,
      startPTT,
      stopPTT,
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
      pttMode,
      pttRecording,
      startPTT,
      stopPTT,
    ],
  );
}

export type UseVoiceEngineReturn = ReturnType<typeof useVoiceEngine>;
export default useVoiceEngine;
