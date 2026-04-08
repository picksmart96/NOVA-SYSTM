import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { askNovaHelp, transcribeAudio } from "@/lib/novaHelpApi";

// ─── TTS helper ─────────────────────────────────────────────────────────────
function speakText(text: string, lang: string) {
  if (!("speechSynthesis" in window)) return;
  try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 1;
  u.pitch = 1;
  // Pick a preferred voice
  const voices = window.speechSynthesis.getVoices();
  const root = lang.split("-")[0];
  const preferred =
    voices.find((v) => /samantha|aria|ava|zira|karen/i.test(v.name) && v.lang.startsWith(root)) ||
    voices.find((v) => /samantha|aria|ava|zira|karen/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith(root));
  if (preferred) u.voice = preferred;
  window.speechSynthesis.speak(u);
}

// ─── Page ────────────────────────────────────────────────────────────────────
type Phase = "idle" | "recording" | "transcribing" | "thinking" | "speaking" | "ready";

export default function NovaHelpPage() {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith("es");
  const ttsLang = isSpanish ? "es-ES" : "en-US";

  const [phase, setPhase] = useState<Phase>("idle");
  const [lastQuestion, setLastQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [textInput, setTextInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [log, setLog] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
    setLog((prev) => [`${ts}  ${msg}`, ...prev].slice(0, 10));
  };

  // ── Handle a question (text or transcribed) ───────────────────────────────
  const handleQuestion = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q) return;
      setLastQuestion(q);
      setAnswer("");
      setErrorMsg("");
      setPhase("thinking");
      addLog(`🤔 "${q.slice(0, 50)}${q.length > 50 ? "…" : ""}"`);

      try {
        const response = await askNovaHelp(q, isSpanish ? "es" : "en");
        setAnswer(response);
        setPhase("speaking");
        addLog(`💬 NOVA answered (${response.length} chars)`);
        speakText(response, ttsLang);
        // After speaking the answer, return to ready state
        // Use a timeout approximating speech duration (avg 14 chars/sec)
        const approxMs = Math.max(2000, (response.length / 14) * 1000);
        setTimeout(() => setPhase("ready"), approxMs);
      } catch {
        const fallback = isSpanish
          ? "Tuve un problema. Pregúntame de nuevo."
          : "I had trouble answering. Try asking again.";
        setAnswer(fallback);
        setPhase("ready");
        addLog("❌ Error getting answer");
      }
    },
    [isSpanish, ttsLang],
  );

  // ── Voice recording (Whisper) ─────────────────────────────────────────────
  const startRecording = async () => {
    setErrorMsg("");
    addLog("🎤 Requesting microphone…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Use webm if supported, otherwise ogg/mp4 fallback
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/ogg")
          ? "audio/ogg"
          : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(250); // collect chunks every 250ms
      setPhase("recording");
      addLog("🔴 Recording started — tap again to send");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(
        isSpanish
          ? `Micrófono no disponible: ${msg}`
          : `Microphone unavailable: ${msg}`,
      );
      addLog(`❌ Mic error: ${msg}`);
    }
  };

  const stopAndTranscribe = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    setPhase("transcribing");
    addLog("⏳ Transcribing audio…");

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    // Stop all tracks to release mic indicator
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    const audioBlob = new Blob(chunksRef.current, {
      type: mediaRecorderRef.current?.mimeType ?? "audio/webm",
    });
    chunksRef.current = [];
    mediaRecorderRef.current = null;

    if (audioBlob.size < 500) {
      setErrorMsg(
        isSpanish
          ? "No se captó audio. Intenta de nuevo."
          : "No audio captured. Please try again.",
      );
      setPhase("ready");
      addLog("⚠️ Recording too short");
      return;
    }

    addLog(`📤 Sending ${Math.round(audioBlob.size / 1024)}KB to Whisper…`);
    const transcript = await transcribeAudio(audioBlob, isSpanish ? "es" : "en");

    if (!transcript) {
      setErrorMsg(
        isSpanish
          ? "No pude entender el audio. Escribe tu pregunta abajo."
          : "Couldn't understand the audio. Try typing your question below.",
      );
      setPhase("ready");
      addLog("⚠️ Transcription returned empty");
      return;
    }

    addLog(`✅ Heard: "${transcript}"`);
    await handleQuestion(transcript);
  };

  const handleMicButton = () => {
    if (phase === "recording") {
      stopAndTranscribe();
    } else if (phase === "idle" || phase === "ready") {
      startRecording();
    }
  };

  // ── Text submit ───────────────────────────────────────────────────────────
  const handleTextSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = textInput.trim();
    if (!q || phase === "recording" || phase === "transcribing" || phase === "thinking") return;
    setTextInput("");
    await handleQuestion(q);
  };

  // Activate voices list on first load
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    setPhase("ready");
  }, []);

  // ── UI helpers ────────────────────────────────────────────────────────────
  const isBusy = phase === "transcribing" || phase === "thinking" || phase === "speaking";
  const isRecording = phase === "recording";

  const phaseLabel: Record<Phase, string> = {
    idle: isSpanish ? "Listo" : "Ready",
    ready: isSpanish ? "Listo" : "Ready",
    recording: isSpanish ? "Grabando… toca para enviar" : "Recording… tap to send",
    transcribing: isSpanish ? "Transcribiendo audio…" : "Transcribing audio…",
    thinking: isSpanish ? "NOVA está pensando…" : "NOVA is thinking…",
    speaking: isSpanish ? "NOVA está hablando…" : "NOVA is speaking…",
  };

  const phaseColor: Record<Phase, string> = {
    idle: "text-slate-400",
    ready: "text-green-400",
    recording: "text-red-400",
    transcribing: "text-yellow-400",
    thinking: "text-blue-400",
    speaking: "text-yellow-400",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center">
          <p className="text-yellow-400 text-sm font-semibold uppercase tracking-[0.22em]">
            {isSpanish ? "Pregunta a NOVA" : "Ask NOVA Anything"}
          </p>
          <h1 className="mt-3 text-5xl font-black">NOVA Help</h1>
          <p className="mt-4 text-slate-300 text-lg max-w-xl mx-auto">
            {isSpanish
              ? "Toca el micrófono para hablar, o escribe tu pregunta abajo."
              : "Tap the mic to speak, or type your question below."}
          </p>
        </div>

        {/* Big mic button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleMicButton}
            disabled={isBusy}
            className={[
              "w-36 h-36 rounded-full flex items-center justify-center text-5xl",
              "transition-all duration-200 shadow-2xl border-4 focus:outline-none",
              isRecording
                ? "bg-red-500 border-red-300 animate-pulse scale-110"
                : isBusy
                  ? "bg-slate-700 border-slate-600 opacity-60 cursor-not-allowed"
                  : "bg-yellow-400 border-yellow-300 hover:scale-105 active:scale-95 cursor-pointer",
            ].join(" ")}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isBusy ? (
              <span className="text-slate-300 text-4xl animate-spin">⟳</span>
            ) : isRecording ? (
              <span>⏹</span>
            ) : (
              <span>🎤</span>
            )}
          </button>

          <p className={`text-sm font-semibold uppercase tracking-widest ${phaseColor[phase]}`}>
            ● {phaseLabel[phase]}
          </p>

          {isRecording && (
            <p className="text-xs text-red-300 animate-pulse">
              {isSpanish ? "Toca de nuevo para detener y enviar" : "Tap again to stop & send"}
            </p>
          )}
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        {/* NOVA answer */}
        {answer && (
          <div className="rounded-3xl border border-yellow-400/20 bg-slate-900 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-slate-950 font-black text-sm">
                N
              </div>
              <p className="text-sm font-semibold text-yellow-400 uppercase tracking-widest">
                NOVA
              </p>
              {phase === "speaking" && (
                <span className="text-xs text-yellow-400 animate-pulse ml-auto">
                  🔊 {isSpanish ? "hablando…" : "speaking…"}
                </span>
              )}
            </div>
            <p className="text-white text-lg leading-relaxed">{answer}</p>
          </div>
        )}

        {/* Last question */}
        {lastQuestion && (
          <div className="rounded-3xl border border-slate-700 bg-slate-900/50 px-6 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">
              {isSpanish ? "Tu pregunta" : "Your question"}
            </p>
            <p className="text-slate-300">{lastQuestion}</p>
          </div>
        )}

        {/* Text input */}
        <form onSubmit={handleTextSubmit} className="flex gap-3">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={isBusy || isRecording}
            placeholder={
              isSpanish
                ? "Escribe tu pregunta sobre el almacén…"
                : "Type your warehouse question…"
            }
            className={[
              "flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3",
              "text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400",
              "transition disabled:opacity-50",
            ].join(" ")}
          />
          <button
            type="submit"
            disabled={!textInput.trim() || isBusy || isRecording}
            className="rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSpanish ? "Enviar" : "Ask"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600">
          {isSpanish
            ? "NOVA responde sobre selección, seguridad, tarimas y rendimiento."
            : "NOVA answers questions about selecting, safety, pallets, and performance."}
        </p>

        {/* Activity log */}
        {log.length > 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">
              Activity Log
            </p>
            <div className="space-y-1 font-mono text-xs">
              {log.map((line, i) => (
                <div
                  key={i}
                  className={i === 0 ? "text-white" : "text-slate-500"}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
