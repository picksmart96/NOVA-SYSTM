import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { askNovaHelp, transcribeAudio } from "@/lib/novaHelpApi";

// ─── TTS ─────────────────────────────────────────────────────────────────────
function speakText(text: string, lang: string, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) { onEnd?.(); return; }
  try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 1;
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
type Phase = "idle" | "listening" | "recording" | "transcribing" | "thinking" | "speaking";

interface LogEntry { time: string; role: "NOVA" | "USER"; text: string; }

// ─── Signal Icon ─────────────────────────────────────────────────────────────
function SignalIcon({ active, phase }: { active: boolean; phase: Phase }) {
  const isListening = active && (phase === "listening" || phase === "recording");
  const isThinking = active && (phase === "thinking" || phase === "transcribing");
  const isSpeaking = active && phase === "speaking";

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      {/* Outer pulse rings — only when listening */}
      {isListening && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-violet-400/20 animate-[ping_2s_ease-in-out_infinite]" />
          <div className="absolute inset-4 rounded-full border-2 border-violet-400/30 animate-[ping_2s_ease-in-out_0.4s_infinite]" />
        </>
      )}
      {/* Speaking rings */}
      {isSpeaking && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/20 animate-[ping_1.5s_ease-in-out_infinite]" />
          <div className="absolute inset-3 rounded-full border-2 border-purple-400/30 animate-[ping_1.5s_ease-in-out_0.3s_infinite]" />
        </>
      )}
      {/* Main circle */}
      <div
        className={[
          "w-36 h-36 rounded-full flex items-center justify-center",
          "border-2 transition-all duration-500",
          active
            ? isListening
              ? "bg-violet-900/60 border-violet-400 shadow-[0_0_40px_rgba(139,92,246,0.5)]"
              : isSpeaking
                ? "bg-purple-900/60 border-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.5)]"
                : isThinking
                  ? "bg-indigo-900/60 border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                  : "bg-violet-900/40 border-violet-600"
            : "bg-[#1a1a2e] border-violet-700/50",
        ].join(" ")}
      >
        {/* Wifi / signal icon */}
        <svg viewBox="0 0 48 48" className={["w-16 h-16 transition-all duration-300", active ? "text-violet-300" : "text-violet-500/60"].join(" ")} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          {/* Outer arc */}
          <path strokeWidth="2.5" strokeOpacity={active && isListening ? "1" : "0.4"} d="M8 20 C8 11.163 15.163 4 24 4 C32.837 4 40 11.163 40 20" className={active && isListening ? "animate-[pulse_1s_ease-in-out_infinite]" : ""} />
          {/* Mid arc */}
          <path strokeWidth="2.5" strokeOpacity={active ? "0.85" : "0.5"} d="M13 25 C13 19.477 18.477 14 24 14 C29.523 14 35 19.477 35 25" />
          {/* Inner arc */}
          <path strokeWidth="2.5" d="M18 30 C18 26.686 20.686 24 24 24 C27.314 24 30 26.686 30 30" />
          {/* Center dot */}
          <circle cx="24" cy="38" r="3" fill="currentColor" strokeWidth="0" />
        </svg>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NovaHelpPage() {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith("es");
  const ttsLang = isSpanish ? "es-ES" : "en-US";

  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionActive, setSessionActive] = useState(false);
  const [answer, setAnswer] = useState("");
  const [lastHeard, setLastHeard] = useState("");
  const [textInput, setTextInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const autoListenRef = useRef(false);

  const now = () => new Date().toLocaleTimeString("en-US", { hour12: true, hour: "numeric", minute: "2-digit", second: "2-digit" });

  const addLog = (role: "NOVA" | "USER", text: string) =>
    setLog((prev) => [{ time: now(), role, text }, ...prev].slice(0, 30));

  // ── Ask NOVA ─────────────────────────────────────────────────────────────
  const handleQuestion = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q) return;
      setLastHeard(q);
      setAnswer("");
      setErrorMsg("");
      setPhase("thinking");
      addLog("USER", q);

      try {
        const response = await askNovaHelp(q, isSpanish ? "es" : "en");
        setAnswer(response);
        setPhase("speaking");
        addLog("NOVA", response);
        speakText(response, ttsLang, () => {
          // After speaking, auto-listen again if session is active
          if (autoListenRef.current) {
            startListening();
          } else {
            setPhase("listening");
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

  // ── MediaRecorder recording ───────────────────────────────────────────────
  const startListening = async () => {
    setErrorMsg("");
    setPhase("listening");
  };

  const startRecording = async () => {
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
      setPhase("listening");
    }
  };

  const stopAndTranscribe = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    setPhase("transcribing");

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    const audioBlob = new Blob(chunksRef.current, { type: mediaRecorderRef.current?.mimeType ?? "audio/webm" });
    chunksRef.current = [];
    mediaRecorderRef.current = null;

    if (audioBlob.size < 500) {
      setErrorMsg(isSpanish ? "No se captó audio. Intenta de nuevo." : "No audio captured. Try again.");
      setPhase("listening");
      return;
    }

    const transcript = await transcribeAudio(audioBlob, isSpanish ? "es" : "en");
    if (!transcript) {
      setErrorMsg(isSpanish ? "No pude entender. Intenta de nuevo." : "Couldn't understand. Try again.");
      setPhase("listening");
      return;
    }
    await handleQuestion(transcript);
  };

  // ── Session start / stop ──────────────────────────────────────────────────
  const startSession = () => {
    autoListenRef.current = true;
    setSessionActive(true);
    setAnswer("");
    setLastHeard("");
    setErrorMsg("");
    setLog([]);

    const greeting = isSpanish
      ? "NOVA Help activa. Toca el micrófono y hazme tu pregunta."
      : "NOVA Help active. Tap the microphone and ask me your question.";
    addLog("NOVA", greeting);
    speakText(greeting, ttsLang, () => setPhase("listening"));
    setPhase("speaking");
  };

  const endSession = () => {
    autoListenRef.current = false;
    // stop any active recording
    if (mediaRecorderRef.current) {
      try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
      mediaRecorderRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    setSessionActive(false);
    setPhase("idle");
    setAnswer("");
    setLastHeard("");
    setErrorMsg("");
  };

  // ── Mic button press ──────────────────────────────────────────────────────
  const handleMic = () => {
    if (!sessionActive) return;
    if (phase === "recording") stopAndTranscribe();
    else if (phase === "listening") startRecording();
  };

  // Load voice list on mount
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  // ── Text submit ───────────────────────────────────────────────────────────
  const handleTextSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = textInput.trim();
    if (!q) return;
    if (!sessionActive) { startSession(); }
    setTextInput("");
    await handleQuestion(q);
  };

  // ── Label helpers ─────────────────────────────────────────────────────────
  const phaseLabels: Record<Phase, string> = {
    idle: isSpanish ? "Listo para iniciar" : "Ready to start",
    listening: isSpanish ? "Escuchando" : "Listening",
    recording: isSpanish ? "Grabando… toca para enviar" : "Recording… tap to send",
    transcribing: isSpanish ? "Transcribiendo…" : "Transcribing…",
    thinking: isSpanish ? "Pensando…" : "Thinking…",
    speaking: isSpanish ? "NOVA hablando…" : "NOVA speaking…",
  };

  const micLabel =
    phase === "recording"
      ? isSpanish ? "Toca para enviar" : "Tap to send"
      : phase === "listening"
        ? isSpanish ? "Toca para hablar" : "Tap to speak"
        : "";

  const canTapMic = sessionActive && (phase === "listening" || phase === "recording");

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white flex flex-col">
      {/* User bar */}
      <div className="bg-[#141428] border-b border-white/5 px-6 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">N</div>
        <div>
          <p className="text-sm font-semibold leading-none">NOVA Help</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {isSpanish ? "Entrenador de voz — almacén" : "Warehouse voice coach"}
          </p>
        </div>
        {sessionActive && (
          <button
            onClick={endSession}
            className="ml-auto text-xs text-slate-500 hover:text-red-400 transition px-3 py-1.5 rounded-lg border border-white/5 hover:border-red-500/30"
          >
            {isSpanish ? "Terminar sesión" : "End Session"} ✕
          </button>
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-8">

        {/* Signal icon */}
        <button
          onClick={handleMic}
          disabled={!canTapMic}
          className={["focus:outline-none transition-transform duration-200", canTapMic ? "cursor-pointer active:scale-95" : "cursor-default"].join(" ")}
          aria-label={phase === "recording" ? "Stop recording" : "Start recording"}
        >
          <SignalIcon active={sessionActive} phase={phase} />
        </button>

        {/* Title + status */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tight">NOVA</h1>
          <p className="text-slate-300 text-base">
            {isSpanish ? "Entrenador de voz para almacén" : "Warehouse voice picking trainer"}
          </p>
          <p className="text-slate-500 text-sm">
            {sessionActive
              ? phaseLabels[phase]
              : isSpanish
                ? "Totalmente automático — como Siri"
                : "Fully automatic — just like Siri"}
          </p>
          {micLabel && (
            <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest animate-pulse">
              {micLabel}
            </p>
          )}
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="w-full max-w-lg rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-red-300 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {/* NOVA answer */}
        {answer && (
          <div className="w-full max-w-lg rounded-2xl border border-violet-500/20 bg-violet-950/30 px-6 py-5">
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-2">NOVA</p>
            <p className="text-white text-base leading-relaxed">{answer}</p>
          </div>
        )}

        {/* Start session button */}
        {!sessionActive ? (
          <button
            onClick={startSession}
            className="w-full max-w-lg py-5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold text-lg tracking-wide transition-all duration-200 shadow-[0_0_30px_rgba(139,92,246,0.35)]"
          >
            {isSpanish ? "Iniciar Sesión" : "Start Session"}
          </button>
        ) : (
          /* Text input while session active */
          <form onSubmit={handleTextSubmit} className="w-full max-w-lg flex gap-3">
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

      {/* Command log — shown only when session active */}
      {sessionActive && log.length > 0 && (
        <div className="border-t border-white/5 bg-[#0f0f20] px-6 py-5 max-h-64 overflow-y-auto">
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-3 font-semibold">Command Log</p>
          <div className="space-y-3">
            {log.map((entry, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 text-right">
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
