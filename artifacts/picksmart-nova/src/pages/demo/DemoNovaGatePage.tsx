import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Activity, Send, ArrowLeft, Sparkles, Lock, Mic, MicOff } from "lucide-react";
import { askNovaHelp } from "@/lib/novaHelpApi";

// ── Per-page NOVA context ─────────────────────────────────────────────────────
interface PageConfig {
  title: string;
  emoji: string;
  description: string;
  opening: string;
  suggestions: string[];
  contextPrefix: string;
}

const PAGE_CONFIGS: Record<string, PageConfig> = {
  Training: {
    title: "Training Modules",
    emoji: "📚",
    description: "6 structured modules covering everything from day-one basics to hitting 100%+.",
    opening: "Hey! The Training section is where selectors go through 6 structured modules — pallet building, picking accuracy, rate improvement, safety, ergonomics, and voice commands. It's only available with full access, but I can tell you everything about it. What do you want to know?",
    suggestions: [
      "What's in Module 1?",
      "How do I improve my pick rate?",
      "What are the 6 modules?",
      "How long does training take?",
    ],
    contextPrefix: "The user is asking about the Training Modules section of PickSmart Academy. Context: 6 modules covering pallet building, picking accuracy, rate improvement, safety, ergonomics, and voice commands. Each module has video lessons and quizzes. Answer their question: ",
  },
  "NOVA Help": {
    title: "NOVA Help",
    emoji: "🤖",
    description: "Real-time AI voice coach for the warehouse floor — ask anything, get instant answers.",
    opening: "Hey! NOVA Help is your real-time AI voice coach — ask me anything on the warehouse floor and I answer instantly. Pallet build advice, pick rate tips, safety checks, slot codes — I've got you. This feature is locked for demo users, but I can show you exactly what it can do. What do you want to know about NOVA Help?",
    suggestions: [
      "How does voice coaching work?",
      "Can NOVA help me build faster pallets?",
      "What questions can I ask NOVA?",
      "Can I use NOVA in Spanish?",
    ],
    contextPrefix: "The user is asking about the NOVA Help AI voice coach feature of PickSmart Academy. Context: real-time AI voice coach for warehouse selectors, answers questions about pallet building, pick rates, safety, slot codes, ergonomics. Answer their question: ",
  },
  "Common Mistakes": {
    title: "Common Mistakes",
    emoji: "⚠️",
    description: "See the most frequent selector errors and get corrective coaching for each one.",
    opening: "Hey! The Common Mistakes section breaks down the most frequent errors selectors make — mispicks, over picks, short picks, unsafe pallet stacking, and more — with corrective coaching for each. It's locked for demo access, but I can walk you through any of these mistakes right now. What do you want to know?",
    suggestions: [
      "What's a mispick?",
      "How do I avoid short picks?",
      "What is unsafe stacking?",
      "What are the most common beginner mistakes?",
    ],
    contextPrefix: "The user is asking about the Common Mistakes section of PickSmart Academy. Context: covers mispicks, over picks, short picks, unsafe pallet stacking, voice command errors, and poor ergonomics — each with corrective coaching. Answer their question: ",
  },
  "My Progress": {
    title: "My Progress",
    emoji: "📈",
    description: "Track your pick rate, accuracy score, training completion, and performance trends.",
    opening: "Hey! My Progress is where you track everything — your pick rate over time, accuracy percentage, module completion, quiz scores, and performance trends. It's personalized to your actual picking data. This page requires full access, but I can tell you exactly what you'll see there. What do you want to know?",
    suggestions: [
      "What stats does it track?",
      "How is pick rate calculated?",
      "What is a good accuracy score?",
      "How do I see my improvement?",
    ],
    contextPrefix: "The user is asking about the My Progress tracking page of PickSmart Academy. Context: tracks pick rate trends, accuracy percentage, training module completion, quiz scores, and daily/weekly performance graphs. Answer their question: ",
  },
  Leaderboard: {
    title: "Leaderboard",
    emoji: "🏆",
    description: "See top selectors ranked by pick rate and accuracy — daily, weekly, and all-time.",
    opening: "Hey! The Leaderboard shows where you rank against other selectors at your warehouse — sorted by pick rate and accuracy. There are daily, weekly, and all-time boards. This is locked for demo mode, but I can tell you everything about how it works. What do you want to know?",
    suggestions: [
      "How is the leaderboard ranked?",
      "Can I see my warehouse ranking?",
      "What's a good pick rate to aim for?",
      "Is there a daily leaderboard?",
    ],
    contextPrefix: "The user is asking about the Leaderboard in PickSmart Academy. Context: ranks selectors by pick rate and accuracy, has daily/weekly/all-time views, shows per-warehouse rankings. Answer their question: ",
  },
  "Selector Breaking News": {
    title: "Selector Breaking News",
    emoji: "📣",
    description: "Community feed where selectors share tips, wins, announcements, and motivation.",
    opening: "Hey! Selector Breaking News is the community feed — selectors post tips, share personal wins, get announcements from management, and motivate each other. Think of it as the warehouse bulletin board but actually alive. It's locked for demo, but I can tell you all about it. What do you want to know?",
    suggestions: [
      "What kind of posts are on the feed?",
      "Can selectors post their own tips?",
      "How does management use this?",
      "Is this visible to everyone?",
    ],
    contextPrefix: "The user is asking about the Selector Breaking News community feed in PickSmart Academy. Context: community feed for warehouse selectors to share tips, wins, management announcements, and motivational content. Answer their question: ",
  },
  "Users & Access": {
    title: "Users & Access",
    emoji: "🛡️",
    description: "Owner admin panel — manage users, invite team, track revenue, and control settings.",
    opening: "Hey! Users & Access is the owner admin panel — you manage all your team accounts, send invitations, control role permissions, track subscription revenue, and configure warehouse settings. This is your control center. It's locked outside of owner access, but I can walk you through how it works. What do you want to know?",
    suggestions: [
      "How do I invite a new selector?",
      "What roles can I assign?",
      "How does billing work?",
      "Can I see who's active?",
    ],
    contextPrefix: "The user is asking about the Users & Access admin panel in PickSmart Academy. Context: owner control center for managing user accounts, assigning roles (selector/trainer/supervisor/manager/owner), sending invitations, tracking revenue, and configuring warehouse settings. Answer their question: ",
  },
};

const DEFAULT_CONFIG: PageConfig = {
  title: "This Page",
  emoji: "🔒",
  description: "This section is available with full access.",
  opening: "Hey! This page is locked for demo access, but I can tell you all about what it does. What would you like to know?",
  suggestions: [
    "What does this page do?",
    "How does it help selectors?",
    "Is this in the free trial?",
    "How do I get access?",
  ],
  contextPrefix: "The user is asking about a feature of PickSmart Academy that requires full access. Answer their question: ",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  role: "nova" | "user";
  text: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DemoNovaGatePage() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const pageName = params.get("page") ?? "";
  const config = PAGE_CONFIGS[pageName] ?? DEFAULT_CONFIG;

  const [messages, setMessages] = useState<Message[]>([
    { role: "nova", text: config.opening },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typed, setTyped] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Animate NOVA opening message
  const [displayedOpening, setDisplayedOpening] = useState("");
  const [openingDone, setOpeningDone] = useState(false);
  useEffect(() => {
    let i = 0;
    const text = config.opening;
    setDisplayedOpening("");
    setOpeningDone(false);
    const id = setInterval(() => {
      i++;
      setDisplayedOpening(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setOpeningDone(true);
      }
    }, 18);
    return () => clearInterval(id);
  }, [config.opening]);

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;
    setInput("");
    setLoading(true);
    setMessages(prev => [...prev, { role: "user", text: q }]);

    const contextualQ = config.contextPrefix + q;
    const answer = await askNovaHelp(contextualQ, "en");
    setMessages(prev => [...prev, { role: "nova", text: answer }]);
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
        <button
          onClick={() => navigate("/demo")}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Demo
        </button>
        <div className="flex items-center gap-2 text-xs font-bold text-yellow-400 uppercase tracking-widest">
          <Lock className="h-3 w-3" />
          Demo Mode
        </div>
      </div>

      {/* ── Page header ── */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="text-3xl">{config.emoji}</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-0.5">
              Locked — Demo Access
            </p>
            <h1 className="text-xl font-black text-white">{config.title}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{config.description}</p>
          </div>
        </div>
      </div>

      {/* ── Main chat area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* NOVA opening message (typewriter) */}
          <div className="flex gap-3 items-start">
            <div className="shrink-0 bg-yellow-400 text-slate-950 p-2 rounded-xl mt-0.5">
              <Activity className="h-5 w-5" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 text-white text-sm leading-relaxed max-w-prose">
              {displayedOpening}
              {!openingDone && (
                <span className="inline-block w-1.5 h-4 bg-yellow-400 ml-0.5 animate-pulse align-middle" />
              )}
            </div>
          </div>

          {/* Suggested questions — show once opening is done */}
          {openingDone && messages.length === 1 && (
            <div className="pl-11">
              <p className="text-xs text-slate-500 mb-2 font-medium">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {config.suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-300 hover:border-yellow-400 hover:text-yellow-400 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation messages (after the first) */}
          {messages.slice(1).map((msg, i) => (
            <div key={i} className={`flex gap-3 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {msg.role === "nova" ? (
                <div className="shrink-0 bg-yellow-400 text-slate-950 p-2 rounded-xl mt-0.5">
                  <Activity className="h-5 w-5" />
                </div>
              ) : (
                <div className="shrink-0 bg-slate-700 text-slate-300 p-2 rounded-xl mt-0.5">
                  <span className="text-xs font-bold">YOU</span>
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-prose ${
                  msg.role === "nova"
                    ? "bg-slate-800 text-white rounded-tl-sm"
                    : "bg-yellow-400 text-slate-950 font-medium rounded-tr-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3 items-start">
              <div className="shrink-0 bg-yellow-400 text-slate-950 p-2 rounded-xl mt-0.5">
                <Activity className="h-5 w-5" />
              </div>
              <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(d => (
                    <span
                      key={d}
                      className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${d * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input bar ── */}
      <div className="border-t border-slate-800 bg-slate-900 px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); setTyped(true); }}
              placeholder={`Ask NOVA about ${config.title}…`}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-slate-950 font-bold px-4 rounded-xl transition flex items-center gap-1"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          {/* CTA */}
          <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <Sparkles className="h-4 w-4 text-yellow-400 shrink-0" />
              <span>Ready to unlock <strong className="text-white">{config.title}</strong> for your team?</span>
            </div>
            <button
              onClick={() => navigate("/request-access")}
              className="shrink-0 ml-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-black px-3 py-1.5 rounded-lg transition"
            >
              Get Access →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
