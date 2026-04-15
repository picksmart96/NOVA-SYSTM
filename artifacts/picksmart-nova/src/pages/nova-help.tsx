import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { askNovaHelp } from "@/lib/novaHelpApi";
import { detectStopWord } from "@/lib/novaModeRouter";
import { NovaVoiceStatus, type VoiceStateKey } from "@/components/nova/NovaVoiceStatus";
import LockedAction from "@/components/paywall/LockedAction";
import { useTalkRequestStore } from "@/lib/talkRequestStore";
import { MessageCircle, X, CheckCircle2, Send, Mic } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { usePerformanceStore } from "@/lib/performanceStore";

// ─── Detect "speak to someone" requests ──────────────────────────────────────
function isHumanRequestTrigger(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("speak to someone") || t.includes("talk to someone") ||
    t.includes("real person") || t.includes("human") || t.includes("call me") ||
    t.includes("can i speak") || t.includes("can i talk") || t.includes("talk to a person") ||
    t.includes("speak with someone") || t.includes("contact someone") ||
    t.includes("speak to a person") || t.includes("connect me") ||
    t.includes("hablar con alguien") || t.includes("hablar con una persona") ||
    t.includes("persona real") || t.includes("con alguien del equipo") ||
    t.includes("quiero hablar") || t.includes("puedo hablar con")
  );
}

const FREE_QUESTION_LIMIT = 3;

// ─── Safety check items ──────────────────────────────────────────────────────
const SAFETY_ITEMS_EN = [
  "Brakes okay?","Battery guard okay?","Horn okay?","Wheels okay?",
  "Hydraulics okay?","Controls okay?","Steering okay?","Welds okay?","Electric wiring okay?",
];
const SAFETY_ITEMS_ES = [
  "¿Frenos bien?","¿Guardia de batería bien?","¿Bocina bien?","¿Ruedas bien?",
  "¿Hidráulicos bien?","¿Controles bien?","¿Dirección bien?","¿Soldaduras bien?","¿Cableado eléctrico bien?",
];

function isSafetyTrigger(text: string): boolean {
  const t = text.toLowerCase();
  return t.includes("safety check")||t.includes("safety inspection")||t.includes("do my safety")||
    t.includes("run safety")||t.includes("start safety")||t.includes("do safety")||
    t.includes("safety walkthrough")||t.includes("revisión de seguridad")||
    t.includes("inspección de seguridad")||t.includes("chequeo de seguridad")||
    t.includes("hacer seguridad")||t.includes("iniciar seguridad");
}
function isSafetyConfirm(text: string): boolean {
  const t = text.toLowerCase().trim().replace(/[.,!?;:]+$/, "");
  const has = (...terms: string[]) => terms.some((x) => t.includes(x));
  return has("yes","yeah","yep","yea","okay","ok","correct","affirmative","right","sure","go","confirm","that's","thats")||
    t === "si"||t === "sí"||has("sí","bueno","listo","correcto");
}
function isSafetyDeny(text: string): boolean {
  const t = text.toLowerCase().trim().replace(/[.,!?;:]+$/, "");
  return t === "no"||t.startsWith("no ")||t.includes("nope")||t.includes("negative")||
    t.includes("fail")||t.includes("bad")||t.includes("broken")||t.includes("not okay")||t.includes("not ok");
}

// ─── Mood detection ──────────────────────────────────────────────────────────
function isNegativeMood(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("tired") || t.includes("exhausted") || t.includes("bad") ||
    t.includes("rough") || t.includes("hard") || t.includes("tough") ||
    t.includes("not good") || t.includes("not great") || t.includes("struggling") ||
    t.includes("stressed") || t.includes("anxious") || t.includes("sore") ||
    t.includes("hurt") || t.includes("pain") || t.includes("sick") ||
    t.includes("sad") || t.includes("depressed") || t.includes("frustrated") ||
    t.includes("worried") || t.includes("nervous") || t.includes("scared") ||
    t.includes("terrible") || t.includes("awful") || t.includes("horrible") ||
    t.includes("down") || t.includes("low") || t.includes("unmotivated") ||
    t.includes("don't want") || t.includes("dont want") || t.includes("can't do") ||
    t.includes("cant do") || t.includes("not feeling") || t.includes("feeling off") ||
    t.includes("cansado") || t.includes("mal") || t.includes("cansada") ||
    t.includes("estresado") || t.includes("difícil") || t.includes("difícil")
  );
}

function isPositiveMood(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("good") || t.includes("great") || t.includes("amazing") ||
    t.includes("awesome") || t.includes("fantastic") || t.includes("excellent") ||
    t.includes("ready") || t.includes("motivated") || t.includes("pumped") ||
    t.includes("energized") || t.includes("focused") || t.includes("strong") ||
    t.includes("confident") || t.includes("happy") || t.includes("excited") ||
    t.includes("let's go") || t.includes("lets go") || t.includes("let's do") ||
    t.includes("bien") || t.includes("listo") || t.includes("genial")
  );
}

function getNegativeMoodResponse(firstName: string, goalRate: number | null, isSpanish: boolean): string {
  const goal = goalRate ? `${goalRate}%` : "your best";
  if (isSpanish) {
    return `Oye ${firstName}, lo entiendo — a veces el día empieza pesado. Pero escúchame bien: tú estás aquí, eso ya dice mucho. Eso muestra que tienes carácter. Toma una respiración profunda, mantén el enfoque, muévete con seguridad, y deja que tu cuerpo tome el ritmo. Tu meta esta semana es ${goal}. No tienes que ser perfecto hoy — solo mejor que ayer. ¡Tú puedes! ¡Pica inteligente y cuídate!`;
  }
  return `Hey ${firstName}, I hear you — some days just start that way, and that's okay. What matters is you showed up. That already takes strength. Take a deep breath, stay focused on one pick at a time, and let your body find its rhythm. Your goal this week is ${goal}. You don't need to be perfect today — just a little better than yesterday. I'm in your corner all day. Pick smart and stay safe out there!`;
}

function getPositiveMoodResponse(firstName: string, goalRate: number | null, isSpanish: boolean): string {
  const goal = goalRate ? `${goalRate}%` : "your goal";
  if (isSpanish) {
    return `¡Eso es lo que quiero escuchar, ${firstName}! Con esa energía vas a tener un día increíble. Tu meta es ${goal} esta semana — tú puedes superar eso. Mantén el ritmo, muévete con seguridad, y recuerda: ¡Pica inteligente! Estoy aquí si necesitas algo.`;
  }
  return `That's what I like to hear, ${firstName}! With that energy you're going to have a great day. Your goal is ${goal} this week — and with that attitude you can crush it. Keep that pace up, stay safe out there, and remember — pick smart! I'm here whenever you need me.`;
}

// ─── Speech Recognition helper ───────────────────────────────────────────────
type SpeechRecognitionCtor = typeof SpeechRecognition;
function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  return (
    (window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition ||
    null
  );
}
const voiceInputSupported = !!getRecognitionCtor();

// ─── TTS ─────────────────────────────────────────────────────────────────────
function speakText(text: string, lang: string, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) { onEnd?.(); return; }
  try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 1.05;
  u.pitch = 1;
  if (onEnd) u.onend = onEnd;
  const voices = window.speechSynthesis.getVoices();
  const root = lang.split("-")[0];
  const preferred =
    voices.find((v) => /samantha|aria|ava|zira|karen/i.test(v.name) && v.lang.startsWith(root)) ||
    voices.find((v) => /samantha|aria|ava|zira|karen/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith(root));
  if (preferred) u.voice = preferred;
  window.speechSynthesis.speak(u);
}

// ─── Helper: detect when NOVA can't fully answer ──────────────────────────────
function isNovaUnsure(response: string): boolean {
  const r = response.toLowerCase();
  return (
    r.includes("i focus on warehouse") ||
    r.includes("ask me something in that area") ||
    r.includes("outside my knowledge") ||
    r.includes("i don't have specific") ||
    r.includes("i'm not sure") ||
    r.includes("not sure about that") ||
    r.includes("can't answer that") ||
    r.includes("don't have information") ||
    r.includes("contact your supervisor") ||
    r.includes("consult your") ||
    r.includes("speak to someone")
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = "idle"|"wake_listening"|"listening"|"thinking"|"speaking";
interface LogEntry { time: string; role: "NOVA"|"USER"; text: string; }

// ─── Signal Icon ─────────────────────────────────────────────────────────────
function SignalIcon({ phase }: { phase: Phase }) {
  const isWake     = phase === "wake_listening";
  const isListen   = phase === "listening";
  const isThinking = phase === "thinking";
  const isSpeaking = phase === "speaking";

  const borderColor = isSpeaking
    ? "border-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.5)]"
    : isListen ? "border-violet-400 shadow-[0_0_40px_rgba(139,92,246,0.5)]"
    : isWake   ? "border-indigo-600/60 shadow-[0_0_18px_rgba(99,102,241,0.2)]"
    : isThinking ? "border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.4)]"
    : "border-violet-700/30";

  const bgColor = isSpeaking ? "bg-purple-900/60"
    : isListen   ? "bg-violet-900/60"
    : isWake     ? "bg-indigo-950/60"
    : isThinking ? "bg-yellow-900/30"
    : "bg-[#1a1a2e]";

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      {isWake && (
        <div className="absolute inset-0 rounded-full border border-indigo-600/20 animate-[ping_3s_ease-in-out_infinite]" />
      )}
      {isListen && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-violet-400/20 animate-[ping_1.2s_ease-in-out_infinite]" />
          <div className="absolute inset-4 rounded-full border-2 border-violet-400/30 animate-[ping_1.2s_ease-in-out_0.4s_infinite]" />
        </>
      )}
      {isSpeaking && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/20 animate-[ping_1.5s_ease-in-out_infinite]" />
          <div className="absolute inset-3 rounded-full border-2 border-purple-400/30 animate-[ping_1.5s_ease-in-out_0.3s_infinite]" />
        </>
      )}
      <div className={`w-36 h-36 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${bgColor} ${borderColor}`}>
        {isSpeaking ? (
          <svg viewBox="0 0 48 48" className="w-10 h-10 text-purple-300" fill="currentColor">
            <rect x="13" y="13" width="22" height="22" rx="4" />
          </svg>
        ) : isWake ? (
          <svg viewBox="0 0 48 48" className="w-12 h-12 text-indigo-500/50" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path strokeWidth="2" d="M24 8 a6 6 0 0 1 6 6 v10 a6 6 0 0 1 -12 0 v-10 a6 6 0 0 1 6 -6z" />
            <path strokeWidth="2" d="M14 26 a10 10 0 0 0 20 0" />
            <line strokeWidth="2" x1="24" y1="36" x2="24" y2="42" />
            <line strokeWidth="2" x1="18" y1="42" x2="30" y2="42" />
          </svg>
        ) : (
          <svg viewBox="0 0 48 48" className={`w-16 h-16 transition-all duration-300 ${phase === "idle" ? "text-violet-500/60" : "text-violet-300"}`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path strokeWidth="2.5" strokeOpacity={isListen ? "1" : "0.4"} d="M8 20 C8 11.163 15.163 4 24 4 C32.837 4 40 11.163 40 20" className={isListen ? "animate-[pulse_1s_ease-in-out_infinite]" : ""} />
            <path strokeWidth="2.5" strokeOpacity={phase !== "idle" ? "0.85" : "0.5"} d="M13 25 C13 19.477 18.477 14 24 14 C29.523 14 35 19.477 35 25" />
            <path strokeWidth="2.5" d="M18 30 C18 26.686 20.686 24 24 24 C27.314 24 30 26.686 30 30" />
            <circle cx="24" cy="38" r="3" fill="currentColor" strokeWidth="0" />
          </svg>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NovaHelpPage() {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith("es");
  const ttsLang   = isSpanish ? "es-ES" : "en-US";
  const [, navigate] = useLocation();

  // ── User + performance data ──────────────────────────────────────────────
  const { currentUser } = useAuthStore();
  const { getYesterdayLog, getGoal, getWeekAvg } = usePerformanceStore();
  const firstName   = currentUser?.fullName?.split(" ")[0] ?? currentUser?.username ?? "";
  const username    = currentUser?.username ?? "";
  const yestLog     = username ? getYesterdayLog(username) : null;
  const userGoal    = username ? getGoal(username) : null;
  const weekAvg     = username ? getWeekAvg(username) : null;
  const isRealUser  = !!currentUser && !currentUser.isDemoUser;

  // ── Question counter + soft lock ──────────────────────────────────────────
  const [questionCount, setQuestionCount] = useState(0);
  const [lockedOut, setLockedOut]         = useState(false);
  const questionCountRef = useRef(0);

  // ── Talk-to-human state ───────────────────────────────────────────────────
  const { addRequest: addTalkRequest } = useTalkRequestStore();
  const [showTalkCard, setShowTalkCard]     = useState(false);
  const [talkSuggested, setTalkSuggested]  = useState(false);
  const [talkName, setTalkName]            = useState("");
  const [talkEmail, setTalkEmail]          = useState("");
  const [talkCompany, setTalkCompany]      = useState("");
  const [talkPhone, setTalkPhone]          = useState("");
  const [talkTopic, setTalkTopic]          = useState("");
  const [talkSubmitted, setTalkSubmitted]  = useState(false);

  // ── State ─────────────────────────────────────────────────────────────────
  const [phase, setPhase]               = useState<Phase>("idle");
  const [sessionActive, setSessionActive] = useState(false);
  const [answer, setAnswer]             = useState("");
  const [lastHeard, setLastHeard]       = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [textInput, setTextInput]       = useState("");
  const [errorMsg, setErrorMsg]         = useState("");
  const [log, setLog]                   = useState<LogEntry[]>([]);
  const [safetyMode, setSafetyMode]     = useState(false);
  const [safetyIndex, setSafetyIndex]   = useState(0);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const sessionActiveRef  = useRef(false);
  const recognitionRef    = useRef<SpeechRecognition | null>(null);
  const listenModeRef     = useRef<"wake"|"question"|null>(null);
  const safetyModeRef     = useRef(false);
  const safetyIndexRef    = useRef(0);
  const ttsUnlockedRef    = useRef(false);
  const moodCheckActiveRef = useRef(false);

  // Forward refs for cross-callback use
  const handleQuestionRef        = useRef<((t: string) => Promise<void>) | null>(null);
  const startWakeRef             = useRef<(() => void) | null>(null);
  const startQuestionListenRef   = useRef<(() => void) | null>(null);
  const handleSafetyCheckInputRef = useRef<((t: string) => void) | null>(null);
  const startSafetyCheckRef      = useRef<(() => void) | null>(null);

  const now = () => new Date().toLocaleTimeString("en-US", { hour12: true, hour: "numeric", minute: "2-digit", second: "2-digit" });
  const addLog = (role: "NOVA"|"USER", text: string) =>
    setLog((prev) => [{ time: now(), role, text }, ...prev].slice(0, 40));

  // ── TTS unlock (call synchronously inside click handlers) ─────────────────
  const unlockTTS = () => {
    if (ttsUnlockedRef.current || !("speechSynthesis" in window)) return;
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    const silent = new SpeechSynthesisUtterance(" ");
    silent.volume = 0;
    silent.rate = 10;
    window.speechSynthesis.speak(silent);
    ttsUnlockedRef.current = true;
  };

  // ── Stop recognition ──────────────────────────────────────────────────────
  const stopRecognition = useCallback(() => {
    listenModeRef.current = null;
    try { recognitionRef.current?.abort(); } catch { /* ignore */ }
    recognitionRef.current = null;
  }, []);

  // ── Dispatch a voice transcript ───────────────────────────────────────────
  const dispatchTranscript = useCallback((text: string, mode: "wake"|"question") => {
    const trimmed = text.trim();
    if (!trimmed || !sessionActiveRef.current) return;

    if (mode === "wake") {
      // Any phrase containing "nova" (or "hola nova" / "hey nova") activates
      if (trimmed.toLowerCase().includes("nova")) {
        stopRecognition();
        const greet = isSpanish
          ? "Sí, te escucho. ¿En qué te ayudo?"
          : "Yes? I'm listening. What's your question?";
        addLog("NOVA", greet);
        setAnswer(greet);
        setPhase("speaking");
        speakText(greet, ttsLang, () => {
          if (sessionActiveRef.current) {
            setPhase("listening");
            startQuestionListenRef.current?.();
          }
        });
      }
      return;
    }

    // ── Question mode ──────────────────────────────────────────────────────
    stopRecognition();
    addLog("USER", trimmed);
    setLastHeard(trimmed);

    if (detectStopWord(trimmed)) {
      const msg = isSpanish
        ? "Pausado. Di 'NOVA' para activarme de nuevo."
        : "Paused. Say 'NOVA' to wake me again.";
      addLog("NOVA", msg);
      setAnswer(msg);
      setPhase("speaking");
      speakText(msg, ttsLang, () => {
        if (sessionActiveRef.current) {
          setPhase("wake_listening");
          startWakeRef.current?.();
        }
      });
      return;
    }

    if (safetyModeRef.current) {
      handleSafetyCheckInputRef.current?.(trimmed);
      return;
    }
    if (isSafetyTrigger(trimmed)) {
      startSafetyCheckRef.current?.();
      return;
    }

    // If they ask for a human, route them straight to the NOVA Sales Agent
    if (isHumanRequestTrigger(trimmed)) {
      const msg = isSpanish
        ? "¡Por supuesto! Te conecto ahora con NOVA, nuestra agente de ventas."
        : "Of course! Connecting you to NOVA right now.";
      addLog("NOVA", msg);
      setAnswer(msg);
      setPhase("speaking");
      speakText(msg, ttsLang, () => { navigate("/meet-nova"); });
      return;
    }

    // ── Mood check — fires right after the opening greeting ──────────────────
    if (moodCheckActiveRef.current) {
      moodCheckActiveRef.current = false;
      const goalRate = userGoal?.targetRate ?? null;
      let moodReply: string;

      if (isNegativeMood(trimmed)) {
        moodReply = getNegativeMoodResponse(firstName, goalRate, isSpanish);
      } else if (isPositiveMood(trimmed)) {
        moodReply = getPositiveMoodResponse(firstName, goalRate, isSpanish);
      } else {
        // Neutral — acknowledge and encourage
        moodReply = isSpanish
          ? `Está bien, ${firstName}. Lo importante es que estás aquí. Un pick a la vez, con seguridad y enfoque — y llegarás. Tu meta es ${goalRate ? goalRate + "%" : "hacerlo lo mejor posible"} esta semana. ¡Pica inteligente!`
          : `Got it, ${firstName}. The important thing is you're here and ready. One pick at a time, stay focused, stay safe — and you'll get there. Your goal is ${goalRate ? goalRate + "%" : "doing your best"} this week. Pick smart!`;
      }

      addLog("NOVA", moodReply);
      setAnswer(moodReply);
      setPhase("speaking");
      speakText(moodReply, ttsLang, () => {
        if (sessionActiveRef.current) {
          const followUp = isSpanish
            ? "Sesión activa. Di 'NOVA' para preguntarme algo."
            : "Session active. Say 'NOVA' to ask me anything.";
          addLog("NOVA", followUp);
          setPhase("wake_listening");
          startWakeRef.current?.();
        }
      });
      return;
    }

    handleQuestionRef.current?.(trimmed);
  }, [isSpanish, ttsLang, stopRecognition, navigate]);

  // ── Start wake listener ───────────────────────────────────────────────────
  const startWakeListen = useCallback(() => {
    const Recognition = getRecognitionCtor();
    if (!Recognition || !sessionActiveRef.current) return;
    stopRecognition();

    const rec = new Recognition();
    recognitionRef.current = rec;
    listenModeRef.current = "wake";

    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = ttsLang;
    rec.maxAlternatives = 1;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const results = Array.from(e.results).slice(e.resultIndex);
      for (const result of results) {
        if (result.isFinal) {
          dispatchTranscript(result[0].transcript, "wake");
        }
      }
    };

    rec.onend = () => {
      // Restart if still in wake mode
      if (sessionActiveRef.current && listenModeRef.current === "wake") {
        setTimeout(() => {
          if (sessionActiveRef.current && listenModeRef.current === "wake") {
            startWakeRef.current?.();
          }
        }, 500);
      }
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "aborted" || e.error === "no-speech") return;
      if (e.error === "not-allowed") {
        setErrorMsg(isSpanish
          ? "Micrófono bloqueado. Permite el acceso al micrófono y recarga."
          : "Microphone blocked. Allow mic access and reload the page.");
        return;
      }
      // Restart on transient errors
      setTimeout(() => {
        if (sessionActiveRef.current && listenModeRef.current === "wake") {
          startWakeRef.current?.();
        }
      }, 800);
    };

    setPhase("wake_listening");
    try { rec.start(); } catch { /* ignore double-start */ }
  }, [ttsLang, isSpanish, stopRecognition, dispatchTranscript]);

  // ── Start question listener ───────────────────────────────────────────────
  const startQuestionListen = useCallback(() => {
    const Recognition = getRecognitionCtor();
    if (!Recognition || !sessionActiveRef.current) return;
    stopRecognition();

    const rec = new Recognition();
    recognitionRef.current = rec;
    listenModeRef.current = "question";

    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = ttsLang;
    rec.maxAlternatives = 1;

    let gotResult = false;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      if (transcript) {
        gotResult = true;
        dispatchTranscript(transcript, "question");
      }
    };

    rec.onend = () => {
      if (!sessionActiveRef.current || listenModeRef.current !== "question") return;
      if (!gotResult) {
        // Nothing heard — restart listening
        setTimeout(() => {
          if (sessionActiveRef.current && listenModeRef.current === "question") {
            startQuestionListenRef.current?.();
          }
        }, 400);
      }
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "aborted") return;
      if (e.error === "not-allowed") {
        setErrorMsg(isSpanish
          ? "Micrófono bloqueado. Permite el acceso al micrófono y recarga."
          : "Microphone blocked. Allow mic access and reload.");
        return;
      }
      setTimeout(() => {
        if (sessionActiveRef.current && listenModeRef.current === "question") {
          startQuestionListenRef.current?.();
        }
      }, 600);
    };

    setPhase("listening");
    try { rec.start(); } catch { /* ignore */ }
  }, [ttsLang, isSpanish, stopRecognition, dispatchTranscript]);

  // ── Ask NOVA AI ───────────────────────────────────────────────────────────
  const handleQuestion = useCallback(async (question: string) => {
    const q = question.trim();
    if (!q) return;

    // Increment question counter
    questionCountRef.current += 1;
    const newCount = questionCountRef.current;
    setQuestionCount(newCount);

    setLastQuestion(q);
    setAnswer("");
    setErrorMsg("");
    setTalkSuggested(false);
    setPhase("thinking");

    try {
      const response = await askNovaHelp(q, isSpanish ? "es" : "en");
      if (!sessionActiveRef.current) return;

      const unsure = isNovaUnsure(response);

      // After FREE_QUESTION_LIMIT questions, lock and route to NOVA Sales
      if (newCount >= FREE_QUESTION_LIMIT) {
        const lockMsg = isSpanish
          ? response + "\n\n⚡ Has hecho " + newCount + " preguntas. ¡Conectándote ahora con NOVA, nuestra agente de ventas, para darte todo lo que necesitas!"
          : response + "\n\n⚡ You've asked " + newCount + " questions — let me connect you with NOVA, our sales agent, to give you everything you need!";
        setAnswer(lockMsg);
        setPhase("speaking");
        addLog("NOVA", lockMsg);
        setLockedOut(true);
        speakText(
          isSpanish
            ? "¡Conectándote ahora con NOVA!"
            : "Connecting you to NOVA now!",
          ttsLang,
          () => { navigate("/meet-nova"); }
        );
        return;
      }

      // If NOVA isn't sure, append a human-help offer to the spoken response
      const spoken = unsure
        ? (isSpanish
            ? response + " Si necesitas más ayuda, puedes solicitar hablar con alguien de nuestro equipo."
            : response + " If you need more help, you can request to speak with someone from our team.")
        : response;

      setAnswer(response);
      setPhase("speaking");
      addLog("NOVA", response);

      speakText(spoken, ttsLang, () => {
        if (sessionActiveRef.current) {
          if (unsure) setTalkSuggested(true);
          setPhase("listening");
          startQuestionListenRef.current?.();
        }
      });
    } catch {
      const fallback = isSpanish
        ? "Tuve un problema. Pregúntame de nuevo."
        : "I had trouble answering that. Ask me again.";
      if (sessionActiveRef.current) {
        setAnswer(fallback);
        setPhase("speaking");
        addLog("NOVA", fallback);
        speakText(fallback, ttsLang, () => {
          if (sessionActiveRef.current) startQuestionListenRef.current?.();
        });
      }
    }
  }, [isSpanish, ttsLang, navigate]);

  // ── Safety check ─────────────────────────────────────────────────────────
  const safetySpeak = useCallback((text: string, onDone?: () => void) => {
    addLog("NOVA", text);
    setAnswer(text);
    setPhase("speaking");
    speakText(text, ttsLang, () => {
      onDone?.();
      if (sessionActiveRef.current) {
        setPhase("listening");
        startQuestionListenRef.current?.();
      }
    });
  }, [ttsLang]);

  const startSafetyCheck = useCallback(() => {
    safetyModeRef.current = true;
    safetyIndexRef.current = 0;
    setSafetyMode(true);
    setSafetyIndex(0);
    const items = isSpanish ? SAFETY_ITEMS_ES : SAFETY_ITEMS_EN;
    safetySpeak(isSpanish ? `Iniciando revisión de seguridad. ${items[0]}` : `Starting safety check. ${items[0]}`);
  }, [isSpanish, safetySpeak]);

  const handleSafetyCheckInput = useCallback((transcript: string) => {
    const items = isSpanish ? SAFETY_ITEMS_ES : SAFETY_ITEMS_EN;
    const idx = safetyIndexRef.current;
    const item = items[idx];
    addLog("USER", transcript);
    setLastHeard(transcript);

    if (isSafetyDeny(transcript)) {
      safetyModeRef.current = false;
      setSafetyMode(false);
      setSafetyIndex(0);
      safetySpeak(isSpanish
        ? `Fallo de seguridad: ${item} Notifica a tu supervisor.`
        : `Safety failed: ${item} Notify your supervisor.`);
      return;
    }
    if (isSafetyConfirm(transcript)) {
      const next = idx + 1;
      if (next < items.length) {
        safetyIndexRef.current = next;
        setSafetyIndex(next);
        safetySpeak(items[next]);
      } else {
        safetyModeRef.current = false;
        setSafetyMode(false);
        setSafetyIndex(0);
        safetySpeak(isSpanish
          ? "Revisión de seguridad completa. ¡Todo en orden!"
          : "Safety check complete. All systems good. Ready to pick!");
      }
      return;
    }
    safetySpeak(isSpanish ? `No escuché bien. ${item}` : `Didn't catch that. ${item}`);
  }, [isSpanish, safetySpeak]);

  // Assign forward refs
  useEffect(() => { handleQuestionRef.current        = handleQuestion;        }, [handleQuestion]);
  useEffect(() => { startWakeRef.current             = startWakeListen;       }, [startWakeListen]);
  useEffect(() => { startQuestionListenRef.current   = startQuestionListen;   }, [startQuestionListen]);
  useEffect(() => { handleSafetyCheckInputRef.current = handleSafetyCheckInput; }, [handleSafetyCheckInput]);
  useEffect(() => { startSafetyCheckRef.current      = startSafetyCheck;      }, [startSafetyCheck]);

  // ── Build personalized greeting ───────────────────────────────────────────
  const buildGreeting = (): string => {
    const name   = firstName || "there";
    const goal   = userGoal?.targetRate ?? null;
    const yRate  = yestLog?.pickRate ?? null;
    const yHours = yestLog?.hours ?? null;
    const avg    = weekAvg;

    if (isSpanish) {
      let g = `¡Hola, ${name}! Bienvenido de vuelta, yo soy NOVA, tu entrenadora de almacén.`;
      if (yRate !== null) {
        g += ` Ayer pick​easte al ${yRate}% en ${yHours ?? "?"} horas — `;
        if (goal && yRate >= goal) g += `¡superaste tu meta, excelente trabajo!`;
        else if (goal) g += `casi llegas a tu meta de ${goal}%, hoy puedes lograrlo.`;
        else g += `buen número, sigue así.`;
      }
      if (avg !== null) g += ` Tu promedio de esta semana es ${avg}%.`;
      if (goal) g += ` Tu objetivo esta semana es ${goal}% — ¡tú puedes llegar ahí!`;
      else g += ` Log​ea tu meta en el Leaderboard para que pueda ayudarte mejor.`;
      g += ` Recuerda: muévete con seguridad, piensa cada pick, y ¡Pica Inteligente! Ahora dime, ¿cómo te sientes hoy?`;
      return g;
    }

    let g = `Hey ${name}! Welcome back — I'm NOVA, your personal warehouse coach.`;
    if (yRate !== null) {
      g += ` Yesterday you hit ${yRate}% in ${yHours ?? "?"} hours — `;
      if (goal && yRate >= goal) g += `that's above your goal, amazing work!`;
      else if (goal) g += `you're ${goal - yRate}% away from your goal of ${goal}%, let's close that gap today.`;
      else g += `solid performance, keep that up.`;
    }
    if (avg !== null) g += ` Your 7-day average is sitting at ${avg}%.`;
    if (goal) g += ` Your target this week is ${goal}% — I believe you can hit it.`;
    else g += ` Head over to the Leaderboard to set a weekly goal so I can track it with you.`;
    g += ` Always be safe out there, pick smart, and let's make today count. Now tell me — how are you feeling today?`;
    return g;
  };

  // ── Session start ─────────────────────────────────────────────────────────
  const startSession = () => {
    // Unlock TTS synchronously on this user gesture
    unlockTTS();

    sessionActiveRef.current = true;
    safetyModeRef.current = false;
    moodCheckActiveRef.current = false;
    setSafetyMode(false);
    setSafetyIndex(0);
    setSessionActive(true);
    setAnswer("");
    setLastHeard("");
    setLastQuestion("");
    setErrorMsg("");
    setLog([]);

    // Personalized greeting for logged-in users
    if (isRealUser && firstName) {
      const greeting = buildGreeting();
      addLog("NOVA", greeting);
      setAnswer(greeting);
      setPhase("speaking");
      moodCheckActiveRef.current = true;
      speakText(greeting, ttsLang, () => {
        if (sessionActiveRef.current) {
          // After greeting, listen for mood response
          setPhase("listening");
          startQuestionListenRef.current?.();
        }
      });
    } else {
      const hint = isSpanish
        ? "Sesión activa. Di 'NOVA' para que te escuche."
        : "Session active. Say 'NOVA' anytime to wake me.";
      addLog("NOVA", hint);
      setAnswer(hint);
      setPhase("speaking");
      speakText(hint, ttsLang, () => {
        if (sessionActiveRef.current) {
          setPhase("wake_listening");
          startWakeRef.current?.();
        }
      });
    }
  };

  // ── Session end ───────────────────────────────────────────────────────────
  const endSession = () => {
    sessionActiveRef.current = false;
    safetyModeRef.current = false;
    setSafetyMode(false);
    setSafetyIndex(0);
    stopRecognition();
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    setSessionActive(false);
    setPhase("idle");
    setAnswer("");
    setLastHeard("");
    setLastQuestion("");
    setErrorMsg("");
    ttsUnlockedRef.current = false;
  };

  // ── Stop NOVA speaking ─────────────────────────────────────────────────────
  const stopSpeaking = () => {
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    if (sessionActiveRef.current) {
      setPhase("listening");
      startQuestionListenRef.current?.();
    }
  };

  // ── Text submit ────────────────────────────────────────────────────────────
  const handleTextSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = textInput.trim();
    if (!q) return;
    // Re-unlock TTS on every text submit (keeps audio warm for async responses)
    unlockTTS();
    if (!sessionActive) {
      sessionActiveRef.current = true;
      setSessionActive(true);
      setLog([]);
    }
    stopRecognition();
    setTextInput("");

    if (safetyModeRef.current) {
      handleSafetyCheckInputRef.current?.(q);
      return;
    }
    if (isSafetyTrigger(q)) {
      startSafetyCheckRef.current?.();
      return;
    }

    // Human request → go straight to NOVA Sales Agent
    if (isHumanRequestTrigger(q)) {
      navigate("/meet-nova");
      return;
    }

    addLog("USER", q);
    setLastQuestion(q);
    await handleQuestion(q);
  };

  // ── Voice states ──────────────────────────────────────────────────────────
  const voiceStateKey: VoiceStateKey =
    phase === "wake_listening" ? "wake_listening"
    : phase === "listening"    ? "active_listening"
    : phase === "thinking"     ? "thinking"
    : phase === "speaking"     ? "speaking"
    : "idle";

  const phaseTitle = !sessionActive
    ? isSpanish ? "Di 'NOVA' para activar" : "Say 'NOVA' to activate"
    : safetyMode
    ? isSpanish
        ? `Revisión de seguridad · Ítem ${safetyIndex + 1} de ${SAFETY_ITEMS_EN.length}`
        : `Safety check · Item ${safetyIndex + 1} of ${SAFETY_ITEMS_EN.length}`
    : phase === "wake_listening"
    ? isSpanish ? "Di 'NOVA' para activarme" : "Say 'NOVA' to wake me"
    : phase === "listening"
    ? isSpanish ? "Escuchando tu pregunta…" : "Listening for your question…"
    : phase === "thinking"
    ? isSpanish ? "NOVA pensando…" : "NOVA thinking…"
    : phase === "speaking"
    ? isSpanish ? "Toca para interrumpir" : "Tap to interrupt NOVA"
    : isSpanish ? "Listo" : "Ready";

  const micLabel =
    phase === "wake_listening"
    ? isSpanish ? "Esperando 'NOVA'…" : "Waiting for 'NOVA'…"
    : phase === "listening"
    ? isSpanish ? "🔴 Escuchando" : "🔴 Listening"
    : phase === "speaking"
    ? isSpanish ? "⏹ Toca para parar" : "⏹ Tap to stop"
    : "";

  // Cleanup
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    return () => {
      sessionActiveRef.current = false;
      stopRecognition();
      try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    };
  }, [stopRecognition]);

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white flex flex-col">
      {/* Top bar */}
      <div className="bg-[#141428] border-b border-white/5 px-6 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">N</div>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-none">NOVA Help</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {isSpanish ? "Entrenador de voz — almacén" : "Warehouse voice coach"}
          </p>
        </div>
        {sessionActive && (
          <div className="flex items-center gap-3">
            <NovaVoiceStatus state={voiceStateKey} />
            <button
              onClick={endSession}
              className="text-xs text-slate-500 hover:text-red-400 transition px-3 py-1.5 rounded-lg border border-white/5 hover:border-red-500/30"
            >
              {isSpanish ? "Terminar ✕" : "End Session ✕"}
            </button>
          </div>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6 max-w-lg mx-auto w-full">

        {/* Signal orb — tap to stop NOVA while speaking */}
        <button
          onClick={phase === "speaking" ? stopSpeaking : undefined}
          disabled={phase !== "speaking"}
          className={["focus:outline-none transition-transform duration-200",
            phase === "speaking" ? "cursor-pointer active:scale-95" : "cursor-default",
          ].join(" ")}
          aria-label={phase === "speaking" ? "Stop speaking" : undefined}
        >
          <SignalIcon phase={phase} />
        </button>

        {/* Title */}
        <div className="text-center space-y-1.5">
          <h1 className="text-4xl font-black tracking-tight">NOVA</h1>
          <p className="text-slate-300 text-base">
            {isSpanish ? "Entrenador de voz para almacén" : "Warehouse voice picking trainer"}
          </p>
          <p className={`text-sm font-medium ${
            phase === "wake_listening" ? "text-indigo-400/70"
            : phase === "listening"   ? "text-violet-400"
            : phase === "speaking"    ? "text-purple-400"
            : "text-slate-400"
          }`}>
            {phaseTitle}
          </p>
          {micLabel && (
            <p className={`text-xs font-semibold uppercase tracking-widest ${
              phase === "wake_listening" ? "text-indigo-500/60" : "text-violet-400 animate-pulse"
            }`}>
              {micLabel}
            </p>
          )}
        </div>

        {!voiceInputSupported && (
          <div className="w-full rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-yellow-300 text-sm text-center">
            {isSpanish
              ? "El modo de voz requiere Chrome. Usa el campo de texto abajo."
              : "Voice mode requires Chrome. Use the text field below to ask NOVA."}
          </div>
        )}

        {errorMsg && (
          <div className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-red-300 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {/* Stop button while speaking */}
        {sessionActive && phase === "speaking" && (
          <button
            onClick={stopSpeaking}
            className="w-full py-4 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 hover:border-red-500/70 text-red-300 font-bold text-base tracking-wide transition-all duration-200 active:scale-95"
          >
            {isSpanish ? "⏹ Parar" : "⏹ Stop"}
          </button>
        )}

        {/* Safety check progress */}
        {sessionActive && safetyMode && (
          <div className="w-full rounded-xl border border-yellow-400/40 bg-yellow-400/8 px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest">
                {isSpanish ? "🛡 Revisión de Seguridad" : "🛡 Safety Check"}
              </p>
              <p className="text-xs text-yellow-300/70 font-semibold">
                {safetyIndex + 1} / {SAFETY_ITEMS_EN.length}
              </p>
            </div>
            <div className="flex gap-1 mb-3">
              {SAFETY_ITEMS_EN.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < safetyIndex ? "bg-green-400" : i === safetyIndex ? "bg-yellow-400 animate-pulse" : "bg-slate-700"
                }`} />
              ))}
            </div>
            <p className="text-sm font-semibold text-yellow-200">
              {(isSpanish ? SAFETY_ITEMS_ES : SAFETY_ITEMS_EN)[safetyIndex]}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              {isSpanish ? "Di 'sí' para confirmar o 'no' si falla" : "Say 'okay' to confirm or 'no' if failed"}
            </p>
          </div>
        )}

        {/* Info panels */}
        {sessionActive && (
          <div className="w-full space-y-3">
            {lastHeard && (
              <div className="rounded-xl border border-white/5 bg-white/3 px-4 py-3 flex gap-3 items-start">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mt-0.5">
                  {isSpanish ? "Oí" : "Heard"}
                </span>
                <p className="text-slate-300 text-sm">{lastHeard}</p>
              </div>
            )}
            {lastQuestion && lastQuestion !== lastHeard && (
              <div className="rounded-xl border border-white/5 bg-white/3 px-4 py-3 flex gap-3 items-start">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mt-0.5">
                  {isSpanish ? "Tú" : "You"}
                </span>
                <p className="text-slate-300 text-sm">{lastQuestion}</p>
              </div>
            )}
            {answer && (
              <div className="rounded-2xl border border-violet-500/20 bg-violet-950/30 px-5 py-4">
                <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-2">NOVA</p>
                <p className="text-white text-base leading-relaxed">{answer}</p>
              </div>
            )}

            {/* Talk suggestion banner (shown when NOVA can't fully answer) */}
            {talkSuggested && !talkSubmitted && (
              <div className="rounded-2xl border border-yellow-400/40 bg-yellow-500/10 px-5 py-4">
                <p className="text-yellow-200 font-bold text-sm mb-1">
                  {isSpanish ? "¿Quieres hablar con alguien?" : "Want to talk to someone?"}
                </p>
                <p className="text-slate-400 text-xs mb-3">
                  {isSpanish
                    ? "NOVA no pudo responder completamente. Conectándote con nuestra agente de ventas."
                    : "NOVA couldn't fully answer that. Let me connect you with our sales agent."}
                </p>
                <button
                  onClick={() => navigate("/meet-nova")}
                  className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-yellow-300 transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  {isSpanish ? "Hablar con NOVA ⚡" : "Talk to NOVA ⚡"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Wake word / Pause chips */}
        {sessionActive && (
          <div className="w-full flex gap-3 text-center">
            <div className={`flex-1 rounded-xl border px-3 py-2.5 transition-all duration-300 ${
              phase === "wake_listening" ? "border-indigo-500/40 bg-indigo-950/40" : "border-white/5 bg-[#0f0f20]"
            }`}>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1">
                {isSpanish ? "Activa" : "Wake"}
              </p>
              <p className={`text-xs font-bold ${phase === "wake_listening" ? "text-indigo-300" : "text-indigo-500"}`}>
                {isSpanish ? "Di 'NOVA'" : "Say 'NOVA'"}
              </p>
            </div>
            <div className={`flex-1 rounded-xl border px-3 py-2.5 transition-all duration-300 ${
              phase === "listening" ? "border-violet-500/40 bg-violet-950/40" : "border-white/5 bg-[#0f0f20]"
            }`}>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1">
                {isSpanish ? "Pausa" : "Pause"}
              </p>
              <p className="text-xs text-red-400 font-bold">
                {isSpanish ? "Di 'Parar'" : "Say 'Stop'"}
              </p>
            </div>
            <div className="flex-1 rounded-xl border border-white/5 bg-[#0f0f20] px-3 py-2.5">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1">
                {isSpanish ? "Modo" : "Mode"}
              </p>
              <p className="text-xs text-green-400 font-bold">
                {isSpanish ? "Sin manos" : "Hands-free"}
              </p>
            </div>
          </div>
        )}

        {/* Talk request form */}
        {showTalkCard && !talkSubmitted && (
          <div className="w-full rounded-2xl border border-yellow-400/30 bg-[#1a1a2e] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-yellow-400" />
                <p className="text-yellow-300 font-bold text-sm">
                  {isSpanish ? "Habla con nuestro equipo" : "Talk to our team"}
                </p>
              </div>
              <button onClick={() => setShowTalkCard(false)} className="text-slate-500 hover:text-slate-300">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-slate-400 text-xs mb-4">
              {isSpanish
                ? "Déjanos tu información y te contactaremos pronto."
                : "Leave your info and we'll reach out to you."}
            </p>
            <div className="space-y-2.5">
              <input
                value={talkName}
                onChange={(e) => setTalkName(e.target.value)}
                placeholder={isSpanish ? "Nombre completo *" : "Full name *"}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition"
              />
              <input
                value={talkEmail}
                onChange={(e) => setTalkEmail(e.target.value)}
                placeholder={isSpanish ? "Correo electrónico *" : "Email address *"}
                type="email"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition"
              />
              <input
                value={talkCompany}
                onChange={(e) => setTalkCompany(e.target.value)}
                placeholder={isSpanish ? "Empresa / almacén" : "Company / warehouse"}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition"
              />
              <input
                value={talkPhone}
                onChange={(e) => setTalkPhone(e.target.value)}
                placeholder={isSpanish ? "Teléfono" : "Phone number"}
                type="tel"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition"
              />
              <textarea
                value={talkTopic}
                onChange={(e) => setTalkTopic(e.target.value)}
                placeholder={isSpanish ? "¿De qué quieres hablar? *" : "What do you want to talk about? *"}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition resize-none"
              />
              <button
                disabled={!talkName.trim() || !talkEmail.trim() || !talkTopic.trim()}
                onClick={() => {
                  addTalkRequest({
                    name: talkName.trim(),
                    email: talkEmail.trim(),
                    company: talkCompany.trim(),
                    phone: talkPhone.trim(),
                    topic: talkTopic.trim(),
                  });
                  setTalkSubmitted(true);
                  setShowTalkCard(false);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-yellow-400 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                {isSpanish ? "Enviar solicitud" : "Send request"}
              </button>
            </div>
          </div>
        )}

        {/* Talk request submitted confirmation */}
        {talkSubmitted && (
          <div className="w-full rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-green-300 font-bold text-sm">
                {isSpanish ? "¡Solicitud enviada!" : "Request sent!"}
              </p>
              <p className="text-slate-400 text-xs mt-1">
                {isSpanish
                  ? "Nos pondremos en contacto contigo pronto."
                  : "We'll reach out to you soon."}
              </p>
            </div>
          </div>
        )}

        {/* Question counter progress bar */}
        {sessionActive && questionCount > 0 && questionCount < FREE_QUESTION_LIMIT && (
          <div className="w-full rounded-xl border border-white/5 bg-white/3 px-4 py-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                {isSpanish ? "Preguntas gratis" : "Free questions"}
              </span>
              <span className="text-[10px] font-bold text-yellow-400">
                {questionCount} / {FREE_QUESTION_LIMIT}
              </span>
            </div>
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                style={{ width: `${(questionCount / FREE_QUESTION_LIMIT) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              {isSpanish
                ? `Después de ${FREE_QUESTION_LIMIT} preguntas, te conectamos con NOVA.`
                : `After ${FREE_QUESTION_LIMIT} questions, we connect you with NOVA.`}
            </p>
          </div>
        )}

        {/* Lock overlay — after 3 questions */}
        {lockedOut && (
          <div className="w-full rounded-2xl border border-yellow-400/40 bg-yellow-400/5 p-6 text-center">
            <div className="text-4xl mb-3">⚡</div>
            <p className="text-yellow-300 font-black text-lg mb-1">
              {isSpanish ? "¡Conectándote con NOVA!" : "Connecting you to NOVA!"}
            </p>
            <p className="text-slate-400 text-sm mb-4">
              {isSpanish
                ? "Has usado tus preguntas gratis. NOVA, nuestra agente de ventas, puede darte todo lo que necesitas."
                : "You've used your free questions. NOVA, our sales agent, can give you everything you need."}
            </p>
            <button
              onClick={() => navigate("/meet-nova")}
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition"
            >
              {isSpanish ? "Hablar con NOVA ahora →" : "Talk to NOVA now →"}
            </button>
          </div>
        )}

        {/* Persistent "Talk to a person" button → routes to NOVA Sales Agent */}
        {sessionActive && !lockedOut && (
          <button
            onClick={() => navigate("/meet-nova")}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/3 py-2.5 text-xs font-semibold text-slate-400 hover:border-yellow-400/40 hover:text-yellow-300 transition"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {isSpanish ? "Hablar con alguien de nuestro equipo" : "Talk to someone on our team"}
          </button>
        )}

        {/* Start / text input */}
        {!sessionActive ? (
          <div className="w-full space-y-3">
            {/* Personalized greeting card for logged-in users */}
            {isRealUser && firstName && (
              <div className="rounded-2xl border border-violet-500/30 bg-violet-950/40 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">N</div>
                  <span className="text-violet-300 text-xs font-bold uppercase tracking-wider">NOVA</span>
                </div>
                <p className="text-white text-sm leading-relaxed mb-1">
                  <span className="font-bold text-yellow-300">Hey {firstName}!</span> Welcome back.
                  {yestLog
                    ? <> Yesterday you hit <span className="font-bold text-green-400">{yestLog.pickRate}%</span> in {yestLog.hours}h.{" "}
                        {userGoal
                          ? yestLog.pickRate >= userGoal.targetRate
                            ? <span className="text-green-400">Above your goal — amazing!</span>
                            : <span className="text-yellow-400">Your goal is {userGoal.targetRate}% — let's close that gap today.</span>
                          : null}
                      </>
                    : userGoal
                      ? <> Your goal this week is <span className="font-bold text-yellow-400">{userGoal.targetRate}%</span>. Let's go after it.</>
                      : <> Log your performance on the Leaderboard so I can track it with you.</>}
                </p>
                <p className="text-slate-400 text-xs mt-2">Tap the button below — NOVA will greet you by voice and ask how you're feeling today.</p>
              </div>
            )}
            <LockedAction onAllowedClick={startSession} className="w-full">
              <button className="w-full py-5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold text-lg tracking-wide transition-all duration-200 shadow-[0_0_30px_rgba(139,92,246,0.35)] flex items-center justify-center gap-3">
                <Mic className="h-5 w-5" />
                {isRealUser && firstName
                  ? (isSpanish ? `¡Hola ${firstName}! Toca para activar NOVA` : `Tap to Hear NOVA Greet You`)
                  : (isSpanish ? "Iniciar Sesión" : "Start Session")}
              </button>
            </LockedAction>
          </div>
        ) : (
          <form onSubmit={handleTextSubmit} className="w-full flex gap-3">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={phase === "thinking"}
              placeholder={isSpanish ? "O escribe tu pregunta…" : "Or type your question…"}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || phase === "thinking"}
              className="rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-3 font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              →
            </button>
          </form>
        )}

        {/* Session log */}
        {log.length > 0 && (
          <div className="w-full">
            <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-2">
              {isSpanish ? "Registro de sesión" : "Session log"}
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {log.map((entry, i) => (
                <div key={i} className={`flex gap-2 text-xs ${entry.role === "NOVA" ? "text-violet-300" : "text-slate-400"}`}>
                  <span className="shrink-0 text-slate-600">{entry.time}</span>
                  <span className={`font-bold shrink-0 ${entry.role === "NOVA" ? "text-violet-500" : "text-slate-500"}`}>
                    {entry.role === "NOVA" ? "NOVA" : isSpanish ? "Tú" : "You"}
                  </span>
                  <span className="leading-relaxed">{entry.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
