import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/lib/authStore";
import { useTrainerStore } from "@/lib/trainerStore";
import { useSupervisorPostStore } from "@/lib/supervisorPostStore";
import { usePerformanceStore } from "@/lib/performanceStore";
import { novaSpeak, novaRecogLang, NOVA_TEXT, matchNovaCommand } from "@/lib/novaSpeech";
import NovaWelcomeAssistant, { hasSeenWelcomeToday, markWelcomeSeen } from "@/components/NovaWelcomeAssistant";
import {
  Headphones, BookOpen, HelpCircle, TrendingUp, Star, AlertTriangle, KeyRound,
  DoorOpen, Mic, MicOff, Volume2, VolumeX, Megaphone, ShieldCheck, Zap,
  ChevronRight, ClipboardList, CheckCircle2, Clock, Target, MessageSquare,
} from "lucide-react";
import { useMyCoaching } from "@/hooks/usePositions";

const STANDARD_UPH = 90;

function PortalCard({ href, icon, title, description, accent = false }: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent?: boolean;
}) {
  return (
    <Link href={href}>
      <div className={`rounded-3xl border p-6 cursor-pointer transition group flex flex-col gap-3 h-full ${
        accent
          ? "border-yellow-400/40 bg-yellow-400/5 hover:bg-yellow-400/10"
          : "border-slate-800 bg-slate-900 hover:border-slate-600"
      }`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          accent ? "bg-yellow-400/20" : "bg-slate-800"
        }`}>
          {icon}
        </div>
        <div>
          <h3 className="font-black text-white text-lg">{title}</h3>
          <p className="text-slate-400 text-sm mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export default function SelectorPortalPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("es") ? "es" : "en";
  const { currentUser } = useAuthStore();
  const { selectors, assignments } = useTrainerStore();
  const latestPost = useSupervisorPostStore((s) => s.latestPost());

  const selectorProfile = selectors.find(
    (s) => s.email.toLowerCase() === (currentUser?.username ?? "").toLowerCase()
      || s.name.toLowerCase().includes((currentUser?.fullName ?? "").toLowerCase().split(" ")[0])
  );

  const assignedAssignment = selectorProfile?.assignedAssignmentId
    ? assignments.find((a) => a.id === selectorProfile.assignedAssignmentId)
    : null;

  // ── Performance logging ────────────────────────────────────────────────────
  const { logToday, getRecentLogs, getTodayLog, getGoal } = usePerformanceStore();
  const username = currentUser?.username ?? "";
  const todayLog = username ? getTodayLog(username) : null;
  const recentLogs = username ? getRecentLogs(username, 7) : [];
  const goal = username ? getGoal(username) : null;

  const [logCases, setLogCases] = useState(todayLog?.cases?.toString() ?? "");
  const [logHours, setLogHours] = useState(todayLog?.hours?.toString() ?? "");
  const [logNote, setLogNote]   = useState(todayLog?.note ?? "");
  const [logSaved, setLogSaved] = useState(false);

  const logCasesNum = parseFloat(logCases) || 0;
  const logHoursNum = parseFloat(logHours) || 0;
  const liveUPH     = logHoursNum > 0 ? Math.round(logCasesNum / logHoursNum) : 0;
  const liveEff     = liveUPH > 0 ? Math.round((liveUPH / STANDARD_UPH) * 100) : 0;

  const handleSaveLog = () => {
    if (!username || logCasesNum <= 0 || logHoursNum <= 0) return;
    const eff = Math.round((liveUPH / STANDARD_UPH) * 100);
    logToday(username, eff, logHoursNum, logNote.trim() || undefined, logCasesNum, liveUPH);
    setLogSaved(true);
    setTimeout(() => setLogSaved(false), 3000);
  };

  // ── Coaching messages ──────────────────────────────────────────────────────
  const { messages: coachMsgs, markRead: markCoachRead } = useMyCoaching(8000);
  const [visibleCoachId, setVisibleCoachId] = useState<string | null>(null);
  const spokenCoachIds = useRef<Set<string>>(new Set());

  // ── NOVA Welcome AI overlay ─────────────────────────────────────────────────
  const [showWelcome, setShowWelcome] = useState(() => {
    const uname = currentUser?.username ?? "";
    return uname ? !hasSeenWelcomeToday(uname) : false;
  });

  // ── Voice / Speech state ───────────────────────────────────────────────────
  const [muted,          setMuted]          = useState(false);
  const [isListening,    setIsListening]    = useState(false);
  const [isSpeaking,     setIsSpeaking]     = useState(false);
  const [novaStatus,     setNovaStatus]     = useState<string>("");
  const [ttsReady,       setTtsReady]       = useState(false);
  const mutedRef       = useRef(false);
  const ttsReadyRef    = useRef(false);
  // Two-phase voice: wake-word listener → command listener → back to wake
  const wakeRecRef     = useRef<any>(null);   // "Hey NOVA" wake recognizer
  const cmdRecRef      = useRef<any>(null);   // one-shot command recognizer
  const listenModeRef  = useRef<"wake" | "command" | "off">("off");
  // Mirrors isSpeaking state so recognizers can check without stale closure
  const isSpeakingRef  = useRef(false);
  // Tracks whether the NOVA Welcome Assistant currently owns the audio session.
  // When true the portal pauses its own speech-recognition so the two
  // recognizers don't fight each other (browsers permit only one at a time).
  const novaActiveRef  = useRef(false);
  // Stable function refs — used by speak() and NWA coordinator
  const stopLoopRef    = useRef<(() => void) | null>(null);   // → stopAllRec
  const startLoopRef   = useRef<(() => void) | null>(null);   // → startWakeLoop
  const startWakeRef   = useRef<(() => void) | null>(null);
  const startCmdRef    = useRef<(() => void) | null>(null);
  // Stable refs for the speak callbacks — lets command handler read the latest
  // data without capturing stale closures.
  const speakTodayFocusRef  = useRef<(() => void)>(() => {});
  const speakLatestUpdateRef = useRef<(() => void)>(() => {});
  const speakAssignmentRef  = useRef<(() => void)>(() => {})

  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  const canListen =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);

  const speak = useCallback((text: string, onDone?: () => void) => {
    if (mutedRef.current || !canSpeak) { onDone?.(); return; }
    // iOS Safari cannot run SpeechRecognition and SpeechSynthesis at the same
    // time — they fight over the single audio session and freeze the page.
    // Stop recognition immediately (synchronously) before starting TTS.
    isSpeakingRef.current = true;
    stopLoopRef.current?.();
    setIsSpeaking(true);

    // Safety timer: if iOS TTS onend silently never fires (a known iOS WebKit
    // bug on auto-triggered speech), this guarantees isSpeakingRef resets and
    // the recognition loop restarts — otherwise voice is permanently frozen.
    // Formula: 20ms/char + 2s buffer (≈2x realistic TTS duration at 1.25× speed).
    let done = false;
    const safetyMs = Math.max(4000, text.length * 20 + 2000);
    const safetyTimer = setTimeout(() => {
      if (!done) {
        done = true;
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        onDone?.();
        if (!mutedRef.current && !novaActiveRef.current) {
          setTimeout(() => startLoopRef.current?.(), 400);
        }
      }
    }, safetyMs);

    novaSpeak(text, lang, () => {
      if (!done) {
        done = true;
        clearTimeout(safetyTimer);
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        onDone?.();
        // Restart the recognition loop after TTS ends, unless NWA owns the mic
        // or the user has muted voice commands.
        if (!mutedRef.current && !novaActiveRef.current) {
          setTimeout(() => startLoopRef.current?.(), 400);
        }
      }
    });
  }, [canSpeak, lang]);

  const speakTodayFocus = useCallback(() => {
    let message = NOVA_TEXT.todayFocusHeader(lang);
    if (assignedAssignment) {
      message += NOVA_TEXT.assignmentLine(assignedAssignment, lang);
    }
    if (latestPost?.safetyTopic) {
      message += NOVA_TEXT.safetyPrefix(lang) + latestPost.safetyTopic + ". ";
    }
    if (latestPost?.workloadUpdate) {
      message += NOVA_TEXT.workloadPrefix(lang) + latestPost.workloadUpdate + ". ";
    }
    if (latestPost?.selectorMessage) {
      message += latestPost.selectorMessage;
    }
    if (!assignedAssignment && !latestPost) {
      message = NOVA_TEXT.noFocusAvailable(lang);
    }
    setNovaStatus(NOVA_TEXT.speakingFocus(lang));
    speak(message, () => setNovaStatus(""));
  }, [assignedAssignment, latestPost, speak, lang]);

  const speakLatestUpdate = useCallback(() => {
    if (!latestPost) {
      speak(NOVA_TEXT.noUpdateYet(lang));
      return;
    }
    let message = NOVA_TEXT.latestUpdateHeader(lang);
    if (latestPost.shiftSummary)  message += NOVA_TEXT.shiftPrefix(lang) + latestPost.shiftSummary + ". ";
    if (latestPost.safetyTopic)   message += NOVA_TEXT.safetyPrefix(lang) + latestPost.safetyTopic + ". ";
    if (latestPost.workloadUpdate) message += NOVA_TEXT.workloadPrefix(lang) + latestPost.workloadUpdate + ". ";
    if (latestPost.topSelectorName) {
      message += NOVA_TEXT.topSelectorLine(latestPost.topSelectorName, latestPost.topSelectorRate ?? "", lang);
    }
    if (latestPost.selectorMessage) message += latestPost.selectorMessage;
    setNovaStatus(NOVA_TEXT.speakingUpdate(lang));
    speak(message, () => setNovaStatus(""));
  }, [latestPost, speak, lang]);

  const speakAssignment = useCallback(() => {
    if (!assignedAssignment) {
      speak(NOVA_TEXT.noAssignmentYet(lang));
      return;
    }
    const msg = NOVA_TEXT.fullAssignment(assignedAssignment, lang);
    setNovaStatus(NOVA_TEXT.speakingAssignment(lang));
    speak(msg, () => setNovaStatus(""));
  }, [assignedAssignment, speak, lang]);

  // ── Auto-greeting on mount ─────────────────────────────────────────────────
  // Only fires if the user has already unlocked TTS via a tap (satisfies
  // browser autoplay policy on iOS/Chrome).  On first visit the "Tap once to
  // enable NOVA's voice" button is shown instead; tapping it unlocks TTS and
  // explicitly speaks the greeting (see unlockTTS handler below).
  useEffect(() => {
    if (!ttsReadyRef.current) return;   // ← wait for user gesture first
    const name = currentUser?.fullName?.split(" ")[0] ?? (lang === "es" ? "amigo" : "there");
    const hour = new Date().getHours();
    const delay = setTimeout(() => {
      speak(NOVA_TEXT.greeting(name, hour, lang));
    }, 600);
    return () => {
      clearTimeout(delay);
      if (canSpeak) window.speechSynthesis.cancel();
    };
  }, [lang]); // eslint-disable-line

  // ── Two-phase NOVA voice system ────────────────────────────────────────────
  //
  // Phase 1 – WAKE: lightweight listener (continuous=false, auto-restarts)
  //   Waits for "Hey NOVA" / "Hola NOVA" / "Nova".
  //   maxAlternatives=3 so partial matches across all hypotheses are checked.
  //
  // Phase 2 – COMMAND: one-shot listener (continuous=false, fires once)
  //   Captures exactly one utterance, matches against portal commands, then
  //   returns to wake phase automatically.
  //
  // This pattern is iOS-compatible (fresh instances, no getUserMedia conflict),
  // Bluetooth-friendly (follows speak → 3 s gap → listen discipline), and
  // battery-efficient vs. always-on continuous recognition.

  const stopAllRec = useCallback(() => {
    listenModeRef.current = "off";
    setIsListening(false);
    try { wakeRecRef.current?.abort(); } catch { /* ignore */ }
    try { cmdRecRef.current?.abort();  } catch { /* ignore */ }
    wakeRecRef.current = null;
    cmdRecRef.current  = null;
  }, []);

  // ── Phase 2: one-shot command listener ─────────────────────────────────────
  const startCommandListen = useCallback(() => {
    if (!canListen || isSpeakingRef.current || novaActiveRef.current || mutedRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    try { cmdRecRef.current?.abort(); } catch { /* ignore */ }
    cmdRecRef.current = null;

    const rec = new SR();
    rec.continuous      = false;
    rec.interimResults  = false;
    rec.lang            = novaRecogLang(lang);
    rec.maxAlternatives = 1;

    let gotResult = false;
    let restarted = false;
    const returnToWake = (delayMs: number) => {
      if (restarted) return;
      restarted = true;
      listenModeRef.current = "wake";
      setTimeout(() => {
        if (!mutedRef.current && !isSpeakingRef.current && !novaActiveRef.current) {
          startWakeRef.current?.();
        }
      }, delayMs);
    };

    rec.onstart = () => {
      setIsListening(true);
      setNovaStatus(lang === "es" ? "NOVA escucha — di tu comando…" : "NOVA listening — say your command…");
    };

    rec.onresult = (e: any) => {
      const text       = (e.results?.[0]?.[0]?.transcript ?? "").toLowerCase().trim();
      const confidence = (e.results?.[0]?.[0]?.confidence ?? 1) as number;
      if (!text) return;
      gotResult = true;
      setNovaStatus(`${NOVA_TEXT.heardCommand(lang)}"${text}"`);

      // Low-confidence result — skip rather than misfire
      if (confidence < 0.45) { returnToWake(400); return; }

      const cmd = matchNovaCommand(text, lang);
      if (cmd === "focus")           speakTodayFocusRef.current();
      else if (cmd === "update")     speakLatestUpdateRef.current();
      else if (cmd === "assignment") speakAssignmentRef.current();
      // speak() will call startLoopRef (→ startWakeLoop) when TTS ends
      returnToWake(400);
    };

    rec.onend = () => {
      cmdRecRef.current = null;
      if (!gotResult) returnToWake(300);
    };

    rec.onerror = (e: any) => {
      cmdRecRef.current = null;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        listenModeRef.current = "off";
        setIsListening(false);
        return;
      }
      returnToWake(e.error === "aborted" ? 500 : 800);
    };

    cmdRecRef.current = rec;
    listenModeRef.current = "command";
    try { rec.start(); } catch { /* ignore double-start */ }
  }, [canListen, lang]); // eslint-disable-line

  // ── Phase 1: wake-word listener ─────────────────────────────────────────────
  const startWakeLoop = useCallback(() => {
    if (!canListen || isSpeakingRef.current || novaActiveRef.current || mutedRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    try { wakeRecRef.current?.abort(); } catch { /* ignore */ }
    wakeRecRef.current = null;

    const rec = new SR();
    rec.continuous      = false;   // iOS-safe: use auto-restart pattern
    rec.interimResults  = false;
    rec.lang            = novaRecogLang(lang);
    rec.maxAlternatives = 3;       // check all hypotheses for wake word

    rec.onstart = () => {
      setIsListening(true);
      setNovaStatus(lang === "es" ? "Di 'Hola NOVA' para activar…" : "Say 'Hey NOVA' to activate…");
    };

    rec.onend = () => {
      wakeRecRef.current = null;
      if (listenModeRef.current === "wake" && !mutedRef.current && !isSpeakingRef.current && !novaActiveRef.current) {
        setTimeout(() => startWakeRef.current?.(), 300);
      } else if (listenModeRef.current !== "command") {
        setIsListening(false);
      }
    };

    rec.onerror = (e: any) => {
      wakeRecRef.current = null;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        listenModeRef.current = "off";
        setIsListening(false);
        return;
      }
      // aborted / no-speech are normal — onend fires next and handles restart
      if (e.error === "aborted" || e.error === "no-speech") return;
      if (listenModeRef.current === "wake" && !mutedRef.current) {
        setTimeout(() => startWakeRef.current?.(), 900);
      }
    };

    rec.onresult = (e: any) => {
      // Collect all text across all results and all alternatives
      const heard = Array.from(e.results as any[])
        .flatMap((r: any) => Array.from(r as any[]).map((alt: any) => alt.transcript?.toLowerCase() ?? ""))
        .join(" ");

      const isWake =
        heard.includes("hey nova") || heard.includes("hey, nova") ||
        heard.includes("hola nova") || heard.includes("oye nova") ||
        heard.trim() === "nova";

      if (isWake) {
        listenModeRef.current = "command";
        try { rec.abort(); } catch { /* ignore */ }
        setNovaStatus(lang === "es" ? "NOVA activa — di tu comando…" : "NOVA active — say your command…");
        // Brief pause so the user hears the status update, then open command mic
        setTimeout(() => startCmdRef.current?.(), 300);
      }
    };

    wakeRecRef.current = rec;
    listenModeRef.current = "wake";
    try { rec.start(); } catch { /* ignore double-start */ }
  // speak callbacks removed from deps — stable via refs, avoids iOS restart floods
  }, [canListen, lang]); // eslint-disable-line

  useEffect(() => { stopLoopRef.current   = stopAllRec;           }, [stopAllRec]);
  useEffect(() => { startLoopRef.current  = startWakeLoop;        }, [startWakeLoop]);
  useEffect(() => { startWakeRef.current  = startWakeLoop;        }, [startWakeLoop]);
  useEffect(() => { startCmdRef.current   = startCommandListen;   }, [startCommandListen]);
  useEffect(() => { isSpeakingRef.current = isSpeaking;           }, [isSpeaking]);
  useEffect(() => { speakTodayFocusRef.current   = speakTodayFocus;   }, [speakTodayFocus]);
  useEffect(() => { speakLatestUpdateRef.current = speakLatestUpdate; }, [speakLatestUpdate]);
  useEffect(() => { speakAssignmentRef.current   = speakAssignment;   }, [speakAssignment]);

  // ── Coordinate with NOVA Welcome Assistant ────────────────────────────────
  // The NWA runs its own SpeechRecognition session.  Chrome allows only one
  // concurrent session — when NWA is active we MUST stop our loop, and resume
  // once NWA hands the mic back.
  const handleNovaActiveChange = useCallback((active: boolean) => {
    novaActiveRef.current = active;
    if (active) {
      stopLoopRef.current?.();
    } else {
      // Small delay to let NWA fully clean up its recognizer before we start ours
      if (!mutedRef.current) {
        setTimeout(() => {
          if (!novaActiveRef.current) startLoopRef.current?.();
        }, 500);
      }
    }
  }, []);

  // Start wake-word listener on mount.
  // 300 ms delay lets the browser finish the page-load audio context handoff
  // before we claim the mic — avoids immediate "not-allowed" on first render.
  useEffect(() => {
    const t = setTimeout(() => { if (!mutedRef.current) startWakeLoop(); }, 300);
    return () => { clearTimeout(t); stopAllRec(); };
  }, []); // eslint-disable-line

  // Restart wake listener when lang changes ONLY — intentionally using refs so
  // that data loads don't trigger abort/restart cycles (causes iOS freeze).
  useEffect(() => {
    stopLoopRef.current?.();
    const t = setTimeout(() => {
      if (!mutedRef.current) startLoopRef.current?.();
    }, 600);
    return () => clearTimeout(t);
  }, [lang]); // eslint-disable-line

  // Toggle mute — also pauses/resumes the wake listener
  const toggleMuteAndLoop = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) {
      if (canSpeak) { window.speechSynthesis.cancel(); setIsSpeaking(false); }
      stopAllRec();
    } else {
      startWakeLoop();
    }
  };

  // ── Speak incoming coaching messages ───────────────────────────────────────
  useEffect(() => {
    const unread = coachMsgs.filter(m => !m.read && !spokenCoachIds.current.has(m.id));
    if (unread.length === 0) return;
    const newest = unread[0];
    spokenCoachIds.current.add(newest.id);
    setVisibleCoachId(newest.id);
    speak(`Coaching message from your supervisor: ${newest.message}`, () => {
      setTimeout(() => setVisibleCoachId(null), 3000);
    });
    void markCoachRead(newest.id);
  }, [coachMsgs, speak, markCoachRead]);

  // One-time TTS unlock (called from a tap handler to satisfy browser policy)
  const unlockTTS = () => {
    if (ttsReadyRef.current) return;
    try {
      const u = new SpeechSynthesisUtterance("\u200B");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
    ttsReadyRef.current = true;
    setTtsReady(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-3 py-5 sm:px-6 sm:py-8">

      {/* NOVA AI Welcome overlay */}
      {showWelcome && (
        <NovaWelcomeAssistant
          userName={currentUser?.fullName?.split(" ")[0] || currentUser?.username || "there"}
          lang={lang}
          onDismiss={() => {
            markWelcomeSeen(currentUser?.username ?? "");
            setShowWelcome(false);
          }}
          onActiveChange={handleNovaActiveChange}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-widest mb-1">Selector Portal</p>
            <h1 className="text-2xl sm:text-4xl font-black capitalize">
              {currentUser?.fullName ?? "Welcome"}
            </h1>
            {selectorProfile && (
              <p className="text-slate-400 mt-2 text-sm">
                {selectorProfile.novaId} · {selectorProfile.level}
              </p>
            )}
            {currentUser?.role && (
              <p className="text-slate-500 text-xs mt-1 capitalize">{currentUser.role}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Talk to NOVA AI — safety briefing button (always visible) */}
            <button
              onClick={() => setShowWelcome(true)}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 active:scale-95 transition shadow-lg shadow-yellow-400/20 text-slate-950"
            >
              <Headphones className="h-5 w-5 shrink-0" />
              <div className="text-left leading-tight">
                <p className="font-black text-sm">NOVA Safety Briefing</p>
                <p className="text-xs font-medium opacity-70">Tap to talk with NOVA</p>
              </div>
            </button>
            {/* Account Number card — always shown */}
            {currentUser?.accountNumber && (
              <div className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Account #</p>
                  <p className="text-xl font-black text-white tracking-[0.15em]">{currentUser.accountNumber}</p>
                </div>
              </div>
            )}
            {/* NOVA Pin if available */}
            {selectorProfile?.novaPin && (
              <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/5 px-5 py-3 flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-yellow-400 shrink-0" />
                <div>
                  <p className="text-xs text-yellow-400 font-bold uppercase tracking-widest">Your NOVA ID</p>
                  <p className="text-2xl font-black text-white tracking-[0.2em]">{selectorProfile.novaPin}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 🎧 Ask NOVA Voice Panel ─────────────────────────────────────── */}
        <div className={`rounded-3xl border p-6 transition-all ${
          isListening
            ? "border-yellow-400 bg-yellow-400/5 shadow-[0_0_30px_rgba(250,204,21,0.15)]"
            : isSpeaking
            ? "border-violet-500/50 bg-violet-500/5"
            : "border-slate-700 bg-slate-900"
        }`}>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-1">NOVA Voice Assistant</p>
              <h2 className="text-2xl font-black">Ask NOVA</h2>
            </div>
            <button
              onClick={toggleMuteAndLoop}
              className="rounded-xl border border-slate-700 p-2.5 text-slate-400 hover:border-slate-500 hover:text-white transition"
              title={muted ? "Unmute NOVA" : "Mute NOVA"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          {/* One-time TTS unlock — tap once, then everything is voice-only */}
          {!ttsReady && !muted && (
            <button
              onClick={() => {
                unlockTTS();
                // Also speak the greeting if TTS was just unlocked
                const name = currentUser?.fullName?.split(" ")[0] ?? (lang === "es" ? "amigo" : "there");
                const hour = new Date().getHours();
                setTimeout(() => speak(NOVA_TEXT.greeting(name, hour, lang)), 200);
              }}
              className="w-full mb-4 flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 text-slate-950 font-black text-base py-4 hover:bg-yellow-300 active:scale-95 transition shadow-lg shadow-yellow-400/20"
            >
              <Mic className="h-5 w-5" />
              {lang === "es" ? "Toca una vez para activar la voz de NOVA" : "Tap once to enable NOVA's voice"}
            </button>
          )}

          {/* Wake-word / command status — shows when mic is active */}
          {!muted && (
            <div className="flex items-center gap-3 mb-4">
              {isListening ? (
                <>
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400" />
                  </span>
                  <p className="text-sm text-yellow-300 font-semibold">
                    {novaStatus || (lang === "es" ? "Di 'Hola NOVA' para activar…" : "Say 'Hey NOVA' to activate…")}
                  </p>
                </>
              ) : isSpeaking ? (
                <>
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-400" />
                  </span>
                  <p className="text-sm text-violet-300 font-semibold">
                    {novaStatus || (lang === "es" ? "NOVA está hablando…" : "NOVA is speaking…")}
                  </p>
                </>
              ) : (
                <>
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-600" />
                  </span>
                  <p className="text-sm text-slate-500">
                    {novaStatus || (lang === "es" ? "Reconectando micrófono…" : "Reconnecting mic…")}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Quick tap chips — always visible, tap instead of speaking */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { unlockTTS(); speakTodayFocus(); }}
              className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-yellow-400/50 hover:bg-slate-750 transition px-4 py-2.5 text-sm font-semibold text-slate-300"
            >
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
              {lang === "es" ? "Enfoque de hoy" : "Today's Focus"}
            </button>
            <button
              onClick={() => { unlockTTS(); speakAssignment(); }}
              className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-blue-400/50 transition px-4 py-2.5 text-sm font-semibold text-slate-300"
            >
              <DoorOpen className="h-3.5 w-3.5 text-blue-300" />
              {lang === "es" ? "Mi Tarea" : "My Assignment"}
            </button>
            <button
              onClick={() => { unlockTTS(); speakLatestUpdate(); }}
              className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-violet-400/50 transition px-4 py-2.5 text-sm font-semibold text-slate-300"
            >
              <Megaphone className="h-3.5 w-3.5 text-violet-300" />
              {lang === "es" ? "Actualización" : "Supervisor Update"}
            </button>
          </div>

          {/* Voice command hint */}
          <p className="mt-3 text-xs text-slate-600">
            {lang === "es"
              ? "Di: \"enfoque de hoy\" · \"mi tarea\" · \"última actualización\""
              : "Say: \"today's focus\" · \"my assignment\" · \"supervisor update\""}
          </p>
        </div>

        {/* ── Performance Log ──────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center shrink-0">
              <ClipboardList className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Log Today's Performance</h2>
              <p className="text-slate-400 text-sm">
                {todayLog
                  ? `Last saved: ${todayLog.cases ?? "—"} cases · ${todayLog.hours}h · ${todayLog.uph ?? "—"} UPH`
                  : "Enter your cases and hours to track your shift."}
              </p>
            </div>
          </div>

          {/* Input row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                Cases Picked
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 720"
                value={logCases}
                onChange={(e) => setLogCases(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 focus:border-yellow-400/60 outline-none text-white font-black text-xl px-4 py-3 placeholder:text-slate-600 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                Hours Worked
              </label>
              <input
                type="number"
                min="0"
                step="0.25"
                placeholder="e.g. 8.5"
                value={logHours}
                onChange={(e) => setLogHours(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 focus:border-yellow-400/60 outline-none text-white font-black text-xl px-4 py-3 placeholder:text-slate-600 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Live calculated stats */}
          {liveUPH > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Zap className="h-3.5 w-3.5 text-yellow-400" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">UPH</p>
                </div>
                <p className="text-2xl font-black text-white">{liveUPH}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">std {STANDARD_UPH}</p>
              </div>
              <div className={`rounded-2xl border px-4 py-3 text-center ${
                liveEff >= 100 ? "bg-green-500/10 border-green-500/30" :
                liveEff >= 85  ? "bg-yellow-400/10 border-yellow-400/30" :
                                 "bg-red-500/10 border-red-500/30"
              }`}>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Target className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Eff%</p>
                </div>
                <p className={`text-2xl font-black ${
                  liveEff >= 100 ? "text-green-400" :
                  liveEff >= 85  ? "text-yellow-400" : "text-red-400"
                }`}>{liveEff}%</p>
                <p className="text-[10px] text-slate-600 mt-0.5">target 100%</p>
              </div>
              <div className="rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Goal</p>
                </div>
                <p className="text-2xl font-black text-white">
                  {goal?.targetRate ? `${goal.targetRate}%` : "—"}
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">weekly target</p>
              </div>
            </div>
          )}

          {/* Optional note */}
          <input
            type="text"
            placeholder="Note (optional) — e.g. short break, equipment issue"
            value={logNote}
            onChange={(e) => setLogNote(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 focus:border-slate-600 outline-none text-white px-4 py-2.5 text-sm placeholder:text-slate-600"
          />

          {/* Save button */}
          <button
            onClick={handleSaveLog}
            disabled={logCasesNum <= 0 || logHoursNum <= 0}
            className={`w-full rounded-2xl py-3.5 text-base font-black transition flex items-center justify-center gap-2 ${
              logSaved
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : logCasesNum > 0 && logHoursNum > 0
                ? "bg-yellow-400 text-slate-950 hover:bg-yellow-300"
                : "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700"
            }`}
          >
            {logSaved
              ? <><CheckCircle2 className="h-5 w-5" /> Saved!</>
              : "Save Today's Log"}
          </button>

          {/* Recent history */}
          {recentLogs.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Last 7 Days</p>
              <div className="space-y-2">
                {recentLogs.map((log) => {
                  const isToday = log.date === new Date().toISOString().slice(0, 10);
                  const effColor =
                    log.pickRate >= 100 ? "text-green-400" :
                    log.pickRate >= 85  ? "text-yellow-400" : "text-red-400";
                  const dateLabel = isToday ? "Today" : new Date(log.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                  return (
                    <div key={log.date} className={`flex items-center justify-between rounded-2xl px-4 py-3 border ${
                      isToday ? "border-yellow-400/20 bg-yellow-400/5" : "border-slate-800 bg-slate-800/50"
                    }`}>
                      <div>
                        <p className={`text-sm font-bold ${isToday ? "text-yellow-400" : "text-white"}`}>{dateLabel}</p>
                        {log.note && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[160px]">{log.note}</p>}
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-xs text-slate-500">Cases</p>
                          <p className="text-sm font-black text-white">{log.cases ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Hours</p>
                          <p className="text-sm font-black text-white">{log.hours}h</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">UPH</p>
                          <p className="text-sm font-black text-white">{log.uph ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Eff%</p>
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

        {/* ── Today's Assignment ───────────────────────────────────────────── */}
        {assignedAssignment && (
          <div className="rounded-3xl border border-blue-500/30 bg-blue-500/5 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-1">Today's Assignment</p>
                <h2 className="text-2xl font-black">#{assignedAssignment.assignmentNumber}</h2>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-300">
                  <span>Aisles {assignedAssignment.startAisle}–{assignedAssignment.endAisle}</span>
                  <span>{assignedAssignment.totalCases} cases</span>
                  <span>{assignedAssignment.stops} stops</span>
                  <span>Goal: {assignedAssignment.goalTimeMinutes}m</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <DoorOpen className="h-4 w-4 text-yellow-400" />
                <span className="text-yellow-300 font-black text-lg">
                  Door {assignedAssignment.doorNumber} · {assignedAssignment.doorCode}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Supervisor Briefing Card ─────────────────────────────────────── */}
        {latestPost && (
          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/5 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="h-5 w-5 text-yellow-400" />
              <p className="text-yellow-300 text-sm font-black uppercase tracking-widest">Today's Briefing</p>
              <span className="text-slate-600 text-xs ml-auto">
                {new Date(latestPost.createdAt).toLocaleString("en-US", {
                  month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                })}
              </span>
            </div>

            {latestPost.shiftSummary && (
              <p className="text-white font-semibold">{latestPost.shiftSummary}</p>
            )}

            <div className="space-y-2.5">
              {latestPost.safetyTopic && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <ShieldCheck className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-0.5">Safety</p>
                    <p className="text-sm text-slate-200">{latestPost.safetyTopic}</p>
                  </div>
                </div>
              )}
              {latestPost.workloadUpdate && (
                <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3">
                  <Zap className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-0.5">Workload</p>
                    <p className="text-sm text-slate-200">{latestPost.workloadUpdate}</p>
                  </div>
                </div>
              )}
              {latestPost.topSelectorName && (
                <div className="flex items-start gap-3 rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-3">
                  <Star className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-0.5">Top Selector</p>
                    <p className="text-sm text-white font-bold">
                      {latestPost.topSelectorName}
                      {latestPost.topSelectorRate && (
                        <span className="text-yellow-300 ml-2">{latestPost.topSelectorRate}</span>
                      )}
                    </p>
                  </div>
                </div>
              )}
              {latestPost.selectorMessage && (
                <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
                  <p className="text-sm text-slate-200 italic">"{latestPost.selectorMessage}"</p>
                  <p className="text-xs text-slate-500 mt-1">— {latestPost.postedBy}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Coaching Message Banner ──────────────────────────────────────── */}
        {coachMsgs.filter(m => !m.read).length > 0 && (
          <div className="rounded-2xl border border-yellow-400/40 bg-yellow-400/5 p-4 flex items-start gap-3 animate-pulse-once">
            <div className="w-8 h-8 rounded-xl bg-yellow-400/20 flex items-center justify-center shrink-0">
              <Headphones className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-yellow-400 mb-1 uppercase tracking-wider">🎧 Coaching from your supervisor</p>
              {coachMsgs.filter(m => !m.read).map(m => (
                <div key={m.id} className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm text-white">{m.message}</p>
                  <button onClick={() => markCoachRead(m.id)} className="shrink-0 text-slate-500 hover:text-slate-300 text-xs mt-0.5">✓</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Portal Cards Grid ────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PortalCard
            href="/nova-trainer"
            icon={<Headphones className="h-5 w-5 text-slate-300" />}
            title="NOVA Trainer"
            description="Practice voice-directed picking with a demo session."
          />
          <PortalCard
            href="/nova-help"
            icon={<HelpCircle className="h-5 w-5 text-slate-300" />}
            title="NOVA Help"
            description="Voice commands, check codes, and picking tips."
          />
          <PortalCard
            href="/training"
            icon={<BookOpen className="h-5 w-5 text-slate-300" />}
            title="Training"
            description="Lessons and modules to improve your skills."
          />
          <PortalCard
            href="/mistakes"
            icon={<AlertTriangle className="h-5 w-5 text-slate-300" />}
            title="Common Mistakes"
            description="Learn what to avoid on the floor."
          />
          <PortalCard
            href="/progress"
            icon={<TrendingUp className="h-5 w-5 text-slate-300" />}
            title="My Progress"
            description="Track your performance over time."
          />
          <PortalCard
            href="/leaderboard"
            icon={<Star className="h-5 w-5 text-slate-300" />}
            title="Leaderboard"
            description="See how you rank among your team."
          />
          <PortalCard
            href="/training-reports"
            icon={<TrendingUp className="h-5 w-5 text-slate-300" />}
            title="Training Reports"
            description="View NOVA's AI feedback from your picking sessions."
          />
        </div>
      </div>
    </div>
  );
}
