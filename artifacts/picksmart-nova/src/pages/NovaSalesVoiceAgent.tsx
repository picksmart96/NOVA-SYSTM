import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX, Send, BarChart3, TrendingUp } from "lucide-react";
import { novaSpeak, pickNovaVoice } from "@/lib/novaSpeech";

// ── Types ─────────────────────────────────────────────────────────────────────

type SalesStage = "open" | "discovery" | "pitch" | "demo" | "trial" | "close";

interface Message {
  id: string;
  role: "assistant" | "user";
  text: string;
  createdAt: Date;
}

interface LeadState {
  companyName: string;
  managerName: string;
  email: string;
  phone: string;
  painPoint: string;
  selectors: number | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  "We have speed problems",
  "We have too many picking mistakes",
  "Show me how NOVA works",
  "How much does it cost?",
  "Start free trial",
];

const HUMOR_LINES = [
  "Some selectors move fast… but the pallet looks like a puzzle gone wrong 😄 We balance both.",
  "Be honest… how crazy does your warehouse get on a busy day? 😄",
  "I've seen pallets that look like they survived a tornado 😄 We fix that.",
  "Most warehouses don't have a picking problem — they have a movement and transition problem.",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function guessPainPoint(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes("speed") || t.includes("slow") || t.includes("pace") || t.includes("rate")) return "speed";
  if (t.includes("mistake") || t.includes("accuracy") || t.includes("mispick") || t.includes("damage")) return "accuracy";
  if (t.includes("training") || t.includes("new hire")) return "training";
  return null;
}

function extractNumbers(text: string): number[] {
  const nums = text.match(/\d+/g);
  return nums ? nums.map((n) => parseInt(n, 10)) : [];
}

function calculateROI(selectors: number, hoursSaved = 1, hourlyRate = 20) {
  const daily = selectors * hoursSaved * hourlyRate;
  const monthly = daily * 22;
  return { daily, monthly };
}

function parseLeadDetails(text: string, existing: LeadState): LeadState {
  const updated = { ...existing };
  if (!updated.email) {
    const m = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (m) updated.email = m[0];
  }
  if (!updated.phone) {
    const m = text.match(/(\+?\d[\d\s().-]{7,}\d)/);
    if (m) updated.phone = m[0];
  }
  if (!updated.managerName && text.length < 60 && !/[@\d]/.test(text)) {
    updated.managerName = text.trim();
  }
  if (!updated.companyName && text.length < 120 && !updated.email) {
    updated.companyName = text.trim();
  }
  const nums = extractNumbers(text);
  if (nums.length > 0 && nums[0] > 1 && nums[0] < 5000) {
    updated.selectors = nums[0];
  }
  return updated;
}

// ── Local reply builder (fallback / speed) ────────────────────────────────────

function buildLocalReply(
  userText: string,
  stage: SalesStage,
  lead: LeadState
): { stage: SalesStage; text: string } {
  const lower = userText.toLowerCase();
  const pain = guessPainPoint(userText);
  const nums = extractNumbers(userText);

  // ROI question with number
  if (nums.length > 0 && nums[0] > 1 && nums[0] < 5000) {
    const roi = calculateROI(nums[0]);
    return {
      stage: "pitch",
      text: `Let me show you something real quick…\n\nIf you have ${nums[0]} selectors and NOVA saves just 1 hour per person…\n\nThat's about $${roi.daily.toLocaleString()} a day.\n\nThat's over $${roi.monthly.toLocaleString()} per month in saved labor and performance.\n\nThat's why most teams move forward after the trial.`,
    };
  }

  // Pricing objection
  if (lower.includes("how much") || lower.includes("price") || lower.includes("cost")) {
    return {
      stage: "close",
      text: "If it improves performance even 10%, it pays for itself fast.\n\nThat's why we start with a free trial — no risk.\n\nLet's do this — I'll set up your free 30 days right now.\n\nJust give me your company name and best email.",
    };
  }

  // Trial / sign-up
  if (lower.includes("trial") || lower.includes("start") || lower.includes("sign")) {
    return {
      stage: "trial",
      text: "Perfect — let's start your free 30-day trial right now.\n\nFirst, give me your company name and the best email for the manager or supervisor handling operations.",
    };
  }

  // Demo
  if (lower.includes("demo") || lower.includes("show me") || lower.includes("how")) {
    return {
      stage: "demo",
      text: "NOVA gives every selector real-time coaching while they work.\n\nIt reduces mistakes, improves pace, and gives supervisors control of the shift.\n\nThis isn't theory — it runs during live picking.\n\nWhat's hurting your operation more right now — speed or accuracy?",
    };
  }

  // Open stage
  if (stage === "open") {
    return {
      stage: "discovery",
      text: "Most warehouses lose 15–25% performance from small mistakes and slow transitions.\n\nI fix that.\n\nWhat's hurting your operation more right now — speed or accuracy?",
    };
  }

  // Existing system objection
  if (lower.includes("already have") || lower.includes("current system") || lower.includes("existing")) {
    return {
      stage: "pitch",
      text: "Perfect — this works on top of your current system.\n\nIt improves performance without replacing anything.\n\nMost teams see improvement within the first week.",
    };
  }

  // No time objection
  if (lower.includes("no time") || lower.includes("busy") || lower.includes("too much")) {
    return {
      stage: "pitch",
      text: "That's exactly why companies use NOVA.\n\nIt runs during the shift — no extra time needed.\n\nAt this point, the best move is to start the trial and measure results directly in your warehouse.\n\nI'll take you there now.",
    };
  }

  if (pain === "speed") {
    return {
      stage: "pitch",
      text: "That usually means lost time between picks, hesitation, and poor flow.\n\nThat adds up fast.\n\nIf I showed you how to cut 10–15 minutes per assignment, would that matter to your operation?",
    };
  }

  if (pain === "accuracy") {
    return {
      stage: "pitch",
      text: "That's one of the biggest problems NOVA is built for.\n\nWe train selectors to confirm correctly, build cleaner pallets, and reduce mispicks.\n\nIf this worked, would you want your whole team using it?",
    };
  }

  if (pain === "training") {
    return {
      stage: "pitch",
      text: "NOVA is strong for that.\n\nInstead of relying only on shadow training, every selector gets a guided system they can use while learning.\n\nThat makes training faster, cleaner, and more consistent.\n\nWould you like a quick demo or the free trial path?",
    };
  }

  if (stage === "trial" && (!lead.companyName || !lead.email)) {
    return {
      stage: "trial",
      text: "To start the trial, send me your company name and the best manager email.\n\nAfter that, I'll create your next step and move you into onboarding.",
    };
  }

  // Default close push
  const humor = HUMOR_LINES[Math.floor(Math.random() * HUMOR_LINES.length)];
  return {
    stage,
    text: `${humor}\n\nBut seriously — the fastest next step is a free 30-day trial so your team can see results in real use.\n\nWant me to set that up now?`,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NovaSalesVoiceAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Most warehouses lose 15–25% performance from small mistakes and slow transitions.\n\nI fix that.\n\nWhat's hurting your operation more right now — speed or accuracy?",
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<SalesStage>("open");
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [trialCreated, setTrialCreated] = useState(false);
  const [lead, setLead] = useState<LeadState>({
    companyName: "",
    managerName: "",
    email: "",
    phone: "",
    painPoint: "",
    selectors: null,
  });

  const recognitionRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const canListen = useMemo(() => {
    if (typeof window === "undefined") return false;
    return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
  }, []);

  const canSpeak = useMemo(() => {
    if (typeof window === "undefined") return false;
    return "speechSynthesis" in window;
  }, []);

  // ── Scroll ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Track chat_started on mount ─────────────────────────────────────────────
  useEffect(() => {
    trackEvent("chat_started");
  }, []);

  // ── Voice recognition setup ─────────────────────────────────────────────────
  useEffect(() => {
    if (!canListen) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => { setErrorMsg(""); setIsListening(true); };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => { setIsListening(false); setErrorMsg("Voice input didn't work. Try again."); };
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript ?? "";
      if (text.trim()) setInput(text.trim());
    };
    recognitionRef.current = rec;
  }, [canListen]);

  // ── Speak ───────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!voiceOn || !canSpeak) return;
    novaSpeak(text, "en");
  }, [voiceOn, canSpeak]);

  // ── Track event ─────────────────────────────────────────────────────────────
  async function trackEvent(event: string, dealId?: string) {
    try {
      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, dealId: dealId ?? null }),
      });
    } catch { /* silent */ }
  }

  // ── Push message ─────────────────────────────────────────────────────────────
  const pushMessage = useCallback((role: "assistant" | "user", text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role,
        text,
        createdAt: new Date(),
      },
    ]);
  }, []);

  // ── Create trial lead → redirect to /deal-sign/:id ──────────────────────────
  const createTrialLead = useCallback(async (currentLead: LeadState) => {
    if (trialCreated) return;
    setTrialCreated(true);
    try {
      const res = await fetch("/api/nova-sales-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: currentLead.companyName || "Unknown Company",
          managerName: currentLead.managerName,
          email: currentLead.email,
          phone: currentLead.phone,
          painPoint: currentLead.painPoint,
          source: "meet_nova_preview",
        }),
      });
      const data = await res.json();
      if (data?.dealLink) {
        await trackEvent("trial_clicked", data.leadId);
        pushMessage("assistant", "Perfect — I created your trial setup. Taking you there now.");
        speak("Perfect. Taking you to your trial setup now.");
        setTimeout(() => { window.location.href = data.dealLink; }, 1400);
      } else {
        pushMessage("assistant", "I saved your request. A team member will follow up to start your trial.");
        speak("I saved your request. A team member will follow up.");
      }
    } catch {
      pushMessage("assistant", "I couldn't create the trial automatically right now, but your info is noted. We'll follow up.");
      speak("Your info is noted. We'll follow up to start your trial.");
    }
  }, [trialCreated, pushMessage, speak]);

  // ── Send message ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isThinking) return;

    pushMessage("user", text);
    setInput("");
    setIsThinking(true);
    setErrorMsg("");

    // Update lead from text
    setLead((prev) => {
      const pain = guessPainPoint(text);
      const updated = parseLeadDetails(text, prev);
      if (pain && !updated.painPoint) updated.painPoint = pain;
      return updated;
    });

    // Build local reply quickly
    const currentLead = parseLeadDetails(text, lead);
    if (guessPainPoint(text) && !currentLead.painPoint) {
      currentLead.painPoint = guessPainPoint(text)!;
    }
    const reply = buildLocalReply(text, stage, currentLead);

    setTimeout(async () => {
      setStage(reply.stage);
      pushMessage("assistant", reply.text);
      speak(reply.text.replace(/\n/g, " "));
      setIsThinking(false);

      // Auto-create trial if we have company + email
      if (reply.stage === "trial" && currentLead.companyName && currentLead.email && !trialCreated) {
        await createTrialLead(currentLead);
      }
    }, 400);
  }, [input, isThinking, stage, lead, trialCreated, pushMessage, speak, createTrialLead]);

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(); };
  const startListening = () => recognitionRef.current?.start();
  const stopListening = () => recognitionRef.current?.stop();

  // ── ROI calculator derived from lead.selectors ───────────────────────────────
  const roi = lead.selectors ? calculateROI(lead.selectors) : null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center">
              <span className="text-slate-950 font-black text-sm">N</span>
            </div>
            <div>
              <p className="font-black text-white leading-none">Meet NOVA</p>
              <p className="text-xs text-yellow-300 mt-0.5">Sales Voice Agent</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-bold uppercase tracking-wider capitalize">
              {stage.replace("_", " ")}
            </span>
            <button
              onClick={() => { setVoiceOn((v) => !v); if (canSpeak) window.speechSynthesis.cancel(); }}
              className="p-2 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition"
              title={voiceOn ? "Mute NOVA" : "Unmute NOVA"}
            >
              {voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] p-4 md:p-6">
        {/* ── Left sidebar ──────────────────────────────────────────────────── */}
        <aside className="space-y-4 h-fit">
          {/* NOVA intro card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-300">What NOVA Does</p>
            <p className="mt-3 text-slate-300 text-sm leading-6">
              NOVA gives every selector real-time voice coaching, improves pick accuracy, and gives supervisors live shift control — running during actual picking, not in a classroom.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-2"><span className="text-yellow-400">✓</span> Live voice picking guidance</span>
              <span className="flex items-center gap-2"><span className="text-yellow-400">✓</span> Mistake coaching &amp; safety</span>
              <span className="flex items-center gap-2"><span className="text-yellow-400">✓</span> Supervisor shift control</span>
              <span className="flex items-center gap-2"><span className="text-yellow-400">✓</span> 30-day free trial</span>
            </div>
          </div>

          {/* Lead snapshot */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-300">Your Info</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Company</span>
                <span className="text-slate-200 truncate ml-2 max-w-[160px] text-right">{lead.companyName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email</span>
                <span className="text-slate-200 truncate ml-2 max-w-[160px] text-right">{lead.email || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone</span>
                <span className="text-slate-200 truncate ml-2 max-w-[160px] text-right">{lead.phone || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pain point</span>
                <span className="text-slate-200 capitalize">{lead.painPoint || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Selectors</span>
                <span className="text-slate-200">{lead.selectors ?? "—"}</span>
              </div>
            </div>
          </div>

          {/* ROI calculator */}
          {roi && (
            <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-yellow-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-yellow-300">Estimated ROI</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">{lead.selectors} selectors × 1hr saved</span>
                </div>
                <div className="flex justify-between border-t border-yellow-400/20 pt-2">
                  <span className="text-slate-300">Daily savings</span>
                  <span className="text-yellow-300 font-bold">${roi.daily.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Monthly savings</span>
                  <span className="text-yellow-300 font-bold">${roi.monthly.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick replies */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-300 mb-3">Quick Replies</p>
            <div className="space-y-2">
              {QUICK_REPLIES.map((r) => (
                <button
                  key={r}
                  onClick={() => sendMessage(r)}
                  disabled={isThinking}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 hover:border-yellow-400 px-3 py-2.5 text-left text-sm text-slate-200 transition disabled:opacity-40"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Voice controls */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-300 mb-3">Voice Controls</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={!canListen}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 font-bold text-sm transition disabled:opacity-40 ${isListening ? "bg-red-500 text-white" : "bg-yellow-400 text-slate-950"}`}
              >
                {isListening ? <><MicOff className="h-4 w-4" /> Stop</> : <><Mic className="h-4 w-4" /> Speak</>}
              </button>
              <button
                onClick={() => { setVoiceOn((v) => !v); if (!voiceOn && canSpeak) window.speechSynthesis.cancel(); }}
                className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-500 transition"
              >
                {voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                {voiceOn ? "NOVA On" : "NOVA Off"}
              </button>
            </div>
            {!canListen && (
              <p className="mt-2 text-xs text-slate-500">Voice input not available in this browser.</p>
            )}
          </div>
        </aside>

        {/* ── Chat panel ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden" style={{ minHeight: "70vh" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-yellow-400 flex items-center justify-center mr-2 mt-1 shrink-0">
                    <span className="text-slate-950 font-black text-xs">N</span>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-line ${
                    msg.role === "assistant"
                      ? "bg-slate-800 text-slate-100"
                      : "bg-yellow-400 text-slate-950 font-medium"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-lg bg-yellow-400 flex items-center justify-center mr-2 shrink-0">
                  <span className="text-slate-950 font-black text-xs">N</span>
                </div>
                <div className="bg-slate-800 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="px-5 py-2 bg-red-500/10 border-t border-red-500/20 text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Input */}
          <form onSubmit={onSubmit} className="border-t border-slate-800 p-4 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type here or use voice…"
              disabled={isThinking}
              className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={!canListen}
              className={`p-2.5 rounded-xl transition disabled:opacity-40 ${isListening ? "bg-red-500 text-white" : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"}`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isThinking}
              className="px-4 py-2.5 rounded-xl bg-yellow-400 text-slate-950 font-bold text-sm disabled:opacity-40 hover:bg-yellow-300 transition flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
