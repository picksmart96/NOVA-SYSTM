import { useEffect } from "react";
import { useLocation } from "wouter";
import useNovaDemoVoiceAgent from "@/hooks/useNovaDemoVoiceAgent";
import { Mic, MicOff, Volume2, VolumeX, Globe, RefreshCw, MessageSquare, Zap } from "lucide-react";

function StatPill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-black ${highlight ? "text-yellow-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

export default function NovaDemoAgentPage() {
  const [, navigate] = useLocation();
  const agent = useNovaDemoVoiceAgent();

  useEffect(() => {
    return () => { agent.destroy(); };
  }, []);

  const langLabel = agent.language === "en" ? "English" : "Español";
  const otherLang = agent.language === "en" ? "es" : "en";
  const otherLangLabel = agent.language === "en" ? "Español" : "English";

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Banner */}
        <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/8 px-5 py-3 text-center text-yellow-300 text-sm font-semibold">
          Public Demo — NOVA Voice Agent · Separate from NOVA Help and NOVA Trainer
        </div>

        {/* Hero card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 sm:p-12 text-center shadow-2xl">
          <div className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 font-black text-2xl transition-all duration-300 ${
            agent.isSpeaking
              ? "border-purple-400 text-purple-300 shadow-[0_0_30px_rgba(168,85,247,0.3)]"
              : agent.isListening
              ? "border-yellow-400 text-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.25)]"
              : agent.isThinking
              ? "border-blue-400 text-blue-300 shadow-[0_0_20px_rgba(96,165,250,0.2)]"
              : "border-slate-700 text-slate-400"
          }`}>
            NOVA
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl font-black">NOVA Demo Agent</h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-300 text-base leading-relaxed">
            Ask anything about PickSmart Academy — selector training, safety, pallet building,
            coaching, motivation, or performance improvement.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={agent.initialize}
              disabled={agent.isListening || agent.isSpeaking}
              className="flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3.5 font-bold text-slate-950 hover:bg-yellow-300 transition disabled:opacity-50"
            >
              <Mic className="h-4 w-4" /> Start NOVA
            </button>

            <button
              onClick={agent.stopSpeaking}
              className="flex items-center gap-2 rounded-2xl border border-slate-700 px-6 py-3.5 font-semibold hover:border-yellow-400 transition"
            >
              <VolumeX className="h-4 w-4" /> Stop NOVA
            </button>

            <button
              onClick={() => agent.setLanguage(otherLang as "en" | "es")}
              className="flex items-center gap-2 rounded-2xl border border-slate-700 px-6 py-3.5 font-semibold hover:border-slate-500 transition"
            >
              <Globe className="h-4 w-4" /> {otherLangLabel}
            </button>
          </div>

          <p className="mt-5 text-slate-600 text-xs">
            Voice commands: "Stop NOVA", "Speak Spanish", "Speak English", "Reset conversation"
          </p>
        </div>

        {/* Status pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatPill label="State" value={agent.stateLabel} highlight />
          <StatPill label="Mic" value={agent.micPermission} />
          <StatPill label="Listening" value={agent.isListening ? "Yes" : "No"} />
          <StatPill label="Thinking" value={agent.isThinking ? "Yes" : "No"} />
          <StatPill label="Language" value={langLabel} />
        </div>

        {/* Last heard / last reply */}
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-black flex items-center gap-2 mb-4">
              <Mic className="h-4 w-4 text-slate-400" /> Last Heard
            </h2>
            <p className="min-h-[80px] rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-300 text-sm leading-relaxed">
              {agent.lastHeard || "Waiting for your question…"}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-black flex items-center gap-2 mb-4">
              <Volume2 className="h-4 w-4 text-yellow-400" /> Last Reply
            </h2>
            <p className="min-h-[80px] rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-300 text-sm leading-relaxed">
              {agent.lastReply || "NOVA will reply here."}
            </p>
          </div>
        </div>

        {/* Transcript */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-black flex items-center gap-2 mb-5">
            <MessageSquare className="h-4 w-4 text-slate-400" /> Conversation Transcript
          </h2>
          <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
            {agent.transcript.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-500 text-sm text-center">
                Conversation will appear here after you start NOVA and ask a question.
              </div>
            ) : (
              agent.transcript.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 ${
                    item.role === "assistant"
                      ? "border-yellow-400/25 bg-yellow-400/8 text-yellow-100"
                      : "border-slate-700 bg-slate-950 text-slate-300"
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1.5">
                    {item.role === "assistant" ? "NOVA" : "You"}
                  </p>
                  <p className="text-sm leading-relaxed">{item.text}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lead prompt */}
        {agent.showLeadPrompt && (
          <div className="rounded-3xl border border-yellow-400 bg-yellow-400/10 p-8 text-center">
            <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-2xl font-black text-yellow-200 mb-3">
              Want to see how this works for your team?
            </h3>
            <p className="mx-auto max-w-xl text-slate-200 text-sm leading-relaxed mb-6">
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
                Keep Exploring
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {agent.error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300 text-sm">
            {agent.error}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 pb-4">
          <button
            onClick={() => navigate("/demo")}
            className="rounded-2xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white hover:border-slate-500 transition"
          >
            ← Back to Demo
          </button>
          <button
            onClick={() => navigate("/checkout/company")}
            className="rounded-2xl border border-yellow-400/40 bg-yellow-400/10 px-5 py-2.5 text-sm font-bold text-yellow-400 hover:bg-yellow-400/20 transition"
          >
            Get Company Access →
          </button>
        </div>

      </div>
    </div>
  );
}
