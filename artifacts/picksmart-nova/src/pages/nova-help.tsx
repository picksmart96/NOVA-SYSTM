import { useState, useCallback, useRef } from "react";
import { useVoiceEngine, UseVoiceEngineReturn } from "@/hooks/useVoiceEngine";
import { askNovaHelp } from "@/lib/novaHelpApi";
import { useTranslation } from "react-i18next";
import {
  Headphones, Mic,
  Radio, StopCircle, RefreshCw,
} from "lucide-react";

// ── Voice state badge ─────────────────────────────────────────────────────────

function VoiceBadge({ state }: { state: string }) {
  const cls: Record<string, string> = {
    Listening: "bg-green-500/20 text-green-300 border-green-500/30",
    Speaking:  "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    Thinking:  "bg-blue-500/20 text-blue-300 border-blue-500/30",
    Awake:     "bg-yellow-400/20 text-yellow-300 border-yellow-400/30",
    Stopped:   "bg-red-500/20 text-red-300 border-red-500/30",
    Idle:      "bg-slate-700/40 text-slate-400 border-slate-700",
  };
  const dot: Record<string, string> = {
    Listening: "bg-green-400",
    Speaking:  "bg-yellow-400",
    Thinking:  "bg-blue-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold ${cls[state] ?? cls.Idle}`}>
      {dot[state] && <span className={`h-2 w-2 rounded-full animate-pulse ${dot[state]}`} />}
      {state}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NovaHelpPage() {
  const { t, i18n } = useTranslation();

  const TOPICS = t("novaHelp.topicsList", { returnObjects: true }) as string[];


  const [started, setStarted] = useState(false);
  const [awake, setAwake] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(t("novaHelp.tapToBegin"));
  const [lastQuestion, setLastQuestion] = useState("");
  const [thinking, setThinking] = useState(false);

  const voiceRef = useRef<UseVoiceEngineReturn | null>(null);
  const awakeRef = useRef(false);
  awakeRef.current = awake;

  const speakAndListen = useCallback((text: string) => {
    setCurrentPrompt(text);
    voiceRef.current?.askAndListen(text);
  }, []);

  const handleVoiceInput = useCallback(async (heard: string) => {
    const text = heard.toLowerCase().trim();
    if (!text) return;

    if (!awakeRef.current) {
      if (text.includes("hey nova") || text.includes("hola nova")) {
        setAwake(true);
        const greeting = t("novaHelp.heyNovaGreeting");
        speakAndListen(greeting);
        return;
      }
      voiceRef.current?.askAndListen(t("novaHelp.sayHeyNova"));
      return;
    }

    if (text.includes("stop") || text.includes("parar") || text.includes("detener")) {
      setAwake(false);
      const bye = t("novaHelp.novaStopped");
      setCurrentPrompt(bye);
      voiceRef.current?.speak(bye, { restartAfterSpeak: true });
      return;
    }

    if (text.includes("hey nova") || text.includes("hola nova")) {
      speakAndListen(t("novaHelp.iAmHere"));
      return;
    }

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
  }, [speakAndListen, t, i18n.language]);

  const voice = useVoiceEngine({
    onHeard: handleVoiceInput,
    autoRestart: true,
    silencePrompt: t("novaHelp.sayHeyNova"),
  });

  voiceRef.current = voice;

  const voiceState = thinking
    ? "Thinking"
    : voice.listening  ? "Listening"
    : voice.speaking   ? "Speaking"
    : voice.processing ? "Thinking"
    : awake            ? "Awake"
    : "Idle";

  const startNovaHelp = async () => {
    const ok = await voice.initialize();
    if (!ok) return;
    setStarted(true);
    const intro = t("novaHelp.started");
    setCurrentPrompt(intro);
    voice.askAndListen(intro);
  };

  const stopNovaHelp = () => {
    voice.stopListening();
    setAwake(false);
    setStarted(false);
    setCurrentPrompt(t("novaHelp.stopped"));
  };

  const retryMic = async () => {
    const ok = await voice.retryMic();
    if (!ok) return;
    voice.askAndListen(currentPrompt || t("novaHelp.sayHeyNova"));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Hero */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-4 sm:px-6 py-10 sm:py-14 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-yellow-400 mb-4 sm:mb-5">
          <Headphones className="h-7 w-7 sm:h-8 sm:w-8 text-slate-950" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 sm:mb-3">{t("novaHelp.title")}</h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
          {t("novaHelp.subtitle")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 justify-center text-xs sm:text-sm text-slate-500">
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">{t("novaHelp.wakePhrase")}</span>
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">{t("novaHelp.stopPhrase")}</span>
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">{t("novaHelp.aiPowered")}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-8 sm:py-12 space-y-12 sm:space-y-14">

        {/* Voice AI Coach */}
        <section>
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <Radio className="h-5 w-5 text-yellow-400" /> {t("novaHelp.voiceAiCoach")}
          </h2>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-8 shadow-2xl">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-slate-400 text-sm mb-1">{t("novaHelp.novaIs")}</p>
                <VoiceBadge state={voiceState} />
              </div>
              <div className="flex flex-wrap gap-2">
                {!started ? (
                  <button
                    onClick={startNovaHelp}
                    className="rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition flex items-center gap-2"
                  >
                    <Mic className="h-4 w-4" /> {t("novaHelp.startNovaHelp")}
                  </button>
                ) : (
                  <button
                    onClick={stopNovaHelp}
                    className="rounded-2xl border border-red-500/30 px-5 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/10 transition flex items-center gap-2"
                  >
                    <StopCircle className="h-4 w-4" /> {t("novaHelp.stop")}
                  </button>
                )}
              </div>
            </div>

            {/* NOVA says */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5 mb-4">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">{t("novaHelp.novaSays")}</p>
              <p className="text-white text-base sm:text-lg font-semibold leading-relaxed">{currentPrompt}</p>
            </div>

            {/* Last heard */}
            {lastQuestion && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{t("novaHelp.youAsked")}</p>
                <p className="text-slate-300 text-sm">{lastQuestion}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-sm text-slate-500">
              <span className="px-3 py-1 rounded-full bg-slate-800">{t("novaHelp.wakeMe")}</span>
              <span className="px-3 py-1 rounded-full bg-slate-800">{t("novaHelp.silenceMe")}</span>
            </div>
          </div>

          {voice.error && (
            <div className="mt-4 rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
              <p className="font-bold text-red-300">{t("novaHelp.micError")}</p>
              <p className="mt-2 text-red-200 text-sm">{voice.error}</p>
              <button
                onClick={retryMic}
                className="mt-3 rounded-2xl bg-yellow-400 px-5 py-2.5 font-bold text-slate-950 hover:bg-yellow-300 transition flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" /> {t("novaHelp.retryMic")}
              </button>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs text-slate-400 mb-2">{t("novaHelp.heard")}</p>
              <p className="font-semibold text-white text-sm break-words line-clamp-2">{voice.lastHeard || "—"}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs text-slate-400 mb-2">{t("novaHelp.mic")}</p>
              <p className="font-semibold text-white text-sm capitalize">{voice.micPermission}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 col-span-2 sm:col-span-1">
              <p className="text-xs text-slate-400 mb-2">{t("novaHelp.awake")}</p>
              <p className={`font-semibold text-sm ${awake ? "text-yellow-400" : "text-slate-500"}`}>
                {awake ? t("novaHelp.awakeYes") : t("novaHelp.awakeNo")}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
            <h3 className="text-base font-black text-white mb-4">{t("novaHelp.topics")}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {Array.isArray(TOPICS) && TOPICS.map((item) => (
                <div key={item} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-300 text-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>


      </div>
    </div>
  );
}
