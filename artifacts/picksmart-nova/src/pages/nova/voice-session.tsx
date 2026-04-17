import { useState, useEffect, useRef } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { 
  useGetAssignment, 
  useListAssignmentStops, 
  useUpdateAssignmentStop, 
  useUpdateAssignment,
  getGetAssignmentQueryKey,
  getListAssignmentStopsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, ArrowLeft, Volume2, CheckCircle2, Box, Headphones, Clock, TrendingUp, TrendingDown, Minus, Zap, Target, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/authStore";
import { logMistake, getCoachingLine, isStruggling, type MistakeType } from "@/lib/mistakeLog";
import { useTranslation } from "react-i18next";
import { novaSpeak } from "@/lib/novaSpeech";

type SessionState = 
  | 'intro'
  | 'pallet_alpha'
  | 'pallet_bravo'
  | 'picking'
  | 'wrong_code'
  | 'confirm_qty'
  | 'outro'
  | 'completed';

export default function VoiceSessionPage() {
  const [, params] = useRoute("/nova/voice/:id");
  const id = params?.id || "";
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("es") ? "es" : "en";
  const { currentUser, jwtToken } = useAuthStore();

  const { data: assignment, isLoading: loadingAssignment } = useGetAssignment(id, {
    query: { enabled: !!id, queryKey: getGetAssignmentQueryKey(id) }
  });

  const { data: stops, isLoading: loadingStops } = useListAssignmentStops(id, {
    query: { enabled: !!id, queryKey: getListAssignmentStopsQueryKey(id) }
  });

  const updateStop = useUpdateAssignmentStop();
  const updateAssignment = useUpdateAssignment();

  const [sessionState, setSessionState] = useState<SessionState>('intro');
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [codeInput, setCodeInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [ttsUnlocked, setTtsUnlocked] = useState(false);

  // ── Mistake tracking ─────────────────────────────────────────────────────
  const [mistakeCount, setMistakeCount]     = useState(0);
  const [lastCoaching, setLastCoaching]     = useState<string | null>(null);
  const [showCoaching, setShowCoaching]     = useState(false);
  const coachingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const recordMistake = (type: MistakeType, expected: string, actual: string) => {
    const severity: "low" | "medium" | "high" =
      type === "check_error" ? "high" : type === "stacking_error" ? "medium" : "low";
    setMistakeCount((n) => n + 1);
    const coaching = getCoachingLine(type, lang);
    setLastCoaching(coaching);
    setShowCoaching(true);
    if (coachingTimerRef.current) clearTimeout(coachingTimerRef.current);
    coachingTimerRef.current = setTimeout(() => setShowCoaching(false), 8000);
    if (jwtToken) {
      logMistake(jwtToken, {
        companyId:     currentUser?.id,
        selectorId:    currentUser?.id,
        sessionId:     id,
        mistakeType:   type,
        description:   `${type.replace("_", " ")} during voice session`,
        expectedAction: expected,
        actualAction:   actual,
        severity,
      });
    }
  };
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize session state based on assignment status
  useEffect(() => {
    if (assignment && stops && stops.length > 0) {
      if (assignment.status === 'completed') {
        setSessionState('completed');
      } else {
        const nextPendingStopIndex = stops.findIndex(s => s.status !== 'picked');
        if (nextPendingStopIndex === -1) {
          setSessionState('outro');
        } else {
          setCurrentStopIndex(nextPendingStopIndex);
          if (assignment.status === 'active' && nextPendingStopIndex > 0) {
            setSessionState('picking');
          } else {
            setSessionState('intro');
          }
        }
      }
    }
  }, [assignment, stops]);

  // Start timer when active
  useEffect(() => {
    if (sessionState !== 'completed' && sessionState !== 'intro' && assignment?.status === 'active') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionState, assignment?.status]);

  // Real TTS — always tied to a prior user gesture (ttsUnlocked gate above)
  const speak = (text: string) => {
    setTranscript(text);
    setIsSpeaking(true);
    novaSpeak(text, lang, () => setIsSpeaking(false), { rate: 0.95, pitch: 1 });
  };

  useEffect(() => {
    if (!assignment || !stops || !ttsUnlocked) return;

    if (sessionState === 'intro') {
      speak(`Start aisle ${assignment.startAisle}. End aisle ${assignment.endAisle}. Total case count ${assignment.totalCases}. Total pallets ${assignment.totalPallets}. Goal time ${assignment.goalTimeMinutes} minutes. To continue, say ready.`);
    } else if (sessionState === 'pallet_alpha') {
      speak("Position Alpha pallet. Get CHEP.");
    } else if (sessionState === 'pallet_bravo') {
      speak("Position Bravo pallet.");
    } else if (sessionState === 'picking') {
      const currentStop = stops[currentStopIndex];
      if (currentStop) {
        speak(`${currentStop.aisle} ${currentStop.slot} check.`);
        setCodeInput("");
      }
    } else if (sessionState === 'outro') {
      speak(`Last case complete. Proceed to printer ${assignment.printerNumber}. Apply label ${assignment.alphaLabelNumber} to pallet Alpha. Deliver Alpha pallet to door ${assignment.doorNumber}. Assignment complete.`);
    }
  }, [sessionState, currentStopIndex, assignment, stops, ttsUnlocked]);

  const handleNext = () => {
    if (isSpeaking) return;

    switch (sessionState) {
      case 'intro':
        setSessionState('pallet_alpha');
        break;
      case 'pallet_alpha':
        if (assignment?.totalPallets && assignment.totalPallets > 1) {
          setSessionState('pallet_bravo');
        } else {
          setSessionState('picking');
        }
        break;
      case 'pallet_bravo':
        setSessionState('picking');
        break;
      case 'confirm_qty':
        // Mark current stop as picked
        if (stops && stops[currentStopIndex]) {
          const currentStop = stops[currentStopIndex];
          updateStop.mutate({
            id: id,
            stopId: currentStop.id,
            data: { status: 'picked', pickedAt: new Date().toISOString() }
          }, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getListAssignmentStopsQueryKey(id) });
              
              if (currentStopIndex < stops.length - 1) {
                setCurrentStopIndex(prev => prev + 1);
                setSessionState('picking');
              } else {
                setSessionState('outro');
              }
            }
          });
        }
        break;
      case 'outro':
        // Complete assignment
        updateAssignment.mutate({
          id: id,
          data: { status: 'completed', completedAt: new Date().toISOString() }
        }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetAssignmentQueryKey(id) });
            setSessionState('completed');
            toast.success("Assignment Completed!");
            setTimeout(() => setLocation('/nova'), 3000);
          }
        });
        break;
    }
  };

  const handleCheckCode = () => {
    if (!stops || !stops[currentStopIndex] || isSpeaking) return;
    
    const currentStop = stops[currentStopIndex];
    if (codeInput.toUpperCase() === currentStop.checkCode.toUpperCase()) {
      // Correct code
      speak(`Confirmed. Grab ${currentStop.qty}.`);
      setSessionState('confirm_qty');
    } else {
      // Wrong code — log + coach
      const coaching = getCoachingLine("check_error", lang);
      speak(`Invalid. ${codeInput}. ${currentStop.aisle} ${currentStop.slot} check. ${coaching}`);
      recordMistake("check_error", currentStop.checkCode, codeInput);
      setCodeInput("");
      setSessionState('wrong_code');
    }
  };

  if (loadingAssignment || loadingStops) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-primary"><Volume2 className="h-12 w-12 animate-pulse" /></div>;
  }

  if (!assignment || !stops) return null;

  const currentStop = stops[currentStopIndex];
  const nextStop = stops[currentStopIndex + 1];
  const pickedCount = stops.filter(s => s.status === 'picked').length;
  const progress = Math.round((pickedCount / stops.length) * 100);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ── NOVA Performance Calculator ─────────────────────────────────────────────
  // Standard UPH is derived from the assignment's own goal time + total cases.
  // Falls back to 90 UPH if goal data is unavailable.
  const standardUPH = (assignment.goalTimeMinutes ?? 0) > 0
    ? Math.round(assignment.totalCases / ((assignment.goalTimeMinutes ?? 60) / 60))
    : 90;

  const hoursWorked = elapsedSeconds / 3600;
  const currentUPH = hoursWorked > 0.005 ? Math.round(pickedCount / hoursWorked) : 0;

  // Efficiency: actual UPH vs. standard UPH
  const efficiency = currentUPH > 0 && standardUPH > 0
    ? Math.round((currentUPH / standardUPH) * 100)
    : 0;

  // Earned time (how long it *should* have taken to pick this many units)
  const earnedSeconds = standardUPH > 0 ? (pickedCount / standardUPH) * 3600 : 0;

  // Positive = ahead of pace, negative = behind
  const paceDeltaSeconds = hoursWorked > 0.005 ? Math.round(earnedSeconds - elapsedSeconds) : 0;

  // Projected time to finish at current rate
  const remaining = stops.length - pickedCount;
  const projectedMinutesLeft = currentUPH > 0
    ? Math.round((remaining / currentUPH) * 60)
    : null;

  const efficiencyColor =
    efficiency >= 100 ? "text-green-400" :
    efficiency >= 85  ? "text-yellow-400" :
    efficiency > 0    ? "text-red-400" :
                        "text-slate-500";

  const efficiencyBg =
    efficiency >= 100 ? "bg-green-500/10 border-green-500/30" :
    efficiency >= 85  ? "bg-yellow-400/10 border-yellow-400/30" :
    efficiency > 0    ? "bg-red-500/10 border-red-500/30" :
                        "bg-slate-800/50 border-slate-700/30";

  const paceLabel =
    paceDeltaSeconds > 30  ? "Ahead" :
    paceDeltaSeconds < -30 ? "Behind" :
                             "On Pace";

  const PaceIcon =
    paceDeltaSeconds > 30  ? TrendingUp :
    paceDeltaSeconds < -30 ? TrendingDown :
                             Minus;

  if (sessionState === 'completed') {
    const finalUPH = hoursWorked > 0.005 ? Math.round(pickedCount / hoursWorked) : 0;
    const finalEff = finalUPH > 0 && standardUPH > 0 ? Math.round((finalUPH / standardUPH) * 100) : 0;
    const perfBand =
      finalEff >= 110 ? { label: "Outstanding", color: "text-green-300", bg: "bg-green-500/10 border-green-500/30" } :
      finalEff >= 100 ? { label: "On Target", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" } :
      finalEff >= 85  ? { label: "Acceptable", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" } :
      finalEff > 0    ? { label: "Below Standard", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" } :
                        { label: "—", color: "text-slate-400", bg: "bg-slate-800 border-slate-700" };
    return (
      <div className="min-h-[100dvh] bg-[#0f141a] flex flex-col items-center justify-center p-6 gap-6">
        <CheckCircle2 className="h-20 w-20 text-green-400" />
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-1">Assignment Complete</h1>
          <p className="text-slate-400">Here's how you performed</p>
        </div>

        {/* Performance Summary */}
        <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className={`rounded-2xl border px-4 py-3 text-center ${perfBand.bg}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Performance Band</p>
            <p className={`text-2xl font-black ${perfBand.color}`}>{perfBand.label}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-800 p-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">UPH</p>
              <p className="text-xl font-black text-white">{finalUPH || "—"}</p>
              <p className="text-[10px] text-slate-600">std {standardUPH}</p>
            </div>
            <div className="rounded-2xl bg-slate-800 p-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Eff%</p>
              <p className={`text-xl font-black ${perfBand.color}`}>{finalEff > 0 ? `${finalEff}%` : "—"}</p>
              <p className="text-[10px] text-slate-600">target 100%</p>
            </div>
            <div className="rounded-2xl bg-slate-800 p-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Time</p>
              <p className="text-xl font-black text-white">{formatTime(elapsedSeconds)}</p>
              <p className="text-[10px] text-slate-600">goal {assignment.goalTimeMinutes}m</p>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 pt-1">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest">Cases Picked</p>
              <p className="text-lg font-black text-white">{pickedCount} / {stops.length}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Pace</p>
              <p className={`text-lg font-black ${
                paceDeltaSeconds > 30 ? "text-green-400" :
                paceDeltaSeconds < -30 ? "text-red-400" : "text-yellow-400"
              }`}>
                {elapsedSeconds > 18 ? paceLabel : "—"}
              </p>
            </div>
          </div>
        </div>

        <Link href="/nova">
          <Button size="lg" className="bg-yellow-400 text-slate-950 font-black hover:bg-yellow-300">
            Return to Assignments
          </Button>
        </Link>
      </div>
    );
  }

  /* ── Voice unlock overlay ─────────────────────────────────────────────── */
  if (!ttsUnlocked) {
    return (
      <div className="min-h-[100dvh] bg-[#0f141a] flex flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-yellow-400 flex items-center justify-center shadow-[0_0_60px_rgba(250,204,21,0.35)]">
          <Headphones className="h-12 w-12 text-slate-950" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white mb-2">NOVA Voice Session</h2>
          <p className="text-slate-400 text-base max-w-xs mx-auto">
            Tap the button below to enable NOVA's voice. She'll guide you through every pick out loud.
          </p>
        </div>
        <button
          onClick={() => {
            try {
              const warmup = new SpeechSynthesisUtterance(" ");
              warmup.volume = 0.01;
              window.speechSynthesis.speak(warmup);
            } catch {}
            setTtsUnlocked(true);
          }}
          className="px-10 py-5 bg-yellow-400 text-slate-950 font-black text-xl rounded-2xl hover:bg-yellow-300 active:scale-95 transition shadow-xl shadow-yellow-400/30"
        >
          Enable NOVA Voice
        </button>
        <Link href={`/nova/assignments/${id}`}>
          <button className="text-slate-500 text-sm hover:text-slate-300 transition">
            ← Back to assignments
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0f141a] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-black/40 backdrop-blur-md border-b border-white/10">
        <Link href={`/nova/assignments/${id}`}>
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" /> Exit Session
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-md font-mono text-sm tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {formatTime(elapsedSeconds)}
          </div>
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-bold text-white/70 uppercase tracking-widest">
            {assignment.voiceMode.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 pt-20 pb-32 z-0 relative">
        
        {/* Pulsing NOVA Indicator */}
        <div className="mb-12 relative flex justify-center items-center h-48 w-full">
          {isSpeaking && (
            <>
              <div className="absolute w-32 h-32 bg-primary/20 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />
              <div className="absolute w-48 h-48 bg-primary/10 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.2s' }} />
              <div className="absolute w-64 h-64 bg-primary/5 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.4s' }} />
            </>
          )}
          <div className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isSpeaking ? 'bg-primary shadow-[0_0_50px_rgba(250,204,21,0.5)] scale-110' : 'bg-secondary border-2 border-primary/50'}`}>
            <Headphones className={`h-10 w-10 ${isSpeaking ? 'text-black' : 'text-primary'}`} />
          </div>
        </div>

        {/* Transcript */}
        <div className="text-center max-w-2xl px-4 mb-12 min-h-[100px] flex items-center justify-center">
          <p className={`text-2xl md:text-3xl font-medium leading-relaxed ${isSpeaking ? 'text-white' : 'text-white/50'}`}>
            "{transcript}"
          </p>
        </div>

        {/* Controls based on state */}
        <div className="w-full max-w-md mx-auto">
          {(sessionState === 'picking' || sessionState === 'wrong_code') ? (
            <Card className="bg-black/50 border-white/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-1">Current Location</p>
                  <p className="text-5xl font-black text-white tracking-tight">{currentStop?.aisle} - {currentStop?.slot}</p>
                </div>
                <div className="flex gap-2">
                  <Input 
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="Enter Check Code" 
                    className="bg-white/5 border-white/20 text-white font-mono text-center text-xl h-14 uppercase placeholder:text-white/20"
                    onKeyDown={(e) => e.key === 'Enter' && handleCheckCode()}
                    disabled={isSpeaking}
                    autoFocus
                  />
                  <Button 
                    onClick={handleCheckCode}
                    disabled={!codeInput || isSpeaking}
                    className="h-14 px-8 bg-primary text-black font-bold hover:bg-primary/90"
                  >
                    Send
                  </Button>
                </div>
                {sessionState === 'wrong_code' && !isSpeaking && (
                  <p className="text-red-400 text-sm text-center mt-3 font-medium">Try again</p>
                )}
              </CardContent>
            </Card>
          ) : sessionState === 'confirm_qty' ? (
            <Card className="bg-primary/10 border-primary/30 backdrop-blur-sm shadow-[0_0_30px_rgba(250,204,21,0.1)]">
              <CardContent className="p-8 text-center">
                <p className="text-primary/70 font-bold uppercase tracking-widest mb-2">Quantity Required</p>
                <p className="text-7xl font-black text-primary mb-8">{currentStop?.qty}</p>
                <Button 
                  onClick={handleNext}
                  disabled={isSpeaking}
                  size="lg"
                  className="w-full h-16 text-xl bg-primary text-black font-black hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(250,204,21,0.4)]"
                >
                  <Mic className="mr-3 h-6 w-6" /> READY
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={isSpeaking}
              size="lg"
              className="w-full h-16 text-xl bg-white/10 text-white font-bold hover:bg-white/20 border border-white/20"
            >
              <Mic className="mr-3 h-5 w-5" /> Say "READY"
            </Button>
          )}
        </div>
      </div>

      {/* NOVA Coaching banner — shown after a mistake, auto-hides after 8s */}
      {showCoaching && lastCoaching && (
        <div className="absolute bottom-[130px] left-4 right-4 z-10 max-w-2xl mx-auto rounded-2xl border border-red-500/40 bg-red-950/80 backdrop-blur-md px-5 py-3.5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-0.5">NOVA COACHING</p>
            <p className="text-sm text-white leading-snug">{lastCoaching}</p>
          </div>
          <button onClick={() => setShowCoaching(false)} className="text-red-500 hover:text-red-300 transition text-xs">✕</button>
        </div>
      )}

      {/* Struggling alert — fires once at threshold */}
      {isStruggling(mistakeCount) && mistakeCount === 10 && (
        <div className="absolute bottom-[180px] left-4 right-4 z-10 max-w-2xl mx-auto rounded-2xl border border-yellow-400/40 bg-yellow-950/80 backdrop-blur-md px-5 py-3.5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-200">
            <span className="font-black">Accuracy Alert — </span>
            {lang === "es"
              ? "Alto número de errores detectado. Recomendamos pausar y revisar el proceso de verificación."
              : "High mistake count detected. Consider pausing to review your check digit process."}
          </p>
        </div>
      )}

      {/* Bottom HUD — Progress + NOVA Performance Calculator */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-md border-t border-white/10">

        {/* Progress bar row */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-3 max-w-5xl mx-auto">
            <span className="w-10 text-right font-mono text-xs text-white/40">{progress}%</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-white/40 font-medium">{pickedCount}/{stops.length}</span>
          </div>
        </div>

        {/* Performance Stats Grid */}
        <div className="px-4 pb-3">
          <div className="max-w-5xl mx-auto grid grid-cols-5 gap-2">

            {/* UPH */}
            <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Zap className="h-3 w-3 text-yellow-400" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">UPH</p>
              </div>
              <p className="text-lg font-black text-white leading-none">{currentUPH || "—"}</p>
              <p className="text-[9px] text-white/30 mt-0.5">std {standardUPH}</p>
            </div>

            {/* Efficiency */}
            <div className={`rounded-xl border px-3 py-2 text-center ${efficiencyBg}`}>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Target className="h-3 w-3 text-white/50" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Eff%</p>
              </div>
              <p className={`text-lg font-black leading-none ${efficiencyColor}`}>
                {efficiency > 0 ? `${efficiency}%` : "—"}
              </p>
              <p className="text-[9px] text-white/30 mt-0.5">target 100%</p>
            </div>

            {/* Pace */}
            <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <PaceIcon className="h-3 w-3 text-white/50" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Pace</p>
              </div>
              <p className={`text-sm font-black leading-none ${
                paceLabel === "Ahead" ? "text-green-400" :
                paceLabel === "Behind" ? "text-red-400" : "text-yellow-400"
              }`}>
                {elapsedSeconds > 18 ? paceLabel : "—"}
              </p>
              {elapsedSeconds > 18 && Math.abs(paceDeltaSeconds) > 30 && (
                <p className="text-[9px] text-white/30 mt-0.5">
                  {Math.abs(Math.round(paceDeltaSeconds / 60))}m {Math.abs(paceDeltaSeconds) % 60}s
                </p>
              )}
            </div>

            {/* ETA */}
            <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Clock className="h-3 w-3 text-white/50" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">ETA</p>
              </div>
              <p className="text-sm font-black text-white leading-none">
                {projectedMinutesLeft !== null && elapsedSeconds > 18
                  ? `${projectedMinutesLeft}m`
                  : "—"}
              </p>
              {nextStop && (
                <p className="text-[9px] text-white/30 mt-0.5 font-mono">
                  Next: {nextStop.aisle}-{nextStop.slot}
                </p>
              )}
            </div>

            {/* Mistakes */}
            <div className={`rounded-xl border px-3 py-2 text-center ${
              mistakeCount === 0
                ? "bg-white/5 border-white/10"
                : isStruggling(mistakeCount)
                ? "bg-red-900/40 border-red-500/40"
                : "bg-yellow-900/30 border-yellow-400/30"
            }`}>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <AlertTriangle className={`h-3 w-3 ${
                  mistakeCount === 0 ? "text-white/50" :
                  isStruggling(mistakeCount) ? "text-red-400" : "text-yellow-400"
                }`} />
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">ERR</p>
              </div>
              <p className={`text-lg font-black leading-none ${
                mistakeCount === 0 ? "text-white/50" :
                isStruggling(mistakeCount) ? "text-red-400" : "text-yellow-400"
              }`}>{mistakeCount}</p>
              <p className="text-[9px] text-white/30 mt-0.5">
                {isStruggling(mistakeCount) ? "retrain" : "session"}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}