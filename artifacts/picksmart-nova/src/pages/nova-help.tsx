import { useState, useCallback, useRef, useEffect } from "react";
import { useVoiceEngine, UseVoiceEngineReturn } from "@/hooks/useVoiceEngine";
import { askNovaHelp } from "@/lib/novaHelpApi";
import { useTranslation } from "react-i18next";
import { Mic, MicOff, StopCircle } from "lucide-react";

// ── Voice state pulse ring ──────────────────────────────────────────────────
function PulseRing({ active, color }: { active: boolean; color: string }) {
  if (!active) return null;
  return (
    <span
      className={`absolute inset-0 rounded-full animate-ping opacity-30 ${color}`}
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NovaHelpPage() {
  const { t, i18n } = useTranslation();

  const [opened, setOpened] = useState(false);
  const [awake, setAwake] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [thinking, setThinking] = useState(false);
  const [micError, setMicError] = useState("");

  const voiceRef = useRef<UseVoiceEngineReturn | null>(null);
  const awakeRef = useRef(false);
  awakeRef.current = awake;

  const speakAndListen = useCallback((text: string) => {
    setCurrentPrompt(text);
    voiceRef.current?.askAndListen(text);
  }, []);

  const handleVoiceInput = useCallback(
    async (heard: string) => {
      const text = heard.toLowerCase().trim();
      if (!text) return;

      // Stop command — silence but keep listening for wake word
      if (
        text.includes("stop") ||
        text.includes("parar") ||
        text.includes("detener")
      ) {
        setAwake(false);
        const bye = t("novaHelp.novaStopped");
        setCurrentPrompt(bye);
        voiceRef.current?.speak(bye, { restartAfterSpeak: true });
        return;
      }

      // Wake word
      if (text.includes("hey nova") || text.includes("hola nova")) {
        if (!awakeRef.current) {
          setAwake(true);
          speakAndListen(t("novaHelp.heyNovaGreeting"));
        } else {
          speakAndListen(t("novaHelp.iAmHere"));
        }
        return;
      }

      // Not awake — wait for wake word silently
      if (!awakeRef.current) {
        voiceRef.current?.startListening();
        return;
      }

      // Awake — answer the question
      setLastQuestion(heard);
      setCurrentPrompt(t("novaHelp.thinking"));
      setThinking(true);

      try {
        const answer = await askNovaHelp(text, i18n.language);
        setThinking(false);
        speakAndListen(answer);
      } catch {
        setThinking(false);
        speakAndListen(t("novaHelp.fallback"));
      }
    },
    [speakAndListen, t, i18n.language]
  );

  const voice = useVoiceEngine({
    onHeard: handleVoiceInput,
    autoRestart: true,
    silencePrompt: "",
  });

  voiceRef.current = voice;

  // Derived state
  const voiceState: "Listening" | "Speaking" | "Thinking" | "Awake" | "Idle" =
    thinking
      ? "Thinking"
      : voice.listening
      ? "Listening"
      : voice.speaking
      ? "Speaking"
      : awake
      ? "Awake"
      : "Idle";

  // ── Open NOVA — the single required tap ──────────────────────────────────
  const openNova = async () => {
    setMicError("");
    const ok = await voice.initialize();
    if (!ok) {
      setMicError(
        voice.error ||
          "Microphone access was denied. Please allow mic access and try again."
      );
      return;
    }
    setOpened(true);
    const intro = t("novaHelp.started");
    setCurrentPrompt(intro);
    voice.askAndListen(intro);
  };

  const stopNova = () => {
    voice.stopListening();
    try { window.speechSynthesis?.cancel(); } catch {}
    setOpened(false);
    setAwake(false);
    setCurrentPrompt("");
    setLastQuestion("");
  };

  // Cleanup on unmount
  useEffect(() => () => { voice.shutdown(); }, []);

  // ── LANDING STATE ──────────────────────────────────────────────────────────
  if (!opened) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg text-center space-y-8">

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
              Ask NOVA{" "}
              <span className="text-yellow-400">Anything</span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg max-w-md mx-auto">
              Get instant help with picking strategies, safety tips, and
              performance advice
            </p>
          </div>

          {/* Card */}
          <div className="rounded-[28px] border border-slate-800 bg-slate-900 p-7 sm:p-9 shadow-2xl text-center space-y-5">

            {/* Icon */}
            <div className="relative inline-flex items-center justify-center">
              <div className="h-16 w-16 rounded-2xl bg-yellow-400 flex items-center justify-center">
                <Mic className="h-8 w-8 text-slate-950" />
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-yellow-400 text-xs font-semibold uppercase tracking-[0.24em]">
                NOVA Help
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Say &quot;Hey NOVA&quot; to wake me
              </h2>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
              Say{" "}
              <span className="text-yellow-300 font-semibold">&quot;Hey NOVA&quot;</span>{" "}
              to wake me up. I&apos;ll keep listening after each answer. Say{" "}
              <span className="text-red-300 font-semibold">&quot;stop&quot;</span>{" "}
              anytime to silence me.
            </p>

            <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-500">
              <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
                &quot;Hey NOVA&quot; to wake
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
                &quot;stop&quot; to silence
              </span>
            </div>

            {micError && (
              <p className="text-red-300 text-sm font-semibold">{micError}</p>
            )}

            <button
              onClick={openNova}
              className="w-full rounded-2xl bg-yellow-400 px-6 py-4 text-lg font-bold text-slate-950 hover:bg-yellow-300 active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <Mic className="h-5 w-5" />
              Open NOVA
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE STATE ───────────────────────────────────────────────────────────
  const ringColor =
    voiceState === "Listening"
      ? "bg-green-400"
      : voiceState === "Speaking"
      ? "bg-yellow-400"
      : voiceState === "Thinking"
      ? "bg-blue-400"
      : "bg-slate-500";

  const stateColor =
    voiceState === "Listening"
      ? "text-green-300"
      : voiceState === "Speaking"
      ? "text-yellow-300"
      : voiceState === "Thinking"
      ? "text-blue-300"
      : awake
      ? "text-yellow-200"
      : "text-slate-400";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">

        {/* State card */}
        <div className="rounded-[28px] border border-slate-800 bg-slate-900 p-7 sm:p-9 shadow-2xl text-center space-y-6">

          {/* Pulse mic icon */}
          <div className="relative inline-flex items-center justify-center mx-auto">
            <PulseRing active={voiceState === "Listening"} color="bg-green-400" />
            <PulseRing active={voiceState === "Speaking"} color="bg-yellow-400" />
            <div
              className={`relative h-16 w-16 rounded-2xl flex items-center justify-center transition-colors ${
                voiceState === "Listening"
                  ? "bg-green-500/20 border border-green-500/30"
                  : voiceState === "Speaking"
                  ? "bg-yellow-400/20 border border-yellow-400/30"
                  : voiceState === "Thinking"
                  ? "bg-blue-500/20 border border-blue-500/30"
                  : "bg-slate-800 border border-slate-700"
              }`}
            >
              {voice.error ? (
                <MicOff className="h-7 w-7 text-red-400" />
              ) : (
                <Mic className={`h-7 w-7 ${stateColor}`} />
              )}
            </div>
          </div>

          {/* Status label */}
          <div>
            <p className={`text-sm font-bold uppercase tracking-widest ${stateColor}`}>
              {voiceState === "Listening"
                ? "Listening…"
                : voiceState === "Speaking"
                ? "Speaking…"
                : voiceState === "Thinking"
                ? "Thinking…"
                : awake
                ? "Awake — Ask anything"
                : 'Say "Hey NOVA" to wake me'}
            </p>
          </div>

          {/* NOVA says */}
          {currentPrompt && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-left">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">
                NOVA says
              </p>
              <p className="text-white text-base font-semibold leading-relaxed">
                {currentPrompt}
              </p>
            </div>
          )}

          {/* You asked */}
          {lastQuestion && (
            <div className="rounded-2xl border border-slate-700 bg-slate-950 px-5 py-3 text-left">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">
                You asked
              </p>
              <p className="text-slate-300 text-sm">{lastQuestion}</p>
            </div>
          )}

          {/* Mic error */}
          {voice.error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 font-semibold">
              {voice.error}
            </div>
          )}

          {/* Stop button */}
          <button
            onClick={stopNova}
            className="w-full rounded-2xl border border-slate-700 px-6 py-3 text-sm font-bold text-slate-300 hover:border-red-500/40 hover:text-red-300 transition flex items-center justify-center gap-2"
          >
            <StopCircle className="h-4 w-4" />
            Stop NOVA
          </button>
        </div>

        {/* Hints */}
        <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-600">
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            &quot;Hey NOVA&quot; to wake
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            &quot;stop&quot; to silence
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            AI-powered answers
          </span>
        </div>
      </div>
    </div>
  );
}
