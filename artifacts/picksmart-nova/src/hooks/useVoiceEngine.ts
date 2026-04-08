import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const STATUS = {
  IDLE: "idle",
  WAKE_LISTENING: "wake_listening",
  ACTIVE_LISTENING: "active_listening",
  THINKING: "thinking",
  SPEAKING: "speaking",
  STOPPED: "stopped",
  ERROR: "error",
  VAD_RECORDING: "vad_recording",
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
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

// ── VAD constants ─────────────────────────────────────────────────────────────
// Replit iframe mic produces low RMS levels. Voice is ~3-8, silence is ~0-2.
// Using a unified threshold of 3 to distinguish speech from silence.
const VAD_THRESHOLD        = 3;    // above = speech, below = silence
const VAD_SILENCE_DURATION = 1400; // ms of silence after speech → process clip
const VAD_MIN_RECORD_MS    = 500;  // minimum recording before silence check
const VAD_MAX_NO_SPEECH_MS = 8000; // discard + restart if no speech in 8s

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
    voices.find((v) => /samantha|aria|ava|zira|karen/i.test(v.name) && v.lang.startsWith(langRoot)) ||
    voices.find((v) => /samantha|aria|ava|zira|karen/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith(langRoot) && v.default) ||
    voices[0]
  );
}

async function transcribeBlob(blob: Blob): Promise<string> {
  // Endpoint expects raw audio bytes with Content-Type header (not multipart/form-data)
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const contentType = blob.type || "audio/webm";
  const res = await fetch("/api/transcribe", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: bytes,
  });
  if (!res.ok) return "";
  const data = await res.json() as { transcript?: string };
  return (data.transcript ?? "").toLowerCase().trim();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useVoiceEngine({
  onHeard,
  lang = "en-US",
  silenceTimeoutMs = 7000,
}: UseVoiceEngineOptions = {}) {

  // ── Core refs ─────────────────────────────────────────────────────────────
  const recognitionRef       = useRef<AnyRecognition>(null);
  const shouldRunRef         = useRef(false);
  const speakingRef          = useRef(false);
  const restartingRef        = useRef(false);
  const recognitionActiveRef = useRef(false);
  const silenceTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ttsWatchdogRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serviceRetryRef      = useRef(0);
  const modeRef              = useRef<"wake" | "active">("wake");
  const langRef              = useRef(lang);
  const onHeardRef           = useRef(onHeard);
  const startRecognitionRef  = useRef<((mode: "wake" | "active") => void) | null>(null);

  // ── VAD refs ──────────────────────────────────────────────────────────────
  const vadModeRef       = useRef(false);  // permanently switched to VAD
  const vadSpeakingRef   = useRef(false);  // NOVA TTS is playing
  const vadActiveRef     = useRef(false);  // tick loop running
  const micStreamRef     = useRef<MediaStream | null>(null);
  const audioCtxRef      = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const speechDetectedRef    = useRef(false);
  const silenceStartVADRef   = useRef<number | null>(null);
  const recordStartRef       = useRef<number>(0);

  // ── VAD loop stored as a ref updated after every render ───────────────────
  // Using an unconditional useEffect means the function is always the latest
  // version with all current refs — no stale closure issues.
  const startVADRef = useRef<() => Promise<void>>(async () => {});

  // ── React state ───────────────────────────────────────────────────────────
  const [status,        setStatus]        = useState<StatusValue>(STATUS.IDLE);
  const [supported,     setSupported]     = useState(false);
  const [initialized,   setInitialized]   = useState(false);
  const [micPermission, setMicPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [error,         setError]         = useState("");
  const [lastHeard,     setLastHeard]     = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [transcript,    setTranscript]    = useState("");
  const [volume,        setVolume]        = useState(0);
  const [vadMode,       setVadMode]       = useState(false);

  useEffect(() => { onHeardRef.current = onHeard; });
  useEffect(() => { langRef.current = lang; }, [lang]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
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
    old.onstart = null; old.onresult = null; old.onerror = null; old.onend = null;
    recognitionRef.current = null;
    restartingRef.current = false;
    recognitionActiveRef.current = false;
    try { old.abort(); } catch { /* ignore */ }
  }, [clearSilenceTimer]);

  const stopMicStream = useCallback(() => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
  }, []);

  const stopVADAudio = useCallback(() => {
    vadActiveRef.current = false;
    silenceStartVADRef.current = null;
    setVolume(0);
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch { /* ignore */ }
      audioCtxRef.current = null;
    }
  }, []);

  // ── VAD loop function — stored in ref, updated every render ───────────────
  // This pattern ensures the function always reads the latest refs without
  // needing useCallback dependencies or stale closures.
  useEffect(() => {
    startVADRef.current = async () => {
      console.log("[NOVA VAD] startVAD called → vadMode:", vadModeRef.current, "speaking:", vadSpeakingRef.current, "recorder:", !!mediaRecorderRef.current);

      if (!vadModeRef.current) return;
      if (vadSpeakingRef.current) { console.log("[NOVA VAD] deferred — NOVA speaking"); return; }
      if (mediaRecorderRef.current) { console.log("[NOVA VAD] deferred — already recording"); return; }

      speechDetectedRef.current = false;
      silenceStartVADRef.current = null;
      chunksRef.current = [];

      // Open microphone
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.error("[NOVA VAD] mic error:", err);
        setError("Microphone unavailable.");
        setStatus(STATUS.ERROR);
        return;
      }
      micStreamRef.current = stream;

      // Pick best format
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/ogg")
        ? "audio/ogg"
        : "audio/mp4";

      // Start recording immediately
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorderRef.current = recorder;
      recorder.start(200);
      recordStartRef.current = Date.now();
      console.log("[NOVA VAD] recording started, mimeType:", mimeType);
      setStatus(STATUS.VAD_RECORDING);
      setVolume(0);

      // ── Volume / silence analysis ─────────────────────────────────────────
      const processClip = async () => {
        stopVADAudio();
        setStatus(STATUS.THINKING);

        await new Promise<void>((res) => {
          recorder.onstop = () => res();
          try { recorder.stop(); } catch { res(); }
        });
        stream.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        console.log("[NOVA VAD] clip ready, size:", blob.size, "speech:", speechDetectedRef.current);

        if (speechDetectedRef.current && blob.size >= 300) {
          try {
            const text = await transcribeBlob(blob);
            console.log("[NOVA VAD] transcription:", JSON.stringify(text));
            if (text) {
              setLastHeard(text);
              setTranscript(text);
              if (onHeardRef.current) await onHeardRef.current(text, text);
            }
          } catch (err) {
            console.error("[NOVA VAD] transcription error:", err);
          }
        }

        // Restart loop
        if (vadModeRef.current && !vadSpeakingRef.current) {
          setTimeout(() => { startVADRef.current(); }, 250);
        }
      };

      try {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const buf = new Uint8Array(analyser.frequencyBinCount);
        vadActiveRef.current = true;

        const tick = () => {
          if (!vadActiveRef.current) return;

          // NOVA started speaking — abort current clip
          if (vadSpeakingRef.current) {
            vadActiveRef.current = false;
            try { recorder.stop(); } catch { /* ignore */ }
            mediaRecorderRef.current = null;
            chunksRef.current = [];
            try { ctx.close(); } catch { /* ignore */ }
            stream.getTracks().forEach((t) => t.stop());
            micStreamRef.current = null;
            setVolume(0);
            return;
          }

          analyser.getByteTimeDomainData(buf);
          let sumSq = 0;
          for (const v of buf) sumSq += (v - 128) ** 2;
          const rms = Math.sqrt(sumSq / buf.length);
          setVolume(Math.round(rms));

          const elapsed = Date.now() - recordStartRef.current;

          // Log RMS every 60 frames (~1s) for threshold calibration
          if (Math.random() < 0.016) console.log("[NOVA VAD] rms:", Math.round(rms * 10) / 10);

          // Unified threshold: above = speech, below = silence
          if (rms >= VAD_THRESHOLD) {
            speechDetectedRef.current = true;
            silenceStartVADRef.current = null;
          } else if (elapsed > VAD_MIN_RECORD_MS && speechDetectedRef.current) {
            if (!silenceStartVADRef.current) silenceStartVADRef.current = Date.now();
            else if (Date.now() - silenceStartVADRef.current > VAD_SILENCE_DURATION) {
              vadActiveRef.current = false;
              processClip();
              return;
            }
          }

          // Safety: no speech after 8s — discard and restart
          if (elapsed > VAD_MAX_NO_SPEECH_MS && !speechDetectedRef.current) {
            console.log("[NOVA VAD] 8s timeout, no speech — restarting");
            vadActiveRef.current = false;
            try { recorder.stop(); } catch { /* ignore */ }
            mediaRecorderRef.current = null;
            chunksRef.current = [];
            try { ctx.close(); } catch { /* ignore */ }
            stream.getTracks().forEach((t) => t.stop());
            micStreamRef.current = null;
            setVolume(0);
            if (vadModeRef.current && !vadSpeakingRef.current) {
              setTimeout(() => { startVADRef.current(); }, 250);
            }
            return;
          }

          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      } catch (audioErr) {
        // AudioContext unavailable — use 5s timed clip fallback
        console.warn("[NOVA VAD] AudioContext failed, using timed mode:", audioErr);
        speechDetectedRef.current = true; // assume speech since we can't detect
        setTimeout(() => {
          if (mediaRecorderRef.current) processClip();
        }, 5000);
      }
    };
  }); // no dep array — runs after every render

  // ── Activate VAD mode ─────────────────────────────────────────────────────
  const activateVAD = useCallback(() => {
    if (vadModeRef.current) return;
    vadModeRef.current = true;
    setVadMode(true);
    shouldRunRef.current = false;
    speakingRef.current = false;
    vadSpeakingRef.current = false;
    killCurrentRecognition();
    console.log("[NOVA VAD] switching to automatic voice detection mode");
    // startVADRef is always current (set in unconditional useEffect above)
    setTimeout(() => {
      console.log("[NOVA VAD] timer fired — calling startVADRef");
      startVADRef.current();
    }, 400);
  }, [killCurrentRecognition]);

  // ── SpeechRecognition core ────────────────────────────────────────────────
  const startRecognition = useCallback(
    (mode: "wake" | "active" = "wake") => {
      if (vadModeRef.current) { startVADRef.current(); return; }
      if (!shouldRunRef.current || speakingRef.current) return;
      if (restartingRef.current || recognitionActiveRef.current) return;

      const Recognition = getRecognitionClass();
      if (!Recognition) { activateVAD(); return; }

      if (recognitionRef.current) {
        const old = recognitionRef.current;
        old.onstart = null; old.onresult = null; old.onerror = null; old.onend = null;
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
          if (serviceRetryRef.current >= 3) { activateVAD(); return; }
          return;
        }

        if (code === "no-speech") { serviceRetryRef.current = 0; return; }
        setError(`Voice error: ${code}`);
      };

      rec.onend = () => {
        clearSilenceTimer();
        restartingRef.current = false;
        recognitionActiveRef.current = false;
        recognitionRef.current = null;
        const retries = serviceRetryRef.current;
        console.log("[NOVA voice] ended — speaking:", speakingRef.current, "shouldRun:", shouldRunRef.current, "retries:", retries);

        if (vadModeRef.current) return;
        if (!shouldRunRef.current || speakingRef.current) return;

        const delay = retries > 0 ? Math.min(500 * Math.pow(2, Math.min(retries - 1, 5)), 30_000) : 50;
        if (retries > 0) console.log(`[NOVA voice] backoff ${delay}ms (retry #${retries})`);
        setTimeout(() => startRecognitionRef.current?.(modeRef.current), delay);
      };

      recognitionRef.current = rec;
      restartingRef.current = true;
      modeRef.current = mode;
      setError("");
      setStatus(mode === "active" ? STATUS.ACTIVE_LISTENING : STATUS.WAKE_LISTENING);
      console.log("[NOVA voice] recognition starting →", mode);
      try { rec.start(); } catch (err) {
        console.warn("[NOVA voice] start() threw:", err);
        recognitionRef.current = null;
        restartingRef.current = false;
      }
    },
    [clearSilenceTimer, startSilenceTimer, activateVAD],
  );

  useEffect(() => { startRecognitionRef.current = startRecognition; }, [startRecognition]);

  const stopRecognition = useCallback(() => {
    clearSilenceTimer();
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
  }, [clearSilenceTimer]);

  // ── Speak ─────────────────────────────────────────────────────────────────
  const speak = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      const { onEnd, restartAfterSpeak } = options;
      const after: "wake" | "active" = restartAfterSpeak ? "active" : options.after ?? "wake";

      setCurrentPrompt(text);
      setTranscript(text);
      vadSpeakingRef.current = true;

      if (!("speechSynthesis" in window)) {
        vadSpeakingRef.current = false;
        onEnd?.();
        if (vadModeRef.current) setTimeout(() => startVADRef.current(), 200);
        else if (shouldRunRef.current) startRecognition(after);
        return;
      }

      speakingRef.current = true;
      clearSilenceTimer();
      if (ttsWatchdogRef.current) clearTimeout(ttsWatchdogRef.current);
      if (!vadModeRef.current) stopRecognition();
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
        vadSpeakingRef.current = false;
        onEnd?.();

        if (vadModeRef.current) {
          setStatus(STATUS.VAD_RECORDING);
          setTimeout(() => { startVADRef.current(); }, 300);
        } else if (shouldRunRef.current) {
          serviceRetryRef.current = 0;
          setTimeout(() => startRecognition(after), 80);
        } else {
          setStatus(STATUS.STOPPED);
        }
      };

      utterance.onend   = () => handleTTSDone("onend");
      utterance.onerror = (e) => {
        console.warn("[NOVA voice] TTS error:", e);
        if (!speakingRef.current) return;
        if (ttsWatchdogRef.current) clearTimeout(ttsWatchdogRef.current);
        speakingRef.current = false;
        vadSpeakingRef.current = false;
        onEnd?.();
        if (vadModeRef.current) {
          setStatus(STATUS.VAD_RECORDING);
          setTimeout(() => startVADRef.current(), 300);
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
        vadSpeakingRef.current = false;
        onEnd?.();
        if (vadModeRef.current) {
          setStatus(STATUS.VAD_RECORDING);
          setTimeout(() => startVADRef.current(), 300);
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
      if (vadModeRef.current) {
        vadSpeakingRef.current = false;
        setTimeout(() => startVADRef.current(), 200);
        return true;
      }
      shouldRunRef.current = true;
      if (!speakingRef.current && !restartingRef.current && !recognitionActiveRef.current) {
        startRecognition(modeRef.current);
      }
      return true;
    }

    setSupported(!!getRecognitionClass());
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

    if (!getRecognitionClass()) {
      vadModeRef.current = true;
      setVadMode(true);
    } else {
      shouldRunRef.current = true;
    }

    return true;
  }, [initialized, micPermission, startRecognition]);

  const startWakeMode   = useCallback(() => { if (!vadModeRef.current) { shouldRunRef.current = true; startRecognition("wake"); } }, [startRecognition]);
  const startActiveMode = useCallback(() => { if (!vadModeRef.current) { shouldRunRef.current = true; startRecognition("active"); } }, [startRecognition]);

  const stopAll = useCallback(() => {
    shouldRunRef.current = false;
    vadModeRef.current = false;
    vadSpeakingRef.current = false;
    vadActiveRef.current = false;
    setVadMode(false);
    killCurrentRecognition();
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    speakingRef.current = false;
    setStatus(STATUS.STOPPED);
    if (mediaRecorderRef.current?.state === "recording") {
      try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
    }
    mediaRecorderRef.current = null;
    stopMicStream();
    stopVADAudio();
  }, [killCurrentRecognition, stopMicStream, stopVADAudio]);

  const retryMic = useCallback(async () => {
    stopAll();
    setInitialized(false);
    setMicPermission("unknown");
    serviceRetryRef.current = 0;
    return initialize();
  }, [initialize, stopAll]);

  useEffect(() => { return () => { stopAll(); }; }, [stopAll]);

  const askAndListen     = useCallback((text: string) => speak(text, { after: "active" }), [speak]);
  const startListening   = useCallback(() => startActiveMode(), [startActiveMode]);
  const stopListening    = useCallback(() => stopAll(), [stopAll]);
  const shutdown         = useCallback(() => stopAll(), [stopAll]);
  const scheduleRestart  = useCallback((_delayMs?: number) => startActiveMode(), [startActiveMode]);
  const hardStopListening = useCallback(() => stopAll(), [stopAll]);

  const listening = status === STATUS.WAKE_LISTENING || status === STATUS.ACTIVE_LISTENING;
  const speaking  = status === STATUS.SPEAKING;
  const thinking  = status === STATUS.THINKING;
  const recording = status === STATUS.VAD_RECORDING;

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
      volume,
      vadMode,
      recording,
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
      pttMode: vadMode,
      pttRecording: recording,
      startPTT: async () => {},
      stopPTT: async () => {},
    }),
    [
      status, supported, initialized, micPermission, error, lastHeard,
      currentPrompt, transcript, volume, vadMode, recording,
      initialize, speak, startWakeMode, startActiveMode, stopAll, retryMic,
      listening, speaking, thinking, askAndListen, startListening, stopListening,
      shutdown, scheduleRestart, hardStopListening,
    ],
  );
}

export type UseVoiceEngineReturn = ReturnType<typeof useVoiceEngine>;
export default useVoiceEngine;
