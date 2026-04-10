import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import useNovaDemoVoiceAgent from "@/hooks/useNovaDemoVoiceAgent";
import { Send, Mic, MicOff, VolumeX, Globe, Zap, MessageSquare, Info } from "lucide-react";

const SUGGESTED = [
  "How does NOVA help selectors improve their rate?",
  "What is voice-directed picking?",
  "How do you train new warehouse hires faster?",
  "What happens when a selector keeps making mispicks?",
  "How does the trainer dashboard work?",
  "Do you support Spanish-speaking selectors?",
];

export default function NovaDemoAgentPage() {
  const [, navigate] = useLocation();
  const agent = useNovaDemoVoiceAgent();

  const [input, setInput] = useState("");
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

  const handleSend = async () => {
    const text = input.trim();
    if (!text || agent.isThinking) return;
    setInput("");
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
    await agent.sendText(text);
  };

  const orbColor = agent.isSpeaking
    ? "border-purple-400 text-purple-300 shadow-[0_0_30px_rgba(168,85,247,0.3)]"
    : agent.isListening
    ? "border-yellow-400 text-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.25)]"
    : agent.isThinking
    ? "border-blue-400 text-blue-300 shadow-[0_0_20px_rgba(96,165,250,0.2)] animate-pulse"
    : "border-slate-700 text-slate-400";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-5">

        {/* Top banner */}
        <div className="rounded-2xl border border-yellow-400/25 bg-yellow-400/8 px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-yellow-300 text-sm font-semibold">
            NOVA Demo Agent — Ask anything about PickSmart Academy
          </p>
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

        {/* NOVA orb + status strip */}
        <div className="flex items-center gap-5 rounded-3xl border border-slate-800 bg-slate-900 px-7 py-5">
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 text-sm font-black transition-all duration-300 ${orbColor}`}>
            NOVA
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-lg text-white">
              {agent.isThinking
                ? "Thinking…"
                : agent.isSpeaking
                ? "Speaking…"
                : agent.isListening
                ? "Listening…"
                : "Ready to answer your questions"}
            </p>
            <p className="text-slate-500 text-sm mt-0.5">
              {agent.transcript.length === 0
                ? "Type a question below or try a suggestion to get started."
                : `${agent.transcript.length} message${agent.transcript.length !== 1 ? "s" : ""} in conversation`}
            </p>
          </div>
          {/* Voice controls — only if supported */}
          {agent.voiceSupported && (
            <div className="flex items-center gap-2 shrink-0">
              {!agent.isListening ? (
                <button
                  onClick={agent.initialize}
                  title="Start voice mode (Chrome only)"
                  className="flex items-center gap-1.5 rounded-xl bg-yellow-400/15 border border-yellow-400/30 px-3 py-2 text-xs font-bold text-yellow-400 hover:bg-yellow-400/25 transition"
                >
                  <Mic className="h-3.5 w-3.5" /> Voice
                </button>
              ) : (
                <button
                  onClick={agent.stopSpeaking}
                  className="flex items-center gap-1.5 rounded-xl bg-red-500/15 border border-red-500/30 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/25 transition"
                >
                  <VolumeX className="h-3.5 w-3.5" /> Stop
                </button>
              )}
            </div>
          )}
        </div>

        {/* Conversation area */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 flex flex-col overflow-hidden" style={{ minHeight: "400px" }}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 max-h-[480px]">
            {agent.transcript.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
                <MessageSquare className="h-10 w-10 text-slate-700" />
                <div>
                  <p className="text-slate-500 font-semibold">Ask NOVA anything</p>
                  <p className="text-slate-600 text-sm mt-1">
                    Training, safety, pallet building, coaching, rate improvement, and more.
                  </p>
                </div>
              </div>
            ) : (
              agent.transcript.map((item) => (
                <div
                  key={item.id}
                  className={`flex gap-3 ${item.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border ${
                    item.role === "assistant"
                      ? "border-yellow-400/40 bg-yellow-400/15 text-yellow-400"
                      : "border-slate-600 bg-slate-700 text-slate-300"
                  }`}>
                    {item.role === "assistant" ? "N" : "Y"}
                  </div>
                  <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    item.role === "assistant"
                      ? "border border-yellow-400/20 bg-yellow-400/8 text-yellow-50"
                      : "border border-slate-700 bg-slate-950 text-slate-200"
                  }`}>
                    {item.text}
                  </div>
                </div>
              ))
            )}
            {agent.isThinking && (
              <div className="flex gap-3">
                <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border border-yellow-400/40 bg-yellow-400/15 text-yellow-400">N</div>
                <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/8 px-4 py-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Suggested questions */}
          {agent.transcript.length === 0 && (
            <div className="border-t border-slate-800 px-5 py-4">
              <p className="text-xs text-slate-600 font-bold uppercase tracking-widest mb-3">Suggested questions</p>
              <div className="flex flex-wrap gap-2">
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
            </div>
          )}

          {/* Text input */}
          <div className="border-t border-slate-800 p-4">
            <div className="flex gap-3 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={agent.language === "es" ? "Escríbele a NOVA…" : "Ask NOVA anything…"}
                disabled={agent.isThinking}
                className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400 placeholder:text-slate-600 disabled:opacity-50 transition"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || agent.isThinking}
                className="shrink-0 w-11 h-11 rounded-2xl bg-yellow-400 flex items-center justify-center text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-slate-700 text-xs mt-2 text-center">
              Press Enter to send · {agent.voiceSupported ? "Voice available — click Voice button above" : "Text mode (voice requires Chrome)"}
            </p>
          </div>
        </div>

        {/* Voice not supported notice for non-Chrome */}
        {!agent.voiceSupported && (
          <div className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-4 flex items-start gap-3 text-sm text-slate-400">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-slate-500" />
            <span>
              <strong className="text-slate-300">Voice mode</strong> requires Chrome or a Chromium-based browser.
              All questions and answers work perfectly through the text input above.
            </span>
          </div>
        )}

        {/* Mic denied notice */}
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
              Want to bring this to your team?
            </h3>
            <p className="mx-auto max-w-lg text-slate-300 text-sm leading-relaxed mb-5">
              Request company access and we'll show you how PickSmart Academy can train, coach,
              and improve performance for your entire warehouse team.
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

        {/* Footer */}
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

      </div>
    </div>
  );
}
