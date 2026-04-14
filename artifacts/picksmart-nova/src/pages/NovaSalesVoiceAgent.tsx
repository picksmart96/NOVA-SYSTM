import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX, Send, BarChart3, TrendingUp, UserRound, CheckCircle2 } from "lucide-react";
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
  "What's the difference vs what we have now?",
  "Show me how NOVA works",
  "How much does it cost?",
  "Start free trial",
  "I want to talk to a real person",
];

function isRealPersonTrigger(text: string) {
  const t = text.toLowerCase();
  return (
    t.includes("real person") || t.includes("human") || t.includes("call me") ||
    t.includes("speak to someone") || t.includes("talk to someone") ||
    t.includes("call us") || t.includes("contact us") || t.includes("speak with") ||
    t.includes("talk with") || t.includes("reach out") || t.includes("phone call")
  );
}

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

  // Before / after comparison
  if (
    lower.includes("how is it different") ||
    lower.includes("what's the difference") ||
    lower.includes("what is the difference") ||
    lower.includes("compare") ||
    lower.includes("before after") ||
    lower.includes("before and after") ||
    lower.includes("vs ") ||
    lower.includes("versus") ||
    lower.includes("better than") ||
    lower.includes("different from") ||
    lower.includes("why nova") ||
    lower.includes("prove it") ||
    lower.includes("show me the difference")
  ) {
    return {
      stage: "demo",
      text: `Let me show you the difference real quick…

BEFORE NOVA:
— Selectors hesitate between picks
— Miscounts and mispicks happen
— Pallets are inconsistent
— Supervisors react instead of control
— Rate is unstable

AFTER NOVA:
— Selectors move continuously without hesitation
— Check codes are confirmed every time
— Pallets are built clean and stable
— Supervisors push updates in real-time
— Rate becomes consistent and predictable

That gap right there… is where your money is going.

If that gap is costing you even 10% performance… that's thousands of dollars every month.

Most warehouses don't realize it because everything still looks busy 😄

But busy doesn't always mean efficient.

The fastest way to see this difference is to run NOVA in your operation.

Let me set up your free trial so you can see it live.`,
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
  const [ttsUnlocked, setTtsUnlocked] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [nowSpeakingText, setNowSpeakingText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [trialCreated, setTrialCreated] = useState(false);
  const [showHumanForm, setShowHumanForm] = useState(false);
  const [humanForm, setHumanForm] = useState({ name: "", email: "", company: "", phone: "", topic: "" });
  const [humanSubmitted, setHumanSubmitted] = useState(false);
  const [humanSubmitting, setHumanSubmitting] = useState(false);
  const [lead, setLead] = useState<LeadState>({
    companyName: "",
    managerName: "",
    email: "",
    phone: "",
    painPoint: "",
    selectors: null,
  });

  const recognitionRef = useRef<any>(null);
  const sendMessageRef = useRef<((text: string) => void) | null>(null);
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

  const autoListenRef = useRef(false); // true once user has activated voice

  // ── Start mic helper ─────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!autoListenRef.current) return;
    try { recognitionRef.current?.start(); } catch { /* already started */ }
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
    rec.onend   = () => setIsListening(false);
    rec.onerror = () => { setIsListening(false); };
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript?.trim() ?? "";
      if (text) {
        setInput(text);
        // Auto-send immediately — defer so state updates first
        setTimeout(() => {
          sendMessageRef.current?.(text);
        }, 50);
      }
    };
    recognitionRef.current = rec;
  }, [canListen]);

  // ── Speak — tracks isSpeaking state + auto-restarts mic when done ───────────
  const speak = useCallback((text: string, onDone?: () => void) => {
    if (!voiceOn || !canSpeak) { onDone?.(); return; }
    setIsSpeaking(true);
    setNowSpeakingText(text);
    novaSpeak(text, "en", () => {
      setIsSpeaking(false);
      setNowSpeakingText("");
      onDone?.();
      setTimeout(startListening, 300);
    });
  }, [voiceOn, canSpeak, startListening]);

  // ── Activate voice (called from user-gesture tap on overlay) ─────────────────
  const handleActivate = useCallback(() => {
    autoListenRef.current = true;
    setTtsUnlocked(true);
    const welcome =
      "Most warehouses lose 15 to 25 percent performance from small mistakes and slow transitions. I fix that. What's hurting your operation more right now — speed or accuracy?";
    if (canSpeak) {
      setIsSpeaking(true);
      setNowSpeakingText(welcome);
      novaSpeak(welcome, "en", () => {
        setIsSpeaking(false);
        setNowSpeakingText("");
        setTimeout(startListening, 300);
      });
    } else {
      setTimeout(startListening, 300);
    }
  }, [canSpeak, startListening]);

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

    // Detect "real person" request
    if (isRealPersonTrigger(text)) {
      setTimeout(() => {
        const msg = "Of course! I've pulled up our contact form right in the sidebar.\n\nFill it out and our team will reach out to you within 24 hours — usually much sooner.";
        pushMessage("assistant", msg);
        speak("Of course! Fill out the contact form in the sidebar and our team will reach out within 24 hours.");
        setShowHumanForm(true);
        setIsThinking(false);
      }, 400);
      return;
    }

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

  // Keep ref in sync so voice onresult always has the latest sendMessage
  useEffect(() => {
    sendMessageRef.current = (text: string) => sendMessage(text);
  }, [sendMessage]);

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(); };
  // Manual mic tap — always starts regardless of autoListenRef
  const manualStartListening = () => {
    autoListenRef.current = true; // enable auto-loop once they tap mic manually
    try { recognitionRef.current?.start(); } catch { /* already running */ }
  };
  const stopListening = () => recognitionRef.current?.stop();

  // ── ROI calculator derived from lead.selectors ───────────────────────────────
  const roi = lead.selectors ? calculateROI(lead.selectors) : null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Voice activation overlay — shown until user taps ── */}
      {!ttsUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/97 backdrop-blur-sm px-6">
          <div className="max-w-md w-full text-center space-y-8">
            {/* Pulsing orb */}
            <div className="relative mx-auto w-36 h-36">
              <div className="absolute inset-0 rounded-full border-4 border-yellow-400/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border-4 border-yellow-400/20 animate-ping" style={{ animationDelay: "400ms" }} />
              <div className="relative flex h-full w-full items-center justify-center rounded-full border-4 border-yellow-400 bg-slate-950 shadow-[0_0_60px_rgba(250,204,21,0.4)]">
                <div className="text-center">
                  <p className="text-3xl font-black text-white">NOVA</p>
                  <p className="text-[10px] text-yellow-400 font-bold tracking-widest">SALES AGENT</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white mb-2">Tap to hear NOVA speak</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Browsers require a tap before playing audio. Tap the button below and NOVA will greet you out loud.
              </p>
            </div>

            <button
              onClick={handleActivate}
              className="w-full flex items-center justify-center gap-3 rounded-3xl bg-yellow-400 px-8 py-5 font-black text-slate-950 text-lg hover:bg-yellow-300 active:scale-95 transition shadow-[0_0_40px_rgba(250,204,21,0.3)]"
            >
              <Volume2 className="h-6 w-6" />
              Activate NOVA Voice
            </button>

            <button
              onClick={() => setTtsUnlocked(true)}
              className="text-slate-600 text-sm hover:text-slate-400 transition underline"
            >
              Skip voice — text only
            </button>
          </div>
        </div>
      )}

      {/* ── Full-screen NOVA speaking view ── */}
      {ttsUnlocked && isSpeaking && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#060d1f] px-6">
          {/* Concentric circles — static rings + pulsing center */}
          <div className="relative flex items-center justify-center mb-10" style={{ width: 280, height: 280 }}>
            {/* Static concentric rings radiating outward */}
            <div className="absolute rounded-full border border-yellow-400/15" style={{ width: 280, height: 280 }} />
            <div className="absolute rounded-full border border-yellow-400/20" style={{ width: 230, height: 230 }} />
            <div className="absolute rounded-full border border-yellow-400/30" style={{ width: 180, height: 180 }} />
            <div className="absolute rounded-full border border-yellow-400/45" style={{ width: 132, height: 132 }} />
            <div className="absolute rounded-full border border-yellow-400/65" style={{ width: 86, height: 86 }} />
            <div className="absolute rounded-full border-2 border-yellow-400/85" style={{ width: 46, height: 46 }} />
            {/* Pulsing outer glow ring */}
            <div className="absolute rounded-full border-2 border-yellow-400/40 animate-ping" style={{ width: 140, height: 140, animationDuration: "1.4s" }} />
            <div className="absolute rounded-full border border-yellow-400/20 animate-ping" style={{ width: 200, height: 200, animationDuration: "2s", animationDelay: "0.3s" }} />
            {/* Center dot */}
            <div className="relative z-10 w-5 h-5 rounded-full bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,1),0_0_40px_rgba(250,204,21,0.5)]" />
          </div>

          {/* Label + title */}
          <h2 className="text-4xl font-black text-white mb-2">Meet NOVA</h2>
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-yellow-400 mb-6">Speaking…</p>

          {/* What NOVA is saying */}
          {nowSpeakingText && (
            <p className="max-w-sm text-center text-slate-300 text-sm leading-relaxed px-2">
              {nowSpeakingText.replace(/\n/g, " ")}
            </p>
          )}

          {/* Controls */}
          <div className="mt-10 flex gap-3">
            <button
              onClick={() => { window.speechSynthesis?.cancel(); setIsSpeaking(false); setNowSpeakingText(""); setTimeout(startListening, 300); }}
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-300 hover:border-yellow-400/50 hover:text-yellow-300 transition"
            >
              Skip →
            </button>
            <button
              onClick={() => { const next = !voiceOn; setVoiceOn(next); if (!next) window.speechSynthesis?.cancel(); }}
              className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-300 hover:border-white/30 transition"
            >
              {voiceOn ? <><VolumeX className="h-4 w-4" /> Mute</> : <><Volume2 className="h-4 w-4" /> Unmute</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Full-screen NOVA listening view ── */}
      {ttsUnlocked && isListening && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#060d1f] px-6">
          <div className="relative flex items-center justify-center mb-10" style={{ width: 280, height: 280 }}>
            {/* Static rings */}
            <div className="absolute rounded-full border border-yellow-400/15" style={{ width: 280, height: 280 }} />
            <div className="absolute rounded-full border border-yellow-400/25" style={{ width: 210, height: 210 }} />
            <div className="absolute rounded-full border border-yellow-400/40" style={{ width: 150, height: 150 }} />
            {/* Slow breathing pulse */}
            <div className="absolute rounded-full border-2 border-yellow-400/50 animate-ping" style={{ width: 110, height: 110, animationDuration: "2s" }} />
            {/* Mic center */}
            <div className="relative z-10 w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center shadow-[0_0_40px_rgba(250,204,21,0.6)]">
              <Mic className="h-7 w-7 text-slate-950" />
            </div>
          </div>
          <h2 className="text-4xl font-black text-white mb-2">Meet NOVA</h2>
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-yellow-400 mb-6">Listening…</p>
          <p className="text-slate-400 text-sm text-center max-w-xs">Speak now — NOVA is ready for your response</p>
          <button
            onClick={stopListening}
            className="mt-10 rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-400 hover:border-red-400/50 hover:text-red-300 transition"
          >
            Stop listening
          </button>
        </div>
      )}

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
                onClick={isListening ? stopListening : manualStartListening}
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

          {/* Talk to a real person */}
          {!showHumanForm && !humanSubmitted && (
            <button
              onClick={() => {
                setShowHumanForm(true);
                sendMessage("I want to talk to a real person");
              }}
              className="w-full flex items-center gap-2 justify-center rounded-2xl border border-slate-700 bg-slate-900 hover:border-yellow-400 px-4 py-3 text-sm text-slate-300 hover:text-yellow-300 font-semibold transition"
            >
              <UserRound className="h-4 w-4" />
              Talk to a Real Person
            </button>
          )}

          {/* Human contact form */}
          {showHumanForm && !humanSubmitted && (
            <div className="rounded-2xl border border-yellow-400/40 bg-yellow-400/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <UserRound className="h-4 w-4 text-yellow-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-yellow-300">Talk to Our Team</p>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!humanForm.name || !humanForm.email) return;
                  setHumanSubmitting(true);
                  try {
                    await fetch("/api/social/talk-requests", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ...humanForm, source: "meet_nova" }),
                    });
                    setHumanSubmitted(true);
                    pushMessage("assistant", `Got it, ${humanForm.name}! Your request has been sent to our team.\n\nWe'll reach out to ${humanForm.email} within 24 hours — usually sooner. Talk soon! 👋`);
                    speak(`Got it! Your request has been sent. We'll reach out within 24 hours.`);
                  } catch {
                    alert("Something went wrong. Please try again.");
                  } finally {
                    setHumanSubmitting(false);
                  }
                }}
                className="space-y-3"
              >
                <input
                  required
                  placeholder="Your name *"
                  value={humanForm.name}
                  onChange={(e) => setHumanForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
                />
                <input
                  type="email"
                  required
                  placeholder="Email address *"
                  value={humanForm.email}
                  onChange={(e) => setHumanForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
                />
                <input
                  placeholder="Company name"
                  value={humanForm.company}
                  onChange={(e) => setHumanForm((f) => ({ ...f, company: e.target.value }))}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
                />
                <input
                  placeholder="Phone number"
                  value={humanForm.phone}
                  onChange={(e) => setHumanForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
                />
                <textarea
                  placeholder="What do you need help with?"
                  value={humanForm.topic}
                  onChange={(e) => setHumanForm((f) => ({ ...f, topic: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 resize-none"
                />
                <button
                  type="submit"
                  disabled={humanSubmitting || !humanForm.name || !humanForm.email}
                  className="w-full rounded-xl bg-yellow-400 text-slate-950 font-bold py-2.5 text-sm hover:bg-yellow-300 transition disabled:opacity-50"
                >
                  {humanSubmitting ? "Sending…" : "Send Request"}
                </button>
              </form>
            </div>
          )}

          {humanSubmitted && (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-5 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
              <div>
                <p className="text-green-300 font-bold text-sm">Request Sent!</p>
                <p className="text-green-400/80 text-xs mt-0.5">Our team will reach out within 24 hours.</p>
              </div>
            </div>
          )}
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
              onClick={isListening ? stopListening : manualStartListening}
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
