import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { novaSpeak, novaRecogLang } from "@/lib/novaSpeech";
import { ASSIGNMENTS } from "@/data/assignments";
import { ASSIGNMENT_STOPS } from "@/data/assignmentStops";
import { voiceCommands } from "@/data/voiceCommands";
import { useTrainerStore } from "@/lib/trainerStore";
import { useAuthStore } from "@/lib/authStore";
import {
  normalizeSpeech, isConfirm, isDeny, isLoadPicks, isReady, extractNumber,
} from "@/lib/parser";
import {
  Headphones, Mic, MicOff, Volume2, RotateCcw, Shield,
  CheckCircle2, AlertTriangle, Package, DoorOpen,
  ChevronRight, Activity, User, List, Play, BookOpen,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Phase =
  | "IDLE"
  | "SIGN_ON"
  | "SIGN_ON_CONFIRM"
  | "PALLET_COUNT"
  | "PALLET_COUNT_CONFIRM"
  | "SAFETY"
  | "SAFETY_FAILED"
  | "LOAD_PICKS_WAIT"
  | "LOAD_PICKS_SUMMARY"
  | "ALPHA_SETUP"
  | "BRAVO_SETUP"
  | "PICKING"
  | "BATCH_COMPLETE"
  | "DONE";

interface LogEntry {
  id: number;
  type: "NOVA" | "USER" | "SYSTEM";
  text: string;
  time: string;
}

// ─── Safety checklist ───────────────────────────────────────────────────────

const SAFETY_ITEMS = [
  "Brakes okay?",
  "Battery guard okay?",
  "Horn okay?",
  "Wheels okay?",
  "Hydraulics okay?",
  "Controls okay?",
  "Steering okay?",
  "Welds okay?",
  "Electric wiring okay?",
];

// ─── TTS helper ─────────────────────────────────────────────────────────────

function speakText(text: string, lang: string, onEnd?: () => void, rate = 0.95) {
  novaSpeak(text, lang, onEnd, { rate, pitch: 1 });
}

// ─── Phase label map ─────────────────────────────────────────────────────────

const PHASE_LABEL: Record<Phase, string> = {
  IDLE: "Idle",
  SIGN_ON: "Sign On",
  SIGN_ON_CONFIRM: "Sign On",
  PALLET_COUNT: "Sign On",
  PALLET_COUNT_CONFIRM: "Sign On",
  SAFETY: "Safety Check",
  SAFETY_FAILED: "Safety FAILED",
  LOAD_PICKS_WAIT: "Load Picks",
  LOAD_PICKS_SUMMARY: "Load Picks",
  ALPHA_SETUP: "Pallet Setup",
  BRAVO_SETUP: "Pallet Setup",
  PICKING: "Picking",
  BATCH_COMPLETE: "Batch Complete",
  DONE: "Done",
};

const PHASE_COLOR: Record<Phase, string> = {
  IDLE: "text-slate-400",
  SIGN_ON: "text-blue-400",
  SIGN_ON_CONFIRM: "text-blue-400",
  PALLET_COUNT: "text-blue-400",
  PALLET_COUNT_CONFIRM: "text-blue-400",
  SAFETY: "text-yellow-400",
  SAFETY_FAILED: "text-red-400",
  LOAD_PICKS_WAIT: "text-purple-400",
  LOAD_PICKS_SUMMARY: "text-purple-400",
  ALPHA_SETUP: "text-cyan-400",
  BRAVO_SETUP: "text-cyan-400",
  PICKING: "text-green-400",
  BATCH_COMPLETE: "text-orange-400",
  DONE: "text-green-400",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function NovaTrainerPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("es") ? "es" : "en";
  const { selectors } = useTrainerStore();
  const { currentUser, pendingInvites, revokeInvite } = useAuthStore();

  // Selector selection (logged-in selectors auto-select their own assignment)
  const [selectedSelectorId, setSelectedSelectorId] = useState<string>("");

  const selectedSelector = selectors.find((s) => String(s.id) === selectedSelectorId) ?? null;
  const selectorAssignmentId = selectedSelector?.assignedAssignmentId ?? null;
  const assignment = selectorAssignmentId ? ASSIGNMENTS.find((a) => a.id === selectorAssignmentId) : null;
  const stops = useMemo(
    () => (selectorAssignmentId ? ASSIGNMENT_STOPS.filter((s) => s.assignmentId === selectorAssignmentId) : []),
    [selectorAssignmentId]
  );

  // ── ES3 state machine ──
  const [phase, setPhase] = useState<Phase>("IDLE");
  const [promptText, setPromptText] = useState("NOVA ready. Select a selector to begin.");
  const [heardText, setHeardText] = useState("");
  const [commandLog, setCommandLog] = useState<LogEntry[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [micMode, setMicMode] = useState<"browser" | "button">("button");

  // Sign-on state
  const [equipmentId, setEquipmentId] = useState("");
  const [maxPallets, setMaxPallets] = useState("2");
  const [safetyIndex, setSafetyIndex] = useState(0);
  const [failedSafetyItem, setFailedSafetyItem] = useState("");

  // Pick state
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [pickedCount, setPickedCount] = useState(0);
  const [codeInput, setCodeInput] = useState("");
  const [lastCodeWrong, setLastCodeWrong] = useState(false);

  // Batch complete sub-steps
  const [batchStep, setBatchStep] = useState(0);

  // Speech rate (voice speed control: "NOVA faster" / "NOVA slower")
  const [novaRate, setNovaRate] = useState(0.95);
  const novaRateRef = useRef(0.95);

  // Refs
  const recognitionRef       = useRef<any>(null);
  const startListeningRef    = useRef<(() => void) | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const phaseRef = useRef<Phase>("IDLE");
  const safetyIndexRef = useRef(0);
  const equipmentIdRef = useRef("");
  const maxPalletsRef = useRef("2");
  const currentStopIndexRef = useRef(0);
  const batchStepRef = useRef(0);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { safetyIndexRef.current = safetyIndex; }, [safetyIndex]);
  useEffect(() => { novaRateRef.current = novaRate; }, [novaRate]);
  useEffect(() => { equipmentIdRef.current = equipmentId; }, [equipmentId]);
  useEffect(() => { maxPalletsRef.current = maxPallets; }, [maxPallets]);
  useEffect(() => { currentStopIndexRef.current = currentStopIndex; }, [currentStopIndex]);
  useEffect(() => { batchStepRef.current = batchStep; }, [batchStep]);

  // Auto-scroll command log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [commandLog]);

  const addLog = useCallback((type: LogEntry["type"], text: string) => {
    setCommandLog((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), type, text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) },
    ]);
  }, []);

  const setPromptAndSpeak = useCallback(
    (text: string) => {
      setPromptText(text);
      setSpeaking(true);
      addLog("NOVA", text);

      // Stop mic while NOVA speaks — prevents her voice being recognised
      shouldKeepListeningRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      try { recognitionRef.current?.abort(); } catch {}
      recognitionRef.current = null;   // force fresh instance on next listen

      // Safety timer: if iOS TTS silently fails (onend never fires), rescue
      // the session automatically.  Formula: ~50 ms/char + 5 s buffer covers
      // the expected TTS duration + the 3 s Bluetooth A2DP→HFP switch delay.
      let done = false;
      const safetyMs = Math.max(8000, text.length * 50 + 5000);
      const safetyTimer = setTimeout(() => {
        if (done) return;
        done = true;
        setSpeaking(false);
        const p = phaseRef.current;
        if (!["IDLE", "SAFETY_FAILED"].includes(p)) {
          shouldKeepListeningRef.current = true;
          setTimeout(() => startListeningRef.current?.(), 3000);
        }
      }, safetyMs);

      speakText(text, lang, () => {
        if (done) return;
        done = true;
        clearTimeout(safetyTimer);
        setSpeaking(false);
        // Auto-restart mic after NOVA finishes.
        // 3000 ms gap: iOS needs this to release TTS audio session before
        // the mic can open (especially with Bluetooth headphones where the
        // A2DP → HFP profile switch takes 1–2 s on its own).
        const p = phaseRef.current;
        if (!["IDLE", "SAFETY_FAILED"].includes(p)) {
          shouldKeepListeningRef.current = true;
          setTimeout(() => startListeningRef.current?.(), 3000);
        }
      }, novaRateRef.current);
    },
    [addLog, lang]
  );

  // ── Speech recognition ──────────────────────────────────────────────────

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition || !shouldKeepListeningRef.current) return;

    // Always create a fresh instance — iOS won't restart a stopped instance
    try { recognitionRef.current?.abort(); } catch {}
    recognitionRef.current = null;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = novaRecogLang(lang);

    let restarted = false;
    const scheduleRestart = (delayMs: number) => {
      if (restarted || !shouldKeepListeningRef.current) return;
      restarted = true;
      setTimeout(() => startListeningRef.current?.(), delayMs);
    };

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: any) => {
      const transcript = normalizeSpeech(event.results?.[0]?.[0]?.transcript || "");
      setHeardText(transcript);
      addLog("USER", transcript || "[no input]");
      handleVoiceInput(transcript);
    };

    recognition.onend = () => {
      setListening(false);
      scheduleRestart(300);
    };

    recognition.onerror = (e: any) => {
      setListening(false);
      if (e?.error === "not-allowed") {
        shouldKeepListeningRef.current = false;
        return;
      }
      // aborted = audio session not ready yet — retry with extra delay
      scheduleRestart(e?.error === "aborted" ? 800 : 500);
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch {}
  }, [addLog, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep ref in sync so setPromptAndSpeak's setTimeout can call latest version
  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  const stopListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    setListening(false);
    try { recognitionRef.current?.abort(); } catch {}
    recognitionRef.current = null;
  }, []);

  // ── Command shortcuts (global during session) ───────────────────────────

  const handleCommandShortcuts = (input: string): boolean => {
    if (!input) {
      setPromptAndSpeak("No input received.");
      return true;
    }

    // ── Voice speed control ──────────────────────────────────────────────
    if (input.includes("nova faster") || input === "faster" || input === "speed up") {
      const next = Math.min(novaRateRef.current + 0.15, 1.8);
      novaRateRef.current = next;
      setNovaRate(next);
      setPromptAndSpeak("Okay, speaking faster.");
      return true;
    }
    if (input.includes("nova slower") || input === "slower" || input === "slow down") {
      const next = Math.max(novaRateRef.current - 0.15, 0.5);
      novaRateRef.current = next;
      setNovaRate(next);
      setPromptAndSpeak("Okay, speaking slower.");
      return true;
    }
    if (input.includes("nova normal") || input === "normal speed") {
      novaRateRef.current = 0.95;
      setNovaRate(0.95);
      setPromptAndSpeak("Back to normal speed.");
      return true;
    }

    if (input === "repeat labels") { setPromptAndSpeak("Repeating label instructions."); return true; }
    if (input === "makeup skips") { setPromptAndSpeak("Makeup skips requested."); return true; }
    if (input === "get drops") { setPromptAndSpeak("Get drops requested."); return true; }
    if (input === "close batch") { setPromptAndSpeak("Closing batch."); return true; }
    if (input.startsWith("go to aisle")) { setPromptAndSpeak("Go to aisle command received."); return true; }
    if (input === "base items") { setPromptAndSpeak("Base items review not yet loaded."); return true; }
    if (input === "previous") { setPromptAndSpeak("Previous item requested."); return true; }
    if (input === "base complete") { setPromptAndSpeak("Base complete confirmed."); return true; }
    if (input === "remove pallet") { setPromptAndSpeak("Remove pallet noted."); return true; }
    if (input === "skip slot") { setPromptAndSpeak("Skip slot noted."); return true; }
    if (input === "report damage") { setPromptAndSpeak("Damage flow started."); return true; }
    if (input.startsWith("damage")) { setPromptAndSpeak("Damage quantity recorded."); return true; }
    if (input === "slot empty") { setPromptAndSpeak("Slot empty recorded."); return true; }
    if (input === "recap weights") { setPromptAndSpeak("Recapping weights."); return true; }
    if (input === "next") { setPromptAndSpeak("Next item."); return true; }
    if (input === "exit list") { setPromptAndSpeak("Exit list."); return true; }
    if (input === "no labels") { setPromptAndSpeak("No labels recorded."); return true; }
    return false;
  };

  // ── Pick flow helpers (use refs to avoid stale closure) ─────────────────

  const beginStop = useCallback((idx: number, stopsArr: typeof stops) => {
    const stop = stopsArr[idx];
    if (!stop) return;
    setPhase("PICKING");
    setCurrentStopIndex(idx);
    setLastCodeWrong(false);
    setCodeInput("");
    setTimeout(() => codeInputRef.current?.focus(), 100);
    setPromptAndSpeak(`New aisle ${stop.aisle} slot ${stop.slot}`);
  }, [setPromptAndSpeak]);

  const startAssignedBatch = useCallback((asgn: typeof assignment, stopsArr: typeof stops) => {
    if (!asgn) { setPromptAndSpeak("No assignment assigned to your ID."); return; }

    setCurrentStopIndex(0);
    setPickedCount(0);

    const summary =
      `Start aisle ${asgn.startAisle} end aisle ${asgn.endAisle}. ` +
      `Slots ${stopsArr.length}. Total cases ${asgn.totalCases}. ` +
      `Pallets ${asgn.totalPallets}. Estimated goal ${asgn.goalTimeMinutes} minutes. ` +
      `To continue say ready.`;
    setPhase("LOAD_PICKS_SUMMARY");
    setPromptAndSpeak(summary);
  }, [setPromptAndSpeak]);

  // ── Main voice input handler ─────────────────────────────────────────────

  const handleVoiceInput = useCallback((rawInput: string) => {
    const input = normalizeSpeech(rawInput);
    const phase = phaseRef.current;

    // Speed commands work at any point during an active session
    if (phase !== "IDLE" && (
      input.includes("nova faster") || input === "faster" || input === "speed up" ||
      input.includes("nova slower") || input === "slower" || input === "slow down" ||
      input.includes("nova normal") || input === "normal speed"
    )) {
      handleCommandShortcuts(input);
      return;
    }

    // Global shortcuts (not during SIGN_ON flow or SAFETY)
    if (!["IDLE", "SIGN_ON", "SIGN_ON_CONFIRM", "PALLET_COUNT", "PALLET_COUNT_CONFIRM", "SAFETY"].includes(phase)) {
      if (handleCommandShortcuts(input)) return;
    }

    // ── Sign on ──
    if (phase === "SIGN_ON") {
      const digits = extractNumber(input);
      if (!digits) { setPromptAndSpeak("Enter equipment ID."); return; }
      setEquipmentId(digits);
      equipmentIdRef.current = digits;
      setPhase("SIGN_ON_CONFIRM");
      setPromptAndSpeak(`Confirm equipment ${digits}.`);
      return;
    }

    if (phase === "SIGN_ON_CONFIRM") {
      if (isConfirm(input)) {
        setPhase("PALLET_COUNT");
        setPromptAndSpeak(`Enter maximum pallet count for jack ${equipmentIdRef.current}.`);
        return;
      }
      if (isDeny(input)) {
        setEquipmentId("");
        equipmentIdRef.current = "";
        setPhase("SIGN_ON");
        setPromptAndSpeak("Enter equipment ID.");
        return;
      }
      setPromptAndSpeak(`Confirm equipment ${equipmentIdRef.current}.`);
      return;
    }

    if (phase === "PALLET_COUNT") {
      const digits = extractNumber(input);
      if (!digits) { setPromptAndSpeak("Enter maximum pallet count."); return; }
      setMaxPallets(digits);
      maxPalletsRef.current = digits;
      setPhase("PALLET_COUNT_CONFIRM");
      setPromptAndSpeak("Confirm maximum pallet count.");
      return;
    }

    if (phase === "PALLET_COUNT_CONFIRM") {
      if (isConfirm(input)) {
        setPhase("SAFETY");
        setSafetyIndex(0);
        safetyIndexRef.current = 0;
        setPromptAndSpeak(SAFETY_ITEMS[0]);
        return;
      }
      if (isDeny(input)) {
        setPhase("PALLET_COUNT");
        setPromptAndSpeak(`Enter maximum pallet count for jack ${equipmentIdRef.current}.`);
        return;
      }
      setPromptAndSpeak("Confirm maximum pallet count.");
      return;
    }

    // ── Safety ──
    if (phase === "SAFETY") {
      const idx = safetyIndexRef.current;
      const item = SAFETY_ITEMS[idx];
      if (isConfirm(input)) {
        if (idx < SAFETY_ITEMS.length - 1) {
          const next = idx + 1;
          setSafetyIndex(next);
          safetyIndexRef.current = next;
          setPromptAndSpeak(SAFETY_ITEMS[next]);
        } else {
          setPhase("LOAD_PICKS_WAIT");
          setPromptAndSpeak("Say load picks.");
        }
        return;
      }
      if (isDeny(input)) {
        setFailedSafetyItem(item);
        setPhase("SAFETY_FAILED");
        setPromptAndSpeak(`Safety check failed. ${item} Session stopped. Contact your supervisor.`);
        stopListening();
        return;
      }
      setPromptAndSpeak(item);
      return;
    }

    // ── Load picks wait ──
    if (phase === "LOAD_PICKS_WAIT") {
      if (isLoadPicks(input)) {
        startAssignedBatch(assignment, stops);
        return;
      }
      setPromptAndSpeak("Say load picks.");
      return;
    }

    // ── Load picks summary ──
    if (phase === "LOAD_PICKS_SUMMARY") {
      if (isReady(input)) {
        setPhase("ALPHA_SETUP");
        setPromptAndSpeak("Position alpha pallet. Get chep.");
        return;
      }
      setPromptAndSpeak("To continue say ready.");
      return;
    }

    // ── Pallet setup ──
    if (phase === "ALPHA_SETUP") {
      if (isReady(input) || isConfirm(input)) {
        setPhase("BRAVO_SETUP");
        setPromptAndSpeak("Position bravo pallet. Get chep.");
        return;
      }
      setPromptAndSpeak("Position alpha pallet. Say ready when set.");
      return;
    }

    if (phase === "BRAVO_SETUP") {
      if (isReady(input) || isConfirm(input)) {
        beginStop(0, stops);
        return;
      }
      setPromptAndSpeak("Position bravo pallet. Say ready when set.");
      return;
    }

    // ── Picking — voice only check code ──
    if (phase === "PICKING") {
      const stop = stops[currentStopIndexRef.current];
      if (!stop) return;

      const digits = extractNumber(input);
      if (!digits) {
        setPromptAndSpeak(`You said ${input}. Invalid. New aisle ${stop.aisle} slot ${stop.slot}`);
        setLastCodeWrong(true);
        return;
      }

      if (digits === stop.checkCode) {
        setLastCodeWrong(false);
        const pallet = (currentStopIndexRef.current % 2 === 0) ? "Alpha" : "Bravo";
        setPickedCount((c) => c + 1);
        setPromptAndSpeak(`Grab ${stop.qty} ${pallet}.`);
        // after short delay, advance or complete
        setTimeout(() => {
          const nextIdx = currentStopIndexRef.current + 1;
          if (nextIdx < stops.length) {
            beginStop(nextIdx, stops);
          } else {
            startBatchComplete(assignment);
          }
        }, 3500);
      } else {
        setLastCodeWrong(true);
        setPromptAndSpeak(`You said ${digits}. Invalid. New aisle ${stop.aisle} slot ${stop.slot}`);
      }
      return;
    }

    // ── Batch complete ──
    if (phase === "BATCH_COMPLETE") {
      handleBatchCompleteInput(input);
      return;
    }
  }, [assignment, stops, beginStop, startAssignedBatch, stopListening, setPromptAndSpeak]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Batch complete flow ──────────────────────────────────────────────────

  const startBatchComplete = useCallback((asgn: typeof assignment) => {
    if (!asgn) return;
    setBatchStep(0);
    batchStepRef.current = 0;
    setPhase("BATCH_COMPLETE");
    setPromptAndSpeak(`Batch complete. Deliver pallet bravo to door ${asgn.doorNumber}.`);
  }, [setPromptAndSpeak]);

  const handleBatchCompleteInput = useCallback((input: string) => {
    const asgn = assignment;
    if (!asgn) return;
    const step = batchStepRef.current;

    const advance = (next: number, prompt: string) => {
      setBatchStep(next);
      batchStepRef.current = next;
      setPromptAndSpeak(prompt);
    };

    if (step === 0) {
      // Confirm door code
      const digits = extractNumber(input);
      if (digits === asgn.doorCode || isConfirm(input)) {
        advance(1, `Apply labels to pallet alpha. Label number ${asgn.alphaLabelNumber}.`);
      } else {
        setPromptAndSpeak(`Deliver pallet bravo to door ${asgn.doorNumber}. Confirm door code.`);
      }
      return;
    }

    if (step === 1) {
      if (isConfirm(input) || normalizeSpeech(input) === "alpha" || extractNumber(input) === String(asgn.alphaLabelNumber)) {
        advance(2, `Apply labels to pallet bravo. Label number ${asgn.bravoLabelNumber}.`);
      } else {
        setPromptAndSpeak(`Apply labels to pallet alpha. Label number ${asgn.alphaLabelNumber}.`);
      }
      return;
    }

    if (step === 2) {
      if (isConfirm(input) || normalizeSpeech(input) === "bravo" || extractNumber(input) === String(asgn.bravoLabelNumber)) {
        advance(3, `Deliver bravo pallet to door ${asgn.doorNumber}. Confirm staging code.`);
      } else {
        setPromptAndSpeak(`Apply labels to pallet bravo. Label number ${asgn.bravoLabelNumber}.`);
      }
      return;
    }

    if (step === 3) {
      if (isConfirm(input) || extractNumber(input) === asgn.doorCode) {
        advance(4, `Deliver alpha pallet to door ${asgn.doorNumber}. Confirm staging code.`);
      } else {
        setPromptAndSpeak(`Deliver bravo pallet to door ${asgn.doorNumber}. Confirm staging code.`);
      }
      return;
    }

    if (step === 4) {
      if (isConfirm(input) || extractNumber(input) === asgn.doorCode) {
        setBatchStep(5);
        batchStepRef.current = 5;
        setPhase("DONE");
        setPromptAndSpeak("Assignment complete. Good work. Say load picks for next batch.");
      } else {
        setPromptAndSpeak(`Deliver alpha pallet to door ${asgn.doorNumber}. Confirm staging code.`);
      }
      return;
    }

    if (step === 5) {
      if (isLoadPicks(input)) {
        startAssignedBatch(asgn, stops);
      } else {
        setPromptAndSpeak("Say load picks for next batch.");
      }
      return;
    }
  }, [assignment, stops, startAssignedBatch, setPromptAndSpeak]);

  // ── Start session ────────────────────────────────────────────────────────

  const startSession = useCallback(() => {
    if (!assignment) return;

    // Prime audio within the user gesture context, then cancel immediately so
    // speechSynthesis.speaking is false when novaSpeak runs.
    // iOS/Chrome require speak() to originate from a top-level gesture handler.
    try {
      window.speechSynthesis.cancel();
      const warmup = new SpeechSynthesisUtterance("\u200B");
      warmup.volume = 0;
      window.speechSynthesis.speak(warmup);
      window.speechSynthesis.cancel();
    } catch {}

    setPhase("SIGN_ON");
    setEquipmentId("");
    setMaxPallets("2");
    setSafetyIndex(0);
    setCurrentStopIndex(0);
    setPickedCount(0);
    setBatchStep(0);
    setLastCodeWrong(false);
    setCodeInput("");
    setCommandLog([]);
    setHeardText("");
    setFailedSafetyItem("");
    setPromptAndSpeak("Enter equipment ID.");

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      setMicMode("browser");
      shouldKeepListeningRef.current = true;
      // 3000 ms: wait for TTS audio session to release before opening mic
      setTimeout(() => startListeningRef.current?.(), 3000);
    } else {
      setMicMode("button");
    }
  }, [assignment, setPromptAndSpeak]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetSession = useCallback(() => {
    stopListening();
    try { window.speechSynthesis.cancel(); } catch {}
    setSpeaking(false);
    setPhase("IDLE");
    setPromptText("NOVA ready. Select a selector to begin.");
    setHeardText("");
    setCommandLog([]);
    setEquipmentId("");
    setMaxPallets("2");
    setSafetyIndex(0);
    setCurrentStopIndex(0);
    setPickedCount(0);
    setBatchStep(0);
    setLastCodeWrong(false);
    setCodeInput("");
    setFailedSafetyItem("");
  }, [stopListening]);

  // ── Button-mode check code submit ────────────────────────────────────────

  const submitCheckCode = useCallback(() => {
    const stop = stops[currentStopIndex];
    if (!stop || !codeInput.trim()) return;

    const input = codeInput.trim();
    setCodeInput("");

    if (input === stop.checkCode) {
      setLastCodeWrong(false);
      const pallet = (currentStopIndex % 2 === 0) ? "Alpha" : "Bravo";
      setPickedCount((c) => c + 1);
      addLog("USER", input);
      setPromptAndSpeak(`Grab ${stop.qty} ${pallet}.`);

      setTimeout(() => {
        const nextIdx = currentStopIndex + 1;
        currentStopIndexRef.current = nextIdx;
        if (nextIdx < stops.length) {
          beginStop(nextIdx, stops);
        } else {
          startBatchComplete(assignment);
        }
      }, 3500);
    } else {
      setLastCodeWrong(true);
      addLog("USER", input);
      setPromptAndSpeak(`You said ${input}. Invalid. New aisle ${stop.aisle} slot ${stop.slot}`);
    }
  }, [stops, currentStopIndex, codeInput, addLog, setPromptAndSpeak, beginStop, startBatchComplete, assignment]);

  // ── Button-mode confirm/deny ─────────────────────────────────────────────

  const handleButtonInput = useCallback((input: string) => {
    addLog("USER", input);
    handleVoiceInput(input);
  }, [addLog, handleVoiceInput]);

  // ── Computed values ──────────────────────────────────────────────────────

  const currentStop = stops[currentStopIndex] ?? null;
  const progress = stops.length > 0 ? Math.round((pickedCount / stops.length) * 100) : 0;
  const isIdle = phase === "IDLE";
  const isActive = !isIdle && phase !== "DONE" && phase !== "SAFETY_FAILED";
  const isPicking = phase === "PICKING";

  const safetyPercent = SAFETY_ITEMS.length > 0
    ? Math.round((safetyIndex / SAFETY_ITEMS.length) * 100)
    : 0;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#080e17] text-slate-100">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-400 rounded-xl">
            <Headphones className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">NOVA Trainer</h1>
            <p className="text-xs text-slate-400">NOVA Voice-Directed Picking — Jennifer Script</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {phase !== "IDLE" && (
            <>
              <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-800 ${PHASE_COLOR[phase]}`}>
                {PHASE_LABEL[phase]}
              </span>
              <button
                onClick={resetSession}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:border-yellow-400 hover:text-white text-sm transition"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-6 grid xl:grid-cols-[280px_1fr_260px] gap-6">

        {/* ── Left panel ──────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Selector picker */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <User className="h-3.5 w-3.5" /> Selector
            </h2>
            {selectors.length === 0 ? (
              <p className="text-slate-500 text-xs">No selectors registered. Add one in the Trainer Dashboard.</p>
            ) : (
              <select
                disabled={!isIdle}
                value={selectedSelectorId}
                onChange={(e) => { setSelectedSelectorId(e.target.value); resetSession(); }}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-400 disabled:opacity-50 transition"
              >
                <option value="">— Choose selector —</option>
                {selectors.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name} · {s.novaId}
                  </option>
                ))}
              </select>
            )}

            {selectedSelector && assignment && (
              <div className="mt-3 rounded-xl bg-green-500/10 border border-green-500/20 px-3 py-2.5 text-xs">
                <p className="text-green-300 font-bold">Assignment #{assignment.assignmentNumber}</p>
                <p className="text-slate-400 mt-0.5">{assignment.totalCases} cases · {stops.length} stops · Aisles {assignment.startAisle}–{assignment.endAisle}</p>
              </div>
            )}
            {selectedSelector && !assignment && (
              <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-xs text-red-300">
                No assignment assigned to this selector.
              </div>
            )}
          </div>

          {/* Phase + safety progress */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" /> Session State
            </h2>
            <div className="space-y-3">
              {(["SIGN_ON", "SAFETY", "LOAD_PICKS_WAIT", "ALPHA_SETUP", "PICKING", "BATCH_COMPLETE"] as Phase[]).map((p) => {
                const phases: Phase[] = ["IDLE", "SIGN_ON", "SIGN_ON_CONFIRM", "PALLET_COUNT", "PALLET_COUNT_CONFIRM", "SAFETY", "SAFETY_FAILED", "LOAD_PICKS_WAIT", "LOAD_PICKS_SUMMARY", "ALPHA_SETUP", "BRAVO_SETUP", "PICKING", "BATCH_COMPLETE", "DONE"];
                const phaseOrderMap: Record<Phase, number> = {} as any;
                phases.forEach((ph, i) => phaseOrderMap[ph] = i);

                const current = phaseOrderMap[phase];
                const thisIdx = phaseOrderMap[p];
                const done = current > thisIdx;
                const active = p === "SIGN_ON" ? ["SIGN_ON", "SIGN_ON_CONFIRM", "PALLET_COUNT", "PALLET_COUNT_CONFIRM"].includes(phase)
                  : p === "SAFETY" ? phase === "SAFETY" || phase === "SAFETY_FAILED"
                  : p === "LOAD_PICKS_WAIT" ? ["LOAD_PICKS_WAIT", "LOAD_PICKS_SUMMARY"].includes(phase)
                  : p === "ALPHA_SETUP" ? ["ALPHA_SETUP", "BRAVO_SETUP"].includes(phase)
                  : p === "PICKING" ? phase === "PICKING"
                  : p === "BATCH_COMPLETE" ? ["BATCH_COMPLETE", "DONE"].includes(phase)
                  : false;

                const label = p === "SIGN_ON" ? "1. Sign On" : p === "SAFETY" ? "2. Safety Check"
                  : p === "LOAD_PICKS_WAIT" ? "3. Load Picks" : p === "ALPHA_SETUP" ? "4. Pallet Setup"
                  : p === "PICKING" ? "5. Picking" : "6. Batch Complete";

                return (
                  <div key={p} className={`flex items-center gap-3 text-sm transition ${active ? "opacity-100" : done ? "opacity-60" : "opacity-30"}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-green-500" : active ? "bg-yellow-400" : "bg-slate-700"}`}>
                      {done ? <CheckCircle2 className="h-3 w-3 text-white" /> : <span className="text-xs font-black text-slate-950 leading-none">{label[0]}</span>}
                    </div>
                    <span className={active ? "text-white font-bold" : done ? "text-slate-300" : "text-slate-500"}>{label}</span>
                  </div>
                );
              })}
            </div>

            {phase === "SAFETY" && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Safety progress</span>
                  <span>{safetyIndex + 1} / {SAFETY_ITEMS.length}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${safetyPercent}%` }} />
                </div>
              </div>
            )}

            {isPicking && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Pick progress</span>
                  <span>{pickedCount} / {stops.length}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Assignment info */}
          {assignment && !isIdle && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <Package className="h-3.5 w-3.5" /> Assignment
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">Number</span><span className="font-mono text-white">#{assignment.assignmentNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Aisles</span><span className="font-mono text-white">{assignment.startAisle}–{assignment.endAisle}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Cases</span><span className="font-mono text-white">{assignment.totalCases}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Stops</span><span className="font-mono text-white">{stops.length}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Goal</span><span className="font-mono text-white">{assignment.goalTimeMinutes}m</span></div>
                <div className="border-t border-slate-800 pt-2 flex justify-between"><span className="text-slate-400 flex items-center gap-1"><DoorOpen className="h-3 w-3" /> Door</span><span className="font-mono text-yellow-400 font-bold">{assignment.doorNumber} · {assignment.doorCode}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Alpha Label</span><span className="font-mono text-yellow-400">{assignment.alphaLabelNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Bravo Label</span><span className="font-mono text-yellow-400">{assignment.bravoLabelNumber}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* ── Center panel — NOVA voice ──────────────────────────────────── */}
        <div className="space-y-4">

          {/* Voice orb */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 flex flex-col items-center">
            <div className="relative flex items-center justify-center h-32 w-32 mb-5">
              {speaking && (
                <>
                  <div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping" style={{ animationDuration: "1.4s" }} />
                  <div className="absolute inset-[-12px] rounded-full bg-yellow-400/10 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.3s" }} />
                </>
              )}
              {listening && !speaking && (
                <div className="absolute inset-0 rounded-full bg-green-400/15 animate-ping" style={{ animationDuration: "1.8s" }} />
              )}
              <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                speaking ? "bg-yellow-400 scale-110 shadow-yellow-400/40"
                : listening ? "bg-green-500/20 border-2 border-green-400"
                : phase === "SAFETY_FAILED" ? "bg-red-500/20 border-2 border-red-400"
                : "bg-slate-800 border-2 border-slate-700"
              }`}>
                {speaking ? (
                  <Volume2 className="h-10 w-10 text-slate-950" />
                ) : listening ? (
                  <Mic className="h-10 w-10 text-green-400" />
                ) : (
                  <Headphones className={`h-10 w-10 ${phase === "SAFETY_FAILED" ? "text-red-400" : "text-slate-500"}`} />
                )}
              </div>
            </div>

            {/* Status label */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                speaking ? "bg-yellow-400/20 text-yellow-300"
                : listening ? "bg-green-500/20 text-green-300"
                : "bg-slate-800 text-slate-400"
              }`}>
                {speaking ? "NOVA speaking" : listening ? "Listening…" : "Standby"}
              </span>
            </div>

            {/* Current prompt */}
            <div className="w-full min-h-[72px] flex items-center justify-center text-center px-4 mb-5">
              <p className={`text-xl font-medium leading-relaxed transition-all ${
                speaking ? "text-white" : phase === "SAFETY_FAILED" ? "text-red-300" : "text-slate-300"
              }`}>
                "{promptText}"
              </p>
            </div>

            {/* Last heard */}
            {heardText && phase !== "IDLE" && (
              <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700">
                <Mic className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-300 font-mono">"{heardText}"</span>
              </div>
            )}

            {/* ── Action zone ── */}

            {isIdle && !selectedSelector && (
              <div className="text-center text-slate-500 text-sm">
                <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Choose a selector to begin.
              </div>
            )}

            {isIdle && selectedSelector && !assignment && (
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-400 opacity-80" />
                <p className="text-red-300 text-sm font-bold">No assignment — cannot start session.</p>
              </div>
            )}

            {isIdle && selectedSelector && assignment && (
              <button
                onClick={startSession}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-yellow-400 text-slate-950 font-black text-lg hover:bg-yellow-300 transition shadow-lg shadow-yellow-400/20"
              >
                <Play className="h-6 w-6" /> Start NOVA Session
              </button>
            )}

            {phase === "SAFETY_FAILED" && (
              <div className="text-center">
                <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                <p className="text-red-300 font-black text-lg mb-1">Safety Check Failed</p>
                <p className="text-slate-400 text-sm mb-4">Failed item: <span className="text-red-300 font-bold">{failedSafetyItem}</span></p>
                <p className="text-slate-500 text-sm">Contact your supervisor before continuing.</p>
                <button onClick={resetSession} className="mt-5 px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold hover:border-yellow-400 transition text-sm">
                  Reset Session
                </button>
              </div>
            )}

            {phase === "DONE" && (
              <div className="text-center">
                <CheckCircle2 className="h-14 w-14 text-green-400 mx-auto mb-3" />
                <p className="text-2xl font-black text-white mb-1">Batch Complete!</p>
                <p className="text-slate-400 text-sm mb-5">Assignment {assignment?.assignmentNumber} finished. {pickedCount} stops picked.</p>
                <button onClick={resetSession} className="px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold hover:border-yellow-400 transition">
                  Run Another Session
                </button>
              </div>
            )}

            {/* Picking: location display + check code input */}
            {isPicking && currentStop && (
              <div className="w-full max-w-sm">
                <div className="text-center mb-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Current Location</p>
                  <p className="text-4xl font-black text-white">Aisle {currentStop.aisle} · Slot {currentStop.slot}</p>
                  <p className="text-sm text-slate-400 mt-1">Stop {currentStopIndex + 1} of {stops.length} · Qty: {currentStop.qty}</p>
                </div>

                {/* Voice mode: no keyboard needed — mic handles check codes */}
                {micMode === "browser" ? (
                  <div className="text-center py-3">
                    <p className="text-xs text-slate-500">
                      {speaking ? "Wait for NOVA…" : "Say the check code out loud"}
                    </p>
                    {lastCodeWrong && (
                      <div className="mt-2 flex items-center justify-center gap-2 text-red-400 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5" /> Wrong code — say it again
                      </div>
                    )}
                  </div>
                ) : (
                  /* Button / keyboard fallback for devices without mic */
                  <>
                    <div className="flex gap-2">
                      <input
                        ref={codeInputRef}
                        value={codeInput}
                        onChange={(e) => { setCodeInput(e.target.value); setLastCodeWrong(false); }}
                        onKeyDown={(e) => e.key === "Enter" && submitCheckCode()}
                        disabled={speaking}
                        maxLength={6}
                        placeholder="Check code…"
                        className={`flex-1 bg-slate-950 border rounded-xl px-4 py-3 text-white font-mono text-center text-xl placeholder:text-slate-600 focus:outline-none transition disabled:opacity-40 ${
                          lastCodeWrong ? "border-red-500 focus:border-red-400" : "border-slate-700 focus:border-yellow-400"
                        }`}
                      />
                      <button
                        onClick={submitCheckCode}
                        disabled={!codeInput || speaking}
                        className="px-5 py-3 rounded-xl bg-yellow-400 text-slate-950 font-black hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </div>
                    {lastCodeWrong && (
                      <div className="mt-2 flex items-center gap-2 text-red-400 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5" /> Invalid check code. Try again.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Confirm / Deny buttons for non-picking phases */}
            {isActive && !isPicking && phase !== "LOAD_PICKS_SUMMARY" && phase !== "LOAD_PICKS_WAIT" && (
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => handleButtonInput("confirm")}
                  disabled={speaking}
                  className="flex-1 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black transition disabled:opacity-40 text-sm"
                >
                  ✓ Confirm
                </button>
                <button
                  onClick={() => handleButtonInput("no")}
                  disabled={speaking}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-black transition disabled:opacity-40 text-sm"
                >
                  ✗ Deny
                </button>
              </div>
            )}

            {/* Load picks / Ready buttons */}
            {phase === "LOAD_PICKS_WAIT" && (
              <button
                onClick={() => handleButtonInput("load picks")}
                disabled={speaking}
                className="px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-lg transition disabled:opacity-40"
              >
                📦 Load Picks
              </button>
            )}

            {phase === "LOAD_PICKS_SUMMARY" && (
              <button
                onClick={() => handleButtonInput("ready")}
                disabled={speaking}
                className="px-8 py-4 rounded-2xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-black text-lg transition disabled:opacity-40"
              >
                <Mic className="inline h-5 w-5 mr-2" /> Say "Ready"
              </button>
            )}

            {(phase === "ALPHA_SETUP" || phase === "BRAVO_SETUP") && (
              <button
                onClick={() => handleButtonInput("ready")}
                disabled={speaking}
                className="px-8 py-4 rounded-2xl bg-cyan-700 hover:bg-cyan-600 text-white font-black text-lg transition disabled:opacity-40"
              >
                <Mic className="inline h-5 w-5 mr-2" /> Ready
              </button>
            )}

            {/* Mic status + speed indicator */}
            {isActive && (
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  {micMode === "browser" ? (
                    <>
                      <span className={`inline-block w-2 h-2 rounded-full ${listening ? "bg-green-400 animate-pulse" : speaking ? "bg-yellow-400" : "bg-slate-600"}`} />
                      {speaking ? "NOVA speaking — mic paused" : listening ? "Listening — speak your response" : "Mic ready"}
                    </>
                  ) : (
                    <>
                      <MicOff className="h-3.5 w-3.5" />
                      No mic detected — use buttons above
                    </>
                  )}
                </div>
                {/* Voice speed badge */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
                  <Volume2 className="h-3 w-3" />
                  <span>Speed: {novaRate < 0.8 ? "Slow" : novaRate > 1.3 ? "Fast" : "Normal"}</span>
                  <span className="text-slate-700">· Say "NOVA faster" or "NOVA slower"</span>
                </div>
              </div>
            )}
          </div>

          {/* Command log */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <List className="h-3.5 w-3.5" /> Command Log
            </h2>
            <div
              ref={logContainerRef}
              className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin"
            >
              {commandLog.length === 0 && (
                <p className="text-slate-600 text-xs text-center py-4">No activity yet.</p>
              )}
              {commandLog.map((entry) => (
                <div key={entry.id} className={`flex gap-2 text-xs rounded-lg px-3 py-1.5 ${
                  entry.type === "NOVA" ? "bg-yellow-400/8 text-slate-300"
                  : entry.type === "USER" ? "bg-green-500/8 text-green-300"
                  : "bg-slate-800 text-slate-400"
                }`}>
                  <span className={`font-bold shrink-0 ${entry.type === "NOVA" ? "text-yellow-400" : entry.type === "USER" ? "text-green-400" : "text-slate-500"}`}>
                    {entry.type === "NOVA" ? "NOVA" : entry.type === "USER" ? "YOU" : "SYS"}
                  </span>
                  <span className="flex-1">{entry.text}</span>
                  <span className="text-slate-600 shrink-0">{entry.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel — cheat sheet ──────────────────────────────────── */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" /> NOVA Commands
            </h2>

            <div className="mb-3">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Confirm / Deny</p>
              <div className="space-y-1">
                {["yes / confirm / affirmative", "no / cancel / negative"].map((cmd) => (
                  <div key={cmd} className="flex items-start gap-2 text-xs">
                    <ChevronRight className="h-3 w-3 text-slate-600 mt-0.5 shrink-0" />
                    <span className="font-mono text-slate-300">{cmd}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">Help Mode</p>
              <div className="space-y-1">
                {voiceCommands.filter((c) => c.type === "help").map((cmd) => (
                  <div key={cmd.action} className="flex items-start gap-2 text-xs">
                    <ChevronRight className="h-3 w-3 text-slate-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-mono text-slate-200">{cmd.phrase}</span>
                      <p className="text-slate-500 text-[10px] leading-tight">{cmd.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-2">Picking Commands</p>
              <div className="space-y-1">
                {voiceCommands.filter((c) => c.type === "basic" && !["confirm","deny"].includes(c.action)).map((cmd) => (
                  <div key={cmd.action} className="flex items-start gap-2 text-xs">
                    <ChevronRight className="h-3 w-3 text-slate-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-mono text-slate-200">{cmd.phrase}</span>
                      <p className="text-slate-500 text-[10px] leading-tight">{cmd.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Safety checklist reference */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" /> Safety Items
            </h2>
            <div className="space-y-1.5">
              {SAFETY_ITEMS.map((item, idx) => (
                <div key={item} className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 transition ${
                  phase === "SAFETY" && idx === safetyIndex ? "bg-yellow-400/10 text-yellow-300 font-bold"
                  : phase === "SAFETY" && idx < safetyIndex ? "text-green-400"
                  : phase === "SAFETY_FAILED" && item === failedSafetyItem ? "text-red-400 font-bold"
                  : "text-slate-500"
                }`}>
                  {phase === "SAFETY" && idx < safetyIndex ? (
                    <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
                  ) : phase === "SAFETY_FAILED" && item === failedSafetyItem ? (
                    <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-current inline-block shrink-0" />
                  )}
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Invite Activity */}
          {pendingInvites.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <User className="h-3.5 w-3.5" /> Invite Activity
              </h2>
              <div className="space-y-2">
                {pendingInvites.slice(-5).reverse().map((inv) => (
                  <div key={inv.token} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate text-white">{inv.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{inv.email} · <span className="text-yellow-400/80">{inv.role}</span></p>
                    </div>
                    <button
                      onClick={() => revokeInvite(inv.token)}
                      className="text-xs px-2 py-1 rounded-lg bg-red-900/40 hover:bg-red-700/60 text-red-400 hover:text-red-200 border border-red-800/50 transition font-semibold shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
