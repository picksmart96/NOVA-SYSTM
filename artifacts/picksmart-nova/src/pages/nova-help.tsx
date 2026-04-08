import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import useVoiceEngine, { UseVoiceEngineReturn } from "@/hooks/useVoiceEngine";
import { askNovaHelp } from "@/lib/novaHelpApi";

const WAKE_WORDS = ["hey nova", "hola nova"];
const STOP_WORDS = ["stop", "parar", "detener"];

export default function NovaHelpPage() {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith("es");

  const [started, setStarted] = useState(false);
  const [awake, setAwake] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");
  const [prompt, setPrompt] = useState(
    isSpanish ? "Di Hola NOVA para activarme." : "Say Hey NOVA to wake me.",
  );

  // Ref so handleVoiceInput can access the latest voice object without stale closures
  const voiceRef = useRef<UseVoiceEngineReturn | null>(null);
  const awakeRef = useRef(false);

  const handleVoiceInput = async (heard: string) => {
    const v = voiceRef.current;
    if (!v) return;
    const text = heard.toLowerCase().trim();

    const wakeMatched = WAKE_WORDS.some((w) => text.includes(w));
    const stopMatched = STOP_WORDS.some((w) => text === w || text.includes(w));

    if (!awakeRef.current) {
      if (wakeMatched) {
        awakeRef.current = true;
        setAwake(true);
        const greeting = isSpanish
          ? "Hola. Soy NOVA. ¿Cómo puedo ayudarte con selección hoy?"
          : "Hi. I'm NOVA. How can I help you with selecting today?";
        setPrompt(greeting);
        v.speak(greeting, { after: "active" });
        return;
      }
      v.startWakeMode();
      return;
    }

    if (stopMatched) {
      awakeRef.current = false;
      setAwake(false);
      const stopText = isSpanish
        ? "NOVA detenida. Di Hola NOVA para activarme otra vez."
        : "NOVA stopped. Say Hey NOVA to wake me again.";
      setPrompt(stopText);
      v.speak(stopText, { after: "wake" });
      return;
    }

    if (wakeMatched) {
      const helloAgain = isSpanish
        ? "Estoy aquí. ¿Cómo puedo ayudarte?"
        : "I'm here. How can I help?";
      setPrompt(helloAgain);
      v.speak(helloAgain, { after: "active" });
      return;
    }

    setLastQuestion(text);
    setPrompt(isSpanish ? "Pensando..." : "Thinking...");

    try {
      const answer = await askNovaHelp(text, isSpanish ? "es" : "en");
      setPrompt(answer);
      v.speak(answer, { after: "active" });
    } catch {
      const fallback = isSpanish
        ? "Tuve un problema respondiendo. Pregúntame otra vez sobre selección, seguridad o tarimas."
        : "I had trouble answering that. Ask me again about selecting, safety, or pallets.";
      setPrompt(fallback);
      v.speak(fallback, { after: "active" });
    }
  };

  const voice = useVoiceEngine({
    lang: isSpanish ? "es-ES" : "en-US",
    onHeard: async (heard) => {
      await handleVoiceInput(heard);
    },
  });

  // Always sync the ref so handleVoiceInput always has the latest voice
  voiceRef.current = voice;

  const startNovaHelp = async () => {
    const ok = await voice.initialize();
    if (!ok) return;
    setStarted(true);
    awakeRef.current = false;
    setAwake(false);
    const intro = isSpanish
      ? "Ayuda NOVA iniciada. Di Hola NOVA para activarme."
      : "NOVA Help started. Say Hey NOVA to wake me.";
    setPrompt(intro);
    voice.speak(intro, { after: "wake" });
  };

  const stopNovaHelp = () => {
    voice.stopAll();
    setStarted(false);
    awakeRef.current = false;
    setAwake(false);
    setPrompt(isSpanish ? "Ayuda NOVA detenida." : "NOVA Help stopped.");
  };

  const retryMic = async () => {
    const ok = await voice.retryMic();
    if (!ok) return;
    setStarted(true);
    const wakeText = isSpanish
      ? "Di Hola NOVA para activarme."
      : "Say Hey NOVA to wake me.";
    setPrompt(wakeText);
    voice.speak(wakeText, { after: "wake" });
  };

  const stateLabel = voice.error
    ? "Error"
    : voice.speaking
      ? isSpanish ? "Hablando" : "Speaking"
      : voice.thinking
        ? isSpanish ? "Pensando" : "Thinking"
        : voice.status === "active_listening"
          ? isSpanish ? "Escuchando" : "Listening"
          : voice.status === "wake_listening"
            ? isSpanish ? "Esperando activación" : "Wake Listening"
            : awake
              ? isSpanish ? "Despierta" : "Awake"
              : isSpanish ? "Inactiva" : "Idle";

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center">
          <p className="text-yellow-400 text-sm font-semibold uppercase tracking-[0.22em]">
            {isSpanish ? "Pregunta a NOVA" : "Ask NOVA Anything"}
          </p>
          <h1 className="mt-3 text-5xl font-black">NOVA Help</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-3xl mx-auto">
            {isSpanish
              ? "Obtén ayuda inmediata sobre selección, seguridad y rendimiento."
              : "Get instant help with picking strategies, safety tips, and performance advice."}
          </p>
        </div>

        {/* Voice panel */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl text-center">
          <h2 className="text-2xl font-bold">
            {isSpanish ? "Asistente de voz para almacén" : "Warehouse Voice Coach"}
          </h2>
          <p className="mt-4 text-yellow-400 font-semibold">
            {isSpanish ? '"Hola NOVA" para activarme' : '"Hey NOVA" to wake me'}
          </p>
          <p className="mt-3 text-slate-300">
            {isSpanish
              ? 'Seguiré escuchando después de cada respuesta. Di "parar" para silenciarme.'
              : 'I\'ll keep listening after each answer. Say "stop" anytime to silence me.'}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {!started ? (
              <button
                onClick={startNovaHelp}
                className="rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition"
              >
                {isSpanish ? "Iniciar Ayuda NOVA" : "Start NOVA Help"}
              </button>
            ) : (
              <>
                <button
                  onClick={() => voice.startWakeMode()}
                  className="rounded-2xl border border-slate-700 px-6 py-3 font-semibold hover:border-yellow-400 transition"
                >
                  {isSpanish ? "Escuchar ahora" : "Listen Now"}
                </button>
                <button
                  onClick={stopNovaHelp}
                  className="rounded-2xl border border-red-500/30 px-6 py-3 font-semibold text-red-300 hover:bg-red-500/10 transition"
                >
                  {isSpanish ? "Detener" : "Stop"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error panel */}
        {voice.error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
            <p className="font-bold text-red-300">
              {isSpanish ? "Error de voz" : "Voice Error"}
            </p>
            <p className="mt-2 text-red-200">{voice.error}</p>
            <button
              onClick={retryMic}
              className="mt-4 rounded-2xl bg-yellow-400 px-5 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition"
            >
              {isSpanish ? "Reintentar micrófono" : "Retry Mic"}
            </button>
          </div>
        ) : null}

        {/* Status grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">{isSpanish ? "Estado" : "State"}</p>
            <p className="mt-3 text-2xl font-black">{stateLabel}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              {isSpanish ? "Última escucha" : "Last Heard"}
            </p>
            <p className="mt-3 text-lg font-semibold break-words">
              {voice.lastHeard || "—"}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              {isSpanish ? "Permiso de micrófono" : "Mic Permission"}
            </p>
            <p className="mt-3 text-lg font-semibold capitalize">
              {voice.micPermission}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              {isSpanish ? "Modo" : "Wake Mode"}
            </p>
            <p className="mt-3 text-lg font-semibold">
              {awake
                ? isSpanish ? "Hola NOVA activa" : "Hey NOVA Active"
                : isSpanish ? "Esperando" : "Waiting"}
            </p>
          </div>
        </div>

        {/* Current prompt + last question */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <h3 className="text-2xl font-bold">
              {isSpanish ? "Respuesta actual" : "Current Prompt"}
            </h3>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-slate-200 text-lg">{prompt}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <h3 className="text-2xl font-bold">
              {isSpanish ? "Última pregunta" : "Last Question"}
            </h3>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-slate-200 text-lg">{lastQuestion || "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
