import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { askNovaHelp, transcribeAudio } from "@/lib/novaHelpApi";
import { detectWakeWord, detectStopWord } from "@/lib/novaModeRouter";
import { NovaVoiceStatus, type VoiceStateKey } from "@/components/nova/NovaVoiceStatus";
import LockedAction from "@/components/paywall/LockedAction";

// ─── Safety check script (mirrors NOVA Trainer exactly) ─────────────────────
const SAFETY_ITEMS_EN = [
  "Brakes okay?",
  "Battery guard okay?",
  "Horn okay?",
  "Wheels okay?",
  "Hydraulics okay?",
  "Controls okay?",
  "Steering okay?",
  "Welds okay?",
  "Electric wiring okay?",
];

const SAFETY_ITEMS_ES = [
  "¿Frenos bien?",
  "¿Guardia de batería bien?",
  "¿Bocina bien?",
  "¿Ruedas bien?",
  "¿Hidráulicos bien?",
  "¿Controles bien?",
  "¿Dirección bien?",
  "¿Soldaduras bien?",
  "¿Cableado eléctrico bien?",
];

function isSafetyTrigger(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("safety check") ||
    t.includes("safety inspection") ||
    t.includes("do my safety") ||
    t.includes("run safety") ||
    t.includes("start safety") ||
    t.includes("do safety") ||
    t.includes("safety walkthrough") ||
    t.includes("revisión de seguridad") ||
    t.includes("inspección de seguridad") ||
    t.includes("chequeo de seguridad") ||
    t.includes("hacer seguridad") ||
    t.includes("iniciar seguridad")
  );
}

function isSafetyConfirm(text: string): boolean {
  const t = text.toLowerCase().trim().replace(/[.,!?;:]+$/, "");
  const has = (...terms: string[]) => terms.some((x) => t.includes(x));
  return (
    has("yes", "yeah", "yep", "yea", "okay", "ok", "correct", "affirmative",
        "right", "sure", "go", "confirm", "that's", "thats") ||
    t === "si" || t === "sí" || has("sí", "si ", " si", "bueno", "listo", "correcto")
  );
}

function isSafetyDeny(text: string): boolean {
  const t = text.toLowerCase().trim().replace(/[.,!?;:]+$/, "");
  return t === "no" || t.startsWith("no ") || t.includes("nope") ||
    t.includes("negative") || t.includes("fail") || t.includes("bad") ||
    t.includes("broken") || t.includes("not okay") || t.includes("not ok");
}

// ─── TTS ─────────────────────────────────────────────────────────────────────
function speakText(text: string, lang: string, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) { onEnd?.(); return; }
  try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 1.05;
  u.pitch = 1;
  if (onEnd) u.onend = onEnd;
  const voices = window.speechSynthesis.getVoices();
  const root = lang.split("-")[0];
  const preferred =
    voices.find((v) => /samantha|aria|ava|zira|karen/i.test(v.name) && v.lang.startsWith(root)) ||
    voices.find((v) => /samantha|aria|ava|zira|karen/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith(root));
  if (preferred) u.voice = preferred;
  window.speechSynthesis.speak(u);
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase =
  | "idle" | "wake_listening" | "listening" | "recording"
  | "transcribing" | "thinking" | "speaking";

interface LogEntry { time: string; role: "NOVA" | "USER"; text: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const WAKE_VOICE_THRESHOLD  = 20;   // RMS to consider "someone is talking"
const WAKE_TRIGGER_MS       = 180;  // ms of continuous voice to trigger capture
const WAKE_CLIP_MAX_MS      = 3000; // max ms to capture for wake word
const WAKE_SILENCE_MS       = 900;  // ms of silence after speech → stop clip early

const SILENCE_THRESHOLD     = 8;
const SILENCE_DURATION      = 1400;
const MIN_RECORD_MS         = 500;

const BARGE_THRESHOLD       = 22;
const BARGE_SPEECH_MS       = 280;

// ─── Signal Icon ─────────────────────────────────────────────────────────────
function SignalIcon({ phase, volume }: { phase: Phase; volume: number }) {
  const isWake     = phase === "wake_listening";
  const isListen   = phase === "listening" || phase === "recording";
  const isThinking = phase === "thinking" || phase === "transcribing";
  const isSpeaking = phase === "speaking";

  const borderColor = isSpeaking
    ? "border-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.5)]"
    : isListen
    ? "border-violet-400 shadow-[0_0_40px_rgba(139,92,246,0.5)]"
    : isWake
    ? "border-indigo-600/60 shadow-[0_0_18px_rgba(99,102,241,0.2)]"
    : isThinking
    ? "border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.4)]"
    : "border-violet-700/30";

  const bgColor = isSpeaking
    ? "bg-purple-900/60"
    : isListen
    ? "bg-violet-900/60"
    : isWake
    ? "bg-indigo-950/60"
    : isThinking
    ? "bg-yellow-900/30"
    : "bg-[#1a1a2e]";

  const volumeScale = phase === "recording" ? 1 + (volume / 100) * 0.4 : 1;

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      {/* Wake mode: dim slow pulse */}
      {isWake && (
        <div className="absolute inset-0 rounded-full border border-indigo-600/20 animate-[ping_3s_ease-in-out_infinite]" />
      )}
      {isListen && (
        <>
          <div
            className="absolute inset-0 rounded-full border-2 border-violet-400/20 transition-transform duration-100"
            style={{ transform: `scale(${volumeScale})` }}
          />
          <div className="absolute inset-4 rounded-full border-2 border-violet-400/30 animate-[ping_2s_ease-in-out_0.4s_infinite]" />
        </>
      )}
      {isSpeaking && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/20 animate-[ping_1.5s_ease-in-out_infinite]" />
          <div className="absolute inset-3 rounded-full border-2 border-purple-400/30 animate-[ping_1.5s_ease-in-out_0.3s_infinite]" />
        </>
      )}
      <div className={`w-36 h-36 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${bgColor} ${borderColor}`}>
        {isSpeaking ? (
          <svg viewBox="0 0 48 48" className="w-10 h-10 text-purple-300" fill="currentColor">
            <rect x="13" y="13" width="22" height="22" rx="4" />
          </svg>
        ) : isWake ? (
          /* Wake icon: small dim mic */
          <svg viewBox="0 0 48 48" className="w-12 h-12 text-indigo-500/50" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path strokeWidth="2" d="M24 8 a6 6 0 0 1 6 6 v10 a6 6 0 0 1 -12 0 v-10 a6 6 0 0 1 6 -6z" />
            <path strokeWidth="2" d="M14 26 a10 10 0 0 0 20 0" />
            <line strokeWidth="2" x1="24" y1="36" x2="24" y2="42" />
            <line strokeWidth="2" x1="18" y1="42" x2="30" y2="42" />
          </svg>
        ) : (
          <svg viewBox="0 0 48 48" className={`w-16 h-16 transition-all duration-300 ${phase === "idle" ? "text-violet-500/60" : "text-violet-300"}`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path strokeWidth="2.5" strokeOpacity={isListen ? "1" : "0.4"} d="M8 20 C8 11.163 15.163 4 24 4 C32.837 4 40 11.163 40 20" className={isListen ? "animate-[pulse_1s_ease-in-out_infinite]" : ""} />
            <path strokeWidth="2.5" strokeOpacity={phase !== "idle" ? "0.85" : "0.5"} d="M13 25 C13 19.477 18.477 14 24 14 C29.523 14 35 19.477 35 25" />
            <path strokeWidth="2.5" d="M18 30 C18 26.686 20.686 24 24 24 C27.314 24 30 26.686 30 30" />
            <circle cx="24" cy="38" r="3" fill="currentColor" strokeWidth="0" />
          </svg>
        )}
      </div>
      {phase === "recording" && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-violet-400 transition-all duration-75"
            style={{ width: `${Math.min(100, volume * 2)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function checkMediaRecorderSupport(): boolean {
  return typeof window !== "undefined" && !!window.MediaRecorder && !!navigator.mediaDevices?.getUserMedia;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NovaHelpPage() {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith("es");
  const ttsLang   = isSpanish ? "es-ES" : "en-US";

  const [phase, setPhase]               = useState<Phase>("idle");
  const [sessionActive, setSessionActive] = useState(false);
  const [wakeMode, setWakeMode]         = useState(false);
  const [answer, setAnswer]             = useState("");
  const [lastHeard, setLastHeard]       = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [textInput, setTextInput]       = useState("");
  const [errorMsg, setErrorMsg]         = useState("");
  const [log, setLog]                   = useState<LogEntry[]>([]);
  const [browserSupported]              = useState(checkMediaRecorderSupport);
  const [volume, setVolume]             = useState(0);

  // ── Main recording refs ────────────────────────────────────────────────────
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const chunksRef         = useRef<Blob[]>([]);
  const streamRef         = useRef<MediaStream | null>(null);
  const audioCtxRef       = useRef<AudioContext | null>(null);
  const vadActiveRef      = useRef(false);
  const silenceStartRef   = useRef<number | null>(null);
  const recordStartRef    = useRef<number>(0);
  const speechDetectedRef = useRef(false);
  const sessionActiveRef  = useRef(false);
  const wakeModeRef       = useRef(false);

  // ── Wake word listener refs (passive monitor — NO recording loop) ──────────
  const wakeCtxRef        = useRef<AudioContext | null>(null);
  const wakeStreamRef     = useRef<MediaStream | null>(null);
  const wakeVadRef        = useRef(false);
  const wakeCapturingRef  = useRef(false);  // true while recording a short clip

  // ── Safety check mode refs ────────────────────────────────────────────────
  const safetyModeRef     = useRef(false);
  const safetyIndexRef    = useRef(0);
  const [safetyMode, setSafetyMode]   = useState(false);
  const [safetyIndex, setSafetyIndex] = useState(0);

  // ── Barge-in refs ─────────────────────────────────────────────────────────
  const bargeCtxRef       = useRef<AudioContext | null>(null);
  const bargeStreamRef    = useRef<MediaStream | null>(null);
  const bargeVadRef       = useRef(false);

  const now = () => new Date().toLocaleTimeString("en-US", { hour12: true, hour: "numeric", minute: "2-digit", second: "2-digit" });
  const addLog = (role: "NOVA" | "USER", text: string) =>
    setLog((prev) => [{ time: now(), role, text }, ...prev].slice(0, 40));

  const voiceStateKey: VoiceStateKey =
    phase === "wake_listening" ? "wake_listening"
    : phase === "listening"    ? "active_listening"
    : phase === "recording"    ? "recording"
    : phase === "transcribing" ? "transcribing"
    : phase === "thinking"     ? "thinking"
    : phase === "speaking"     ? "speaking"
    : "idle";

  // ── Stop main VAD ──────────────────────────────────────────────────────────
  const stopVAD = useCallback(() => {
    vadActiveRef.current = false;
    silenceStartRef.current = null;
    setVolume(0);
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch { /* ignore */ }
      audioCtxRef.current = null;
    }
  }, []);

  // ── Stop barge-in listener ─────────────────────────────────────────────────
  const stopBargeIn = useCallback(() => {
    bargeVadRef.current = false;
    if (bargeCtxRef.current) {
      try { bargeCtxRef.current.close(); } catch { /* ignore */ }
      bargeCtxRef.current = null;
    }
    bargeStreamRef.current?.getTracks().forEach((t) => t.stop());
    bargeStreamRef.current = null;
  }, []);

  // ── Stop wake word listener ────────────────────────────────────────────────
  const stopWakeListener = useCallback(() => {
    wakeVadRef.current = false;
    wakeCapturingRef.current = false;
    if (wakeCtxRef.current) {
      try { wakeCtxRef.current.close(); } catch { /* ignore */ }
      wakeCtxRef.current = null;
    }
    wakeStreamRef.current?.getTracks().forEach((t) => t.stop());
    wakeStreamRef.current = null;
  }, []);

  // Forward refs for cross-callback use
  const startRecordingRef        = useRef<(() => Promise<void>) | null>(null);
  const stopAndTranscribeRef     = useRef<(() => Promise<void>) | null>(null);
  const startWakeListenerRef     = useRef<(() => Promise<void>) | null>(null);
  const handleSafetyCheckInputRef = useRef<((t: string) => void) | null>(null);
  const startSafetyCheckRef       = useRef<(() => void) | null>(null);

  // ── Activate NOVA after wake word confirmed ────────────────────────────────
  const activateNova = useCallback(() => {
    wakeModeRef.current = false;
    setWakeMode(false);
    const greet = isSpanish
      ? "Hola. Soy NOVA. ¿En qué puedo ayudarte?"
      : "Hi. I'm NOVA. How can I help you?";
    addLog("NOVA", greet);
    setAnswer(greet);
    setPhase("speaking");
    speakText(greet, ttsLang, () => {
      stopBargeIn();
      if (sessionActiveRef.current) {
        setPhase("listening");
        setTimeout(() => { if (sessionActiveRef.current) startRecordingRef.current?.(); }, 150);
      }
    });
    setTimeout(() => { if (sessionActiveRef.current) startBargeInRef.current?.(); }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpanish, ttsLang, stopBargeIn]);

  const startBargeInRef = useRef<(() => Promise<void>) | null>(null);

  // ── Wake word listener: passive VAD → short clip → transcribe ─────────────
  const startWakeListener = useCallback(async () => {
    if (wakeCtxRef.current || !sessionActiveRef.current) return;
    wakeCapturingRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true } as MediaTrackConstraints,
      });
      wakeStreamRef.current = stream;
      const ctx = new AudioContext();
      wakeCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      wakeVadRef.current = true;
      let voiceStart: number | null = null;

      const tick = () => {
        if (!wakeVadRef.current) return;
        if (wakeCapturingRef.current) { requestAnimationFrame(tick); return; }

        analyser.getByteTimeDomainData(buf);
        let sumSq = 0;
        for (const v of buf) sumSq += (v - 128) ** 2;
        const rms = Math.sqrt(sumSq / buf.length);

        if (rms > WAKE_VOICE_THRESHOLD) {
          if (!voiceStart) voiceStart = Date.now();
          else if (Date.now() - voiceStart > WAKE_TRIGGER_MS) {
            // Voice detected — capture a short clip and check for wake word
            voiceStart = null;
            wakeCapturingRef.current = true;
            captureWakeClip();
          }
        } else {
          voiceStart = null;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      // mic unavailable — stay in wake_listening visually
    }

    async function captureWakeClip() {
      if (!sessionActiveRef.current) { wakeCapturingRef.current = false; return; }
      try {
        const clipStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/ogg") ? "audio/ogg" : "audio/mp4";
        const recorder = new MediaRecorder(clipStream, { mimeType });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.start(200);

        // Run for up to WAKE_CLIP_MAX_MS, or stop early on silence after speech
        const clipCtx = new AudioContext();
        const clipAnalyser = clipCtx.createAnalyser();
        clipAnalyser.fftSize = 256;
        clipCtx.createMediaStreamSource(clipStream).connect(clipAnalyser);
        const clipBuf = new Uint8Array(clipAnalyser.frequencyBinCount);
        let clipSpeechDetected = false;
        let clipSilenceStart: number | null = null;
        const clipStart = Date.now();

        await new Promise<void>((resolve) => {
          const clipTick = () => {
            if (!wakeVadRef.current) { resolve(); return; }
            clipAnalyser.getByteTimeDomainData(clipBuf);
            let sq = 0;
            for (const v of clipBuf) sq += (v - 128) ** 2;
            const rms = Math.sqrt(sq / clipBuf.length);
            const elapsed = Date.now() - clipStart;

            if (rms > WAKE_VOICE_THRESHOLD) {
              clipSpeechDetected = true;
              clipSilenceStart = null;
            } else if (clipSpeechDetected) {
              if (!clipSilenceStart) clipSilenceStart = Date.now();
              else if (Date.now() - clipSilenceStart > WAKE_SILENCE_MS) {
                resolve(); return;
              }
            }
            if (elapsed >= WAKE_CLIP_MAX_MS) { resolve(); return; }
            requestAnimationFrame(clipTick);
          };
          requestAnimationFrame(clipTick);
        });

        try { clipCtx.close(); } catch { /* ignore */ }
        await new Promise<void>((res) => { recorder.onstop = () => res(); try { recorder.stop(); } catch { res(); } });
        clipStream.getTracks().forEach((t) => t.stop());

        if (!wakeVadRef.current || !sessionActiveRef.current) {
          wakeCapturingRef.current = false; return;
        }

        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size < 300) { wakeCapturingRef.current = false; return; }

        const transcript = await transcribeAudio(blob, isSpanish ? "es" : "en");

        if (!wakeVadRef.current || !sessionActiveRef.current) {
          wakeCapturingRef.current = false; return;
        }

        if (transcript && detectWakeWord(transcript)) {
          // Wake word confirmed — activate!
          stopWakeListener();
          activateNova();
        } else {
          // Not a wake word — resume passive monitoring
          wakeCapturingRef.current = false;
        }
      } catch {
        wakeCapturingRef.current = false;
      }
    }
  }, [isSpanish, stopWakeListener, activateNova]);

  // ── Core: start full recording (active session only) ──────────────────────
  const startRecording = useCallback(async () => {
    if (mediaRecorderRef.current) return;
    setErrorMsg("");
    speechDetectedRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/ogg") ? "audio/ogg" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorderRef.current = recorder;
      recorder.start(200);
      recordStartRef.current = Date.now();
      setPhase("recording");

      try {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const buf = new Uint8Array(analyser.frequencyBinCount);
        vadActiveRef.current = true;
        silenceStartRef.current = null;

        const tick = () => {
          if (!vadActiveRef.current) return;
          analyser.getByteTimeDomainData(buf);
          let sumSq = 0;
          for (const v of buf) sumSq += (v - 128) ** 2;
          const rms = Math.sqrt(sumSq / buf.length);
          setVolume(Math.round(rms));
          const elapsed = Date.now() - recordStartRef.current;

          if (rms >= SILENCE_THRESHOLD) {
            speechDetectedRef.current = true;
            silenceStartRef.current = null;
          } else if (elapsed > MIN_RECORD_MS && speechDetectedRef.current) {
            if (!silenceStartRef.current) silenceStartRef.current = Date.now();
            else if (Date.now() - silenceStartRef.current > SILENCE_DURATION) {
              vadActiveRef.current = false;
              stopAndTranscribeRef.current?.();
              return;
            }
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      } catch { /* VAD not available */ }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(isSpanish ? `Micrófono no disponible: ${msg}` : `Microphone unavailable: ${msg}`);
      setPhase("listening");
    }
  }, [isSpanish]);

  // ── Core: stop recording and transcribe ───────────────────────────────────
  const stopAndTranscribe = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    stopVAD();
    setPhase("transcribing");

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      try { recorder.stop(); } catch { resolve(); }
    });
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    const audioBlob = new Blob(chunksRef.current, { type: recorder.mimeType ?? "audio/webm" });
    chunksRef.current = [];
    mediaRecorderRef.current = null;

    // Speech gate — discard silent recordings, no API call
    if (!speechDetectedRef.current || audioBlob.size < 300) {
      if (sessionActiveRef.current) {
        setPhase("listening");
        setTimeout(() => { if (sessionActiveRef.current) startRecordingRef.current?.(); }, 300);
      }
      return;
    }

    const transcript = await transcribeAudio(audioBlob, isSpanish ? "es" : "en");
    if (!transcript?.trim()) {
      if (sessionActiveRef.current) {
        setPhase("listening");
        setTimeout(() => { if (sessionActiveRef.current) startRecordingRef.current?.(); }, 300);
      }
      return;
    }

    setLastHeard(transcript);
    addLog("USER", transcript);

    // ── Stop word — highest priority ──────────────────────────────────────
    if (detectStopWord(transcript)) {
      try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
      stopBargeIn();
      const stopReply = isSpanish
        ? "Sesión pausada. Di 'Hola NOVA' para continuar."
        : "Session paused. Say 'Hey NOVA' to continue.";
      addLog("NOVA", stopReply);
      setAnswer(stopReply);
      wakeModeRef.current = true;
      setWakeMode(true);
      setPhase("speaking");
      speakText(stopReply, ttsLang, () => {
        stopBargeIn();
        if (sessionActiveRef.current) {
          setPhase("wake_listening");
          setTimeout(() => { if (sessionActiveRef.current) startWakeListenerRef.current?.(); }, 200);
        }
      });
      return;
    }

    // ── Safety check mode — intercept all input ───────────────────────────
    if (safetyModeRef.current) {
      handleSafetyCheckInputRef.current?.(transcript);
      return;
    }

    // ── Safety check trigger ───────────────────────────────────────────────
    if (isSafetyTrigger(transcript)) {
      startSafetyCheckRef.current?.();
      return;
    }

    // ── Normal question ───────────────────────────────────────────────────
    await handleQuestion(transcript);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpanish, ttsLang, stopVAD, stopBargeIn]);

  // ── Safety check mode ────────────────────────────────────────────────────
  // Speaks `text`, then when done starts recording again
  const safetySpeak = useCallback((text: string, onDone?: () => void) => {
    addLog("NOVA", text);
    setAnswer(text);
    setPhase("speaking");
    speakText(text, ttsLang, () => {
      stopBargeIn();
      onDone?.();
      if (sessionActiveRef.current) {
        setPhase("listening");
        setTimeout(() => { if (sessionActiveRef.current) startRecordingRef.current?.(); }, 150);
      }
    });
    setTimeout(() => { if (sessionActiveRef.current) startBargeInRef.current?.(); }, 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsLang, stopBargeIn]);

  const startSafetyCheck = useCallback(() => {
    safetyModeRef.current = true;
    safetyIndexRef.current = 0;
    setSafetyMode(true);
    setSafetyIndex(0);
    const items = isSpanish ? SAFETY_ITEMS_ES : SAFETY_ITEMS_EN;
    const intro = isSpanish
      ? `Iniciando revisión de seguridad. ${items[0]}`
      : `Starting safety check. ${items[0]}`;
    safetySpeak(intro);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpanish, safetySpeak]);

  const handleSafetyCheckInput = useCallback((transcript: string) => {
    const items = isSpanish ? SAFETY_ITEMS_ES : SAFETY_ITEMS_EN;
    const idx = safetyIndexRef.current;
    const item = items[idx];

    addLog("USER", transcript);
    setLastHeard(transcript);

    if (isSafetyDeny(transcript)) {
      // Item failed — stop the check
      safetyModeRef.current = false;
      setSafetyMode(false);
      setSafetyIndex(0);
      const failed = isSpanish
        ? `Fallo de seguridad: ${item} Notifica a tu supervisor. Sesión de seguridad detenida.`
        : `Safety failed: ${item} Notify your supervisor. Safety session stopped.`;
      safetySpeak(failed);
      return;
    }

    if (isSafetyConfirm(transcript)) {
      const next = idx + 1;
      if (next < items.length) {
        safetyIndexRef.current = next;
        setSafetyIndex(next);
        safetySpeak(items[next]);
      } else {
        // All items passed
        safetyModeRef.current = false;
        setSafetyMode(false);
        setSafetyIndex(0);
        const done = isSpanish
          ? "Revisión de seguridad completa. Todo en orden. ¡Listo para trabajar!"
          : "Safety check complete. All systems good. Ready to pick!";
        safetySpeak(done);
      }
      return;
    }

    // Unrecognized — repeat current item
    const repeat = isSpanish
      ? `No escuché bien. ${item}`
      : `Didn't catch that. ${item}`;
    safetySpeak(repeat);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpanish, safetySpeak]);

  // ── Ask NOVA AI ───────────────────────────────────────────────────────────
  const handleQuestion = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q) return;
      setLastQuestion(q);
      setAnswer("");
      setErrorMsg("");
      setPhase("thinking");

      try {
        const response = await askNovaHelp(q, isSpanish ? "es" : "en");
        setAnswer(response);
        setPhase("speaking");
        addLog("NOVA", response);
        speakText(response, ttsLang, () => {
          stopBargeIn();
          if (sessionActiveRef.current) {
            setPhase("listening");
            setTimeout(() => { if (sessionActiveRef.current) startRecordingRef.current?.(); }, 150);
          }
        });
        setTimeout(() => { if (sessionActiveRef.current) startBargeInRef.current?.(); }, 400);
      } catch {
        const fallback = isSpanish
          ? "Tuve un problema. Pregúntame de nuevo."
          : "I had trouble answering. Try asking again.";
        setAnswer(fallback);
        setPhase("listening");
        setTimeout(() => { if (sessionActiveRef.current) startRecordingRef.current?.(); }, 200);
      }
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [isSpanish, ttsLang, stopBargeIn],
  );

  // ── Barge-in listener (runs while NOVA speaks) ────────────────────────────
  const startBargeIn = useCallback(async () => {
    if (bargeCtxRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true } as MediaTrackConstraints,
      });
      bargeStreamRef.current = stream;
      const ctx = new AudioContext();
      bargeCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      bargeVadRef.current = true;
      let speechStart: number | null = null;

      const tick = () => {
        if (!bargeVadRef.current) return;
        analyser.getByteTimeDomainData(buf);
        let sumSq = 0;
        for (const v of buf) sumSq += (v - 128) ** 2;
        const rms = Math.sqrt(sumSq / buf.length);

        if (rms > BARGE_THRESHOLD) {
          if (!speechStart) speechStart = Date.now();
          else if (Date.now() - speechStart > BARGE_SPEECH_MS) {
            stopBargeIn();
            try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
            if (sessionActiveRef.current) {
              setPhase("listening");
              setTimeout(() => { if (sessionActiveRef.current) startRecordingRef.current?.(); }, 80);
            }
            return;
          }
        } else {
          speechStart = null;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch { /* barge-in unavailable */ }
  }, [stopBargeIn]);

  // Assign all forward refs
  useEffect(() => { startRecordingRef.current          = startRecording;          }, [startRecording]);
  useEffect(() => { stopAndTranscribeRef.current        = stopAndTranscribe;       }, [stopAndTranscribe]);
  useEffect(() => { startWakeListenerRef.current        = startWakeListener;       }, [startWakeListener]);
  useEffect(() => { startBargeInRef.current             = startBargeIn;            }, [startBargeIn]);
  useEffect(() => { handleSafetyCheckInputRef.current   = handleSafetyCheckInput;  }, [handleSafetyCheckInput]);
  useEffect(() => { startSafetyCheckRef.current         = startSafetyCheck;        }, [startSafetyCheck]);

  // ── TTS unlock helper — must be called synchronously inside a click/tap handler ──
  const unlockTTS = () => {
    if (!("speechSynthesis" in window)) return;
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    // A zero-content silent utterance triggers the browser's audio permission
    // and keeps the audio context warm for all future async speechSynthesis.speak() calls
    const silent = new SpeechSynthesisUtterance(" ");
    silent.volume = 0;
    silent.rate = 10;
    window.speechSynthesis.speak(silent);
  };

  // ── Session start ─────────────────────────────────────────────────────────
  const startSession = () => {
    // Unlock TTS synchronously on this user gesture — keeps it warm for async calls
    unlockTTS();

    sessionActiveRef.current = true;
    wakeModeRef.current = true;
    setSessionActive(true);
    setWakeMode(true);
    setAnswer("");
    setLastHeard("");
    setLastQuestion("");
    setErrorMsg("");
    setLog([]);

    const hint = isSpanish
      ? "Sesión activa. Di Hola NOVA para comenzar."
      : "Session active. Say Hey NOVA to begin.";
    addLog("NOVA", hint);
    speakText(hint, ttsLang, () => {
      if (sessionActiveRef.current) {
        setPhase("wake_listening");
        // Start passive wake word listener after greeting
        setTimeout(() => { if (sessionActiveRef.current) startWakeListenerRef.current?.(); }, 200);
      }
    });
    setPhase("speaking");
  };

  // ── Session end ────────────────────────────────────────────────────────────
  const endSession = () => {
    sessionActiveRef.current = false;
    wakeModeRef.current = false;
    safetyModeRef.current = false;
    setSafetyMode(false);
    setSafetyIndex(0);
    stopVAD();
    stopBargeIn();
    stopWakeListener();
    if (mediaRecorderRef.current) {
      try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
      mediaRecorderRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    setSessionActive(false);
    setWakeMode(false);
    setPhase("idle");
    setAnswer("");
    setLastHeard("");
    setLastQuestion("");
    setErrorMsg("");
  };

  // ── Stop TTS (tap while speaking) ─────────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    stopBargeIn();
    if (sessionActiveRef.current) {
      setPhase("listening");
      setTimeout(() => { if (sessionActiveRef.current) startRecordingRef.current?.(); }, 150);
    }
  }, [stopBargeIn]);

  // ── Mic button tap ────────────────────────────────────────────────────────
  const handleMic = () => {
    if (!sessionActive) return;
    if (phase === "speaking") {
      stopSpeaking();
    } else if (phase === "recording") {
      stopVAD();
      stopAndTranscribeRef.current?.();
    }
    // wake_listening and listening are fully automatic — tap does nothing (passive)
  };

  // ── Text submit ────────────────────────────────────────────────────────────
  const handleTextSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = textInput.trim();
    if (!q) return;
    // Re-unlock TTS on every text submit (keeps audio context warm for async responses)
    unlockTTS();
    if (!sessionActive) {
      sessionActiveRef.current = true;
      wakeModeRef.current = false;
      setSessionActive(true);
      setWakeMode(false);
      setLog([]);
    } else {
      // Text bypasses wake word — deactivate wake listener if running
      stopWakeListener();
      wakeModeRef.current = false;
      setWakeMode(false);
    }
    setTextInput("");

    // Safety check mode — intercept input
    if (safetyModeRef.current) {
      handleSafetyCheckInputRef.current?.(q);
      return;
    }

    // Safety check trigger via text
    if (isSafetyTrigger(q)) {
      startSafetyCheckRef.current?.();
      return;
    }

    addLog("USER", q);
    setLastQuestion(q);
    await handleQuestion(q);
  };

  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    return () => { stopVAD(); stopBargeIn(); stopWakeListener(); };
  }, [stopVAD, stopBargeIn, stopWakeListener]);

  // ── Labels ────────────────────────────────────────────────────────────────
  const canTapMic = sessionActive && (phase === "recording" || phase === "speaking");

  const micLabel =
    phase === "wake_listening"
    ? isSpanish ? "Esperando 'Hola NOVA'…" : "Waiting for 'Hey NOVA'…"
    : phase === "recording"
    ? isSpanish ? "🔴 Pausa para enviar" : "🔴 Pause to send"
    : phase === "speaking"
    ? isSpanish ? "⏹ Habla o toca para parar" : "⏹ Speak or tap to stop"
    : phase === "listening"
    ? isSpanish ? "Escuchando…" : "Listening…"
    : "";

  const phaseTitle = !sessionActive
    ? isSpanish ? "Di 'Hola NOVA' para activar" : "Say 'Hey NOVA' to activate"
    : safetyMode
    ? isSpanish ? `Revisión de seguridad · Ítem ${safetyIndex + 1} de ${SAFETY_ITEMS_EN.length}` : `Safety check · Item ${safetyIndex + 1} of ${SAFETY_ITEMS_EN.length}`
    : phase === "wake_listening"
    ? isSpanish ? "Di 'Hola NOVA' para activarme" : "Say 'Hey NOVA' to wake me"
    : phase === "recording"
    ? isSpanish ? "Grabando… pausa cuando termines" : "Recording… pause when done"
    : phase === "transcribing"
    ? isSpanish ? "Procesando…" : "Processing…"
    : phase === "thinking"
    ? isSpanish ? "NOVA pensando…" : "NOVA thinking…"
    : phase === "speaking"
    ? isSpanish ? "Habla para interrumpir • toca para parar" : "Speak or tap to stop NOVA"
    : isSpanish ? "Escuchando…" : "Listening…";

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white flex flex-col">
      {/* Top bar */}
      <div className="bg-[#141428] border-b border-white/5 px-6 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">N</div>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-none">NOVA Help</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {isSpanish ? "Entrenador de voz — almacén" : "Warehouse voice coach"}
          </p>
        </div>
        {sessionActive && (
          <div className="flex items-center gap-3">
            <NovaVoiceStatus state={voiceStateKey} />
            <button
              onClick={endSession}
              className="text-xs text-slate-500 hover:text-red-400 transition px-3 py-1.5 rounded-lg border border-white/5 hover:border-red-500/30"
            >
              {isSpanish ? "Terminar ✕" : "End Session ✕"}
            </button>
          </div>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6 max-w-lg mx-auto w-full">

        {/* Signal circle */}
        <button
          onClick={handleMic}
          disabled={!canTapMic}
          className={[
            "focus:outline-none transition-transform duration-200",
            canTapMic ? "cursor-pointer active:scale-95" : "cursor-default",
          ].join(" ")}
          aria-label={phase === "recording" ? "Stop recording" : phase === "speaking" ? "Stop speaking" : undefined}
        >
          <SignalIcon phase={phase} volume={volume} />
        </button>

        {/* Title */}
        <div className="text-center space-y-1.5">
          <h1 className="text-4xl font-black tracking-tight">NOVA</h1>
          <p className="text-slate-300 text-base">
            {isSpanish ? "Entrenador de voz para almacén" : "Warehouse voice picking trainer"}
          </p>
          <p className={`text-sm font-medium ${
            phase === "wake_listening" ? "text-indigo-400/70"
            : phase === "recording"   ? "text-violet-400"
            : phase === "speaking"    ? "text-purple-400"
            : "text-slate-400"
          }`}>
            {phaseTitle}
          </p>
          {micLabel && (
            <p className={`text-xs font-semibold uppercase tracking-widest ${
              phase === "wake_listening" ? "text-indigo-500/60" : "text-violet-400 animate-pulse"
            }`}>
              {micLabel}
            </p>
          )}
        </div>

        {!browserSupported && (
          <div className="w-full rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-yellow-300 text-sm text-center">
            {isSpanish
              ? "El modo de voz tiene limitaciones en este navegador. Usa Chrome."
              : "Live voice mode is limited on this browser. Try Chrome for best results."}
          </div>
        )}

        {errorMsg && (
          <div className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-red-300 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {/* Big stop button while NOVA speaks */}
        {sessionActive && phase === "speaking" && (
          <button
            onClick={stopSpeaking}
            className="w-full py-4 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 hover:border-red-500/70 text-red-300 font-bold text-base tracking-wide transition-all duration-200 active:scale-95"
          >
            {isSpanish ? "⏹ Parar" : "⏹ Stop"}
          </button>
        )}

        {/* Safety check progress banner */}
        {sessionActive && safetyMode && (
          <div className="w-full rounded-xl border border-yellow-400/40 bg-yellow-400/8 px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest">
                {isSpanish ? "🛡 Revisión de Seguridad" : "🛡 Safety Check"}
              </p>
              <p className="text-xs text-yellow-300/70 font-semibold">
                {safetyIndex + 1} / {SAFETY_ITEMS_EN.length}
              </p>
            </div>
            <div className="flex gap-1 mb-3">
              {SAFETY_ITEMS_EN.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < safetyIndex ? "bg-green-400" : i === safetyIndex ? "bg-yellow-400 animate-pulse" : "bg-slate-700"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm font-semibold text-yellow-200">
              {(isSpanish ? SAFETY_ITEMS_ES : SAFETY_ITEMS_EN)[safetyIndex]}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              {isSpanish ? "Di 'sí' para confirmar o 'no' si falla" : "Say 'okay' to confirm or 'no' if failed"}
            </p>
          </div>
        )}

        {/* Info panels */}
        {sessionActive && (
          <div className="w-full space-y-3">
            {lastHeard && (
              <div className="rounded-xl border border-white/5 bg-white/3 px-4 py-3 flex gap-3 items-start">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mt-0.5">
                  {isSpanish ? "Oí" : "Heard"}
                </span>
                <p className="text-slate-300 text-sm">{lastHeard}</p>
              </div>
            )}
            {lastQuestion && lastQuestion !== lastHeard && (
              <div className="rounded-xl border border-white/5 bg-white/3 px-4 py-3 flex gap-3 items-start">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mt-0.5">
                  {isSpanish ? "Tú" : "You"}
                </span>
                <p className="text-slate-300 text-sm">{lastQuestion}</p>
              </div>
            )}
            {answer && (
              <div className="rounded-2xl border border-violet-500/20 bg-violet-950/30 px-5 py-4">
                <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-2">NOVA</p>
                <p className="text-white text-base leading-relaxed">{answer}</p>
              </div>
            )}
          </div>
        )}

        {/* Wake / Pause hint chips */}
        {sessionActive && (
          <div className="w-full flex gap-3 text-center">
            <div className={`flex-1 rounded-xl border px-3 py-2.5 transition-all duration-300 ${
              phase === "wake_listening"
                ? "border-indigo-500/40 bg-indigo-950/40"
                : "border-white/5 bg-[#0f0f20]"
            }`}>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1">
                {isSpanish ? "Activa" : "Wake"}
              </p>
              <p className={`text-xs font-bold ${phase === "wake_listening" ? "text-indigo-300" : "text-indigo-500"}`}>
                {isSpanish ? "Hola NOVA" : "Hey NOVA"}
              </p>
            </div>
            <div className="flex-1 rounded-xl border border-white/5 bg-[#0f0f20] px-3 py-2.5">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1">
                {isSpanish ? "Pausa" : "Pause"}
              </p>
              <p className="text-xs text-red-400 font-bold">
                {isSpanish ? "Parar" : "Stop"}
              </p>
            </div>
            <div className="flex-1 rounded-xl border border-white/5 bg-[#0f0f20] px-3 py-2.5">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1">
                {isSpanish ? "Modo" : "Mode"}
              </p>
              <p className="text-xs text-green-400 font-bold">
                {isSpanish ? "Sin manos" : "Hands-free"}
              </p>
            </div>
          </div>
        )}

        {/* Start / text input */}
        {!sessionActive ? (
          <LockedAction onAllowedClick={startSession} className="w-full">
            <button className="w-full py-5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold text-lg tracking-wide transition-all duration-200 shadow-[0_0_30px_rgba(139,92,246,0.35)]">
              {isSpanish ? "Iniciar Sesión" : "Start Session"}
            </button>
          </LockedAction>
        ) : (
          <form onSubmit={handleTextSubmit} className="w-full flex gap-3">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={phase === "thinking" || phase === "transcribing"}
              placeholder={isSpanish ? "O escribe tu pregunta…" : "Or type your question…"}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || phase === "thinking" || phase === "transcribing"}
              className="rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-3 font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              →
            </button>
          </form>
        )}

        {/* Session log */}
        {log.length > 0 && (
          <div className="w-full">
            <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-2">
              {isSpanish ? "Registro de sesión" : "Session log"}
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {log.map((entry, i) => (
                <div key={i} className={`flex gap-2 text-xs ${entry.role === "NOVA" ? "text-violet-300" : "text-slate-400"}`}>
                  <span className="shrink-0 text-slate-600">{entry.time}</span>
                  <span className={`font-bold shrink-0 ${entry.role === "NOVA" ? "text-violet-500" : "text-slate-500"}`}>
                    {entry.role === "NOVA" ? "NOVA" : isSpanish ? "Tú" : "You"}
                  </span>
                  <span className="leading-relaxed">{entry.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
