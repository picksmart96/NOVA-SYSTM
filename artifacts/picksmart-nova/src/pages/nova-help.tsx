import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { askNovaHelp, type ChatMessage } from "@/lib/novaHelpApi";
import { detectStopWord } from "@/lib/novaModeRouter";
import { NovaVoiceStatus, type VoiceStateKey } from "@/components/nova/NovaVoiceStatus";
import LockedAction from "@/components/paywall/LockedAction";
import { useTalkRequestStore } from "@/lib/talkRequestStore";
import { MessageCircle, X, CheckCircle2, Send, Mic, BarChart2, Target, Zap, ClipboardList, Clock, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { usePerformanceStore } from "@/lib/performanceStore";

const PERF_STANDARD_UPH = 90;

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

const FREE_QUESTION_LIMIT_GUEST = 3;
const FREE_QUESTION_LIMIT_MEMBER = 9999;

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
  const t = text.toLowerCase().trim().replace(/[.,!?;:'"]+$/, "");
  const has = (...terms: string[]) => terms.some((x) => t.includes(x));
  return (
    has("yes","yeah","yep","yea","yup","okay","ok","correct","affirmative","right",
        "sure","go","confirm","that's","thats","good","looks good","all good",
        "checked","works","working","fine","clear","check","all clear","ready",
        "it's fine","its fine","good to go","ten four","10-4","roger","copy") ||
    t === "si" || t === "sí" || t === "aye" || t === "check" ||
    has("sí","bueno","listo","correcto","bien","perfecto","claro","de acuerdo","está bien","esta bien")
  );
}
function isSafetyDeny(text: string): boolean {
  const t = text.toLowerCase().trim().replace(/[.,!?;:'"]+$/, "");
  return (
    t === "no" || t.startsWith("no ") || t.endsWith(" no") ||
    t.includes("nope") || t.includes("negative") ||
    t.includes("fail") || t.includes("bad") || t.includes("broken") ||
    t.includes("not okay") || t.includes("not ok") || t.includes("doesn't work") ||
    t.includes("doesn't") || t.includes("does not") || t.includes("not working") ||
    t.includes("issue") || t.includes("problem") || t.includes("damaged") ||
    t.includes("no good") || t.includes("malo") || t.includes("roto") ||
    t.includes("falla") || t.includes("no funciona")
  );
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
// Safety timer ensures onEnd always fires even when iOS TTS silently fails
// (a known WebKit bug where SpeechSynthesisUtterance.onend never fires for
// auto-triggered or background utterances).
function speakText(text: string, lang: string, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) { onEnd?.(); return; }
  try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 1.05;
  u.pitch = 1;

  let done = false;
  const safetyMs = Math.max(6000, text.length * 75 + 3000);
  const safetyTimer = onEnd
    ? setTimeout(() => { if (!done) { done = true; onEnd(); } }, safetyMs)
    : undefined;

  if (onEnd) {
    u.onend = () => {
      if (!done) {
        done = true;
        clearTimeout(safetyTimer);
        // 3000 ms gap: iOS needs time to release the TTS playback audio session
        // before SpeechRecognition can claim the mic (especially over Bluetooth
        // where the A2DP → HFP profile switch itself takes 1-2 seconds).
        setTimeout(onEnd, 3000);
      }
    };
    // On error fire immediately — there's no audio session to release.
    u.onerror = () => { if (!done) { done = true; clearTimeout(safetyTimer); onEnd(); } };
  }

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
  const { getYesterdayLog, getGoal, getWeekAvg, logToday, getRecentLogs, getTodayLog, setGoal } = usePerformanceStore();
  const firstName   = currentUser?.fullName?.split(" ")[0] ?? currentUser?.username ?? "";
  const username    = currentUser?.username ?? "";
  const yestLog     = username ? getYesterdayLog(username) : null;
  const userGoal    = username ? getGoal(username) : null;
  const weekAvg     = username ? getWeekAvg(username) : null;
  const isRealUser  = !!currentUser && !currentUser.isDemoUser;
  const FREE_QUESTION_LIMIT = isRealUser ? FREE_QUESTION_LIMIT_MEMBER : FREE_QUESTION_LIMIT_GUEST;

  // ── Tab navigation ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"coach" | "performance">("coach");

  // ── Performance tracker (My Performance tab) ──────────────────────────────
  const perfUsername  = currentUser?.username ?? "";
  const perfTodayLog  = perfUsername ? getTodayLog(perfUsername) : null;
  const perfRecentLogs = perfUsername ? getRecentLogs(perfUsername, 7) : [];
  const perfGoal      = perfUsername ? getGoal(perfUsername) : null;

  const [perfCases, setPerfCases] = useState(perfTodayLog?.cases?.toString() ?? "");
  const [perfHours, setPerfHours] = useState(perfTodayLog?.hours?.toString() ?? "");
  const [perfGoalInput, setPerfGoalInput] = useState(perfGoal?.targetRate?.toString() ?? "");
  const [perfNote, setPerfNote]   = useState(perfTodayLog?.note ?? "");
  const [perfSaved, setPerfSaved] = useState(false);

  const perfCasesNum = parseFloat(perfCases) || 0;
  const perfHoursNum = parseFloat(perfHours) || 0;
  const perfGoalNum  = parseFloat(perfGoalInput) || 0;
  const liveUPH      = perfHoursNum > 0 ? Math.round(perfCasesNum / perfHoursNum) : 0;
  const liveEff      = liveUPH > 0 ? Math.round((liveUPH / PERF_STANDARD_UPH) * 100) : 0;

  const novaFeedback = (): string => {
    if (!liveUPH) return isSpanish
      ? "Ingresa tus números y te ayudo a entender tu rendimiento."
      : "Enter your shift numbers and I'll help you understand your pace.";
    if (liveEff >= 110) return isSpanish
      ? `¡Destacado! Con ${liveUPH} UPH estás ${liveEff - 100}% por encima del estándar. ¡Eres un selector de alto rendimiento — sigue así!`
      : `Outstanding! At ${liveUPH} UPH you're ${liveEff - 100}% above standard. You're a top performer — keep that pace!`;
    if (liveEff >= 100) return isSpanish
      ? `¡En objetivo! Con ${liveUPH} UPH estás cumpliendo el estándar de ${PERF_STANDARD_UPH}. Enfócate en mantener la consistencia.`
      : `On target! At ${liveUPH} UPH you're hitting the ${PERF_STANDARD_UPH} standard. Focus on keeping that consistency.`;
    if (liveEff >= 85) return isSpanish
      ? `¡Casi llegas! Con ${liveUPH} UPH estás ${100 - liveEff}% por debajo. Pequeñas mejoras en tu ruta suman mucho.`
      : `Getting close! At ${liveUPH} UPH you're ${100 - liveEff}% below standard. Small improvements in your pick path add up fast.`;
    return isSpanish
      ? `Con ${liveUPH} UPH estás ${100 - liveEff}% por debajo del estándar de ${PERF_STANDARD_UPH}. Reduce el tiempo muerto entre picks y optimiza tu ruta.`
      : `At ${liveUPH} UPH you're ${100 - liveEff}% below the ${PERF_STANDARD_UPH} standard. Focus on reducing dead time between picks and tightening your path.`;
  };

  const handlePerfSave = () => {
    if (!perfUsername || perfCasesNum <= 0 || perfHoursNum <= 0) return;
    const eff = liveUPH > 0 ? Math.round((liveUPH / PERF_STANDARD_UPH) * 100) : 0;
    logToday(perfUsername, eff, perfHoursNum, perfNote.trim() || undefined, perfCasesNum, liveUPH);
    if (perfGoalNum > 0) setGoal(perfUsername, perfGoalNum);
    setPerfSaved(true);
    setTimeout(() => setPerfSaved(false), 3000);
  };

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
  const [diagMsg, setDiagMsg]           = useState("");   // visible mic diagnostics
  const [log, setLog]                   = useState<LogEntry[]>([]);
  const [safetyMode, setSafetyMode]     = useState(false);
  const [safetyIndex, setSafetyIndex]   = useState(0);
  const [chatHistory, setChatHistory]   = useState<ChatMessage[]>([]);
  const chatHistoryRef                  = useRef<ChatMessage[]>([]);
  // Always-on wake detection
  const [alwaysListening, setAlwaysListening] = useState(false);
  const [ttsReady,        setTtsReady]        = useState(false);
  // Auto-restart countdown after session ends
  const [autoRestartCount, setAutoRestartCount] = useState(0);
  const autoRestartTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const sessionActiveRef   = useRef(false);
  const recognitionRef     = useRef<SpeechRecognition | null>(null);
  const listenModeRef      = useRef<"wake"|"question"|null>(null);
  const safetyModeRef      = useRef(false);
  const safetyIndexRef     = useRef(0);
  const ttsUnlockedRef     = useRef(false);
  const moodCheckActiveRef = useRef(false);
  // Always-on wake refs
  const alwaysRecRef       = useRef<any>(null);
  const alwaysActiveRef    = useRef(false);
  const ttsReadyRef        = useRef(false);

  // ── Screen lock / audio keep-alive refs ───────────────────────────────────
  const wakeLockRef        = useRef<WakeLockSentinel | null>(null);
  const audioCtxRef        = useRef<AudioContext | null>(null);
  const keepAliveNodeRef   = useRef<OscillatorNode | null>(null);
  // Bluetooth HFP mic stream — kept alive while recognition is active so iOS
  // stays on the HFP (hands-free) profile instead of dropping back to A2DP.
  const btStreamRef        = useRef<MediaStream | null>(null);

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

  // ── Bluetooth HFP session management ─────────────────────────────────────
  //
  // On iOS, Bluetooth headphones default to A2DP (high-quality output only).
  // Speech recognition needs the HFP profile (which carries the mic channel).
  // The ONLY reliable way to get HFP is:
  //   1. Call getUserMedia() within a user gesture (tap).
  //   2. KEEP the resulting stream alive (tracks NOT stopped) for the whole session.
  //      While the stream lives, iOS holds HFP open — no mid-session profile switches.
  //   3. Stop the tracks only when the session ends.
  //
  // Any call to .stop() on the tracks during the session drops iOS back to A2DP,
  // requiring another 1–2 s switch before the next recognition attempt — which
  // is the root cause of the "mic doesn't work with Bluetooth" bug.

  const releaseBtStream = useCallback(() => {
    try { btStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
    btStreamRef.current = null;
  }, []);

  // Call this ONCE at session start within the user-gesture callback.
  // Returns the stream (or null on permission error).
  const openBtStream = useCallback(async (): Promise<MediaStream | null> => {
    releaseBtStream();
    if (!navigator.mediaDevices?.getUserMedia) return null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      btStreamRef.current = stream;   // ← keep alive for entire session
      return stream;
    } catch (err: any) {
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setErrorMsg(isSpanish
          ? "Micrófono bloqueado. Ve a Ajustes → Safari → Micrófono y permite el acceso."
          : "Mic blocked. Go to Settings → Safari → Microphone and allow access.");
      }
      return null;
    }
  }, [isSpanish, releaseBtStream]);

  // ── startRecWithBT ────────────────────────────────────────────────────────
  //
  // Strategy: getUserMedia (held since startSession tap) established HFP.
  // Before calling rec.start() we RELEASE the getUserMedia tracks so iOS
  // doesn't have two APIs competing for the same capture device.
  // HFP stays engaged briefly after the stream is released; recognition
  // grabs the BT mic during that window.
  //
  // If the stream already died, we re-open it first to re-establish HFP,
  // wait 700 ms for the BT profile switch, release it, then start.
  //
  const startRecWithBT = useCallback((
    rec: SpeechRecognition,
    mode: "wake" | "question"
  ): void => {
    // getUserMedia was causing `aborted` on iOS — holding the audio input
    // stream blocks SpeechRecognition from claiming the same mic device.
    // Solution: release any stream we hold, then let SpeechRecognition
    // handle the BT routing entirely on its own.
    releaseBtStream();

    if (!sessionActiveRef.current || listenModeRef.current !== mode) return;

    setDiagMsg("🎤 mic open…");
    try {
      rec.start();
    } catch (e: any) {
      setDiagMsg(`rec.start err: ${e?.message ?? String(e)}`);
    }
  }, [releaseBtStream]);

  // ── Wake Lock — keeps screen on while NOVA is active ─────────────────────
  const requestWakeLock = useCallback(async () => {
    if (!("wakeLock" in navigator)) return;
    try {
      if (wakeLockRef.current) return;
      wakeLockRef.current = await (navigator as Navigator & { wakeLock: { request(type: string): Promise<WakeLockSentinel> } }).wakeLock.request("screen");
      wakeLockRef.current.addEventListener("release", () => {
        wakeLockRef.current = null;
      });
    } catch { /* permission denied or device doesn't support */ }
  }, []);

  const releaseWakeLock = useCallback(() => {
    try { wakeLockRef.current?.release(); } catch { /* ignore */ }
    wakeLockRef.current = null;
  }, []);

  // ── Silent AudioContext — keeps iOS audio session alive ───────────────────
  const startAudioKeepAlive = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx || audioCtxRef.current) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.00001;
      osc.frequency.value = 1;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      keepAliveNodeRef.current = osc;
    } catch { /* ignore */ }
  }, []);

  const stopAudioKeepAlive = useCallback(() => {
    try { keepAliveNodeRef.current?.stop(); } catch { /* ignore */ }
    try { audioCtxRef.current?.close(); } catch { /* ignore */ }
    keepAliveNodeRef.current = null;
    audioCtxRef.current = null;
  }, []);

  // ── Visibility change — restart mic immediately when screen unlocks ────────
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (!sessionActiveRef.current) return;

      // Re-request wake lock (OS releases it when screen locks)
      requestWakeLock();

      // Resume AudioContext if suspended
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }

      // Restart recognition in whichever mode was active
      const mode = listenModeRef.current;
      setTimeout(() => {
        if (!sessionActiveRef.current) return;
        if (mode === "wake") {
          startWakeRef.current?.();
        } else if (mode === "question") {
          startQuestionListenRef.current?.();
        }
      }, 400);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [requestWakeLock]);

  // ── Stop recognition ──────────────────────────────────────────────────────
  // IMPORTANT: do NOT touch btStreamRef here.
  // Stopping the BT tracks during a session drops iOS back to A2DP,
  // which requires a 1-2 s profile switch before the mic works again.
  const stopRecognition = useCallback(() => {
    listenModeRef.current = null;
    try { recognitionRef.current?.abort(); } catch { /* ignore */ }
    recognitionRef.current = null;
    // btStreamRef is intentionally left alive — stopRecognition ≠ endSession
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
      speakText(msg, ttsLang, () => { navigate("/meet-nova?from=support"); });
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

    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = ttsLang;
    rec.maxAlternatives = 3;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      setDiagMsg("✅ heard wake");
      const transcripts = Array.from(e.results)
        .map((r) => Array.from(r).map((alt) => alt.transcript).join(" "))
        .join(" ");
      dispatchTranscript(transcripts, "wake");
    };

    rec.onend = () => {
      if (sessionActiveRef.current && listenModeRef.current === "wake") {
        setTimeout(() => {
          if (sessionActiveRef.current && listenModeRef.current === "wake") {
            startWakeRef.current?.();
          }
        }, 300);
      }
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      setDiagMsg(`wake err: ${e.error}`);
      if (e.error === "aborted" || e.error === "no-speech") return;
      const delay = e.error === "not-allowed" ? 999999 : 900;
      if (e.error === "not-allowed") {
        setErrorMsg(isSpanish
          ? "Micrófono bloqueado. Ve a Ajustes → Safari → Micrófono."
          : "Mic blocked. Go to Settings → Safari → Microphone.");
      }
      setTimeout(() => {
        if (sessionActiveRef.current && listenModeRef.current === "wake") {
          startWakeRef.current?.();
        }
      }, delay);
    };

    setPhase("wake_listening");
    startRecWithBT(rec, "wake");
  }, [ttsLang, isSpanish, stopRecognition, dispatchTranscript, startRecWithBT]);

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
    let restarted = false;   // prevent double-restart from onerror + onend both firing

    const scheduleRestart = (delayMs: number) => {
      if (restarted) return;
      restarted = true;
      setTimeout(() => {
        if (sessionActiveRef.current && listenModeRef.current === "question") {
          startQuestionListenRef.current?.();
        }
      }, delayMs);
    };

    rec.onresult = (e: SpeechRecognitionEvent) => {
      setDiagMsg("✅ heard speech");
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
      if (!gotResult) scheduleRestart(300);
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      setDiagMsg(`q err: ${e.error}`);
      if (e.error === "not-allowed") {
        setErrorMsg(isSpanish
          ? "Micrófono bloqueado. Ve a Ajustes → Safari → Micrófono."
          : "Mic blocked. Go to Settings → Safari → Microphone.");
        restarted = true;   // don't retry on permanent permission denial
        return;
      }
      // For all errors (including aborted): onend will also fire after this,
      // scheduleRestart ensures only ONE restart happens.
      scheduleRestart(e.error === "aborted" ? 500 : 700);
    };

    setPhase("listening");
    startRecWithBT(rec, "question");
  }, [ttsLang, isSpanish, stopRecognition, dispatchTranscript, startRecWithBT]);

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

    // Build updated history including this user message
    const historyWithQ: ChatMessage[] = [...chatHistoryRef.current, { role: "user", content: q }];

    try {
      const response = await askNovaHelp(q, isSpanish ? "es" : "en", chatHistoryRef.current);
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
          () => { navigate("/meet-nova?from=support"); }
        );
        return;
      }

      // If NOVA isn't sure, append a human-help offer to the spoken response
      const spoken = unsure
        ? (isSpanish
            ? response + " Si necesitas más ayuda, puedes solicitar hablar con alguien de nuestro equipo."
            : response + " If you need more help, you can request to speak with someone from our team.")
        : response;

      // Save to conversation history
      const updatedHistory: ChatMessage[] = [
        ...historyWithQ,
        { role: "assistant", content: response },
      ];
      chatHistoryRef.current = updatedHistory;
      setChatHistory(updatedHistory);

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
    // Give a helpful prompt — say yes to confirm, no to flag an issue
    safetySpeak(isSpanish
      ? `Di "sí" si está bien, o "no" si hay un problema. ${item}`
      : `Say "yes" if it's okay, or "no" if there's an issue. ${item}`);
  }, [isSpanish, safetySpeak]);

  // Assign forward refs
  useEffect(() => { handleQuestionRef.current        = handleQuestion;        }, [handleQuestion]);
  useEffect(() => { startWakeRef.current             = startWakeListen;       }, [startWakeListen]);
  useEffect(() => { startQuestionListenRef.current   = startQuestionListen;   }, [startQuestionListen]);
  useEffect(() => { handleSafetyCheckInputRef.current = handleSafetyCheckInput; }, [handleSafetyCheckInput]);
  useEffect(() => { startSafetyCheckRef.current      = startSafetyCheck;      }, [startSafetyCheck]);

  // ── Always-On Wake Detection ("Hey NOVA" → auto-start session) ─────────────
  //
  // Runs as soon as the page loads.  No button tap required to START listening.
  // Tapping any button (or the one-time "Enable Voice" pill) is only needed
  // once to satisfy the browser's audio-unlock policy for TTS output.

  const stopAlwaysListen = useCallback(() => {
    alwaysActiveRef.current = false;
    setAlwaysListening(false);
    try { alwaysRecRef.current?.abort(); } catch { /* ignore */ }
    alwaysRecRef.current = null;
  }, []);

  const startAlwaysListenRef = useRef<(() => void) | null>(null);
  const startSessionRef      = useRef<(() => void) | null>(null);

  // Retry tracking for always-on listener — prevents infinite error loops on iOS
  const alwaysRetryCount = useRef(0);
  const alwaysRetryDelay = useRef(900);

  const startAlwaysListen = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR || sessionActiveRef.current) return;

    // Hard stop after too many consecutive errors — let browser recover for 15s
    if (alwaysRetryCount.current >= 6) {
      alwaysRetryCount.current = 0;
      alwaysRetryDelay.current = 900;
      setTimeout(() => {
        if (!sessionActiveRef.current) startAlwaysListenRef.current?.();
      }, 15000);
      return;
    }

    stopAlwaysListen();

    const rec = new SR();
    // Use continuous=false — iOS doesn't support true continuous mode and
    // terminates sessions constantly, causing rapid restart glitches.
    // The onend handler below re-starts automatically after each phrase.
    rec.continuous     = false;
    rec.interimResults = false;
    rec.lang           = ttsLang;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      alwaysActiveRef.current = true;
      alwaysRetryCount.current = 0;
      alwaysRetryDelay.current = 900;
      setAlwaysListening(true);
    };

    rec.onend = () => {
      alwaysActiveRef.current = false;
      setAlwaysListening(false);
      alwaysRecRef.current = null;
      // Auto-restart unless session is now active
      if (!sessionActiveRef.current) {
        const delay = Math.min(alwaysRetryDelay.current, 4000);
        setTimeout(() => {
          if (!sessionActiveRef.current) startAlwaysListenRef.current?.();
        }, delay);
      }
    };

    rec.onerror = (e: any) => {
      alwaysActiveRef.current = false;
      setAlwaysListening(false);
      alwaysRecRef.current = null;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") return;
      if (e.error === "aborted") return; // We aborted it ourselves — don't count as error
      alwaysRetryCount.current++;
      alwaysRetryDelay.current = Math.min(alwaysRetryDelay.current * 1.5, 4000);
      if (!sessionActiveRef.current) {
        const delay = Math.min(alwaysRetryDelay.current, 4000);
        setTimeout(() => {
          if (!sessionActiveRef.current) startAlwaysListenRef.current?.();
        }, delay);
      }
    };

    rec.onresult = (e: any) => {
      const results = Array.from(e.results as any[]).slice(e.resultIndex);
      for (const result of results as any[]) {
        if (!result.isFinal) continue;
        const text = (result[0]?.transcript || "").toLowerCase().trim();
        // Wake words: "nova", "hey nova", "hola nova", "oye nova"
        if (/\bnova\b|hey nova|hola nova|oye nova/i.test(text)) {
          stopAlwaysListen();
          if (!sessionActiveRef.current) {
            startSessionRef.current?.();
          }
          return;
        }
      }
    };

    alwaysRecRef.current = rec;
    try { rec.start(); } catch {
      alwaysRetryCount.current++;
    }
  }, [ttsLang, stopAlwaysListen]);

  useEffect(() => { startAlwaysListenRef.current = startAlwaysListen; }, [startAlwaysListen]);

  // Mount: kick off always-on listener after a short delay
  useEffect(() => {
    const t = setTimeout(() => {
      if (!sessionActiveRef.current) startAlwaysListenRef.current?.();
    }, 800);
    return () => {
      clearTimeout(t);
      stopAlwaysListen();
    };
  }, []); // eslint-disable-line

  // When session becomes active, stop the always-on listener
  useEffect(() => {
    if (sessionActive) stopAlwaysListen();
  }, [sessionActive, stopAlwaysListen]);

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
  //
  // iOS USER-GESTURE RULES — read before changing this function:
  //
  //  1. This function MUST remain synchronous (no async/await).
  //     The moment you await anything inside a click handler, iOS considers
  //     the gesture "consumed" and will refuse TTS, mic, and wake-lock.
  //
  //  2. getUserMedia() is fired here (inside the gesture) but NOT awaited.
  //     The Promise resolves in the background while TTS is speaking.
  //     By the time NOVA finishes the greeting (≥3 s), the BT stream is open
  //     and HFP is engaged — recognition then finds the headphone mic ready.
  //
  //  3. We NEVER stop btStreamRef tracks during a session. Stopping them
  //     drops iOS back to A2DP which silences recognition until a 1-2 s
  //     BT profile switch completes.  Tracks are only stopped in endSession.
  //
  const startSession = () => {
    // ── Step 1: synchronous cleanup & TTS unlock ─────────────────────────────
    stopAlwaysListen();
    stopRecognition();

    ttsUnlockedRef.current = false;
    unlockTTS();  // queues a silent 0-volume utterance to open the TTS channel

    // ── Step 2: release any leftover stream ──────────────────────────────────
    // We no longer hold a getUserMedia stream during the session.
    // getUserMedia competing with SpeechRecognition for the same audio device
    // was causing instant `aborted` errors on iOS with Bluetooth headphones.
    // iOS SpeechRecognition handles its own BT HFP routing when given time.
    releaseBtStream();

    // ── Step 3: wake-lock + audio keep-alive ─────────────────────────────────
    requestWakeLock();
    startAudioKeepAlive();

    // ── Step 4: state reset ───────────────────────────────────────────────────
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
    setDiagMsg("");
    setLog([]);
    chatHistoryRef.current = [];
    setChatHistory([]);

    // ── Step 5: start speaking (rAF lets the silent unlock utterance fire first)
    requestAnimationFrame(() => {
      if (!sessionActiveRef.current) return;

      if (isRealUser && firstName) {
        const greeting = buildGreeting();
        addLog("NOVA", greeting);
        setAnswer(greeting);
        setPhase("speaking");
        moodCheckActiveRef.current = true;
        speakText(greeting, ttsLang, () => {
          if (sessionActiveRef.current) {
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
    });
  };

  // Keep startSessionRef in sync (regular fn, not useCallback — update every render)
  useEffect(() => { startSessionRef.current = startSession; });

  // ── Session end ───────────────────────────────────────────────────────────
  const endSession = (autoRestart = true) => {
    sessionActiveRef.current = false;
    safetyModeRef.current = false;
    setSafetyMode(false);
    setSafetyIndex(0);
    stopRecognition();
    // NOW we release the BT stream — session is truly over
    releaseBtStream();
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    releaseWakeLock();
    stopAudioKeepAlive();
    setSessionActive(false);
    setPhase("idle");
    setAnswer("");
    setLastHeard("");
    setLastQuestion("");
    setErrorMsg("");
    // Do NOT reset ttsUnlockedRef — iOS page-level TTS unlock persists
    // Resume always-on wake listener after session ends
    setTimeout(() => startAlwaysListenRef.current?.(), 1000);

    // Auto-restart session after 5-second countdown
    if (autoRestart && ttsReadyRef.current) {
      if (autoRestartTimerRef.current) clearInterval(autoRestartTimerRef.current);
      setAutoRestartCount(5);
      let remaining = 5;
      autoRestartTimerRef.current = setInterval(() => {
        remaining -= 1;
        setAutoRestartCount(remaining);
        if (remaining <= 0) {
          clearInterval(autoRestartTimerRef.current!);
          autoRestartTimerRef.current = null;
          setAutoRestartCount(0);
          startSessionRef.current?.();
        }
      }, 1000);
    }
  };

  const cancelAutoRestart = () => {
    if (autoRestartTimerRef.current) {
      clearInterval(autoRestartTimerRef.current);
      autoRestartTimerRef.current = null;
    }
    setAutoRestartCount(0);
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

    // Human request → go straight to NOVA Support Agent
    if (isHumanRequestTrigger(q)) {
      navigate("/meet-nova?from=support");
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
      if (autoRestartTimerRef.current) clearInterval(autoRestartTimerRef.current);
      try { btStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
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
        {sessionActive && activeTab === "coach" && (
          <div className="flex items-center gap-3">
            <NovaVoiceStatus state={voiceStateKey} />
            <button
              onClick={() => endSession(false)}
              className="text-xs text-slate-500 hover:text-red-400 transition px-3 py-1.5 rounded-lg border border-white/5 hover:border-red-500/30"
            >
              {isSpanish ? "Terminar ✕" : "End Session ✕"}
            </button>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="bg-[#141428] border-b border-white/5 px-4 flex gap-1">
        <button
          onClick={() => setActiveTab("coach")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition ${
            activeTab === "coach"
              ? "border-violet-400 text-white"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <Mic className="h-4 w-4" />
          {isSpanish ? "Entrenador NOVA" : "NOVA Coach"}
        </button>
        <button
          onClick={() => setActiveTab("performance")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition ${
            activeTab === "performance"
              ? "border-yellow-400 text-yellow-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <BarChart2 className="h-4 w-4" />
          {isSpanish ? "Mi Rendimiento" : "My Performance"}
        </button>
      </div>

      {/* ── My Performance Tab ─────────────────────────────────────────────── */}
      {activeTab === "performance" && (
        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full space-y-5">

          {/* NOVA feedback banner */}
          <div className={`rounded-2xl border px-5 py-4 flex gap-3 items-start ${
            liveEff >= 110 ? "bg-green-500/10 border-green-500/30" :
            liveEff >= 100 ? "bg-green-500/10 border-green-500/30" :
            liveEff >= 85  ? "bg-yellow-400/10 border-yellow-400/30" :
            liveEff > 0    ? "bg-red-500/10 border-red-500/30" :
                             "bg-violet-900/30 border-violet-500/20"
          }`}>
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">N</div>
            <p className="text-sm text-slate-200 leading-relaxed">{novaFeedback()}</p>
          </div>

          {/* Input row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                {isSpanish ? "Cajas Picadas" : "Cases Picked"}
              </label>
              <input
                type="number" min="0" placeholder="720"
                value={perfCases}
                onChange={(e) => setPerfCases(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 focus:border-yellow-400/60 outline-none text-white font-black text-2xl px-4 py-3 placeholder:text-slate-600 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                {isSpanish ? "Horas Trabajadas" : "Hours Worked"}
              </label>
              <input
                type="number" min="0" step="0.25" placeholder="8.5"
                value={perfHours}
                onChange={(e) => setPerfHours(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 focus:border-yellow-400/60 outline-none text-white font-black text-2xl px-4 py-3 placeholder:text-slate-600 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Goal input */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              {isSpanish ? "Meta de Eficiencia %" : "Efficiency Goal %"}
            </label>
            <input
              type="number" min="50" max="150" placeholder="100"
              value={perfGoalInput}
              onChange={(e) => setPerfGoalInput(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 focus:border-violet-400/60 outline-none text-white font-bold text-lg px-4 py-3 placeholder:text-slate-600 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <p className="text-[10px] text-slate-600 mt-1">
              {isSpanish ? "NOVA usará esta meta para guiarte cada día." : "NOVA will use this goal to coach you each day."}
            </p>
          </div>

          {/* Live stats */}
          {liveUPH > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-slate-800 border border-slate-700 px-3 py-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Zap className="h-3 w-3 text-yellow-400" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">UPH</p>
                </div>
                <p className="text-2xl font-black text-white">{liveUPH}</p>
                <p className="text-[9px] text-slate-600 mt-0.5">std {PERF_STANDARD_UPH}</p>
              </div>
              <div className={`rounded-2xl border px-3 py-3 text-center ${
                liveEff >= 100 ? "bg-green-500/10 border-green-500/30" :
                liveEff >= 85  ? "bg-yellow-400/10 border-yellow-400/30" :
                                 "bg-red-500/10 border-red-500/30"
              }`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="h-3 w-3 text-slate-400" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{isSpanish ? "Ef%" : "Eff%"}</p>
                </div>
                <p className={`text-2xl font-black ${
                  liveEff >= 100 ? "text-green-400" :
                  liveEff >= 85  ? "text-yellow-400" : "text-red-400"
                }`}>{liveEff}%</p>
                <p className="text-[9px] text-slate-600 mt-0.5">target 100%</p>
              </div>
              <div className="rounded-2xl bg-slate-800 border border-slate-700 px-3 py-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-slate-400" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{isSpanish ? "Meta" : "Goal"}</p>
                </div>
                <p className="text-2xl font-black text-white">
                  {perfGoalNum > 0 ? `${perfGoalNum}%` : "—"}
                </p>
                <p className="text-[9px] text-slate-600 mt-0.5">{isSpanish ? "semanal" : "weekly"}</p>
              </div>
            </div>
          )}

          {/* Note */}
          <input
            type="text"
            placeholder={isSpanish ? "Nota opcional — ej. equipo dañado" : "Note (optional) — e.g. short break, equipment issue"}
            value={perfNote}
            onChange={(e) => setPerfNote(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 focus:border-slate-600 outline-none text-white px-4 py-2.5 text-sm placeholder:text-slate-600"
          />

          {/* Save button */}
          <button
            onClick={handlePerfSave}
            disabled={perfCasesNum <= 0 || perfHoursNum <= 0}
            className={`w-full rounded-2xl py-3.5 text-base font-black transition flex items-center justify-center gap-2 ${
              perfSaved
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : perfCasesNum > 0 && perfHoursNum > 0
                ? "bg-yellow-400 text-slate-950 hover:bg-yellow-300"
                : "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700"
            }`}
          >
            {perfSaved
              ? <><CheckCircle2 className="h-5 w-5" /> {isSpanish ? "¡Guardado!" : "Saved!"}</>
              : isSpanish ? "Guardar Mi Registro" : "Save Today's Log"}
          </button>

          {/* 7-day history */}
          {perfRecentLogs.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">
                {isSpanish ? "Últimos 7 días" : "Last 7 Days"}
              </p>
              <div className="space-y-2">
                {perfRecentLogs.map((log) => {
                  const isToday = log.date === new Date().toISOString().slice(0, 10);
                  const effColor = log.pickRate >= 100 ? "text-green-400" : log.pickRate >= 85 ? "text-yellow-400" : "text-red-400";
                  const dateLabel = isToday
                    ? (isSpanish ? "Hoy" : "Today")
                    : new Date(log.date + "T12:00:00").toLocaleDateString(isSpanish ? "es-US" : "en-US", { weekday: "short", month: "short", day: "numeric" });
                  return (
                    <div key={log.date} className={`flex items-center justify-between rounded-2xl px-4 py-3 border ${
                      isToday ? "border-yellow-400/20 bg-yellow-400/5" : "border-slate-800 bg-slate-800/40"
                    }`}>
                      <div>
                        <p className={`text-sm font-bold ${isToday ? "text-yellow-400" : "text-white"}`}>{dateLabel}</p>
                        {log.note && <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[140px]">{log.note}</p>}
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="text-[10px] text-slate-500">{isSpanish ? "Cajas" : "Cases"}</p>
                          <p className="text-sm font-black text-white">{log.cases ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">{isSpanish ? "Hrs" : "Hours"}</p>
                          <p className="text-sm font-black text-white">{log.hours}h</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">UPH</p>
                          <p className="text-sm font-black text-white">{log.uph ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">Eff%</p>
                          <p className={`text-sm font-black ${effColor}`}>{log.pickRate}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── NOVA Coach Tab ─────────────────────────────────────────────────── */}
      {activeTab === "coach" && (
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

        {/* Mic diagnostic — shows recognition errors in real time (debug) */}
        {sessionActive && diagMsg && (
          <div className="w-full rounded-lg border border-slate-600/40 bg-slate-900/60 px-4 py-2 text-slate-400 text-xs font-mono text-center">
            {diagMsg}
          </div>
        )}

        {/* Headphone tip — shown before session starts */}
        {!sessionActive && voiceInputSupported && (
          <div className="w-full rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-3 flex items-start gap-3">
            <span className="text-lg shrink-0">🎧</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isSpanish
                ? "Para usar auriculares: conéctalos primero, luego toca Iniciar NOVA. iOS redirige el micrófono automáticamente."
                : "To use headphones: connect them first, then tap Start NOVA. iOS routes the mic automatically when you tap the button."}
            </p>
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

        {/* Tap to speak — manual question listen trigger */}
        {sessionActive && (phase === "listening" || phase === "wake_listening") && (
          <button
            onClick={() => {
              stopRecognition();
              listenModeRef.current = "question";
              setPhase("listening");
              startQuestionListenRef.current?.();
            }}
            className="w-full py-4 rounded-2xl bg-violet-700/30 hover:bg-violet-700/50 active:bg-violet-700/70 border border-violet-500/50 text-violet-200 font-bold text-base tracking-wide transition-all duration-150 active:scale-95 flex items-center justify-center gap-3"
          >
            <Mic className="h-5 w-5 animate-pulse" />
            {isSpanish ? "🎤 Tocar para hablar" : "🎤 Tap to speak"}
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

        {/* ── Chat bubble conversation history ─────────────────────────────── */}
        {sessionActive && chatHistory.length > 0 && (
          <div className="w-full space-y-3">
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 items-end ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                  msg.role === "assistant"
                    ? "bg-violet-600 text-white"
                    : "bg-slate-700 text-slate-300"
                }`}>
                  {msg.role === "assistant" ? "N" : (firstName?.[0]?.toUpperCase() ?? "U")}
                </div>
                {/* Bubble */}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "assistant"
                    ? "bg-violet-950/60 border border-violet-500/20 text-white rounded-bl-sm"
                    : "bg-slate-800 border border-slate-700 text-slate-200 rounded-br-sm"
                }`}>
                  {msg.role === "assistant" && (
                    <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">NOVA</p>
                  )}
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {phase === "thinking" && (
              <div className="flex gap-3 items-end">
                <div className="shrink-0 w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-black text-white">N</div>
                <div className="bg-violet-950/60 border border-violet-500/20 rounded-2xl rounded-bl-sm px-4 py-3">
                  <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">NOVA</p>
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Talk suggestion banner */}
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
                  onClick={() => navigate("/meet-nova?from=support")}
                  className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-yellow-300 transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  {isSpanish ? "Hablar con NOVA ⚡" : "Talk to NOVA ⚡"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick-start chips — show when session is active but no chat history yet */}
        {sessionActive && chatHistory.length === 0 && phase !== "thinking" && (
          <div className="w-full">
            <p className="text-xs text-slate-600 uppercase tracking-widest font-bold mb-2 text-center">
              {isSpanish ? "Prueba preguntar:" : "Try asking:"}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {(isSpanish ? [
                "¿Cómo construyo una tarima correctamente?",
                "Dame consejos de seguridad",
                "¿Cómo mejoro mi rendimiento?",
                "¿Qué hago si hago un error de selección?",
                "Haz mi revisión de seguridad",
                "Me duele la espalda",
              ] : [
                "How do I build a pallet correctly?",
                "Give me safety tips",
                "How do I improve my rate?",
                "What do I do if I mispick?",
                "Run my safety check",
                "My back is hurting",
              ]).map((chip) => (
                <button
                  key={chip}
                  onClick={async () => {
                    unlockTTS();
                    if (!sessionActive) {
                      sessionActiveRef.current = true;
                      setSessionActive(true);
                      setLog([]);
                    }
                    stopRecognition();
                    setTextInput("");
                    if (isSafetyTrigger(chip)) { startSafetyCheckRef.current?.(); return; }
                    addLog("USER", chip);
                    setLastQuestion(chip);
                    await handleQuestion(chip);
                  }}
                  className="rounded-full border border-violet-500/30 bg-violet-950/30 px-3 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-900/50 hover:border-violet-400/50 transition"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Voice mode status chips */}
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
              onClick={() => navigate("/meet-nova?from=support")}
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition"
            >
              {isSpanish ? "Hablar con NOVA ahora →" : "Talk to NOVA now →"}
            </button>
          </div>
        )}

        {/* Persistent "Talk to a person" button → routes to NOVA Support Agent */}
        {sessionActive && !lockedOut && (
          <button
            onClick={() => navigate("/meet-nova?from=support")}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/3 py-2.5 text-xs font-semibold text-slate-400 hover:border-yellow-400/40 hover:text-yellow-300 transition"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {isSpanish ? "Hablar con alguien de nuestro equipo" : "Talk to someone on our team"}
          </button>
        )}

        {/* ── Always-on wake indicator + start controls ── */}
        <div className="w-full space-y-3">

          {/* Auto-restart countdown banner */}
          {!sessionActive && autoRestartCount > 0 && (
            <div className="flex items-center justify-between rounded-2xl border border-violet-500/30 bg-violet-900/20 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500" />
                </span>
                <span className="text-violet-300 text-sm font-semibold">
                  {isSpanish
                    ? `NOVA reiniciando en ${autoRestartCount}s…`
                    : `NOVA restarting in ${autoRestartCount}s…`}
                </span>
              </div>
              <button
                onClick={cancelAutoRestart}
                className="text-xs text-slate-500 hover:text-red-400 transition"
              >
                {isSpanish ? "Cancelar" : "Cancel"}
              </button>
            </div>
          )}

          {/* Always-listening badge — shows when mic is running in background (no countdown) */}
          {!sessionActive && autoRestartCount === 0 && alwaysListening && (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-violet-500/30 bg-violet-900/20 px-4 py-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500" />
              </span>
              <span className="text-violet-300 text-sm font-semibold">
                {isSpanish ? "NOVA está escuchando — di \"Hola NOVA\"" : "NOVA is listening — say \"Hey NOVA\""}
              </span>
            </div>
          )}

          {/* Single "Start NOVA" button — unlocks TTS + starts session in one tap */}
          {!sessionActive && autoRestartCount === 0 && (
            <LockedAction
              onAllowedClick={() => {
                cancelAutoRestart();
                ttsReadyRef.current = true;
                setTtsReady(true);
                startSession();
              }}
              className="w-full"
            >
              <button className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold text-base tracking-wide transition-all duration-200 shadow-[0_0_24px_rgba(139,92,246,0.4)] flex items-center justify-center gap-3">
                <Mic className="h-5 w-5" />
                {isSpanish ? "Iniciar NOVA" : "Start NOVA"}
              </button>
            </LockedAction>
          )}

          {/* Personalized stat card */}
          {!sessionActive && isRealUser && firstName && (
            <div className="rounded-2xl border border-violet-500/20 bg-violet-950/30 p-4">
              <p className="text-white text-sm leading-relaxed">
                <span className="font-bold text-yellow-300">Hey {firstName}!</span>{" "}
                {yestLog
                  ? <>Yesterday you hit <span className="font-bold text-green-400">{yestLog.pickRate}%</span> in {yestLog.hours}h.{" "}
                      {userGoal
                        ? yestLog.pickRate >= userGoal.targetRate
                          ? <span className="text-green-400">Above your goal — amazing!</span>
                          : <span className="text-yellow-400">Your goal is {userGoal.targetRate}% — let's close that gap.</span>
                        : null}
                    </>
                  : userGoal
                    ? <>Your goal this week is <span className="font-bold text-yellow-400">{userGoal.targetRate}%</span>.</>
                    : <>Log your performance so NOVA can track it with you.</>}
              </p>
            </div>
          )}

          {/* ── Always-visible text input ── */}
          <form onSubmit={handleTextSubmit} className="w-full flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={phase === "thinking"}
              placeholder={isSpanish ? "Escribe tu pregunta aquí…" : "Type your question here…"}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || phase === "thinking"}
              className="rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-3 font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed text-lg"
            >
              →
            </button>
          </form>
        </div>

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
      )}
    </div>
  );
}
