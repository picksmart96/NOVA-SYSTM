import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import useNovaDemoVoiceAgent from "@/hooks/useNovaDemoVoiceAgent";
import {
  Mic, MicOff, VolumeX, Volume2, Globe, Send,
  Zap, Info, ChevronDown, ChevronUp,
} from "lucide-react";

const WELCOME_EN =
  "Hi, I'm NOVA — PickSmart Academy's public demo voice agent. I can answer any questions you have about warehouse training, selector coaching, safety, and performance improvement. What would you like to know?";
const WELCOME_ES =
  "Hola, soy NOVA — el agente de voz de demostración de PickSmart Academy. Puedo responder preguntas sobre capacitación, coaching de selectores, seguridad y mejora de rendimiento. ¿Qué te gustaría saber?";

const SUGGESTED = [
  "How does NOVA improve selector picking rates?",
  "What is voice-directed picking?",
  "How do you onboard new warehouse hires faster?",
  "What happens when a selector keeps mispicking?",
  "How does the trainer dashboard work?",
  "Do you support Spanish-speaking selectors?",
];

export default function NovaDemoAgentPage() {
  const [, navigate] = useLocation();
  const agent = useNovaDemoVoiceAgent();

  const [input, setInput] = useState("");
  const [showSuggested, setShowSuggested] = useState(true);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agent.transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { agent.destroy(); };
  }, []);

  // ── Tap to Activate — must be called from a click handler (user gesture) ──
  const handleActivate = () => {
    const welcome = agent.language === "es" ? WELCOME_ES : WELCOME_EN;
    agent.unlockAndSpeak(welcome);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || agent.isThinking) return;
    setInput("");
    setShowSuggested(false);
    await agent.sendText(text);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = async (text: string) => {
    if (agent.isThinking) return;
    setShowSuggested(false);
    await agent.sendText(text);
  };

  const startVoice = async () => {
    await agent.initialize();
  };

  const orbRing = agent.isSpeaking
    ? "border-purple-400 shadow-[0_0_60px_rgba(168,85,247,0.5),0_0_120px_rgba(168,85,247,0.15)]"
    : agent.isListening
    ? "border-yellow-400 shadow-[0_0_60px_rgba(250,204,21,0.5),0_0_120px_rgba(250,204,21,0.15)]"
    : agent.isThinking
    ? "border-blue-400 shadow-[0_0_40px_rgba(96,165,250,0.4)] animate-pulse"
    : agent.ttsEnabled
    ? "border-green-700 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
    : "border-slate-700";

  const orbPulse = agent.isListening || agent.isSpeaking || agent.isThinking;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* ── Header ── */}
      <header className="border-b border-slate-800/60 bg-slate-950/90 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-4xl px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="rounded-lg bg-yellow-400/15 border border-yellow-400/30 px-2.5 py-0.5 text-[11px] font-black text-yellow-400 tracking-widest uppercase">
                Public Demo
              </span>
              <h1 className="font-black text-lg text-white">NOVA Voice Agent</h1>
            </div>
            <p className="text-slate-600 text-[11px] mt-0.5 tracking-wide">
              Separate from NOVA Help &nbsp;·&nbsp; Separate from NOVA Trainer
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => agent.setLanguage(agent.language === "en" ? "es" : "en")}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-yellow-400 hover:text-yellow-400 transition"
            >
              <Globe className="h-3.5 w-3.5" />
              {agent.language === "en" ? "Español" : "English"}
            </button>
            <button
              onClick={() => navigate("/demo")}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              ← Demo
            </button>
          </div>
        </div>
      </header>

      {/* ── ACTIVATE VOICE OVERLAY — shown until user taps ── */}
      {!agent.ttsEnabled && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/95 backdrop-blur-sm px-6">
          <div className="max-w-md w-full text-center space-y-8">
            {/* Pulsing orb */}
            <div className="relative mx-auto w-36 h-36">
              <div className="absolute inset-0 rounded-full border-4 border-yellow-400/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border-4 border-yellow-400/20 animate-ping" style={{ animationDelay: "400ms" }} />
              <div className="relative flex h-full w-full items-center justify-center rounded-full border-4 border-yellow-400 bg-slate-950 shadow-[0_0_60px_rgba(250,204,21,0.4)]">
                <div className="text-center">
                  <p className="text-3xl font-black text-white">NOVA</p>
                  <p className="text-[10px] text-yellow-400 font-bold tracking-widest">VOICE AGENT</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white mb-2">
                {agent.language === "en" ? "Tap to hear NOVA speak" : "Toca para escuchar a NOVA"}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                {agent.language === "en"
                  ? "Browsers require a tap before playing audio. Tap the button below and NOVA will greet you out loud."
                  : "Los navegadores requieren una interacción antes de reproducir audio. Toca el botón y NOVA te saludará en voz alta."}
              </p>
            </div>

            <button
              onClick={handleActivate}
              className="w-full flex items-center justify-center gap-3 rounded-3xl bg-yellow-400 px-8 py-5 font-black text-slate-950 text-lg hover:bg-yellow-300 active:scale-95 transition shadow-[0_0_40px_rgba(250,204,21,0.3)]"
            >
              <Volume2 className="h-6 w-6" />
              {agent.language === "en" ? "Activate NOVA Voice" : "Activar voz de NOVA"}
            </button>

            <button
              onClick={() => {
                // Skip voice — just unlock without speaking so UI loads
                agent.unlockAndSpeak(" ");
              }}
              className="text-slate-600 text-sm hover:text-slate-400 transition underline"
            >
              {agent.language === "en" ? "Skip voice — text only" : "Sin voz — solo texto"}
            </button>
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 space-y-6">

        {/* NOVA orb + status */}
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            {orbPulse && (
              <div className={`absolute inset-0 rounded-full border-4 ${orbRing} animate-ping opacity-20`} />
            )}
            <div className={`relative flex h-32 w-32 items-center justify-center rounded-full border-4 bg-slate-950 transition-all duration-500 ${orbRing}`}>
              <div className="text-center">
                <p className="text-2xl font-black text-white">NOVA</p>
                <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-0.5">
                  {agent.isSpeaking ? "SPEAKING" : agent.isListening ? "LISTENING" : agent.isThinking ? "THINKING" : "READY"}
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="font-bold text-slate-200">
              {agent.isSpeaking
                ? "NOVA is speaking…"
                : agent.isListening
                ? "Listening — speak now"
                : agent.isThinking
                ? "NOVA is thinking…"
                : "Ready for your question"}
            </p>
            {agent.isSpeaking && (
              <button
                onClick={agent.stopSpeaking}
                className="mt-2 flex items-center gap-1.5 mx-auto rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition"
              >
                <VolumeX className="h-3.5 w-3.5" /> Stop speaking
              </button>
            )}
          </div>

          {/* Voice mic conversation toggle */}
          {agent.voiceSupported && agent.ttsEnabled && !agent.isListening && (
            <button
              onClick={startVoice}
              className="flex items-center gap-2.5 rounded-2xl bg-yellow-400 px-8 py-4 font-black text-slate-950 text-base hover:bg-yellow-300 active:scale-95 transition shadow-[0_0_30px_rgba(250,204,21,0.25)]"
            >
              <Mic className="h-5 w-5" /> Start Voice Conversation
            </button>
          )}
          {agent.isListening && (
            <button
              onClick={agent.stopSpeaking}
              className="flex items-center gap-2.5 rounded-2xl bg-red-500 px-8 py-4 font-black text-white text-base hover:bg-red-400 active:scale-95 transition"
            >
              <MicOff className="h-5 w-5" /> Stop Listening
            </button>
          )}
        </div>

        {/* ── Conversation panel ── */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">
          {/* Transcript */}
          <div className="overflow-y-auto px-5 py-5 space-y-3 max-h-[380px]">
            {agent.transcript.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Volume2 className="h-10 w-10 text-slate-800" />
                <p className="text-slate-600 text-sm">
                  NOVA's replies appear here — and she'll speak them aloud.
                </p>
              </div>
            ) : (
              agent.transcript.map((item) => (
                <div
                  key={item.id}
                  className={`flex gap-3 ${item.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border ${
                    item.role === "assistant"
                      ? "border-yellow-400/40 bg-yellow-400/15 text-yellow-400"
                      : "border-slate-600 bg-slate-800 text-slate-300"
                  }`}>
                    {item.role === "assistant" ? "N" : "Y"}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    item.role === "assistant"
                      ? "border border-yellow-400/15 bg-yellow-400/8 text-yellow-50"
                      : "border border-slate-700 bg-slate-950 text-slate-200"
                  }`}>
                    {item.text}
                  </div>
                </div>
              ))
            )}
            {agent.isThinking && (
              <div className="flex gap-3">
                <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border border-yellow-400/40 bg-yellow-400/15 text-yellow-400">N</div>
                <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/8 px-4 py-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Suggested questions */}
          <div className="border-t border-slate-800">
            <button
              onClick={() => setShowSuggested((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-3 text-xs font-bold text-slate-500 hover:text-slate-300 transition"
            >
              <span className="tracking-widest uppercase">Suggested questions</span>
              {showSuggested ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {showSuggested && (
              <div className="px-5 pb-4 flex flex-wrap gap-2">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestion(q)}
                    disabled={agent.isThinking}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 hover:border-yellow-400/50 hover:text-yellow-200 transition disabled:opacity-40"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text input */}
          <div className="border-t border-slate-800 p-4">
            <div className="flex gap-3 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={agent.language === "es" ? "Escríbele a NOVA…" : "Type your question for NOVA…"}
                disabled={agent.isThinking || !agent.ttsEnabled}
                className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400 placeholder:text-slate-600 disabled:opacity-50 transition"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || agent.isThinking || !agent.ttsEnabled}
                className="shrink-0 w-11 h-11 rounded-2xl bg-yellow-400 flex items-center justify-center text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-slate-700 text-xs mt-2">
              Press Enter to send · NOVA speaks every reply aloud
            </p>
          </div>
        </div>

        {/* Non-Chrome voice input notice */}
        {!agent.voiceSupported && agent.ttsEnabled && (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/50 px-5 py-4 flex items-start gap-3 text-sm text-slate-400">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-slate-500" />
            <span>
              <strong className="text-slate-300">Voice input</strong> requires Chrome or Edge. Text input works in all browsers — NOVA speaks every reply aloud.
            </span>
          </div>
        )}

        {/* Error */}
        {agent.error && (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/8 px-5 py-3 text-red-300 text-sm">
            {agent.error}
          </div>
        )}

        {/* Lead prompt */}
        {agent.showLeadPrompt && (
          <div className="rounded-3xl border border-yellow-400 bg-yellow-400/10 p-7 text-center">
            <Zap className="h-7 w-7 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-xl font-black text-yellow-200 mb-2">
              Want to bring NOVA to your warehouse?
            </h3>
            <p className="mx-auto max-w-lg text-slate-300 text-sm leading-relaxed mb-5">
              Request company access and we'll show you how PickSmart Academy trains,
              coaches, and improves performance for your entire team.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate("/checkout/company")}
                className="rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition"
              >
                Request Company Access
              </button>
              <button
                onClick={() => agent.setShowLeadPrompt(false)}
                className="rounded-2xl border border-slate-600 px-6 py-3 font-semibold text-slate-300 hover:border-slate-400 transition"
              >
                Keep Chatting
              </button>
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="flex flex-wrap justify-center gap-3 pb-4">
          <button
            onClick={() => navigate("/demo")}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white hover:border-slate-500 transition"
          >
            ← Back to Demo
          </button>
          <button
            onClick={() => navigate("/checkout/company")}
            className="rounded-xl border border-yellow-400/35 bg-yellow-400/8 px-4 py-2 text-sm font-bold text-yellow-400 hover:bg-yellow-400/15 transition"
          >
            Get Company Access →
          </button>
        </div>

      </main>
    </div>
  );
}
