import { useEffect, useMemo, useState } from "react";
import { ASSIGNMENTS } from "@/data/assignments";
import { getStopsForAssignment } from "@/data/assignmentStops";
import { voiceCommands } from "@/data/voiceCommands";
import {
  normalizeSpeech,
  isConfirm,
  isDeny,
  isLoadPicks,
  extractDigits,
} from "@/lib/parser";
import { useVoiceEngine, UseVoiceEngineReturn } from "@/hooks/useVoiceEngine";

const SYSTEM_DEFAULTS = {
  printerNumber: "307",
  alphaLabelNumber: "242",
  bravoLabelNumber: "578",
};

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

const PHASES = {
  IDLE: "IDLE",
  SIGN_ON_EQUIPMENT: "SIGN_ON_EQUIPMENT",
  SIGN_ON_CONFIRM_EQUIPMENT: "SIGN_ON_CONFIRM_EQUIPMENT",
  SIGN_ON_PALLET_COUNT: "SIGN_ON_PALLET_COUNT",
  SIGN_ON_CONFIRM_PALLET_COUNT: "SIGN_ON_CONFIRM_PALLET_COUNT",
  SAFETY: "SAFETY",
  SAFETY_FAILED: "SAFETY_FAILED",
  WAIT_LOAD_PICKS: "WAIT_LOAD_PICKS",
  LOAD_SUMMARY: "LOAD_SUMMARY",
  SETUP_ALPHA: "SETUP_ALPHA",
  SETUP_BRAVO: "SETUP_BRAVO",
  PICK_WAIT_CHECK: "PICK_WAIT_CHECK",
  PICK_WAIT_READY: "PICK_WAIT_READY",
  BATCH_COMPLETE_DOOR_BRAVO: "BATCH_COMPLETE_DOOR_BRAVO",
  BATCH_COMPLETE_ALPHA_LABEL: "BATCH_COMPLETE_ALPHA_LABEL",
  BATCH_COMPLETE_BRAVO_LABEL: "BATCH_COMPLETE_BRAVO_LABEL",
  BATCH_COMPLETE_STAGE_BRAVO: "BATCH_COMPLETE_STAGE_BRAVO",
  BATCH_COMPLETE_STAGE_ALPHA: "BATCH_COMPLETE_STAGE_ALPHA",
  NEXT_BATCH_WAIT: "NEXT_BATCH_WAIT",
};

function StatCard({ label, value, tone = "default" }: { label: string; value: string | number; tone?: string }) {
  const toneClass =
    tone === "accent"
      ? "text-yellow-300"
      : tone === "danger"
      ? "text-red-300"
      : tone === "success"
      ? "text-green-300"
      : "text-white";

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 p-3 sm:p-5 shadow-lg">
      <p className="text-xs sm:text-sm text-slate-400">{label}</p>
      <p className={`mt-1 sm:mt-3 text-lg sm:text-2xl font-black truncate ${toneClass}`}>{value}</p>
    </div>
  );
}

function PhaseBadge({ phase }: { phase: string }) {
  return (
    <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-300">
      {phase}
    </span>
  );
}

function VoiceStateBadge({ voice }: { voice: UseVoiceEngineReturn }) {
  let label = "Idle";
  let className = "bg-slate-500/20 text-slate-300";

  if (voice.listening) {
    label = "Listening";
    className = "bg-green-500/20 text-green-300";
  } else if (voice.speaking) {
    label = "Speaking";
    className = "bg-yellow-500/20 text-yellow-300";
  } else if (voice.processing) {
    label = "Processing";
    className = "bg-blue-500/20 text-blue-300";
  } else if (voice.error) {
    label = "Error";
    className = "bg-red-500/20 text-red-300";
  }

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}

export default function NovaTrainerPage() {
  const [selectorUserId, setSelectorUserId] = useState("user-001");
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [promptText, setPromptText] = useState("Start NOVA to begin.");
  const [commandLog, setCommandLog] = useState<{ id: number; type: string; text: string; at: string }[]>([]);

  const [equipmentId, setEquipmentId] = useState("");
  const [maxPalletCount, setMaxPalletCount] = useState("2");
  const [safetyIndex, setSafetyIndex] = useState(0);
  const [failedSafetyItem, setFailedSafetyItem] = useState("");

  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [helpCount, setHelpCount] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);

  const myAssignments = useMemo(() => {
    return ASSIGNMENTS.filter((a) => a.selectorUserId === selectorUserId);
  }, [selectorUserId]);

  const activeAssignment = useMemo(() => {
    return ASSIGNMENTS.find((a) => a.id === activeAssignmentId) || null;
  }, [activeAssignmentId]);

  const stops = useMemo(() => {
    if (!activeAssignment) return [];
    return getStopsForAssignment(activeAssignment.id);
  }, [activeAssignment]);

  const currentStop = stops[currentStopIndex] || null;
  const nextStop = stops[currentStopIndex + 1] || null;

  const addLog = (type: string, text: string) => {
    setCommandLog((prev) => [
      {
        id: Date.now() + Math.random(),
        type,
        text,
        at: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
  };

  const voice = useVoiceEngine({
    onHeard: (heard: string, raw: string) => {
      addLog("USER", raw || heard);
      handleVoiceInput(heard);
    },
    autoRestart: true,
    silencePrompt: "No input received.",
  });

  const speakPrompt = (text: string) => {
    setPromptText(text);
    addLog("NOVA", text);
    voice.askAndListen(text);
  };

  const speakOnly = (text: string) => {
    setPromptText(text);
    addLog("NOVA", text);
    voice.speak(text, { restartAfterSpeak: true });
  };

  const startAssignedBatch = () => {
    const assignment = myAssignments[0];
    if (!assignment) {
      speakPrompt("No assignment assigned to your ID.");
      return;
    }

    setActiveAssignmentId(assignment.id);
    setCurrentStopIndex(0);
    setPhase(PHASES.LOAD_SUMMARY);

    const summary = `Start aisle ${assignment.startAisle} end aisle ${assignment.endAisle}. Slots ${assignment.stops}. Total cases ${assignment.totalCases}. Pallets ${assignment.totalPallets}. Estimated goal ${assignment.goalTimeMinutes}. To continue say ready.`;
    speakPrompt(summary);
  };

  const beginPickFlow = () => {
    if (!currentStop) return;
    setPhase(PHASES.PICK_WAIT_CHECK);
    speakPrompt(`New aisle ${currentStop.aisle} slot ${currentStop.slot}`);
  };

  const moveToNextStop = () => {
    if (currentStopIndex < stops.length - 1) {
      const nextIndex = currentStopIndex + 1;
      setCurrentStopIndex(nextIndex);
      const next = stops[nextIndex];
      setPhase(PHASES.PICK_WAIT_CHECK);
      speakPrompt(`New aisle ${next.aisle} slot ${next.slot}`);
      return;
    }

    setPhase(PHASES.BATCH_COMPLETE_DOOR_BRAVO);
    speakPrompt(
      `Batch complete deliver pallet bravo to door ${activeAssignment?.doorNumber}`
    );
  };

  const helpCountSetter = () => {
    setHelpCount((prev) => prev + 1);
  };

  const handleQuickCommand = (input: string): boolean => {
    const value = normalizeSpeech(input);

    if (!value) {
      speakPrompt("No input received.");
      return true;
    }

    if (value === "repeat labels") { helpCountSetter(); speakPrompt("Repeating label instructions."); return true; }
    if (value === "makeup skips") { helpCountSetter(); speakPrompt("Makeup skips requested."); return true; }
    if (value === "get drops") { helpCountSetter(); speakPrompt("Get drops requested."); return true; }
    if (value === "close batch") {
      helpCountSetter();
      setPhase(PHASES.BATCH_COMPLETE_DOOR_BRAVO);
      speakPrompt(activeAssignment ? `Batch complete deliver pallet bravo to door ${activeAssignment.doorNumber}` : "Close batch.");
      return true;
    }
    if (value.startsWith("go to aisle")) { helpCountSetter(); speakPrompt("Go to aisle command received."); return true; }
    if (value === "base items") { helpCountSetter(); speakPrompt("Base items review."); return true; }
    if (value === "previous") { helpCountSetter(); speakPrompt("Previous item."); return true; }
    if (value === "base complete") { helpCountSetter(); speakPrompt("Base complete."); return true; }
    if (value === "remove pallet") { helpCountSetter(); speakPrompt("Remove pallet noted."); return true; }
    if (value === "skip slot") { helpCountSetter(); speakPrompt("Skip slot noted."); return true; }
    if (value === "report damage") { helpCountSetter(); speakPrompt("Damage flow started."); return true; }
    if (value.startsWith("damage")) { helpCountSetter(); speakPrompt("Damage quantity recorded."); return true; }
    if (value === "slot empty") { helpCountSetter(); speakPrompt("Slot empty recorded."); return true; }
    if (value === "recap weights") { helpCountSetter(); speakPrompt("Recapping weights."); return true; }
    if (value === "next") { helpCountSetter(); speakPrompt("Next item."); return true; }
    if (value === "exit list") { helpCountSetter(); speakPrompt("Exit list."); return true; }
    if (value === "no labels") { helpCountSetter(); speakPrompt("No labels recorded."); return true; }

    return false;
  };

  const handleVoiceInput = (inputRaw: string) => {
    const input = normalizeSpeech(inputRaw);

    if (handleQuickCommand(input)) return;

    if (phase === PHASES.SIGN_ON_EQUIPMENT) {
      const digits = extractDigits(input);
      if (!digits) { speakPrompt("Enter equipment ID."); return; }
      setEquipmentId(digits);
      setPhase(PHASES.SIGN_ON_CONFIRM_EQUIPMENT);
      speakPrompt(`Confirm equipment ${digits}.`);
      return;
    }

    if (phase === PHASES.SIGN_ON_CONFIRM_EQUIPMENT) {
      if (isConfirm(input)) {
        setPhase(PHASES.SIGN_ON_PALLET_COUNT);
        speakPrompt(`Enter maximum pallet count for jack ${equipmentId}.`);
        return;
      }
      if (isDeny(input)) {
        setEquipmentId("");
        setPhase(PHASES.SIGN_ON_EQUIPMENT);
        speakPrompt("Enter equipment ID.");
        return;
      }
      speakPrompt(`Confirm equipment ${equipmentId}.`);
      return;
    }

    if (phase === PHASES.SIGN_ON_PALLET_COUNT) {
      const digits = extractDigits(input);
      if (!digits) { speakPrompt("Enter maximum pallet count."); return; }
      setMaxPalletCount(digits);
      setPhase(PHASES.SIGN_ON_CONFIRM_PALLET_COUNT);
      speakPrompt("Confirm maximum pallet count.");
      return;
    }

    if (phase === PHASES.SIGN_ON_CONFIRM_PALLET_COUNT) {
      if (isConfirm(input)) {
        setSafetyIndex(0);
        setPhase(PHASES.SAFETY);
        speakPrompt(SAFETY_ITEMS[0]);
        return;
      }
      if (isDeny(input)) {
        setPhase(PHASES.SIGN_ON_PALLET_COUNT);
        speakPrompt(`Enter maximum pallet count for jack ${equipmentId}.`);
        return;
      }
      speakPrompt("Confirm maximum pallet count.");
      return;
    }

    if (phase === PHASES.SAFETY) {
      const item = SAFETY_ITEMS[safetyIndex];
      if (isConfirm(input)) {
        if (safetyIndex < SAFETY_ITEMS.length - 1) {
          const nextIndex = safetyIndex + 1;
          setSafetyIndex(nextIndex);
          speakPrompt(SAFETY_ITEMS[nextIndex]);
        } else {
          setPhase(PHASES.WAIT_LOAD_PICKS);
          speakPrompt("Say load picks.");
        }
        return;
      }
      if (isDeny(input)) {
        setFailedSafetyItem(item);
        setPhase(PHASES.SAFETY_FAILED);
        voice.stopListening();
        setPromptText(`Safety failed. ${item} Session stopped.`);
        addLog("NOVA", `Safety failed. ${item} Session stopped.`);
        voice.speak(`Safety failed. ${item} Session stopped.`, { restartAfterSpeak: false });
        return;
      }
      speakPrompt(item);
      return;
    }

    if (phase === PHASES.WAIT_LOAD_PICKS) {
      if (isLoadPicks(input)) { startAssignedBatch(); return; }
      speakPrompt("Say load picks.");
      return;
    }

    if (phase === PHASES.LOAD_SUMMARY) {
      if (input === "ready") {
        setPhase(PHASES.SETUP_ALPHA);
        speakPrompt("Position alpha pallet get chep.");
        return;
      }
      speakPrompt("To continue say ready.");
      return;
    }

    if (phase === PHASES.SETUP_ALPHA) {
      if (input === "ready") {
        setPhase(PHASES.SETUP_BRAVO);
        speakPrompt("Position bravo pallet get chep.");
        return;
      }
      speakPrompt("Position alpha pallet get chep.");
      return;
    }

    if (phase === PHASES.SETUP_BRAVO) {
      if (input === "ready") { beginPickFlow(); return; }
      speakPrompt("Position bravo pallet get chep.");
      return;
    }

    if (phase === PHASES.PICK_WAIT_CHECK) {
      if (!currentStop) return;
      const digits = extractDigits(input);
      if (!digits) {
        setInvalidCount((prev) => prev + 1);
        speakPrompt(`You said ${input || "nothing"}. Invalid.`);
        return;
      }
      if (digits !== currentStop.checkCode) {
        setInvalidCount((prev) => prev + 1);
        speakPrompt(`You said ${digits}. Invalid.`);
        return;
      }
      const side = currentStopIndex % 2 === 0 ? "Alpha" : "Bravo";
      setPhase(PHASES.PICK_WAIT_READY);
      speakPrompt(`Grab ${currentStop.qty} ${side}`);
      return;
    }

    if (phase === PHASES.PICK_WAIT_READY) {
      if (input === "ready" || input === "grab" || isConfirm(input)) { moveToNextStop(); return; }
      speakPrompt("Ready.");
      return;
    }

    if (phase === PHASES.BATCH_COMPLETE_DOOR_BRAVO) {
      const digits = extractDigits(input);
      if (digits === String(activeAssignment?.doorCode || "")) {
        setPhase(PHASES.BATCH_COMPLETE_ALPHA_LABEL);
        speakPrompt("Apply labels to pallet alpha");
        return;
      }
      speakPrompt(`Batch complete deliver pallet bravo to door ${activeAssignment?.doorNumber || ""}`);
      return;
    }

    if (phase === PHASES.BATCH_COMPLETE_ALPHA_LABEL) {
      const digits = extractDigits(input);
      if (input.includes("alpha") || digits === SYSTEM_DEFAULTS.alphaLabelNumber) {
        setPhase(PHASES.BATCH_COMPLETE_BRAVO_LABEL);
        speakPrompt("Apply labels to pallet bravo");
        return;
      }
      speakPrompt("Apply labels to pallet alpha");
      return;
    }

    if (phase === PHASES.BATCH_COMPLETE_BRAVO_LABEL) {
      const digits = extractDigits(input);
      if (input.includes("bravo") || digits === SYSTEM_DEFAULTS.bravoLabelNumber) {
        setPhase(PHASES.BATCH_COMPLETE_STAGE_BRAVO);
        speakPrompt(`Deliver bravo pallet to door ${activeAssignment?.doorNumber || ""}`);
        return;
      }
      speakPrompt("Apply labels to pallet bravo");
      return;
    }

    if (phase === PHASES.BATCH_COMPLETE_STAGE_BRAVO) {
      const digits = extractDigits(input);
      if (digits === String(activeAssignment?.doorCode || "")) {
        setPhase(PHASES.BATCH_COMPLETE_STAGE_ALPHA);
        speakPrompt(`Deliver alpha pallet to door ${activeAssignment?.doorNumber || ""}`);
        return;
      }
      speakPrompt(`Deliver bravo pallet to door ${activeAssignment?.doorNumber || ""}`);
      return;
    }

    if (phase === PHASES.BATCH_COMPLETE_STAGE_ALPHA) {
      const digits = extractDigits(input);
      if (digits === String(activeAssignment?.doorCode || "")) {
        setPhase(PHASES.NEXT_BATCH_WAIT);
        speakPrompt("Say load picks.");
        return;
      }
      speakPrompt(`Deliver alpha pallet to door ${activeAssignment?.doorNumber || ""}`);
      return;
    }

    if (phase === PHASES.NEXT_BATCH_WAIT) {
      if (isLoadPicks(input)) { startAssignedBatch(); return; }
      speakPrompt("Say load picks.");
    }
  };

  const startNova = async () => {
    const ok = await voice.initialize();
    if (!ok) return;
    setSessionStarted(true);
    setPhase(PHASES.SIGN_ON_EQUIPMENT);
    setPromptText("Enter equipment ID.");
    addLog("NOVA", "Enter equipment ID.");
    voice.askAndListen("Enter equipment ID.");
  };

  const retryMic = async () => {
    const ok = await voice.retryMic();
    if (!ok) return;
    voice.askAndListen(promptText || "Enter equipment ID.");
  };

  const resetSession = () => {
    voice.stopListening();
    setSessionStarted(false);
    setPhase(PHASES.IDLE);
    setPromptText("Start NOVA to begin.");
    setCommandLog([]);
    setEquipmentId("");
    setMaxPalletCount("2");
    setSafetyIndex(0);
    setFailedSafetyItem("");
    setActiveAssignmentId(null);
    setCurrentStopIndex(0);
    setInvalidCount(0);
    setHelpCount(0);
  };

  useEffect(() => {
    if (!voice.currentPrompt) return;
    setPromptText(voice.currentPrompt);
  }, [voice.currentPrompt]);

  return (
    <div className="min-h-screen bg-slate-950 text-white px-3 py-5 sm:px-6 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
          <div>
            <p className="text-yellow-400 text-xs sm:text-sm font-semibold uppercase tracking-[0.22em]">NOVA Trainer</p>
            <h1 className="mt-1 sm:mt-2 text-2xl sm:text-4xl font-black">ES3 Script Mode</h1>
            <p className="mt-1 sm:mt-2 text-slate-400 text-sm sm:text-base max-w-3xl">
              Hands-free voice workflow after one tap. Selector can talk to NOVA without touching the screen again.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {!sessionStarted ? (
              <button
                onClick={startNova}
                className="rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition"
              >
                Start NOVA
              </button>
            ) : (
              <>
                <button
                  onClick={() => voice.startListening()}
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold hover:border-yellow-400 transition"
                >
                  Listen Now
                </button>
                <button
                  onClick={resetSession}
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold hover:border-red-400 transition"
                >
                  Reset Session
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mic error */}
        {voice.error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="font-bold text-red-300">Microphone / Voice Error</p>
            <p className="mt-2 text-red-200">{voice.error}</p>
            <button
              onClick={retryMic}
              className="mt-4 rounded-2xl bg-yellow-400 px-5 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition"
            >
              Retry Mic
            </button>
          </div>
        ) : null}

        {/* Selector switcher */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-lg flex flex-wrap items-center gap-4">
          <p className="text-sm text-slate-400 font-semibold">Selector ID:</p>
          <select
            value={selectorUserId}
            onChange={(e) => setSelectorUserId(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
          >
            {["user-001", "user-002", "user-003"].map((uid) => (
              <option key={uid} value={uid}>{uid}</option>
            ))}
          </select>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <StatCard label="Phase" value={phase} tone="accent" />
          <StatCard label="Selector" value={selectorUserId} />
          <StatCard label="Assignment" value={activeAssignment ? `#${activeAssignment.assignmentNumber}` : "—"} />
          <StatCard label="Current Stop" value={currentStop ? `${currentStop.stopOrder}` : "—"} />
          <StatCard
            label="Voice State"
            value={voice.listening ? "Listening" : voice.speaking ? "Speaking" : voice.processing ? "Processing" : "Idle"}
            tone={voice.listening ? "success" : voice.error ? "danger" : "accent"}
          />
          <StatCard label="Invalid Count" value={invalidCount} tone={invalidCount > 0 ? "danger" : "default"} />
        </div>

        {/* Main layout */}
        <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-6">

          {/* Left column */}
          <div className="space-y-5 sm:space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl sm:text-2xl font-bold">Current Prompt</h2>
                <VoiceStateBadge voice={voice} />
              </div>

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-lg font-semibold text-white">{promptText}</p>
              </div>

              <div className="mt-5 grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Heard Response</p>
                  <p className="mt-2 font-semibold text-white">{voice.lastHeard || "—"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Microphone Permission</p>
                  <p className="mt-2 font-semibold text-white capitalize">{voice.micPermission}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
              <h2 className="text-2xl font-bold">Live Session Data</h2>
              <div className="mt-5 grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Equipment ID</p>
                  <p className="mt-2 font-semibold">{equipmentId || "—"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Max Pallet Count</p>
                  <p className="mt-2 font-semibold">{maxPalletCount || "—"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Current Aisle</p>
                  <p className="mt-2 font-semibold">{currentStop?.aisle ?? "—"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Current Slot</p>
                  <p className="mt-2 font-semibold">{currentStop?.slot ?? "—"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Next Stop</p>
                  <p className="mt-2 font-semibold">{nextStop ? `${nextStop.aisle}/${nextStop.slot}` : "—"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Failed Safety Item</p>
                  <p className="mt-2 font-semibold text-red-300">{failedSafetyItem || "None"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Door</p>
                  <p className="mt-2 font-semibold">{activeAssignment?.doorNumber ?? "—"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Door Code</p>
                  <p className="mt-2 font-semibold">{activeAssignment?.doorCode ?? "—"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Printer</p>
                  <p className="mt-2 font-semibold">{SYSTEM_DEFAULTS.printerNumber}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Labels</p>
                  <p className="mt-2 font-semibold">A {SYSTEM_DEFAULTS.alphaLabelNumber} · B {SYSTEM_DEFAULTS.bravoLabelNumber}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
              <h2 className="text-2xl font-bold">Command Log</h2>
              <div className="mt-5 max-h-[420px] overflow-auto space-y-3">
                {commandLog.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-400">No activity yet.</div>
                ) : (
                  commandLog.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${entry.type === "NOVA" ? "bg-yellow-500/20 text-yellow-300" : "bg-blue-500/20 text-blue-300"}`}>
                          {entry.type}
                        </span>
                        <span className="text-xs text-slate-500">{entry.at}</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-200">{entry.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
              <h2 className="text-2xl font-bold">Assigned Work</h2>
              <div className="mt-5 space-y-3">
                {myAssignments.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-400">
                    No assignments for {selectorUserId}.
                  </div>
                ) : (
                  myAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className={`rounded-2xl border p-4 ${activeAssignmentId === assignment.id ? "border-yellow-400 bg-yellow-500/10" : "border-slate-800 bg-slate-950"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold">#{assignment.assignmentNumber}</p>
                        <PhaseBadge phase={assignment.type} />
                      </div>
                      <p className="mt-2 text-sm text-slate-400">
                        {assignment.totalCases} Cases · Aisles {assignment.startAisle}–{assignment.endAisle}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
              <h2 className="text-2xl font-bold">ES3 Commands</h2>
              <div className="mt-5 max-h-[420px] overflow-auto space-y-3">
                {voiceCommands.map((cmd) => (
                  <div key={`${cmd.type}-${cmd.phrase}`} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${cmd.type === "help" ? "bg-blue-500/20 text-blue-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                        {cmd.type}
                      </span>
                      <p className="font-semibold">{cmd.phrase}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{cmd.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
              <h2 className="text-2xl font-bold">Quick Controls</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button onClick={() => handleVoiceInput("yes")} className="rounded-2xl border border-slate-700 px-4 py-3 font-semibold hover:border-yellow-400 transition">Confirm</button>
                <button onClick={() => handleVoiceInput("no")} className="rounded-2xl border border-slate-700 px-4 py-3 font-semibold hover:border-red-400 transition">Deny</button>
                <button onClick={() => handleVoiceInput("load picks")} className="rounded-2xl border border-slate-700 px-4 py-3 font-semibold hover:border-yellow-400 transition">Load Picks</button>
                <button onClick={() => handleVoiceInput("ready")} className="rounded-2xl border border-slate-700 px-4 py-3 font-semibold hover:border-yellow-400 transition">Ready</button>
              </div>
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm text-slate-400">Help Count</p>
                <p className="mt-2 text-xl font-bold">{helpCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
