import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { askNovaHelp, transcribeAudio } from "@/lib/novaHelpApi";
import { detectWakeWord, detectStopWord } from "@/lib/novaModeRouter";
import { NovaVoiceStatus, type VoiceStateKey } from "@/components/nova/NovaVoiceStatus";

// ─── TTS ─────────────────────────────────────────────────────────────────────
function speakText(text: string, lang: string, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) { onEnd?.(); return; }
  try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 1.0;
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
type Phase = "idle" | "wake_listening" | "listening" | "recording" | "transcribing" | "thinking" | "speaking";

interface LogEntry { time: string; role: "NOVA" | "USER"; text: string; }

// ─── Signal Icon ─────────────────────────────────────────────────────────────
function SignalIcon({ phase }: { phase: Phase }) {
  const isWake     = phase === "wake_listening";
  const isListen   = phase === "listening" || phase === "recording";
  const isThinking = phase === "thinking" || phase === "transcribing";
  const isSpeaking = phase === "speaking";

  const borderColor = isSpeaking
    ? "border-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.5)]"
    : isListen
    ? "border-violet-400 shadow-[0_0_40px_rgba(139,92,246,0.5)]"
    : isWake
    ? "border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.35)]"
    : isThinking
    ? "border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.4)]"
    : "border-violet-700/50";

  const bgColor = isSpeaking
    ? "bg-purple-900/60"
    : isListen
    ? "bg-violet-900/60"
    : isWake
    ? "bg-indigo-900/40"
    : isThinking
    ? "bg-yellow-900/30"
    : "bg-[#1a1a2e]";

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      {(isListen || isWake) && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-violet-400/20 animate-[ping_2s_ease-in-out_infinite]" />
          <div className="absolute inset-4 rounded-full border-2 border-violet-400/30 animate-[ping_2s_ease-in-out_0.4s_infinite]" />
        </>
      )}
      {isSpeaking && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/20 animate-[ping_1.5s_ease-in-out_infinite]" />
          <div className="absolute inset-3 rounded-full border-2 border-purple-400/30 animate-[ping_1.5s_ease-in-out_0.3s_infinite]" />
        </>
      )}
      <div className={`w-36 h-36 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${bgColor} ${borderColor}`}>
        <svg viewBox="0 0 48 48" className={`w-16 h-16 transition-all duration-300 ${phase === "idle" ? "text-violet-500/60" : "text-violet-300"}`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path strokeWidth="2.5" strokeOpacity={isListen || isWake ? "1" : "0.4"} d="M8 20 C8 11.163 15.163 4 24 4 C32.837 4 40 11.163 40 20" className={isListen ? "animate-[pulse_1s_ease-in-out_infinite]" : ""} />
          <path strokeWidth="2.5" strokeOpacity={phase !== "idle" ? "0.85" : "0.5"} d="M13 25 C13 19.477 18.477 14 24 14 C29.523 14 35 19.477 35 25" />
          <path strokeWidth="2.5" d="M18 30 C18 26.686 20.686 24 24 24 C27.314 24 30 26.686 30 30" />
          <circle cx="24" cy="38" r="3" fill="currentColor" strokeWidth="0" />
        </svg>
      </div>
    </div>
  );
}

// ─── Browser support check ────────────────────────────────────────────────────
function checkMediaRecorderSupport(): boolean {
  return typeof window !== "undefined" && !!window.MediaRecorder && !!navigator.mediaDevices?.getUserMedia;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NovaHelpPage() {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith("es");
  const ttsLang = isSpanish ? "es-ES" : "en-US";

  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionActive, setSessionActive] = useState(false);
  const [wakeMode, setWakeMode] = useState(false); // true = waiting for "hey nova"
  const [answer, setAnswer] = useState("");
  const [lastHeard, setLastHeard] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [textInput, setTextInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [browserSupported] = useState(checkMediaRecorderSupport);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionActiveRef = useRef(false);
  const wakeModeRef = useRef(false);

  const now = () => new Date().toLocaleTimeString("en-US", { hour12: true, hour: "numeric", minute: "2-digit", second: "2-digit" });
  const addLog = (role: "NOVA" | "USER", text: string) =>
    setLog((prev) => [{ time: now(), role, text }, ...prev].slice(0, 40));

  // Map Phase to VoiceStateKey for the status badge
  const voiceStateKey: VoiceStateKey =
    phase === "wake_listening" ? "wake_listening"
    : phase === "listening" ? "active_listening"
    : phase === "recording" ? "recording"
    : phase === "transcribing" ? "transcribing"
    : phase === "thinking" ? "thinking"
    : phase === "speaking" ? "speaking"
    : "idle";

  // ── Core: start recording from mic ───────────────────────────────────────
  const startRecording = useCallback(async () => {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/ogg")
        ? "audio/ogg"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setPhase("recording");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(isSpanish ? `Micrófono no disponible: ${msg}` : `Microphone unavailable: ${msg}`);
      setPhase(wakeModeRef.current ? "wake_listening" : "listening");
    }
  }, [isSpanish]);

  // ── Core: stop recording and transcribe ──────────────────────────────────
  const stopAndTranscribe = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    setPhase("transcribing");

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    const audioBlob = new Blob(chunksRef.current, { type: recorder.mimeType ?? "audio/webm" });
    chunksRef.current = [];
    mediaRecorderRef.current = null;

    if (audioBlob.size < 500) {
      setErrorMsg(isSpanish ? "No se captó audio. Intenta de nuevo." : "No audio captured. Try again.");
      setPhase(wakeModeRef.current ? "wake_listening" : "listening");
      return;
    }

    const transcript = await transcribeAudio(audioBlob, isSpanish ? "es" : "en");
    if (!transcript) {
      setErrorMsg(isSpanish ? "No pude entender. Intenta de nuevo." : "Couldn't understand. Try again.");
      setPhase(wakeModeRef.current ? "wake_listening" : "listening");
      return;
    }

    setLastHeard(transcript);
    addLog("USER", transcript);

    // ── Wake word check ──────────────────────────────────────────────────
    if (wakeModeRef.current) {
      const wake = detectWakeWord(transcript);
      if (wake) {
        // Wake word detected — greet and switch to active listening
        wakeModeRef.current = false;
        setWakeMode(false);
        const greet = isSpanish
          ? "Hola. Soy NOVA. ¿Cómo puedo ayudarte con selección hoy?"
          : "Hi. I'm NOVA. How can I help you with selecting today?";
        addLog("NOVA", greet);
        setAnswer(greet);
        setPhase("speaking");
        speakText(greet, ttsLang, () => {
          if (sessionActiveRef.current) {
            setPhase("listening");
            // Auto-start recording for first question
            setTimeout(() => {
              if (sessionActiveRef.current) startRecording();
            }, 400);
          }
        });
        return;
      }
      // Not wake word — go back to wake_listening
      setPhase("wake_listening");
      return;
    }

    // ── Stop word check ──────────────────────────────────────────────────
    if (detectStopWord(transcript)) {
      const stopReply = isSpanish ? "Sesión pausada. Di 'Hey NOVA' para continuar." : "Session paused. Say 'Hey NOVA' to continue.";
      addLog("NOVA", stopReply);
      setAnswer(stopReply);
      setPhase("speaking");
      speakText(stopReply, ttsLang, () => {
        // Return to wake listening
        wakeModeRef.current = true;
        setWakeMode(true);
        setPhase("wake_listening");
      });
      return;
    }

    // ── Normal question ─────────────────────────────────────────────────
    await handleQuestion(transcript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpanish, ttsLang]);

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
          if (sessionActiveRef.current) {
            // Auto-start recording for next question
            setPhase("listening");
            setTimeout(() => {
              if (sessionActiveRef.current) startRecording();
            }, 500);
          }
        });
      } catch {
        const fallback = isSpanish
          ? "Tuve un problema. Pregúntame de nuevo."
          : "I had trouble answering. Try asking again.";
        setAnswer(fallback);
        setPhase("listening");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSpanish, ttsLang],
  );

  // ── Session start ─────────────────────────────────────────────────────────
  const startSession = () => {
    sessionActiveRef.current = true;
    wakeModeRef.current = true; // start in wake mode
    setSessionActive(true);
    setWakeMode(true);
    setAnswer("");
    setLastHeard("");
    setLastQuestion("");
    setErrorMsg("");
    setLog([]);

    const wakeHint = isSpanish
      ? "Sesión NOVA activa. Toca el micrófono y di Hola NOVA para comenzar."
      : "NOVA session active. Tap the microphone and say Hey NOVA to begin.";
    addLog("NOVA", wakeHint);
    speakText(wakeHint, ttsLang, () => setPhase("wake_listening"));
    setPhase("speaking");
  };

  // ── Session end ───────────────────────────────────────────────────────────
  const endSession = () => {
    sessionActiveRef.current = false;
    wakeModeRef.current = false;
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

  // ── Stop TTS immediately ──────────────────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    if (sessionActiveRef.current) {
      setPhase("listening");
      setTimeout(() => {
        if (sessionActiveRef.current) startRecording();
      }, 300);
    }
  }, [startRecording]);

  // ── Mic button tap ────────────────────────────────────────────────────────
  const handleMic = () => {
    if (!sessionActive) return;
    if (phase === "speaking") {
      // Interrupt NOVA mid-sentence
      stopSpeaking();
    } else if (phase === "recording") {
      stopAndTranscribe();
    } else if (phase === "listening" || phase === "wake_listening") {
      startRecording();
    }
  };

  // ── Text submit (bypasses wake word) ─────────────────────────────────────
  const handleTextSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = textInput.trim();
    if (!q) return;
    if (!sessionActive) {
      sessionActiveRef.current = true;
      wakeModeRef.current = false;
      setSessionActive(true);
      setWakeMode(false);
      setLog([]);
    }
    setTextInput("");
    addLog("USER", q);
    setLastQuestion(q);
    await handleQuestion(q);
  };

  // Load TTS voices on mount
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  // ── Labels ────────────────────────────────────────────────────────────────
  const micLabel =
    phase === "recording"
      ? isSpanish ? "🔴 Toca para enviar" : "🔴 Tap to send"
      : phase === "speaking"
      ? isSpanish ? "⏹ Toca para parar" : "⏹ Tap to stop"
      : phase === "wake_listening"
      ? isSpanish ? "Toca · Di Hola NOVA" : "Tap · Say Hey NOVA"
      : phase === "listening"
      ? isSpanish ? "Toca para hablar" : "Tap to speak"
      : "";

  const canTapMic =
    sessionActive &&
    (phase === "listening" || phase === "recording" || phase === "wake_listening" || phase === "speaking");

  const phaseTitle = !sessionActive
    ? isSpanish ? "Totalmente automático — como Siri" : "Fully automatic — just like Siri"
    : phase === "wake_listening"
    ? isSpanish ? "Di 'Hola NOVA' para activar" : "Say 'Hey NOVA' to activate"
    : phase === "recording"
    ? isSpanish ? "Grabando… toca para enviar" : "Recording… tap to send"
    : phase === "transcribing"
    ? isSpanish ? "Transcribiendo…" : "Transcribing…"
    : phase === "thinking"
    ? isSpanish ? "NOVA pensando…" : "NOVA thinking…"
    : phase === "speaking"
    ? isSpanish ? "NOVA hablando — toca para parar" : "NOVA speaking — tap to stop"
    : isSpanish ? "Listo — toca el micrófono" : "Ready — tap the microphone";

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
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

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6 max-w-lg mx-auto w-full">

        {/* Signal circle — tap to record */}
        <button
          onClick={handleMic}
          disabled={!canTapMic}
          className={[
            "focus:outline-none transition-transform duration-200",
            canTapMic ? "cursor-pointer active:scale-95" : "cursor-default",
          ].join(" ")}
          aria-label={phase === "recording" ? "Stop recording" : "Start recording"}
        >
          <SignalIcon phase={phase} />
        </button>

        {/* Title + phase status */}
        <div className="text-center space-y-1.5">
          <h1 className="text-4xl font-black tracking-tight">NOVA</h1>
          <p className="text-slate-300 text-base">
            {isSpanish ? "Entrenador de voz para almacén" : "Warehouse voice picking trainer"}
          </p>
          <p className={`text-sm font-medium ${phase === "wake_listening" ? "text-indigo-400" : phase === "recording" ? "text-red-400" : "text-slate-400"}`}>
            {phaseTitle}
          </p>
          {micLabel && (
            <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest animate-pulse">
              {micLabel}
            </p>
          )}
        </div>

        {/* Browser not supported warning */}
        {!browserSupported && (
          <div className="w-full rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-yellow-300 text-sm text-center">
            {isSpanish
              ? "El modo de voz en vivo tiene limitaciones en este navegador. Usa Chrome para mejores resultados."
              : "Live voice mode is limited on this browser. Try Chrome for best results."}
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-red-300 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {/* Info panels — shown during active session */}
        {sessionActive && (
          <div className="w-full space-y-3">
            {/* Last heard */}
            {lastHeard && (
              <div className="rounded-xl border border-white/5 bg-white/3 px-4 py-3 flex gap-3 items-start">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mt-0.5">Heard</span>
                <p className="text-slate-300 text-sm">{lastHeard}</p>
              </div>
            )}
            {/* Last question */}
            {lastQuestion && lastQuestion !== lastHeard && (
              <div className="rounded-xl border border-white/5 bg-white/3 px-4 py-3 flex gap-3 items-start">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mt-0.5">You</span>
                <p className="text-slate-300 text-sm">{lastQuestion}</p>
              </div>
            )}
            {/* NOVA answer */}
            {answer && (
              <div className="rounded-2xl border border-violet-500/20 bg-violet-950/30 px-5 py-4">
                <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-2">NOVA</p>
                <p className="text-white text-base leading-relaxed">{answer}</p>
              </div>
            )}
          </div>
        )}

        {/* Hints */}
        {sessionActive && (
          <div className="w-full flex gap-3 text-center">
            <div className="flex-1 rounded-xl border border-white/5 bg-[#0f0f20] px-3 py-2.5">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1">
                {isSpanish ? "Activa" : "Wake"}
              </p>
              <p className="text-xs text-indigo-400 font-bold">
                {isSpanish ? "Hola NOVA" : "Hey NOVA"}
              </p>
            </div>
            <div className="flex-1 rounded-xl border border-white/5 bg-[#0f0f20] px-3 py-2.5">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1">
                {isSpanish ? "Detén" : "Stop"}
              </p>
              <p className="text-xs text-red-400 font-bold">
                {isSpanish ? "Parar" : "Stop"}
              </p>
            </div>
          </div>
        )}

        {/* Start button / Text input */}
        {!sessionActive ? (
          <button
            onClick={startSession}
            className="w-full py-5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold text-lg tracking-wide transition-all duration-200 shadow-[0_0_30px_rgba(139,92,246,0.35)]"
          >
            {isSpanish ? "Iniciar Sesión" : "Start Session"}
          </button>
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
              {isSpanish ? "Enviar" : "Ask"}
            </button>
          </form>
        )}
      </div>

      {/* ── Command log ─────────────────────────────────────────────────── */}
      {sessionActive && log.length > 0 && (
        <div className="border-t border-white/5 bg-[#0f0f20] px-6 py-5 max-h-52 overflow-y-auto">
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-3 font-semibold">Session Log</p>
          <div className="space-y-3">
            {log.map((entry, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 text-right w-16">
                  <p className={`text-xs font-bold ${entry.role === "NOVA" ? "text-violet-400" : "text-slate-400"}`}>
                    {entry.role}
                  </p>
                  <p className="text-[10px] text-slate-600">{entry.time}</p>
                </div>
                <p className={`text-sm leading-relaxed ${entry.role === "NOVA" ? "text-slate-200" : "text-slate-400"}`}>
                  {entry.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
