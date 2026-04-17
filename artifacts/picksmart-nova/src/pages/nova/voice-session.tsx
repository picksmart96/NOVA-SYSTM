import { useState, useEffect, useRef, useCallback } from "react";
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
import {
  Mic, ArrowLeft, Volume2, CheckCircle2, Box, Headphones, Clock,
  TrendingUp, TrendingDown, Minus, Zap, Target, AlertTriangle,
  ShieldCheck, BarChart2, ThumbsUp
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/authStore";
import { logMistake, getCoachingLine, isStruggling, type MistakeType } from "@/lib/mistakeLog";
import { useTranslation } from "react-i18next";
import { novaSpeak } from "@/lib/novaSpeech";

// ── Types ─────────────────────────────────────────────────────────────────────
type SessionState =
  | 'intro'
  | 'pallet_alpha'
  | 'pallet_bravo'
  | 'picking'
  | 'wrong_code'
  | 'confirm_qty'
  | 'pallet_check'
  | 'outro'
  | 'submitting'
  | 'completed';

// ── PALLET CHECK INTERVAL ─────────────────────────────────────────────────────
const PALLET_CHECK_EVERY = 50; // every 50 cases

// ── Pallet check text ─────────────────────────────────────────────────────────
const PALLET_CHECK_TEXT = "Pause real quick. Check your pallet right now. Look for any crushed corners. Make sure it is not leaning or unstable. If it needs it, wrap it now to keep product from falling. Safety first. When you're ready, tap continue.";

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
  const updateStop       = useUpdateAssignmentStop();
  const updateAssignment = useUpdateAssignment();

  // ── Core session state ──────────────────────────────────────────────────────
  const [sessionState, setSessionState]     = useState<SessionState>('intro');
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [codeInput, setCodeInput]           = useState("");
  const [isSpeaking, setIsSpeaking]         = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [transcript, setTranscript]         = useState("");
  const [ttsUnlocked, setTtsUnlocked]       = useState(false);

  // ── Qty confirmation voice ─────────────────────────────────────────────────
  const [qtyInput, setQtyInput]             = useState<string>("");
  const [isListeningQty, setIsListeningQty] = useState(false);
  const qtyRecognitionRef                   = useRef<any>(null);

  // ── Mistake tracking ───────────────────────────────────────────────────────
  const [mistakeCount, setMistakeCount]     = useState(0);
  const [wrongCodeCount, setWrongCodeCount] = useState(0);
  const [overPickCount, setOverPickCount]   = useState(0);
  const [shortPickCount, setShortPickCount] = useState(0);
  const [lastCoaching, setLastCoaching]     = useState<string | null>(null);
  const [showCoaching, setShowCoaching]     = useState(false);
  const coachingTimerRef                    = useRef<NodeJS.Timeout | null>(null);

  // ── Slot timing ─────────────────────────────────────────────────────────────
  const slotStartTimeRef  = useRef<number | null>(null);
  const slotTimesRef      = useRef<number[]>([]);

  // ── Pallet check tracking ─────────────────────────────────────────────────
  const [palletCheckPending, setPalletCheckPending]   = useState(false);
  const lastPalletCheckCountRef = useRef(0);
  const savedStateRef           = useRef<SessionState>('picking');

  // ── Voice command state ────────────────────────────────────────────────────
  const lastSpeechRef    = useRef<string>("");
  const speechRateRef    = useRef<number>(1.25);
  const sessionStateRef  = useRef<SessionState>('intro');
  const cmdRecRef        = useRef<any>(null);
  const cmdLoopRef       = useRef<(() => void) | null>(null);
  const cmdActiveRef     = useRef(false);

  // ── Final report ──────────────────────────────────────────────────────────
  const [report, setReport] = useState<{
    novaFeedback: string;
    improvements: string;
    mistakeSummary: string;
    howToImprove: string;
    performanceBand: string;
    efficiencyPercent: number;
    uphActual: number;
    uphStandard: number;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── API helpers ────────────────────────────────────────────────────────────
  const authHeaders = jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {};

  const logEvent = useCallback((
    eventType: string,
    opts: { stopId?: string; expectedValue?: string; actualValue?: string; slotTimeSeconds?: number } = {}
  ) => {
    if (!jwtToken) return;
    fetch("/api/picking-events", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ assignmentId: id, ...opts, eventType }),
    }).catch(() => {});
  }, [id, jwtToken]); // eslint-disable-line

  // ── Mistake helper ─────────────────────────────────────────────────────────
  const recordMistake = useCallback((type: MistakeType, expected: string, actual: string) => {
    const severity: "low" | "medium" | "high" =
      type === "check_error" ? "high" : type === "stacking_error" ? "medium" : "low";
    setMistakeCount(n => n + 1);
    const coaching = getCoachingLine(type, lang);
    setLastCoaching(coaching);
    setShowCoaching(true);
    if (coachingTimerRef.current) clearTimeout(coachingTimerRef.current);
    coachingTimerRef.current = setTimeout(() => setShowCoaching(false), 8000);
    if (jwtToken) {
      logMistake(jwtToken, {
        companyId:      currentUser?.id,
        selectorId:     currentUser?.id,
        sessionId:      id,
        mistakeType:    type,
        description:    `${type.replace("_", " ")} during voice session`,
        expectedAction: expected,
        actualAction:   actual,
        severity,
      });
    }
    logEvent(type, { expectedValue: expected, actualValue: actual });
  }, [lang, jwtToken, currentUser, id, logEvent]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionState !== 'completed' && sessionState !== 'intro' && sessionState !== 'submitting' && assignment?.status === 'active') {
      timerRef.current = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionState, assignment?.status]);

  // ── Initialize from DB assignment state ───────────────────────────────────
  useEffect(() => {
    if (assignment && stops && stops.length > 0) {
      if (assignment.status === 'completed') {
        setSessionState('completed');
      } else {
        const nextPending = stops.findIndex(s => s.status !== 'picked');
        if (nextPending === -1) {
          setSessionState('outro');
        } else {
          setCurrentStopIndex(nextPending);
          if (assignment.status === 'active' && nextPending > 0) {
            setSessionState('picking');
          } else {
            setSessionState('intro');
          }
        }
      }
    }
  }, [assignment, stops]);

  // ── Speak helper ───────────────────────────────────────────────────────────
  const speak = useCallback((text: string, onEnd?: () => void) => {
    lastSpeechRef.current = text;
    setTranscript(text);
    setIsSpeaking(true);
    novaSpeak(text, lang, () => {
      setIsSpeaking(false);
      onEnd?.();
    }, { rate: speechRateRef.current, pitch: 1 });
  }, [lang]);

  // ── Qty voice recognition ──────────────────────────────────────────────────
  const startQtyListening = useCallback((expectedQty: number, stopId: string) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    try { qtyRecognitionRef.current?.stop(); } catch {}

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = lang === "es" ? "es-US" : "en-US";
    let gotResult = false;

    rec.onstart  = () => setIsListeningQty(true);
    rec.onerror  = (e: any) => {
      setIsListeningQty(false);
      if (!gotResult && e.error !== "not-allowed") {
        // Auto-retry on mic drop
        setTimeout(() => startQtyListening(expectedQty, stopId), 700);
      }
    };
    rec.onend = () => {
      setIsListeningQty(false);
      if (!gotResult) {
        // Auto-retry if nothing heard
        setTimeout(() => startQtyListening(expectedQty, stopId), 500);
      }
    };
    rec.onresult = (e: any) => {
      gotResult = true;
      const heard = (e.results?.[0]?.[0]?.transcript?.trim() || "").toLowerCase();
      if (!heard) return;

      // ── ES3 voice commands ─────────────────────────────────────────────────
      if (/\brepeat\b|repita|repetir/i.test(heard)) {
        gotResult = false;
        if (lastSpeechRef.current) speak(lastSpeechRef.current, () => startQtyListening(expectedQty, stopId));
        return;
      }
      if (/\bfaster\b|más.?rápido|mas.?rapido/i.test(heard)) {
        speechRateRef.current = Math.min(1.9, speechRateRef.current + 0.15);
        gotResult = false;
        speak(lang === "es" ? "Más rápido." : "Faster.", () => startQtyListening(expectedQty, stopId));
        return;
      }
      if (/\bslower\b|más.?lento|mas.?lento/i.test(heard)) {
        speechRateRef.current = Math.max(0.7, speechRateRef.current - 0.15);
        gotResult = false;
        speak(lang === "es" ? "Más lento." : "Slower.", () => startQtyListening(expectedQty, stopId));
        return;
      }
      // ──────────────────────────────────────────────────────────────────────

      // Extract number from speech (handles "two" → 2, word numbers, and digits)
      const NUM_WORDS: Record<string,number> = {
        one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
        eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,
        to:2,too:2,tu:2,won:1,
        uno:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,
      };
      const lower = heard.trim().toLowerCase();
      const fromWord = NUM_WORDS[lower];
      const fromDigit = (() => { const m = heard.match(/\d+/); return m ? parseInt(m[0], 10) : NaN; })();
      const said = fromWord !== undefined ? fromWord : (!isNaN(fromDigit) ? fromDigit : NaN);

      if (!isNaN(said) && said > 0) {
        setQtyInput(String(said));
        handleQtySubmit(said, expectedQty, stopId);
      } else {
        // Nothing recognized as number — retry
        gotResult = false;
        setTimeout(() => startQtyListening(expectedQty, stopId), 400);
      }
    };
    qtyRecognitionRef.current = rec;
    setIsListeningQty(true);
    try { rec.start(); } catch {}
  }, [lang]); // eslint-disable-line

  // ── Background "picking" command listener ──────────────────────────────────
  // Runs during 'picking' state so "Repeat"/"Faster"/"Slower" work while typing
  useEffect(() => { sessionStateRef.current = sessionState; }, [sessionState]);

  const stopCmdLoop = useCallback(() => {
    cmdActiveRef.current = false;
    try { cmdRecRef.current?.abort(); } catch {}
    cmdRecRef.current = null;
  }, []);

  const startCmdLoop = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR || cmdActiveRef.current) return;
    try { cmdRecRef.current?.abort(); } catch {}

    const rec = new SR();
    rec.continuous     = true;
    rec.interimResults = false;
    rec.lang           = lang === "es" ? "es-US" : "en-US";
    rec.maxAlternatives = 1;

    rec.onstart = () => { cmdActiveRef.current = true; };
    rec.onend   = () => {
      cmdActiveRef.current = false;
      cmdRecRef.current    = null;
      if (sessionStateRef.current === "picking") {
        setTimeout(() => cmdLoopRef.current?.(), 700);
      }
    };
    rec.onerror = (e: any) => {
      cmdActiveRef.current = false;
      cmdRecRef.current    = null;
      if (e.error === "not-allowed") return;
      if (sessionStateRef.current === "picking") {
        setTimeout(() => cmdLoopRef.current?.(), 1000);
      }
    };
    rec.onresult = (e: any) => {
      const text = (e.results?.[e.results.length - 1]?.[0]?.transcript || "").toLowerCase().trim();
      if (/\brepeat\b|repita|repetir/i.test(text)) {
        if (lastSpeechRef.current) speak(lastSpeechRef.current);
      } else if (/\bfaster\b|más.?rápido|mas.?rapido/i.test(text)) {
        speechRateRef.current = Math.min(1.9, speechRateRef.current + 0.15);
        speak(lang === "es" ? "Más rápido." : "Faster.");
      } else if (/\bslower\b|más.?lento|mas.?lento/i.test(text)) {
        speechRateRef.current = Math.max(0.7, speechRateRef.current - 0.15);
        speak(lang === "es" ? "Más lento." : "Slower.");
      }
    };

    cmdRecRef.current = rec;
    try { rec.start(); } catch {}
  }, [lang, speak]); // eslint-disable-line

  useEffect(() => { cmdLoopRef.current = startCmdLoop; }, [startCmdLoop]);

  useEffect(() => {
    if (!ttsUnlocked) return;
    if (sessionState === "picking" && !isSpeaking) {
      const t = setTimeout(() => startCmdLoop(), 400);
      return () => { clearTimeout(t); stopCmdLoop(); };
    } else {
      stopCmdLoop();
    }
  }, [sessionState, isSpeaking, ttsUnlocked]); // eslint-disable-line

  // ── Handle qty submission ──────────────────────────────────────────────────
  const handleQtySubmit = useCallback((actual: number, expected: number, stopId: string) => {
    if (actual > expected) {
      setOverPickCount(n => n + 1);
      logEvent("over_pick", { stopId, expectedValue: String(expected), actualValue: String(actual) });
      speak(`Over pick. NOVA expected ${expected}, you said ${actual}. That counts as an over pick. Heading to next stop.`, () => {
        setQtyInput("");
        advanceStop();
      });
    } else if (actual < expected) {
      setShortPickCount(n => n + 1);
      logEvent("short_pick", { stopId, expectedValue: String(expected), actualValue: String(actual) });
      speak(`Short pick. NOVA expected ${expected}, you said ${actual}. Short pick recorded. Moving on.`, () => {
        setQtyInput("");
        advanceStop();
      });
    } else {
      setQtyInput("");
      advanceStop();
    }
  }, [logEvent, speak]); // eslint-disable-line

  // ── Advance to next stop ───────────────────────────────────────────────────
  const advanceStop = useCallback(() => {
    if (!stops) return;

    // Compute slot time
    if (slotStartTimeRef.current) {
      const slotSecs = Math.round((Date.now() - slotStartTimeRef.current) / 1000);
      slotTimesRef.current.push(slotSecs);
      logEvent("slot_complete", { slotTimeSeconds: slotSecs });
    }
    slotStartTimeRef.current = Date.now();

    if (currentStopIndex < stops.length - 1) {
      const newIndex = currentStopIndex + 1;
      setCurrentStopIndex(newIndex);

      // Pallet check every 50 cases
      const pickedSoFar = stops.filter((s, i) => i < newIndex && s.status === 'picked').length + 1;
      if (
        pickedSoFar >= PALLET_CHECK_EVERY &&
        Math.floor(pickedSoFar / PALLET_CHECK_EVERY) > Math.floor(lastPalletCheckCountRef.current / PALLET_CHECK_EVERY)
      ) {
        lastPalletCheckCountRef.current = pickedSoFar;
        savedStateRef.current = 'picking';
        setPalletCheckPending(true);
        setSessionState('pallet_check');
      } else {
        setSessionState('picking');
      }
    } else {
      setSessionState('outro');
    }
  }, [stops, currentStopIndex, logEvent]);

  // ── NOVA speech on state changes ──────────────────────────────────────────
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
        if (!slotStartTimeRef.current) slotStartTimeRef.current = Date.now();
        speak(`${currentStop.aisle} ${currentStop.slot} check.`);
        setCodeInput("");
      }
    } else if (sessionState === 'pallet_check') {
      speak(PALLET_CHECK_TEXT);
    } else if (sessionState === 'outro') {
      speak(
        `Last case complete. Proceed to printer ${assignment.printerNumber}. Apply label ${assignment.alphaLabelNumber} to pallet Alpha. Stage your pallet to door ${assignment.doorNumber}. You completed your assignment. Check with your trainer.`
      );
    }
  }, [sessionState, currentStopIndex, ttsUnlocked]); // eslint-disable-line

  // ── Start qty listening after NOVA says "Grab X" ─────────────────────────
  useEffect(() => {
    if (sessionState === 'confirm_qty' && !isSpeaking && ttsUnlocked) {
      const currentStop = stops?.[currentStopIndex];
      if (currentStop) {
        // Small delay then start listening for qty
        const t = setTimeout(() => {
          startQtyListening(currentStop.qty, currentStop.id);
        }, 500);
        return () => clearTimeout(t);
      }
    }
  }, [sessionState, isSpeaking, ttsUnlocked]); // eslint-disable-line

  // ── Check code handler ────────────────────────────────────────────────────
  const handleCheckCode = () => {
    if (!stops || !stops[currentStopIndex] || isSpeaking) return;
    const currentStop = stops[currentStopIndex];
    if (codeInput.toUpperCase() === currentStop.checkCode.toUpperCase()) {
      setWrongCodeCount(wc => wc);
      speak(`Confirmed. Grab ${currentStop.qty}.`);
      setSessionState('confirm_qty');
    } else {
      setWrongCodeCount(wc => wc + 1);
      const coaching = getCoachingLine("check_error", lang);
      speak(`Invalid. ${codeInput}. ${currentStop.aisle} ${currentStop.slot} check. ${coaching}`);
      recordMistake("check_error", currentStop.checkCode, codeInput);
      setCodeInput("");
      setSessionState('wrong_code');
    }
  };

  // ── "Ready" button — state machine step ───────────────────────────────────
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
      case 'pallet_check':
        setPalletCheckPending(false);
        setSessionState(savedStateRef.current);
        break;
      case 'confirm_qty': {
        // Fallback: user tapped READY without speaking — count as exact pick
        try { qtyRecognitionRef.current?.stop(); } catch {}
        setIsListeningQty(false);
        const currentStop = stops?.[currentStopIndex];
        if (currentStop) {
          updateStop.mutate(
            { id, stopId: currentStop.id, data: { status: 'picked', pickedAt: new Date().toISOString() } },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListAssignmentStopsQueryKey(id) });
                advanceStop();
              }
            }
          );
        }
        break;
      }
      case 'outro':
        submitSessionAndComplete();
        break;
    }
  };

  // ── Submit session report and complete ─────────────────────────────────────
  const submitSessionAndComplete = async () => {
    if (!assignment || !stops) return;
    setSessionState('submitting');

    const pickedCases   = stops.filter(s => s.status === 'picked').length;
    const hoursWorked   = elapsedSeconds / 3600;
    const stdUPH        = (assignment.goalTimeMinutes ?? 0) > 0
      ? Math.round(assignment.totalCases / ((assignment.goalTimeMinutes ?? 60) / 60))
      : 90;
    const actualUPH     = hoursWorked > 0.005 ? Math.round(pickedCases / hoursWorked) : 0;
    const efficiency    = actualUPH > 0 && stdUPH > 0 ? Math.round((actualUPH / stdUPH) * 100) : 0;
    const perfBand      =
      efficiency >= 110 ? "Outstanding" :
      efficiency >= 100 ? "On Target" :
      efficiency >= 85  ? "Acceptable" :
      efficiency > 0    ? "Below Standard" : "Not Measured";

    const avgSlotTime = slotTimesRef.current.length > 0
      ? slotTimesRef.current.reduce((a, b) => a + b, 0) / slotTimesRef.current.length
      : 0;

    // Complete in DB
    await new Promise<void>((resolve) => {
      updateAssignment.mutate(
        { id, data: { status: 'completed', completedAt: new Date().toISOString() } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetAssignmentQueryKey(id) });
            resolve();
          },
          onError: () => resolve()
        }
      );
    });

    // Post report to API
    try {
      const res = await fetch("/api/picking-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          assignmentId:        id,
          totalCases:          assignment.totalCases,
          pickedCases,
          totalDurationSeconds: elapsedSeconds,
          goalTimeMinutes:     assignment.goalTimeMinutes ?? 60,
          wrongCodeCount,
          overPickCount,
          shortPickCount,
          avgSlotTimeSeconds:  avgSlotTime,
          uphActual:           actualUPH,
          uphStandard:         stdUPH,
          efficiencyPercent:   efficiency,
          performanceBand:     perfBand,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const r = data.report;
        setReport({
          novaFeedback:     r.nova_feedback ?? r.novaFeedback ?? "",
          improvements:     r.improvements ?? "",
          mistakeSummary:   r.mistake_summary ?? r.mistakeSummary ?? "",
          howToImprove:     r.how_to_improve ?? r.howToImprove ?? "",
          performanceBand:  perfBand,
          efficiencyPercent: efficiency,
          uphActual:        actualUPH,
          uphStandard:      stdUPH,
        });
      }
    } catch {}

    setSessionState('completed');
    toast.success("Assignment complete! Your report has been submitted.");
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingAssignment || loadingStops) {
    return (
      <div className="min-h-screen bg-[#0f141a] flex items-center justify-center text-primary">
        <Volume2 className="h-12 w-12 animate-pulse" />
      </div>
    );
  }
  if (!assignment || !stops) return null;

  const currentStop   = stops[currentStopIndex];
  const nextStop      = stops[currentStopIndex + 1];
  const pickedCount   = stops.filter(s => s.status === 'picked').length;
  const progress      = Math.round((pickedCount / stops.length) * 100);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const standardUPH   = (assignment.goalTimeMinutes ?? 0) > 0
    ? Math.round(assignment.totalCases / ((assignment.goalTimeMinutes ?? 60) / 60))
    : 90;
  const hoursWorked   = elapsedSeconds / 3600;
  const currentUPH    = hoursWorked > 0.005 ? Math.round(pickedCount / hoursWorked) : 0;
  const efficiency    = currentUPH > 0 && standardUPH > 0 ? Math.round((currentUPH / standardUPH) * 100) : 0;
  const earnedSeconds = standardUPH > 0 ? (pickedCount / standardUPH) * 3600 : 0;
  const paceDelta     = hoursWorked > 0.005 ? Math.round(earnedSeconds - elapsedSeconds) : 0;
  const remaining     = stops.length - pickedCount;
  const projectedMin  = currentUPH > 0 ? Math.round((remaining / currentUPH) * 60) : null;

  const effColor = efficiency >= 100 ? "text-green-400" : efficiency >= 85 ? "text-yellow-400" : efficiency > 0 ? "text-red-400" : "text-slate-500";
  const effBg    = efficiency >= 100 ? "bg-green-500/10 border-green-500/30" : efficiency >= 85 ? "bg-yellow-400/10 border-yellow-400/30" : efficiency > 0 ? "bg-red-500/10 border-red-500/30" : "bg-slate-800/50 border-slate-700/30";
  const paceLabel = paceDelta > 30 ? "Ahead" : paceDelta < -30 ? "Behind" : "On Pace";
  const PaceIcon  = paceDelta > 30 ? TrendingUp : paceDelta < -30 ? TrendingDown : Minus;

  // ── Submitting overlay ────────────────────────────────────────────────────
  if (sessionState === 'submitting') {
    return (
      <div className="min-h-[100dvh] bg-[#0f141a] flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-20 h-20 rounded-full bg-yellow-400/10 border-2 border-yellow-400 flex items-center justify-center">
          <BarChart2 className="h-10 w-10 text-yellow-400 animate-pulse" />
        </div>
        <p className="text-white font-black text-xl">Generating Your Report…</p>
        <p className="text-slate-400 text-sm text-center">NOVA is analyzing your session performance</p>
      </div>
    );
  }

  // ── Completed screen with AI report ──────────────────────────────────────
  if (sessionState === 'completed') {
    const perfColor =
      (report?.performanceBand ?? "") === "Outstanding" ? "text-green-300" :
      (report?.performanceBand ?? "") === "On Target"   ? "text-green-400" :
      (report?.performanceBand ?? "") === "Acceptable"  ? "text-yellow-400" :
      "text-red-400";
    const perfBg =
      (report?.performanceBand ?? "") === "Outstanding" ? "bg-green-500/10 border-green-500/30" :
      (report?.performanceBand ?? "") === "On Target"   ? "bg-green-500/10 border-green-500/30" :
      (report?.performanceBand ?? "") === "Acceptable"  ? "bg-yellow-400/10 border-yellow-400/30" :
      "bg-red-500/10 border-red-500/30";

    return (
      <div className="min-h-[100dvh] bg-[#0f141a] text-white overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-8 space-y-5">

          {/* Header */}
          <div className="flex flex-col items-center gap-3 pt-4 pb-2">
            <CheckCircle2 className="h-16 w-16 text-green-400" />
            <h1 className="text-3xl font-black text-center">Assignment Complete</h1>
            <p className="text-slate-400 text-center text-sm">
              {assignment.title} · Report submitted to your trainer
            </p>
          </div>

          {/* Performance Band */}
          <div className={`rounded-2xl border px-5 py-4 text-center ${perfBg}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Performance Band</p>
            <p className={`text-2xl font-black ${perfColor}`}>{report?.performanceBand ?? "—"}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-800 p-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">UPH</p>
              <p className="text-xl font-black">{report?.uphActual || currentUPH || "—"}</p>
              <p className="text-[10px] text-slate-600">std {standardUPH}</p>
            </div>
            <div className="rounded-2xl bg-slate-800 p-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Efficiency</p>
              <p className={`text-xl font-black ${perfColor}`}>
                {(report?.efficiencyPercent ?? efficiency) > 0 ? `${report?.efficiencyPercent ?? efficiency}%` : "—"}
              </p>
              <p className="text-[10px] text-slate-600">target 100%</p>
            </div>
            <div className="rounded-2xl bg-slate-800 p-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Time</p>
              <p className="text-xl font-black">{formatTime(elapsedSeconds)}</p>
              <p className="text-[10px] text-slate-600">goal {assignment.goalTimeMinutes}m</p>
            </div>
          </div>

          {/* Error summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`rounded-2xl border p-3 text-center ${wrongCodeCount > 0 ? "bg-red-500/10 border-red-500/30" : "bg-slate-800 border-slate-700"}`}>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Wrong Codes</p>
              <p className={`text-2xl font-black ${wrongCodeCount > 0 ? "text-red-400" : "text-white"}`}>{wrongCodeCount}</p>
            </div>
            <div className={`rounded-2xl border p-3 text-center ${overPickCount > 0 ? "bg-orange-500/10 border-orange-500/30" : "bg-slate-800 border-slate-700"}`}>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Over Picks</p>
              <p className={`text-2xl font-black ${overPickCount > 0 ? "text-orange-400" : "text-white"}`}>{overPickCount}</p>
            </div>
            <div className={`rounded-2xl border p-3 text-center ${shortPickCount > 0 ? "bg-yellow-500/10 border-yellow-400/30" : "bg-slate-800 border-slate-700"}`}>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Short Picks</p>
              <p className={`text-2xl font-black ${shortPickCount > 0 ? "text-yellow-400" : "text-white"}`}>{shortPickCount}</p>
            </div>
          </div>

          {/* NOVA AI Report */}
          {report && (
            <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/5 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-yellow-400 flex items-center justify-center">
                  <Headphones className="h-4 w-4 text-slate-950" />
                </div>
                <p className="font-black text-yellow-400 text-sm uppercase tracking-widest">NOVA Report</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Overall</p>
                <p className="text-white text-sm leading-relaxed">{report.novaFeedback}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">What to Improve</p>
                <p className="text-slate-300 text-sm leading-relaxed">{report.improvements}</p>
              </div>

              {report.mistakeSummary && (
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Mistake Patterns</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{report.mistakeSummary}</p>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Tips for Next Session</p>
                <p className="text-slate-300 text-sm leading-relaxed">{report.howToImprove}</p>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-slate-600 pb-2">
            This report has been sent to your trainer and supervisor.
          </p>

          <Link href="/nova">
            <Button size="lg" className="w-full h-14 bg-yellow-400 text-slate-950 font-black hover:bg-yellow-300">
              Return to Assignments
            </Button>
          </Link>

        </div>
      </div>
    );
  }

  // ── Voice unlock overlay ──────────────────────────────────────────────────
  if (!ttsUnlocked) {
    return (
      <div className="min-h-[100dvh] bg-[#0f141a] flex flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-yellow-400 flex items-center justify-center shadow-[0_0_60px_rgba(250,204,21,0.35)]">
          <Headphones className="h-12 w-12 text-slate-950" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white mb-2">NOVA Voice Session</h2>
          <p className="text-slate-400 text-base max-w-xs mx-auto">
            Tap the button to enable NOVA's voice. She'll guide you through every pick out loud.
          </p>
          {assignment && (
            <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-left space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Assignment</p>
              <p className="text-white font-black">{assignment.title}</p>
              <p className="text-slate-400 text-sm">{assignment.totalCases} cases · Goal {assignment.goalTimeMinutes} min · Door {assignment.doorNumber}</p>
            </div>
          )}
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
          Start Picking
        </button>
        <Link href={`/nova/assignments/${id}`}>
          <button className="text-slate-500 text-sm hover:text-slate-300 transition">← Back</button>
        </Link>
      </div>
    );
  }

  // ── Main picking interface ────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-[#0f141a] text-slate-100 flex flex-col relative overflow-hidden">

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-black/40 backdrop-blur-md border-b border-white/10">
        <Link href={`/nova/assignments/${id}`}>
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" /> Exit
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-md font-mono text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" /> {formatTime(elapsedSeconds)}
          </div>
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-bold text-white/70 uppercase tracking-widest">
            {assignment.voiceMode.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 pt-20 pb-36 z-0 relative">

        {/* NOVA Orb */}
        <div className="mb-10 relative flex justify-center items-center h-44 w-full">
          {isSpeaking && (
            <>
              <div className="absolute w-28 h-28 bg-primary/20 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />
              <div className="absolute w-44 h-44 bg-primary/10 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.2s' }} />
              <div className="absolute w-60 h-60 bg-primary/5 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.4s' }} />
            </>
          )}
          {isListeningQty && (
            <div className="absolute w-44 h-44 bg-green-400/15 rounded-full animate-ping" style={{ animationDuration: '1.8s' }} />
          )}
          <div className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
            sessionState === 'pallet_check'
              ? 'bg-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.5)] scale-110'
              : isSpeaking
              ? 'bg-primary shadow-[0_0_50px_rgba(250,204,21,0.5)] scale-110'
              : isListeningQty
              ? 'bg-green-500/30 border-2 border-green-400 scale-105'
              : 'bg-secondary border-2 border-primary/50'
          }`}>
            {sessionState === 'pallet_check'
              ? <ShieldCheck className="h-10 w-10 text-white" />
              : isListeningQty
              ? <Mic className="h-10 w-10 text-green-400" />
              : <Headphones className={`h-10 w-10 ${isSpeaking ? 'text-black' : 'text-primary'}`} />
            }
          </div>
        </div>

        {/* NOVA Transcript */}
        <div className="text-center max-w-2xl px-4 mb-4 min-h-[80px] flex items-center justify-center">
          <p className={`text-2xl md:text-3xl font-medium leading-relaxed ${isSpeaking ? 'text-white' : 'text-white/50'}`}>
            "{transcript}"
          </p>
        </div>

        {/* Repeat / Speed controls — always visible tap fallback */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() => { if (lastSpeechRef.current) speak(lastSpeechRef.current); }}
            disabled={!transcript || isSpeaking}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-yellow-400/50 hover:bg-slate-750 disabled:opacity-30 transition px-4 py-2 text-sm font-bold text-slate-300"
            title="Repeat last NOVA message"
          >
            <Volume2 className="h-4 w-4 text-yellow-400" />
            {lang === "es" ? "Repita" : "Repeat"}
          </button>
          <button
            onClick={() => { speechRateRef.current = Math.min(1.9, speechRateRef.current + 0.15); }}
            className="rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-500 transition px-3 py-2 text-xs font-bold text-slate-400"
            title="Faster"
          >▶▶</button>
          <button
            onClick={() => { speechRateRef.current = Math.max(0.7, speechRateRef.current - 0.15); }}
            className="rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-500 transition px-3 py-2 text-xs font-bold text-slate-400"
            title="Slower"
          >◀◀</button>
        </div>

        {/* Action area */}
        <div className="w-full max-w-md mx-auto">

          {/* PALLET CHECK interrupt */}
          {sessionState === 'pallet_check' && (
            <Card className="bg-orange-500/10 border-orange-500/40 shadow-[0_0_30px_rgba(249,115,22,0.15)]">
              <CardContent className="p-6 text-center space-y-4">
                <ShieldCheck className="h-12 w-12 text-orange-400 mx-auto" />
                <div>
                  <p className="text-orange-300 font-black text-xl">Pallet Inspection</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Every 50 cases — check crushed corners, stability, and wrap if needed.
                  </p>
                </div>
                <Button
                  onClick={handleNext}
                  disabled={isSpeaking}
                  size="lg"
                  className="w-full h-14 text-lg bg-orange-500 text-white font-black hover:bg-orange-400"
                >
                  <ThumbsUp className="mr-2 h-5 w-5" /> Pallet Checked — Continue
                </Button>
              </CardContent>
            </Card>
          )}

          {/* PICKING / WRONG CODE: check code entry */}
          {(sessionState === 'picking' || sessionState === 'wrong_code') && (
            <Card className="bg-black/50 border-white/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-1">Current Location</p>
                  <p className="text-5xl font-black text-white tracking-tight">{currentStop?.aisle} - {currentStop?.slot}</p>
                  {nextStop && (
                    <p className="text-xs text-white/30 mt-2 font-mono">Next: {nextStop.aisle}-{nextStop.slot}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={codeInput}
                    onChange={e => setCodeInput(e.target.value)}
                    placeholder="Enter Check Code"
                    className="bg-white/5 border-white/20 text-white font-mono text-center text-xl h-14 uppercase placeholder:text-white/20"
                    onKeyDown={e => e.key === 'Enter' && handleCheckCode()}
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
          )}

          {/* CONFIRM QTY: voice + manual input */}
          {sessionState === 'confirm_qty' && (
            <Card className="bg-primary/10 border-primary/30 shadow-[0_0_30px_rgba(250,204,21,0.1)]">
              <CardContent className="p-6 text-center space-y-4">
                <p className="text-primary/70 font-bold uppercase tracking-widest">Grab</p>
                <p className="text-8xl font-black text-primary leading-none">{currentStop?.qty}</p>

                {/* Listening indicator */}
                {isListeningQty && (
                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <Mic className="h-5 w-5 animate-pulse" />
                    <span className="text-sm font-bold">Say how many you grabbed…</span>
                  </div>
                )}

                {/* Qty override input */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={qtyInput}
                    onChange={e => setQtyInput(e.target.value)}
                    placeholder="Actual qty"
                    min="0"
                    className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-xl font-black placeholder:text-white/20 outline-none focus:border-yellow-400 transition"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && qtyInput) {
                        const val = parseInt(qtyInput);
                        if (!isNaN(val)) {
                          try { qtyRecognitionRef.current?.stop(); } catch {}
                          setIsListeningQty(false);
                          handleQtySubmit(val, currentStop!.qty, currentStop!.id);
                        }
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      const val = parseInt(qtyInput || String(currentStop?.qty ?? 0));
                      if (!isNaN(val)) {
                        try { qtyRecognitionRef.current?.stop(); } catch {}
                        setIsListeningQty(false);
                        handleQtySubmit(val, currentStop!.qty, currentStop!.id);
                      }
                    }}
                    disabled={isSpeaking}
                    className="h-14 px-6 bg-primary text-black font-black hover:bg-primary/90"
                  >
                    OK
                  </Button>
                </div>

                <Button
                  onClick={handleNext}
                  disabled={isSpeaking}
                  variant="ghost"
                  size="sm"
                  className="text-white/40 hover:text-white hover:bg-white/10 text-xs"
                >
                  Exact amount — tap to confirm
                </Button>
              </CardContent>
            </Card>
          )}

          {/* INTRO / PALLET ALPHA / PALLET BRAVO / OUTRO */}
          {(sessionState === 'intro' || sessionState === 'pallet_alpha' || sessionState === 'pallet_bravo' || sessionState === 'outro') && (
            <Button
              onClick={handleNext}
              disabled={isSpeaking}
              size="lg"
              className="w-full h-16 text-xl bg-white/10 text-white font-bold hover:bg-white/20 border border-white/20"
            >
              <Mic className="mr-3 h-5 w-5" />
              {sessionState === 'outro' ? 'Submit & Complete' : 'Say "READY"'}
            </Button>
          )}
        </div>
      </div>

      {/* Coaching banner */}
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

      {/* Bottom HUD */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-md border-t border-white/10">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-3 max-w-5xl mx-auto">
            <span className="w-10 text-right font-mono text-xs text-white/40">{progress}%</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-white/40 font-medium">{pickedCount}/{stops.length}</span>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="max-w-5xl mx-auto grid grid-cols-6 gap-2">

            <div className="rounded-xl bg-white/5 border border-white/10 px-2 py-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Zap className="h-3 w-3 text-yellow-400" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">UPH</p>
              </div>
              <p className="text-base font-black text-white leading-none">{currentUPH || "—"}</p>
              <p className="text-[9px] text-white/30 mt-0.5">std {standardUPH}</p>
            </div>

            <div className={`rounded-xl border px-2 py-2 text-center ${effBg}`}>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Target className="h-3 w-3 text-white/50" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Eff%</p>
              </div>
              <p className={`text-base font-black leading-none ${effColor}`}>{efficiency > 0 ? `${efficiency}%` : "—"}</p>
              <p className="text-[9px] text-white/30 mt-0.5">target 100%</p>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 px-2 py-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <PaceIcon className="h-3 w-3 text-white/50" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Pace</p>
              </div>
              <p className={`text-sm font-black leading-none ${paceLabel === "Ahead" ? "text-green-400" : paceLabel === "Behind" ? "text-red-400" : "text-yellow-400"}`}>
                {elapsedSeconds > 18 ? paceLabel : "—"}
              </p>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 px-2 py-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Clock className="h-3 w-3 text-white/50" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">ETA</p>
              </div>
              <p className="text-sm font-black text-white leading-none">{projectedMin !== null && elapsedSeconds > 18 ? `${projectedMin}m` : "—"}</p>
            </div>

            <div className={`rounded-xl border px-2 py-2 text-center ${wrongCodeCount > 0 ? "bg-red-900/30 border-red-500/30" : "bg-white/5 border-white/10"}`}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-0.5">Codes</p>
              <p className={`text-base font-black leading-none ${wrongCodeCount > 0 ? "text-red-400" : "text-white/50"}`}>{wrongCodeCount}</p>
            </div>

            <div className={`rounded-xl border px-2 py-2 text-center ${(overPickCount + shortPickCount) > 0 ? "bg-orange-900/30 border-orange-500/30" : "bg-white/5 border-white/10"}`}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-0.5">O/S</p>
              <p className={`text-base font-black leading-none ${(overPickCount + shortPickCount) > 0 ? "text-orange-400" : "text-white/50"}`}>
                {overPickCount}/<span className="text-yellow-400">{shortPickCount}</span>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
