import { useState, useCallback, useRef, useEffect } from "react";
import { useVoiceEngine, UseVoiceEngineReturn } from "@/hooks/useVoiceEngine";
import { askNovaHelp } from "@/lib/novaHelpApi";
import { useTranslation } from "react-i18next";
import { Mic, MicOff, StopCircle, RefreshCw } from "lucide-react";

export default function NovaHelpPage() {
  const { t, i18n } = useTranslation();

  const [ready, setReady] = useState(false);
  const [awake, setAwake] = useState(false);
  const [novaText, setNovaText] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [thinking, setThinking] = useState(false);

  const voiceRef = useRef<UseVoiceEngineReturn | null>(null);
  const awakeRef = useRef(false);
  awakeRef.current = awake;

  const speakAndListen = useCallback((text: string) => {
    setNovaText(text);
    voiceRef.current?.askAndListen(text);
  }, []);

  const handleVoiceInput = useCallback(
    async (heard: string) => {
      const text = heard.toLowerCase().trim();
      if (!text) return;

      if (text.includes("stop") || text.includes("parar") || text.includes("detener")) {
        setAwake(false);
        const bye = t("novaHelp.novaStopped");
        setNovaText(bye);
        voiceRef.current?.speak(bye, { restartAfterSpeak: true });
        return;
      }

      if (text.includes("hey nova") || text.includes("hola nova")) {
        setAwake(true);
        speakAndListen(awakeRef.current ? t("novaHelp.iAmHere") : t("novaHelp.heyNovaGreeting"));
        return;
      }

      if (!awakeRef.current) {
        voiceRef.current?.startListening();
        return;
      }

      setLastQuestion(heard);
      setNovaText(t("novaHelp.thinking"));
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

  useEffect(() => () => { voice.shutdown(); }, []);

  const tap = async () => {
    if (ready) {
      voice.startListening();
      return;
    }
    const ok = await voice.initialize();
    if (!ok) return;
    setReady(true);
    setNovaText(t("novaHelp.started"));
    voice.askAndListen(t("novaHelp.started"));
  };

  const stop = () => {
    voice.stopListening();
    try { window.speechSynthesis?.cancel(); } catch {}
    setReady(false);
    setAwake(false);
    setNovaText("");
    setLastQuestion("");
  };

  // ── Derived visual state ───────────────────────────────────────────────────
  const isListening = voice.listening;
  const isSpeaking  = voice.speaking;
  const isThinking  = thinking || voice.processing;

  const ringClass = isListening
    ? "ring-green-400/60"
    : isSpeaking
    ? "ring-yellow-400/60"
    : isThinking
    ? "ring-blue-400/60"
    : awake
    ? "ring-yellow-400/30"
    : "ring-slate-700";

  const iconColor = isListening
    ? "text-green-300"
    : isSpeaking
    ? "text-yellow-300"
    : isThinking
    ? "text-blue-300"
    : voice.error
    ? "text-red-400"
    : ready
    ? "text-yellow-200"
    : "text-slate-400";

  const statusLabel = isThinking
    ? "Thinking…"
    : isListening
    ? "Listening…"
    : isSpeaking
    ? "Speaking…"
    : awake
    ? "Awake — ask anything"
    : ready
    ? "Say \"Hey NOVA\" to wake me"
    : "Tap mic to start";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12 text-white">
      <div className="w-full max-w-md flex flex-col items-center gap-8">

        {/* ── Mic button ── */}
        <button
          onClick={tap}
          className={`relative flex items-center justify-center h-28 w-28 rounded-full ring-4 transition-all duration-300 ${ringClass} ${
            ready ? "bg-slate-900" : "bg-slate-900 hover:bg-slate-800"
          }`}
          aria-label={statusLabel}
        >
          {/* Pulse rings */}
          {(isListening || isSpeaking) && (
            <span className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
              isListening ? "bg-green-400" : "bg-yellow-400"
            }`} />
          )}
          {voice.error
            ? <MicOff className={`h-12 w-12 ${iconColor}`} />
            : <Mic className={`h-12 w-12 ${iconColor}`} />
          }
        </button>

        {/* ── Status label ── */}
        <p className={`text-sm font-semibold uppercase tracking-widest text-center ${
          isListening ? "text-green-400"
          : isSpeaking ? "text-yellow-400"
          : isThinking ? "text-blue-400"
          : awake ? "text-yellow-300"
          : "text-slate-500"
        }`}>
          {statusLabel}
        </p>

        {/* ── NOVA says ── */}
        {novaText && (
          <div className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-6 py-5">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">NOVA says</p>
            <p className="text-white text-base sm:text-lg font-semibold leading-relaxed">
              {novaText}
            </p>
          </div>
        )}

        {/* ── You asked ── */}
        {lastQuestion && (
          <div className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">You asked</p>
            <p className="text-slate-300 text-sm">{lastQuestion}</p>
          </div>
        )}

        {/* ── Mic error ── */}
        {voice.error && (
          <div className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4">
            <p className="text-red-300 text-sm font-semibold mb-3">{voice.error}</p>
            <button
              onClick={async () => { await voice.retryMic(); voice.startListening(); }}
              className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-yellow-300 transition flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Retry mic
            </button>
          </div>
        )}

        {/* ── Stop button (only when active) ── */}
        {ready && (
          <button
            onClick={stop}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-300 transition"
          >
            <StopCircle className="h-4 w-4" /> Stop NOVA
          </button>
        )}

        {/* ── Hint badges ── */}
        {ready && (
          <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-600">
            <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
              "Hey NOVA" to wake
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
              "stop" to silence
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
