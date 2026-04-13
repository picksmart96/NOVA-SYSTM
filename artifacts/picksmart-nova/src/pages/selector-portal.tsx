import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import { useTrainerStore } from "@/lib/trainerStore";
import { useSupervisorPostStore } from "@/lib/supervisorPostStore";
import {
  Headphones, BookOpen, HelpCircle, TrendingUp, Star, AlertTriangle, KeyRound,
  DoorOpen, Mic, MicOff, Volume2, VolumeX, Megaphone, ShieldCheck, Zap,
  ChevronRight,
} from "lucide-react";

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

  // ── Voice / Speech state ───────────────────────────────────────────────────
  const [muted, setMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [novaStatus, setNovaStatus] = useState<string>("");
  const mutedRef = useRef(false);
  const recognitionRef = useRef<any>(null);

  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  const canListen =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);

  const speak = useCallback((text: string, onDone?: () => void) => {
    if (mutedRef.current || !canSpeak) { onDone?.(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.97;
    u.pitch = 1;
    setIsSpeaking(true);
    u.onend = () => { setIsSpeaking(false); onDone?.(); };
    u.onerror = () => { setIsSpeaking(false); onDone?.(); };
    window.speechSynthesis.speak(u);
  }, [canSpeak]);

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next && canSpeak) { window.speechSynthesis.cancel(); setIsSpeaking(false); }
  };

  const speakTodayFocus = useCallback(() => {
    let message = "Today's focus. ";
    if (assignedAssignment) {
      message += `Your assignment is number ${assignedAssignment.assignmentNumber}. `;
      message += `Aisles ${assignedAssignment.startAisle} through ${assignedAssignment.endAisle}. `;
      message += `${assignedAssignment.totalCases} cases, ${assignedAssignment.stops} stops. `;
      message += `Goal time: ${assignedAssignment.goalTimeMinutes} minutes. `;
      message += `Stage at Door ${assignedAssignment.doorNumber}. `;
    }
    if (latestPost?.safetyTopic) {
      message += `Safety: ${latestPost.safetyTopic}. `;
    }
    if (latestPost?.workloadUpdate) {
      message += `Workload: ${latestPost.workloadUpdate}. `;
    }
    if (latestPost?.selectorMessage) {
      message += latestPost.selectorMessage;
    }
    if (!assignedAssignment && !latestPost) {
      message = "No assignment or briefing available right now. Check with your supervisor.";
    }
    setNovaStatus("Speaking today's focus…");
    speak(message, () => setNovaStatus(""));
  }, [assignedAssignment, latestPost, speak]);

  const speakLatestUpdate = useCallback(() => {
    if (!latestPost) {
      speak("No supervisor update posted yet. Check back at the start of your shift.");
      return;
    }
    let message = "Latest supervisor update. ";
    if (latestPost.shiftSummary) message += `Shift: ${latestPost.shiftSummary}. `;
    if (latestPost.safetyTopic)  message += `Safety: ${latestPost.safetyTopic}. `;
    if (latestPost.workloadUpdate) message += `Workload: ${latestPost.workloadUpdate}. `;
    if (latestPost.topSelectorName) {
      message += `Top selector: ${latestPost.topSelectorName} at ${latestPost.topSelectorRate}. `;
    }
    if (latestPost.selectorMessage) message += latestPost.selectorMessage;
    setNovaStatus("Speaking latest update…");
    speak(message, () => setNovaStatus(""));
  }, [latestPost, speak]);

  const speakAssignment = useCallback(() => {
    if (!assignedAssignment) {
      speak("You don't have an assignment yet. Ask your supervisor or trainer.");
      return;
    }
    const msg = `Your assignment is number ${assignedAssignment.assignmentNumber}. Aisles ${assignedAssignment.startAisle} through ${assignedAssignment.endAisle}. ${assignedAssignment.totalCases} cases. ${assignedAssignment.stops} stops. Goal: ${assignedAssignment.goalTimeMinutes} minutes. Stage at Door ${assignedAssignment.doorNumber}, code ${assignedAssignment.doorCode}.`;
    setNovaStatus("Speaking assignment…");
    speak(msg, () => setNovaStatus(""));
  }, [assignedAssignment, speak]);

  // ── Auto-greeting on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const name = currentUser?.fullName?.split(" ")[0] ?? "there";
    const time = new Date().getHours();
    const greeting = time < 12 ? "Good morning" : time < 17 ? "Good afternoon" : "Good evening";
    const delay = setTimeout(() => {
      speak(`${greeting}, ${name}. I'm NOVA. Tap "Ask NOVA" to hear your assignment or today's briefing.`);
    }, 800);
    return () => {
      clearTimeout(delay);
      if (canSpeak) window.speechSynthesis.cancel();
    };
  }, []);

  // ── Voice recognition setup ────────────────────────────────────────────────
  useEffect(() => {
    if (!canListen) return;
    const SpeechRecognitionClass = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => { setIsListening(true); setNovaStatus("Listening…"); };
    recognition.onend   = () => { setIsListening(false); };
    recognition.onerror = () => {
      setIsListening(false);
      setNovaStatus("Couldn't hear that. Try again.");
      setTimeout(() => setNovaStatus(""), 3000);
    };

    recognition.onresult = (event: any) => {
      const text = (event.results?.[0]?.[0]?.transcript ?? "").toLowerCase();
      setNovaStatus(`Heard: "${text}"`);

      if (text.includes("today") || text.includes("focus")) {
        speakTodayFocus();
      } else if (text.includes("supervisor") || text.includes("update") || text.includes("briefing")) {
        speakLatestUpdate();
      } else if (text.includes("assignment") || text.includes("door") || text.includes("aisle")) {
        speakAssignment();
      } else {
        const reply = "I didn't catch a command. Try saying: today's focus, assignment, or latest update.";
        speak(reply, () => setNovaStatus(""));
      }
    };

    recognitionRef.current = recognition;
  }, [speakTodayFocus, speakLatestUpdate, speakAssignment]);

  const startVoiceCommand = () => {
    if (!recognitionRef.current) {
      speak("Voice commands are not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      recognitionRef.current.start();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-3 py-5 sm:px-6 sm:py-8">
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
          </div>
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

        {/* ── 🎧 Ask NOVA Voice Panel ─────────────────────────────────────── */}
        <div className={`rounded-3xl border p-6 transition-all ${
          isListening
            ? "border-yellow-400 bg-yellow-400/5 shadow-[0_0_30px_rgba(250,204,21,0.15)]"
            : isSpeaking
            ? "border-violet-500/50 bg-violet-500/5"
            : "border-slate-700 bg-slate-900"
        }`}>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-1">NOVA Voice Assistant</p>
              <h2 className="text-2xl font-black">Ask NOVA</h2>
              <p className="text-slate-400 text-sm mt-1">
                Tap to speak — or use the quick buttons below.
              </p>
            </div>
            <button
              onClick={toggleMute}
              className="rounded-xl border border-slate-700 p-2.5 text-slate-400 hover:border-slate-500 hover:text-white transition"
              title={muted ? "Unmute NOVA" : "Mute NOVA"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          {/* Big ask button */}
          <button
            onClick={startVoiceCommand}
            disabled={!canListen}
            className={`w-full flex items-center justify-center gap-3 rounded-2xl py-4 text-lg font-black transition ${
              isListening
                ? "bg-yellow-400 text-slate-950 animate-pulse"
                : canListen
                ? "bg-yellow-400 text-slate-950 hover:bg-yellow-300"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            {isListening ? (
              <><MicOff className="h-6 w-6" /> Stop Listening</>
            ) : (
              <><Mic className="h-6 w-6" /> 🎧 Ask NOVA</>
            )}
          </button>

          {/* Status line */}
          {(novaStatus || isListening || isSpeaking) && (
            <div className="mt-3 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                isListening ? "bg-yellow-400 animate-ping" : isSpeaking ? "bg-violet-400 animate-pulse" : "bg-slate-500"
              }`} />
              <p className="text-sm text-slate-400">
                {novaStatus || (isListening ? "Listening for your command…" : isSpeaking ? "NOVA is speaking…" : "")}
              </p>
            </div>
          )}

          {/* Quick voice commands */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={speakTodayFocus}
              className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-yellow-400/50 hover:bg-slate-750 transition px-4 py-2 text-sm font-semibold text-slate-300"
            >
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
              Today's Focus
            </button>
            <button
              onClick={speakAssignment}
              className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-blue-400/50 transition px-4 py-2 text-sm font-semibold text-slate-300"
            >
              <DoorOpen className="h-3.5 w-3.5 text-blue-300" />
              My Assignment
            </button>
            <button
              onClick={speakLatestUpdate}
              className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-violet-400/50 transition px-4 py-2 text-sm font-semibold text-slate-300"
            >
              <Megaphone className="h-3.5 w-3.5 text-violet-300" />
              Supervisor Update
            </button>
          </div>

          {/* Voice command hints */}
          <p className="mt-4 text-xs text-slate-600">
            Voice commands: <span className="text-slate-500">"today's focus"</span> · <span className="text-slate-500">"my assignment"</span> · <span className="text-slate-500">"supervisor update"</span>
          </p>
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

        {/* ── Portal Cards Grid ────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PortalCard
            href="/nova-trainer"
            accent
            icon={<Headphones className="h-6 w-6 text-yellow-400" />}
            title="NOVA Trainer"
            description="Practice voice-directed picking with your assignment."
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
        </div>
      </div>
    </div>
  );
}
