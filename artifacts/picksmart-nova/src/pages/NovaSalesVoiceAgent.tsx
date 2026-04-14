import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX, Send, BarChart3, TrendingUp, UserRound, CheckCircle2 } from "lucide-react";
import { novaSpeak, pickNovaVoice } from "@/lib/novaSpeech";

// ── Types ─────────────────────────────────────────────────────────────────────

type SalesStage = "greeting" | "name_ask" | "reason_ask" | "open" | "discovery" | "pitch" | "demo" | "trial" | "close";

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
  "I'm looking to improve my team's picking speed",
  "We have too many mispicks and mistakes",
  "I'm trying to train new hires faster",
  "What's the difference vs what we have now?",
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
  if (
    t.includes("training") || t.includes("new hire") || t.includes("new hires") ||
    t.includes("onboard") || t.includes("orientation") || t.includes("quit") ||
    t.includes("turnover") || t.includes("retention") || t.includes("scared") ||
    t.includes("frustrated") || t.includes("confusion") || t.includes("don't know what to do") ||
    t.includes("floor ready") || t.includes("ramp") || t.includes("new employee") ||
    t.includes("new employees") || t.includes("new workers") || t.includes("newbie") ||
    t.includes("first week") || t.includes("week one") || t.includes("starter")
  ) return "training";
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

// ── Extract a first name from user input ──────────────────────────────────────
function extractFirstName(text: string): string | null {
  const t = text.trim();

  // Phrase patterns — grab the word right after the keyword
  const patterns = [
    /my name is ([A-Za-zÀ-ÖØ-öø-ÿ]+)/i,
    /i'?m ([A-Za-zÀ-ÖØ-öø-ÿ]+)/i,
    /this is ([A-Za-zÀ-ÖØ-öø-ÿ]+)/i,
    /it'?s ([A-Za-zÀ-ÖØ-öø-ÿ]+)/i,
    /call me ([A-Za-zÀ-ÖØ-öø-ÿ]+)/i,
    /name'?s ([A-Za-zÀ-ÖØ-öø-ÿ]+)/i,
    /my ([A-Za-zÀ-ÖØ-öø-ÿ]+)/i,          // "my Soumaila" → Soumaila
    /([A-Za-zÀ-ÖØ-öø-ÿ]+) here/i,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) return m[1];
  }

  // Any short text with no digits or @ — treat the first word as the name
  if (t.length < 40 && !/[@\d]/.test(t)) {
    const firstWord = t.split(/\s+/)[0];
    if (firstWord.length >= 2) return firstWord;
  }

  return null;
}

// ── Local reply builder (fallback / speed) ────────────────────────────────────

function isAffirmative(text: string): boolean {
  return /\b(yes|yeah|yep|yup|sure|ok|okay|alright|absolutely|definitely|sounds good|let's do it|lets do it|of course|for sure|go ahead|please|do it|set it up|sign me up|i'm in|im in|let's go|lets go|agreed|correct|right|exactly|totally|certainly|indeed|sounds great|great|perfect|cool|good|fine|why not|no problem|works for me|tell me more|i'm interested|interested|want to|i want|love to|i'd like|id like|can we|can i|let me|show me|go on|continue|proceed)\b/.test(text.toLowerCase());
}

function isNegative(text: string): boolean {
  return /\b(no|nope|nah|not really|not right now|not interested|maybe later|later|not yet|don't think so|dont think so|we're good|we are good|pass|skip|nevermind|never mind|not sure|unsure|i don't know|i dont know|not today|not now)\b/.test(text.toLowerCase());
}

function buildLocalReply(
  userText: string,
  stage: SalesStage,
  lead: LeadState
): { stage: SalesStage; text: string } {
  const lower = userText.toLowerCase();
  const pain = guessPainPoint(userText);
  const nums = extractNumbers(userText);
  const affirm = isAffirmative(lower);
  const negat  = isNegative(lower);

  // ── Greeting stage — waiting for user's name ──────────────────────────────
  if (stage === "greeting" || stage === "name_ask") {
    const firstName = extractFirstName(userText);
    const name = firstName
      ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
      : null;
    // Always move forward — with or without a name
    return {
      stage: "reason_ask",
      text: name
        ? `Hi ${name}! What brings you here today? Are you looking to improve your team's speed, reduce picking mistakes, or get new hires up to speed faster?`
        : "What brings you here today? Are you looking to improve your team's speed, reduce picking mistakes, or get new hires up to speed faster?",
    };
  }

  // ── Reason stage — user just said what brings them here ───────────────────
  if (stage === "reason_ask") {
    const nameGreet = lead.managerName ? `Got it, ${lead.managerName}.` : "Got it.";
    if (pain === "speed") {
      return {
        stage: "pitch",
        text: `${nameGreet} Speed is usually where the biggest time is leaking — hesitation between picks, slow transitions, selectors stopping instead of flowing.\n\nNOVA fixes that in real time, right on the floor.\n\nMost teams recover 10 to 15 minutes per assignment just from better transitions alone.\n\nHow many selectors are on your team right now?`,
      };
    }
    if (pain === "accuracy") {
      return {
        stage: "pitch",
        text: `${nameGreet} Mispicks and mistakes are exactly what NOVA is built to prevent.\n\nIt coaches selectors to confirm every check code, count out loud, and build pallets correctly — every stop, every shift.\n\nMost teams see mispick rates drop fast in the first two weeks.\n\nHow many selectors are you working with?`,
      };
    }
    if (pain === "training") {
      return {
        stage: "pitch",
        text: `${nameGreet} Training is honestly one of the toughest parts of warehouse work — and most people don't realize how much goes wrong before a new hire ever takes their first pick.\n\nHere's what usually happens: Day one, they come in excited. They sit through orientation. They watch the safety videos. Maybe they do jack training or forklift cert. Hours of information — and by the end of it, they're overwhelmed.\n\nThen someone says "okay, you're ready for the floor." And they walk out there...\n\nAnd it feels like total chaos.\n\nPallets moving. Numbers flying. A voice in their headset they can barely follow. Nobody warned them it would feel like this.\n\nThat's when the fear kicks in — "Is this job even for me?" That thought runs through almost every new hire's head in week one.\n\nSome push through it. Others quit. And the ones who stay... make mistakes. Mispicks. Slow rates. Pallet build errors. All because nobody actually prepared them for what the floor really feels like.\n\nThat's exactly where NOVA comes in.\n\nAfter orientation and safety training is done — before they ever touch a real pick — NOVA steps in. We walk them through exactly what to expect: the rhythm of picking, how to confirm check codes, how to build a clean pallet, how to transition between stops without losing time.\n\nBy the time they hit the floor, they already know the job. No confusion. Less stress. Fewer injuries. And a whole lot less "I quit after week two."\n\nI always say — NOVA doesn't throw new hires into the deep end. We actually teach them to swim first. 😄\n\nHonestly, it's the difference between a new hire who makes it 90 days and becomes solid... and one who's gone before week three.\n\nSo — would it be worth running a free 30-day trial and seeing the difference with your next group?`,
      };
    }
    // Generic reason or "just looking" — move to discovery
    return {
      stage: "discovery",
      text: `${nameGreet} I appreciate you sharing that.\n\nMost warehouse teams I work with are dealing with at least one of these: picking too slow, too many mistakes, or training taking too long.\n\nWhich one hits your operation the hardest?`,
    };
  }

  // ── ROI question with selector count ──────────────────────────────────────
  if (nums.length > 0 && nums[0] > 1 && nums[0] < 5000) {
    const roi = calculateROI(nums[0]);
    return {
      stage: "pitch",
      text: `Let me show you something real quick.\n\nIf you have ${nums[0]} selectors and NOVA saves just 1 hour per person per shift…\n\nThat's $${roi.daily.toLocaleString()} a day.\n\nOver $${roi.monthly.toLocaleString()} a month in recovered labor.\n\nMost teams see that return in the first two weeks of the trial.\n\nWant to start the 30-day free trial and see it in your operation?`,
    };
  }

  // ── Affirmative responses — context-aware by stage ─────────────────────────
  if (affirm) {
    if (stage === "open" || stage === "discovery") {
      return {
        stage: "discovery",
        text: "Great — tell me a little about your operation.\n\nHow many selectors are on your team, and what's the biggest thing hurting your numbers right now — speed, accuracy, or training new hires?",
      };
    }
    if (stage === "pitch" || stage === "demo") {
      return {
        stage: "close",
        text: "Perfect. The fastest way to see real results is to run NOVA in your warehouse for 30 days at no cost.\n\nI can set that up right now.\n\nJust give me your company name and the best email for whoever manages operations.",
      };
    }
    if (stage === "close" || stage === "trial") {
      return {
        stage: "trial",
        text: "Let's do it.\n\nGive me your company name and the best manager email and I'll create your trial setup right now.",
      };
    }
    // Fallback affirmative
    return {
      stage: "close",
      text: "Love the energy.\n\nLet's get your free trial started — just give me your company name and best email and I'll set it up right now.",
    };
  }

  // ── Negative / not-now responses ──────────────────────────────────────────
  if (negat) {
    if (stage === "open" || stage === "discovery") {
      return {
        stage: "discovery",
        text: "No worries at all.\n\nMost warehouse managers I talk to aren't actively looking — they just want to know what's possible.\n\nIs there one area where your team loses the most time right now? Even just curious.",
      };
    }
    if (stage === "pitch" || stage === "demo") {
      return {
        stage: "pitch",
        text: "Completely fair.\n\nCan I ask — what would have to be true for this to make sense for your team?\n\nI want to make sure I'm not wasting your time.",
      };
    }
    return {
      stage,
      text: "No problem at all.\n\nIf you ever want to run a quick trial or have questions about how NOVA works in a real warehouse, I'm here.\n\nIs there anything else I can help you with today?",
    };
  }

  // ── Before / after comparison ──────────────────────────────────────────────
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
      text: `Here's the real difference.\n\nBefore NOVA: selectors hesitate between picks, miscounts happen, pallets are inconsistent, supervisors react instead of control.\n\nAfter NOVA: selectors move without hesitation, codes are confirmed every pick, pallets are clean, supervisors push updates live.\n\nThat gap is where your performance budget is going right now.\n\nMost warehouses don't see it because everything still looks busy — but busy doesn't mean efficient.\n\nWant to run the trial and measure the gap in your own operation?`,
    };
  }

  // ── Pricing ────────────────────────────────────────────────────────────────
  if (lower.includes("how much") || lower.includes("price") || lower.includes("cost") || lower.includes("pricing")) {
    return {
      stage: "close",
      text: "Great question.\n\nPricing depends on team size and contract length — but here's what matters most right now: the trial is completely free for 30 days.\n\nNo credit card. No commitment. You run it, measure the results, and decide.\n\nMost teams that see real numbers move forward pretty quickly.\n\nWant to start the trial? Give me your company name and email and I'll set it up.",
    };
  }

  // ── Trial / sign-up intent ─────────────────────────────────────────────────
  if (lower.includes("trial") || lower.includes("start") || lower.includes("sign up") || lower.includes("signup")) {
    return {
      stage: "trial",
      text: "Let's go. Free 30-day trial — I'll get you set up right now.\n\nJust give me your company name and the best email for the manager or supervisor handling operations.",
    };
  }

  // ── Demo / how it works ────────────────────────────────────────────────────
  if (lower.includes("demo") || lower.includes("show me") || lower.includes("how does") || lower.includes("how does it work") || lower.includes("how it works")) {
    return {
      stage: "demo",
      text: "NOVA runs in real time while your selectors pick.\n\nIt gives voice-directed coaching, confirms check codes, catches mistakes before they ship, and gives supervisors live control of the shift.\n\nIt doesn't replace your current system — it runs on top of it.\n\nMost teams see measurable improvement in the first week.\n\nWhat's the biggest pain point in your operation right now — speed or accuracy?",
    };
  }

  // ── Open stage fallback (shouldn't normally be hit since initial stage is "greeting") ──
  if (stage === "open") {
    const nameGreet = lead.managerName ? `Thanks, ${lead.managerName}.` : "Thanks for sharing.";
    return {
      stage: "discovery",
      text: `${nameGreet}\n\nTell me about your operation — how many selectors on your team, and what's hurting you more right now: speed or accuracy?`,
    };
  }

  // ── Existing system objection ──────────────────────────────────────────────
  if (lower.includes("already have") || lower.includes("current system") || lower.includes("existing")) {
    return {
      stage: "pitch",
      text: "That's completely fine — NOVA runs on top of your current system, not instead of it.\n\nIt adds real-time coaching on the floor without replacing anything you already use.\n\nMost teams keep everything they have and just add NOVA on top.\n\nHow many selectors are on your team?",
    };
  }

  // ── No time objection ──────────────────────────────────────────────────────
  if (lower.includes("no time") || lower.includes("busy") || lower.includes("too much")) {
    return {
      stage: "pitch",
      text: "That's exactly why companies use NOVA — it runs during the shift, no extra training sessions, no classroom time.\n\nSelectors just pick and NOVA coaches them live.\n\nThe setup takes one day. After that it runs on its own.\n\nWant to see what that looks like for your team?",
    };
  }

  // ── Pain point: speed ──────────────────────────────────────────────────────
  if (pain === "speed") {
    return {
      stage: "pitch",
      text: "Speed issues usually come from lost time between picks — hesitation, poor transitions, selectors stopping instead of flowing.\n\nNOVA closes that gap.\n\nMost teams cut 10 to 15 minutes per assignment just from tighter transitions alone.\n\nIf I showed you how to get that time back, would that make a difference for your operation?",
    };
  }

  // ── Pain point: accuracy ───────────────────────────────────────────────────
  if (pain === "accuracy") {
    return {
      stage: "pitch",
      text: "Accuracy is one of the biggest things NOVA is built for.\n\nIt coaches selectors to confirm every check code, count cases out loud, and build pallets correctly — every stop, every shift.\n\nMost teams see mispick rates drop significantly in the first two weeks.\n\nIf NOVA cut your mispicks in half, would that be worth a 30-day test?",
    };
  }

  // ── Pain point: training ───────────────────────────────────────────────────
  if (pain === "training") {
    const name = lead.managerName ? `${lead.managerName}, ` : "";
    return {
      stage: "pitch",
      text: `${name}training is one of the most overlooked problems in warehousing — and nobody talks about how much it actually costs.\n\nHere's the reality: A new hire comes in excited on day one. They sit through orientation. Safety videos. Jack training. Forklift cert. Hours of it — and by the end they're already mentally drained.\n\nThen they get told "you're ready for the floor." And they walk out there...\n\nAnd it feels like chaos.\n\nPallets moving. Numbers coming fast. A voice in the headset they barely understand. Nobody told them it would feel like this.\n\nThat's when fear takes over — "Is this job even for me?" Almost every new hire thinks that in week one.\n\nSome push through. Some quit. And the ones who stay make expensive mistakes — mispicks, pallet errors, slow rates — because they were never actually prepared for what the floor feels like.\n\nNOVA changes that.\n\nWe step in after orientation and safety training — before they ever touch a real pick. We show them exactly what to expect: the picking rhythm, check code confirmations, clean pallet building, how to move between stops without losing time.\n\nBy the time they hit the floor, they already know the job. Less confusion. Less stress. Fewer injuries. And a lot less "I quit after two weeks."\n\nI always say — NOVA doesn't throw new hires into the deep end. We actually teach them to swim. 😄\n\nIt's the difference between a hire who makes it 90 days and becomes solid... and one who's gone before week three.\n\nWould it be worth running a free 30-day trial with your next batch of new hires?`,
    };
  }

  // ── Already in trial stage — form is showing, just encourage them ────────────
  if (stage === "trial" && (!lead.companyName || !lead.email)) {
    return {
      stage: "trial",
      text: "Go ahead and fill out the form — I'll get everything set up on my end as soon as you hit submit.",
    };
  }

  // ── Default: push toward trial ────────────────────────────────────────────
  return {
    stage,
    text: "Here's what I know for sure — every warehouse I've talked to has found at least one area where performance and money are slipping.\n\nThe best way to find yours is a live 30-day trial in your own operation.\n\nNo cost. No commitment. Real results.\n\nWant to get started? Just give me your company name and best email.",
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NovaSalesVoiceAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! My name is NOVA and I'll be assisting you today.\n\nIf you ever feel like I'm not the right fit, I can send a request to my boss — it usually takes about 24 hours to reply, but I'm fully certified and here to help.\n\nI hope I'm doing a good job so far!\n\nSo — what's your name?",
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<SalesStage>("greeting");
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
  const [showTrialForm, setShowTrialForm] = useState(false);
  const [trialForm, setTrialForm] = useState({ company: "", managerName: "", email: "", phone: "" });
  const [trialSubmitting, setTrialSubmitting] = useState(false);
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

  const autoListenRef  = useRef(false); // true once user has activated voice
  const speechStartRef = useRef(false); // tracks if onstart fired for current utterance

  // ── Preload voices on mount so they are available when user taps ─────────────
  useEffect(() => {
    if (!canSpeak) return;
    // Trigger voice list load — browsers populate it lazily
    window.speechSynthesis.getVoices();
    const load = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, [canSpeak]);

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
    speechStartRef.current = false;
    setTtsUnlocked(true);

    const welcome =
      "Hi! My name is NOVA and I'll be assisting you today. If you ever feel like I'm not the right fit, I can send a request to my boss — it usually takes about 24 hours to reply, but I'm fully certified and here to help. I hope I'm doing a good job so far! So — what's your name?";

    if (!canSpeak) {
      setTimeout(startListening, 300);
      return;
    }

    // Show the speaking UI immediately so the user sees feedback
    setIsSpeaking(true);
    setNowSpeakingText(welcome);

    // 3-second watchdog — if onstart never fires, speech was silently blocked
    const watchdog = setTimeout(() => {
      if (!speechStartRef.current) {
        // Speech never actually started — clear speaking state and move on
        setIsSpeaking(false);
        setNowSpeakingText("");
        setErrorMsg("Your browser blocked audio. For full voice, open the app in a new tab or use the deployed site.");
        setTimeout(startListening, 300);
      }
    }, 3000);

    novaSpeak(welcome, "en",
      // onDone
      () => {
        clearTimeout(watchdog);
        setIsSpeaking(false);
        setNowSpeakingText("");
        setTimeout(startListening, 300);
      },
      // opts — onStart fires when audio actually begins
      {
        onStart: () => {
          speechStartRef.current = true;
          clearTimeout(watchdog);
        },
      }
    );
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

  // ── Call AI for intelligent response ─────────────────────────────────────────
  const callNovaAI = useCallback(async (
    conversationMessages: Message[],
    currentStage: SalesStage,
    currentLead: LeadState,
  ): Promise<{ text: string; stage: SalesStage } | null> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const res = await fetch("/api/nova-sales-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: conversationMessages.slice(-12).map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.text,
          })),
          stage: currentStage,
          lead: {
            managerName: currentLead.managerName,
            companyName: currentLead.companyName,
            painPoint: currentLead.painPoint,
            selectors: currentLead.selectors,
          },
        }),
      });

      clearTimeout(timeout);

      if (!res.ok) return null;
      const data = await res.json();
      if (data.text && data.stage) {
        return { text: data.text, stage: data.stage as SalesStage };
      }
      return null;
    } catch {
      return null; // network error or timeout → use local fallback
    }
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isThinking) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", text, createdAt: new Date() };
    pushMessage("user", text);
    setInput("");
    setIsThinking(true);
    setErrorMsg("");

    // Update lead from text — extract name specifically during greeting stages
    const currentLead = parseLeadDetails(text, lead);
    if (guessPainPoint(text) && !currentLead.painPoint) {
      currentLead.painPoint = guessPainPoint(text)!;
    }
    if ((stage === "greeting" || stage === "name_ask") && !currentLead.managerName) {
      const firstName = extractFirstName(text);
      if (firstName) currentLead.managerName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    }
    setLead(currentLead);

    // Detect "real person" request — always handle locally
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

    // Build the full conversation history including the new user message
    const fullHistory = [...messages, userMessage];

    // Try AI first, fall back to local script if unavailable
    const aiReply = await callNovaAI(fullHistory, stage, currentLead);
    const reply = aiReply ?? buildLocalReply(text, stage, currentLead);

    setStage(reply.stage);
    pushMessage("assistant", reply.text);
    speak(reply.text.replace(/\n/g, " "));
    setIsThinking(false);

    // If moving into trial stage, show the sign-up form
    if (reply.stage === "trial" && !trialCreated) {
      if (currentLead.companyName && currentLead.email) {
        await createTrialLead(currentLead);
      } else {
        setTimeout(() => setShowTrialForm(true), 600);
      }
    }
  }, [input, isThinking, stage, lead, messages, trialCreated, pushMessage, speak, createTrialLead, callNovaAI]);

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

      {/* ── Trial sign-up form overlay ── */}
      {showTrialForm && !trialCreated && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div className="w-full max-w-md bg-[#0c1428] border border-yellow-400/40 rounded-3xl shadow-[0_0_80px_rgba(250,204,21,0.15)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0">
                <span className="text-slate-950 font-black text-sm">N</span>
              </div>
              <div>
                <p className="font-black text-white text-sm leading-none">Start Your Free 30-Day Trial</p>
                <p className="text-xs text-yellow-300 mt-0.5">No credit card. No commitment.</p>
              </div>
              <button
                onClick={() => setShowTrialForm(false)}
                className="ml-auto text-slate-600 hover:text-slate-300 transition text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!trialForm.company || !trialForm.email) return;
                setTrialSubmitting(true);

                // Stop listening while submitting
                recognitionRef.current?.stop();
                autoListenRef.current = false;

                // Hide form immediately for snappy feel
                setShowTrialForm(false);

                // Update lead with form values and create trial
                const filledLead: LeadState = {
                  companyName: trialForm.company,
                  managerName: trialForm.managerName,
                  email: trialForm.email,
                  phone: trialForm.phone,
                  painPoint: lead.painPoint,
                  selectors: lead.selectors,
                };
                setLead(filledLead);

                // NOVA acknowledges while creating the trial
                const ack = `Perfect, ${trialForm.managerName || "there"}! Creating your trial setup for ${trialForm.company} right now. One moment.`;
                pushMessage("assistant", ack);
                speak(ack);

                await createTrialLead(filledLead);
                setTrialSubmitting(false);
              }}
              className="px-6 py-5 space-y-3"
            >
              <input
                required
                placeholder="Company name *"
                value={trialForm.company}
                onChange={(e) => setTrialForm((f) => ({ ...f, company: e.target.value }))}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition"
              />
              <input
                placeholder="Your name (manager / supervisor)"
                value={trialForm.managerName}
                onChange={(e) => setTrialForm((f) => ({ ...f, managerName: e.target.value }))}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition"
              />
              <input
                type="email"
                required
                placeholder="Email address *"
                value={trialForm.email}
                onChange={(e) => setTrialForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition"
              />
              <input
                type="tel"
                placeholder="Phone number (optional)"
                value={trialForm.phone}
                onChange={(e) => setTrialForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition"
              />

              <button
                type="submit"
                disabled={trialSubmitting || !trialForm.company || !trialForm.email}
                className="w-full rounded-2xl bg-yellow-400 text-slate-950 font-black py-3.5 text-sm hover:bg-yellow-300 active:scale-95 transition disabled:opacity-50 shadow-[0_0_30px_rgba(250,204,21,0.25)]"
              >
                {trialSubmitting ? "Setting up your trial…" : "Start My 30-Day Trial →"}
              </button>

              <p className="text-center text-xs text-slate-600 pb-1">
                Free trial · No credit card · Cancel anytime
              </p>
            </form>
          </div>
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
              {stage === "greeting" || stage === "name_ask" ? "getting started" : stage === "reason_ask" ? "listening" : stage.replace("_", " ")}
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
