import { useState, useCallback, useRef } from "react";
import { VOICE_COMMANDS } from "@/data/voiceCommands";
import { SYSTEM_DEFAULTS } from "@/data/systemDefaults";
import { DOOR_CODES } from "@/data/doorCodes";
import { useVoiceEngine, UseVoiceEngineReturn } from "@/hooks/useVoiceEngine";
import { askNovaHelp } from "@/lib/novaHelpApi";
import {
  Headphones, Search, Mic, AlertTriangle, BookOpen, Zap,
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

// ── FAQ data ──────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "What is a check code?",
    a: "A check code is a 3-digit number assigned to each slot location. NOVA says the aisle and slot, and you say back the check code displayed on the slot label. This confirms you're picking from the correct location.",
  },
  {
    q: "What if NOVA says 'Invalid'?",
    a: "You entered the wrong check code. NOVA will repeat the aisle and slot. Look at the slot label again and enter the correct 3-digit code. NOVA will loop until you get it right — you cannot skip a slot without the correct code.",
  },
  {
    q: "How does pallet setup work?",
    a: "At the start of every assignment, NOVA guides you through positioning your pallets. Alpha pallet goes first. If your assignment has 2 pallets, you'll also set up Bravo. Use CHEP pallets from the stack.",
  },
  {
    q: "What do I do when I finish picking?",
    a: `After the last case, NOVA gives you your completion instructions: go to Printer ${SYSTEM_DEFAULTS.printerNumber}, apply label ${SYSTEM_DEFAULTS.alphaLabelNumber} to Alpha pallet, apply label ${SYSTEM_DEFAULTS.bravoLabelNumber} to Bravo pallet, then deliver to your door number.`,
  },
  {
    q: "What does my performance percent mean?",
    a: "Your performance percent compares your actual rate to the warehouse goal rate. 100% means you're exactly on goal. Above 100% means you're ahead. Below 100% means you need to pick up pace.",
  },
  {
    q: "What is a short pick?",
    a: "When a slot doesn't have enough product to fill your order, say 'short' and NOVA will log it and move you to the next stop. Report shortages to your supervisor at the end of your shift.",
  },
];

const TOPICS = [
  "Pallet building", "Stacking", "Rate improvement", "Short pick",
  "Over pick", "Mispick", "Safety", "Hydration",
  "Pallet jack handling", "Door staging", "Labels", "Check codes",
  "Ergonomics", "Walking pace", "Beginner mindset", "Batch complete",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NovaHelpPage() {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [started, setStarted] = useState(false);
  const [awake, setAwake] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("Tap 'Start NOVA Help' to begin.");
  const [lastQuestion, setLastQuestion] = useState("");
  const [thinking, setThinking] = useState(false);

  // Use a ref so the onHeard callback always has access to the latest voice functions
  // without capturing a stale closure reference from render time
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
      if (text.includes("hey nova")) {
        setAwake(true);
        speakAndListen("Hey. I'm NOVA. Ask me anything about selecting.");
        return;
      }
      voiceRef.current?.askAndListen("Say Hey NOVA to wake me.");
      return;
    }

    if (text.includes("stop")) {
      setAwake(false);
      const bye = "NOVA stopped. Say Hey NOVA to wake me again.";
      setCurrentPrompt(bye);
      voiceRef.current?.speak(bye, { restartAfterSpeak: true });
      return;
    }

    if (text.includes("hey nova")) {
      speakAndListen("I'm here. Ask your question.");
      return;
    }

    setLastQuestion(heard);
    setCurrentPrompt("Thinking…");
    setThinking(true);

    try {
      const answer = await askNovaHelp(text);
      setThinking(false);
      speakAndListen(answer);
    } catch {
      setThinking(false);
      speakAndListen("I had trouble with that. Ask again about selecting, safety, or pallet building.");
    }
  }, [speakAndListen]);

  const voice = useVoiceEngine({
    onHeard: handleVoiceInput,
    autoRestart: true,
    silencePrompt: "No input received.",
  });

  // Keep the ref up to date every render
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
    const intro = "NOVA Help started. Say Hey NOVA to wake me.";
    setCurrentPrompt(intro);
    voice.askAndListen(intro);
  };

  const stopNovaHelp = () => {
    voice.stopListening();
    setAwake(false);
    setStarted(false);
    setCurrentPrompt("NOVA Help stopped.");
  };

  const retryMic = async () => {
    const ok = await voice.retryMic();
    if (!ok) return;
    voice.askAndListen(currentPrompt || "Say Hey NOVA to wake me.");
  };

  const filteredCommands = VOICE_COMMANDS.filter(
    (c) =>
      c.phrase.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Hero */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-4 sm:px-6 py-10 sm:py-14 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-yellow-400 mb-4 sm:mb-5">
          <Headphones className="h-7 w-7 sm:h-8 sm:w-8 text-slate-950" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 sm:mb-3">NOVA Help Center</h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
          Ask NOVA anything about warehouse selecting — voice-powered, AI-backed, hands-free.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 justify-center text-xs sm:text-sm text-slate-500">
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">"Hey NOVA" to wake</span>
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">"stop" to silence</span>
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">AI-powered answers</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-8 sm:py-12 space-y-12 sm:space-y-14">

        {/* Voice AI Coach */}
        <section>
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <Radio className="h-5 w-5 text-yellow-400" /> Voice AI Coach
          </h2>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-8 shadow-2xl">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-slate-400 text-sm mb-1">NOVA is</p>
                <VoiceBadge state={voiceState} />
              </div>
              <div className="flex flex-wrap gap-2">
                {!started ? (
                  <button
                    onClick={startNovaHelp}
                    className="rounded-2xl bg-yellow-400 px-5 py-2.5 font-bold text-slate-950 hover:bg-yellow-300 transition flex items-center gap-2"
                  >
                    <Mic className="h-4 w-4" /> Start NOVA Help
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => voice.startListening()}
                      className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold hover:border-yellow-400 transition flex items-center gap-2"
                    >
                      <Mic className="h-4 w-4" /> Listen
                    </button>
                    <button
                      onClick={stopNovaHelp}
                      className="rounded-2xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/10 transition flex items-center gap-2"
                    >
                      <StopCircle className="h-4 w-4" /> Stop
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* NOVA says */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5 mb-4">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">NOVA says</p>
              <p className="text-white text-base sm:text-lg font-semibold leading-relaxed">{currentPrompt}</p>
            </div>

            {/* Last heard */}
            {lastQuestion && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">You asked</p>
                <p className="text-slate-300 text-sm">{lastQuestion}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-sm text-slate-500">
              <span className="px-3 py-1 rounded-full bg-slate-800">"Hey NOVA" to wake</span>
              <span className="px-3 py-1 rounded-full bg-slate-800">"stop" to silence</span>
            </div>
          </div>

          {voice.error && (
            <div className="mt-4 rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
              <p className="font-bold text-red-300">Microphone / Voice Error</p>
              <p className="mt-2 text-red-200 text-sm">{voice.error}</p>
              <button
                onClick={retryMic}
                className="mt-3 rounded-2xl bg-yellow-400 px-5 py-2.5 font-bold text-slate-950 hover:bg-yellow-300 transition flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Retry Mic
              </button>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs text-slate-400 mb-2">Heard</p>
              <p className="font-semibold text-white text-sm break-words line-clamp-2">{voice.lastHeard || "—"}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs text-slate-400 mb-2">Mic</p>
              <p className="font-semibold text-white text-sm capitalize">{voice.micPermission}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 col-span-2 sm:col-span-1">
              <p className="text-xs text-slate-400 mb-2">Awake</p>
              <p className={`font-semibold text-sm ${awake ? "text-yellow-400" : "text-slate-500"}`}>
                {awake ? "Yes — listening for questions" : "No — say Hey NOVA"}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
            <h3 className="text-base font-black text-white mb-4">Topics NOVA can help with</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {TOPICS.map((item) => (
                <div key={item} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-300 text-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Reference */}
        <section>
          <h2 className="text-xl font-black text-white mb-4 sm:mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" /> Quick Reference
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">System Defaults</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Printer</span><span className="font-mono font-bold text-yellow-400">{SYSTEM_DEFAULTS.printerNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Alpha Label</span><span className="font-mono font-bold text-yellow-400">{SYSTEM_DEFAULTS.alphaLabelNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Bravo Label</span><span className="font-mono font-bold text-yellow-400">{SYSTEM_DEFAULTS.bravoLabelNumber}</span></div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Door Codes</p>
              <div className="space-y-2 text-sm">
                {DOOR_CODES.slice(0, 3).map((dc) => (
                  <div key={dc.doorNumber} className="flex justify-between">
                    <span className="text-slate-400">Door {dc.doorNumber}</span>
                    <span className="font-mono font-bold text-yellow-400">{dc.stagingCode}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:col-span-2 md:col-span-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Emergency</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-red-400"><AlertTriangle className="h-4 w-4" /><span>Say "emergency stop"</span></div>
                <p className="text-slate-400">NOVA immediately silences and flags your supervisor. Use for injuries or hazards.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Voice Commands */}
        <section>
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <Mic className="h-5 w-5 text-yellow-400" /> Voice Commands
          </h2>
          <div className="relative mb-4 sm:mb-5">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commands..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-yellow-400 transition"
            />
          </div>
          <div className="space-y-3">
            {filteredCommands.map((cmd) => (
              <div key={cmd.phrase} className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="shrink-0">
                  <span className="inline-block px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 font-mono font-bold text-sm">
                    "{cmd.phrase}"
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">{cmd.description}</p>
                </div>
                <div className="shrink-0">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-xs font-medium capitalize">
                    {cmd.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section>
          <h2 className="text-xl font-black text-white mb-4 sm:mb-6 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-yellow-400" /> Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between text-white font-semibold hover:bg-slate-800/50 transition"
                >
                  <span className="pr-4">{faq.q}</span>
                  <span className="text-slate-500 text-lg shrink-0">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-slate-300 text-sm leading-relaxed border-t border-slate-800">
                    <p className="pt-4">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
