import { useEffect, useMemo, useRef, useState } from "react";
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
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/lib/authStore";
import { useTrainerStore, type TrainerSelector } from "@/lib/trainerStore";

const SYSTEM_DEFAULTS = {
  printerNumber: "307",
  alphaLabelNumber: "242",
  bravoLabelNumber: "578",
};

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

function VoiceStateBadge({ voice, labels }: { voice: UseVoiceEngineReturn; labels: { listening: string; speaking: string; processing: string; error: string; idle: string } }) {
  let label = labels.idle;
  let className = "bg-slate-500/20 text-slate-300";

  if (voice.listening) {
    label = labels.listening;
    className = "bg-green-500/20 text-green-300";
  } else if (voice.speaking) {
    label = labels.speaking;
    className = "bg-yellow-500/20 text-yellow-300";
  } else if (voice.processing) {
    label = labels.processing;
    className = "bg-blue-500/20 text-blue-300";
  } else if (voice.error) {
    label = labels.error;
    className = "bg-red-500/20 text-red-300";
  }

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}

export default function NovaTrainerPage() {
  const { t } = useTranslation();
  const { currentUser, accounts } = useAuthStore();

  const SAFETY_ITEMS = t("novaTrainer.safetyItems", { returnObjects: true }) as string[];

  const p = (key: string, vars?: Record<string, string | number>) =>
    t(`novaTrainer.prompt.${key}`, vars);

  // Real registered selectors from authStore
  const selectorAccounts = useMemo(
    () => accounts.filter((a) => a.role === "selector"),
    [accounts]
  );
  // Map each selector's username → a demo user-ID used by the hardcoded assignment data
  const usernameToId = useMemo(
    () => Object.fromEntries(selectorAccounts.map((acc, i) => [acc.username, `user-00${i + 1}`])),
    [selectorAccounts]
  );

  // When the logged-in user is a selector, default to their own username
  const defaultUsername =
    currentUser?.role === "selector"
      ? currentUser.username
      : selectorAccounts.length > 0
      ? selectorAccounts[0].username
      : "user-001";

  const [selectorUsername, setSelectorUsername] = useState(defaultUsername);

  // NOVA ID gate — must be set before full dashboard renders
  const { selectors: trainerSelectors } = useTrainerStore();
  const [novaIdInput, setNovaIdInput] = useState("");
  const [matchedSelector, setMatchedSelector] = useState<TrainerSelector | null>(null);
  const [entryError, setEntryError] = useState("");

  // The underlying demo user-ID used to filter ASSIGNMENTS data
  // Prefer the trainer-store userId when a selector logged in via NOVA ID gate
  const selectorUserId =
    matchedSelector?.userId ?? (usernameToId[selectorUsername] ?? "user-001");
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [promptText, setPromptText] = useState(p("startNova"));
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
      { id: Date.now() + Math.random(), type, text, at: new Date().toLocaleTimeString() },
      ...prev,
    ]);
  };

  const voice = useVoiceEngine({
    onHeard: (heard: string, raw: string) => {
      addLog("USER", raw || heard);
      handleVoiceInput(heard);
    },
    autoRestart: true,
    silencePrompt: p("noInputReceived"),
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
      speakPrompt(p("noAssignment"));
      return;
    }

    setActiveAssignmentId(assignment.id);
    setCurrentStopIndex(0);
    setPhase(PHASES.LOAD_SUMMARY);

    const summary = p("loadSummary", {
      startAisle: assignment.startAisle,
      endAisle: assignment.endAisle,
      stops: assignment.stops,
      cases: assignment.totalCases,
      pallets: assignment.totalPallets,
      goal: assignment.goalTimeMinutes,
    });
    speakPrompt(summary);
  };

  const beginPickFlow = () => {
    if (!currentStop) return;
    setPhase(PHASES.PICK_WAIT_CHECK);
    speakPrompt(p("newAisle", { aisle: currentStop.aisle, slot: currentStop.slot }));
  };

  const moveToNextStop = () => {
    if (currentStopIndex < stops.length - 1) {
      const nextIndex = currentStopIndex + 1;
      setCurrentStopIndex(nextIndex);
      const next = stops[nextIndex];
      setPhase(PHASES.PICK_WAIT_CHECK);
      speakPrompt(p("newAisle", { aisle: next.aisle, slot: next.slot }));
      return;
    }

    setPhase(PHASES.BATCH_COMPLETE_DOOR_BRAVO);
    speakPrompt(p("batchCompleteDoor", { door: activeAssignment?.doorNumber ?? "" }));
  };

  const helpCountSetter = () => setHelpCount((prev) => prev + 1);

  const handleQuickCommand = (input: string): boolean => {
    const value = normalizeSpeech(input);

    if (!value) {
      speakPrompt(p("noInputReceived"));
      return true;
    }

    if (value === "repeat labels") { helpCountSetter(); speakPrompt(p("repeatLabels")); return true; }
    if (value === "makeup skips") { helpCountSetter(); speakPrompt(p("makeupSkips")); return true; }
    if (value === "get drops") { helpCountSetter(); speakPrompt(p("getDrops")); return true; }
    if (value === "close batch") {
      helpCountSetter();
      setPhase(PHASES.BATCH_COMPLETE_DOOR_BRAVO);
      speakPrompt(activeAssignment
        ? p("batchClose", { door: activeAssignment.doorNumber })
        : p("closeBatch"));
      return true;
    }
    if (value.startsWith("go to aisle")) { helpCountSetter(); speakPrompt(p("goToAisle")); return true; }
    if (value === "base items") { helpCountSetter(); speakPrompt(p("baseItems")); return true; }
    if (value === "previous") { helpCountSetter(); speakPrompt(p("previous")); return true; }
    if (value === "base complete") { helpCountSetter(); speakPrompt(p("baseComplete")); return true; }
    if (value === "remove pallet") { helpCountSetter(); speakPrompt(p("removePallet")); return true; }
    if (value === "skip slot") { helpCountSetter(); speakPrompt(p("skipSlot")); return true; }
    if (value === "report damage") { helpCountSetter(); speakPrompt(p("reportDamage")); return true; }
    if (value.startsWith("damage")) { helpCountSetter(); speakPrompt(p("damageQty")); return true; }
    if (value === "slot empty") { helpCountSetter(); speakPrompt(p("slotEmpty")); return true; }
    if (value === "recap weights") { helpCountSetter(); speakPrompt(p("recapWeights")); return true; }
    if (value === "next") { helpCountSetter(); speakPrompt(p("next")); return true; }
    if (value === "exit list") { helpCountSetter(); speakPrompt(p("exitList")); return true; }
    if (value === "no labels") { helpCountSetter(); speakPrompt(p("noLabels")); return true; }

    return false;
  };

  const handleVoiceInput = (inputRaw: string) => {
    const input = normalizeSpeech(inputRaw);

    if (handleQuickCommand(input)) return;

    if (phase === PHASES.SIGN_ON_EQUIPMENT) {
      const digits = extractDigits(input);
      if (!digits) { speakPrompt(p("enterEquipmentId")); return; }
      setEquipmentId(digits);
      setPhase(PHASES.SIGN_ON_CONFIRM_EQUIPMENT);
      speakPrompt(p("confirmEquipment", { id: digits }));
      return;
    }

    if (phase === PHASES.SIGN_ON_CONFIRM_EQUIPMENT) {
      if (isConfirm(input)) {
        setPhase(PHASES.SIGN_ON_PALLET_COUNT);
        speakPrompt(p("enterMaxPallets", { id: equipmentId }));
        return;
      }
      if (isDeny(input)) {
        setEquipmentId("");
        setPhase(PHASES.SIGN_ON_EQUIPMENT);
        speakPrompt(p("enterEquipmentId"));
        return;
      }
      speakPrompt(p("confirmEquipment", { id: equipmentId }));
      return;
    }

    if (phase === PHASES.SIGN_ON_PALLET_COUNT) {
      const digits = extractDigits(input);
      if (!digits) { speakPrompt(p("enterMaxPallets", { id: equipmentId })); return; }
      setMaxPalletCount(digits);
      setPhase(PHASES.SIGN_ON_CONFIRM_PALLET_COUNT);
      speakPrompt(p("confirmMaxPallets"));
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
        speakPrompt(p("enterMaxPallets", { id: equipmentId }));
        return;
      }
      speakPrompt(p("confirmMaxPallets"));
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
          speakPrompt(p("sayLoadPicks"));
        }
        return;
      }
      if (isDeny(input)) {
        setFailedSafetyItem(item);
        setPhase(PHASES.SAFETY_FAILED);
        voice.stopListening();
        const failMsg = p("safetyFailed", { item });
        setPromptText(failMsg);
        addLog("NOVA", failMsg);
        voice.speak(failMsg, { restartAfterSpeak: false });
        return;
      }
      speakPrompt(item);
      return;
    }

    if (phase === PHASES.WAIT_LOAD_PICKS) {
      if (isLoadPicks(input)) { startAssignedBatch(); return; }
      speakPrompt(p("sayLoadPicks"));
      return;
    }

    if (phase === PHASES.LOAD_SUMMARY) {
      if (input === "ready") {
        setPhase(PHASES.SETUP_ALPHA);
        speakPrompt(p("positionAlpha"));
        return;
      }
      speakPrompt(p("toContinue"));
      return;
    }

    if (phase === PHASES.SETUP_ALPHA) {
      if (input === "ready") {
        setPhase(PHASES.SETUP_BRAVO);
        speakPrompt(p("positionBravo"));
        return;
      }
      speakPrompt(p("positionAlpha"));
      return;
    }

    if (phase === PHASES.SETUP_BRAVO) {
      if (input === "ready") { beginPickFlow(); return; }
      speakPrompt(p("positionBravo"));
      return;
    }

    if (phase === PHASES.PICK_WAIT_CHECK) {
      if (!currentStop) return;
      const digits = extractDigits(input);
      if (!digits) {
        setInvalidCount((prev) => prev + 1);
        speakPrompt(p("invalidInput", { input: input || "nothing" }));
        return;
      }
      if (digits !== currentStop.checkCode) {
        setInvalidCount((prev) => prev + 1);
        speakPrompt(p("invalidInput", { input: digits }));
        return;
      }
      const side = currentStopIndex % 2 === 0 ? p("alphaSide") : p("bravaSide");
      setPhase(PHASES.PICK_WAIT_READY);
      speakPrompt(p("grab", { qty: currentStop.qty, side }));
      return;
    }

    if (phase === PHASES.PICK_WAIT_READY) {
      if (input === "ready" || input === "grab" || isConfirm(input)) { moveToNextStop(); return; }
      speakPrompt(p("ready"));
      return;
    }

    if (phase === PHASES.BATCH_COMPLETE_DOOR_BRAVO) {
      const digits = extractDigits(input);
      if (digits === String(activeAssignment?.doorCode || "")) {
        setPhase(PHASES.BATCH_COMPLETE_ALPHA_LABEL);
        speakPrompt(p("applyAlphaLabels"));
        return;
      }
      speakPrompt(p("batchCompleteDoor", { door: activeAssignment?.doorNumber || "" }));
      return;
    }

    if (phase === PHASES.BATCH_COMPLETE_ALPHA_LABEL) {
      const digits = extractDigits(input);
      if (input.includes("alpha") || input.includes("alfa") || digits === SYSTEM_DEFAULTS.alphaLabelNumber) {
        setPhase(PHASES.BATCH_COMPLETE_BRAVO_LABEL);
        speakPrompt(p("applyBravoLabels"));
        return;
      }
      speakPrompt(p("applyAlphaLabels"));
      return;
    }

    if (phase === PHASES.BATCH_COMPLETE_BRAVO_LABEL) {
      const digits = extractDigits(input);
      if (input.includes("bravo") || digits === SYSTEM_DEFAULTS.bravoLabelNumber) {
        setPhase(PHASES.BATCH_COMPLETE_STAGE_BRAVO);
        speakPrompt(p("deliverBravo", { door: activeAssignment?.doorNumber || "" }));
        return;
      }
      speakPrompt(p("applyBravoLabels"));
      return;
    }

    if (phase === PHASES.BATCH_COMPLETE_STAGE_BRAVO) {
      const digits = extractDigits(input);
      if (digits === String(activeAssignment?.doorCode || "")) {
        setPhase(PHASES.BATCH_COMPLETE_STAGE_ALPHA);
        speakPrompt(p("deliverAlpha", { door: activeAssignment?.doorNumber || "" }));
        return;
      }
      speakPrompt(p("deliverBravo", { door: activeAssignment?.doorNumber || "" }));
      return;
    }

    if (phase === PHASES.BATCH_COMPLETE_STAGE_ALPHA) {
      const digits = extractDigits(input);
      if (digits === String(activeAssignment?.doorCode || "")) {
        setPhase(PHASES.NEXT_BATCH_WAIT);
        speakPrompt(p("sayLoadPicks"));
        return;
      }
      speakPrompt(p("deliverAlpha", { door: activeAssignment?.doorNumber || "" }));
      return;
    }

    if (phase === PHASES.NEXT_BATCH_WAIT) {
      if (isLoadPicks(input)) { startAssignedBatch(); return; }
      speakPrompt(p("sayLoadPicks"));
    }
  };

  const startNova = async () => {
    const ok = await voice.initialize();
    if (!ok) return;
    setSessionStarted(true);
    setPhase(PHASES.SIGN_ON_EQUIPMENT);
    const enterEq = p("enterEquipmentId");
    setPromptText(enterEq);
    addLog("NOVA", enterEq);
    voice.askAndListen(enterEq);
  };

  const retryMic = async () => {
    const ok = await voice.retryMic();
    if (!ok) return;
    voice.askAndListen(promptText || p("enterEquipmentId"));
  };

  const resetSession = () => {
    voice.stopListening();
    setSessionStarted(false);
    setPhase(PHASES.IDLE);
    setPromptText(p("startNova"));
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

  // Auto-start session as soon as a selector is matched (mic already granted in handleEnterNova)
  const hasAutoStartedRef = useRef(false);
  useEffect(() => {
    if (matchedSelector && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      startNova();
    }
    if (!matchedSelector) {
      hasAutoStartedRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedSelector]);

  const voiceLabels = {
    listening: t("novaTrainer.listening"),
    speaking: t("novaTrainer.speaking"),
    processing: t("novaTrainer.processing"),
    error: t("novaTrainer.error"),
    idle: t("novaTrainer.idle"),
  };

  // ── NOVA ID handler ──────────────────────────────────────────────────────────
  const handleEnterNova = async () => {
    const cleaned = novaIdInput.trim().toUpperCase();
    if (!cleaned) {
      setEntryError("Please enter your NOVA ID.");
      return;
    }
    const found = trainerSelectors.find(
      (s) => (s.novaId ?? "").toUpperCase() === cleaned
    );
    if (!found) {
      setEntryError("Invalid NOVA ID. Please check with your trainer.");
      return;
    }
    setEntryError("");
    // Initialize mic HERE (same user-gesture context) so auto-start works immediately
    await voice.initialize();
    setMatchedSelector(found);
  };

  // ── NOVA ID entry screen ─────────────────────────────────────────────────────
  if (!matchedSelector) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] text-white flex flex-col">
        {/* Top bar */}
        <div className="bg-[#141428] border-b border-white/5 px-6 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">N</div>
          <div>
            <p className="text-sm font-semibold leading-none">NOVA Trainer</p>
            <p className="text-xs text-slate-400 mt-0.5">ES3 Script Mode</p>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-8">

          {/* Signal circle */}
          <div className="relative flex items-center justify-center w-48 h-48">
            <div className="w-36 h-36 rounded-full flex items-center justify-center border-2 border-violet-700/50 bg-[#1a1a2e]">
              <svg viewBox="0 0 48 48" className="w-16 h-16 text-violet-500/60" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path strokeWidth="2.5" strokeOpacity="0.4" d="M8 20 C8 11.163 15.163 4 24 4 C32.837 4 40 11.163 40 20" />
                <path strokeWidth="2.5" strokeOpacity="0.5" d="M13 25 C13 19.477 18.477 14 24 14 C29.523 14 35 19.477 35 25" />
                <path strokeWidth="2.5" d="M18 30 C18 26.686 20.686 24 24 24 C27.314 24 30 26.686 30 30" />
                <circle cx="24" cy="38" r="3" fill="currentColor" strokeWidth="0" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black tracking-tight">NOVA</h1>
            <p className="text-slate-300 text-base">Warehouse voice picking trainer</p>
            <p className="text-slate-500 text-sm">Fully automatic — just like Siri</p>
          </div>

          {/* NOVA ID field */}
          <div className="w-full max-w-md space-y-3">
            <input
              value={novaIdInput}
              onChange={(e) => { setNovaIdInput(e.target.value); setEntryError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleEnterNova()}
              placeholder="NOVA-XXXXX"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center text-lg font-semibold tracking-widest uppercase text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition"
              autoComplete="off"
              spellCheck={false}
            />
            {entryError && (
              <p className="text-sm font-semibold text-red-300 text-center">{entryError}</p>
            )}
            <button
              onClick={handleEnterNova}
              className="w-full py-5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold text-lg tracking-wide transition-all duration-200 shadow-[0_0_30px_rgba(139,92,246,0.35)]"
            >
              Start Session
            </button>
            <p className="text-center text-xs text-slate-600">
              Your NOVA ID is given to you by your trainer after registration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-3 py-5 sm:px-6 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
          <div>
            <p className="text-yellow-400 text-xs sm:text-sm font-semibold uppercase tracking-[0.22em]">{t("novaTrainer.label")}</p>
            <h1 className="mt-1 sm:mt-2 text-2xl sm:text-4xl font-black">{t("novaTrainer.heading")}</h1>
            <p className="mt-1 sm:mt-2 text-slate-400 text-sm sm:text-base max-w-3xl">
              {t("novaTrainer.subtitle")}
            </p>
            {/* Active session pill */}
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-bold text-white">{matchedSelector.novaId}</span>
              <span className="text-slate-400 text-sm">·</span>
              <span className="text-sm text-slate-300 capitalize">{matchedSelector.name}</span>
              <button
                onClick={() => {
                  setMatchedSelector(null);
                  setNovaIdInput("");
                  setEntryError("");
                  resetSession();
                }}
                className="ml-1 text-xs text-slate-500 hover:text-red-300 font-semibold transition"
                title="Change session"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {!sessionStarted ? (
              <button
                onClick={startNova}
                className="rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition"
              >
                {t("novaTrainer.startNova")}
              </button>
            ) : (
              <>
                <button
                  onClick={() => voice.startListening()}
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold hover:border-yellow-400 transition"
                >
                  {t("novaTrainer.listenNow")}
                </button>
                <button
                  onClick={resetSession}
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold hover:border-red-400 transition"
                >
                  {t("novaTrainer.resetSession")}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mic error */}
        {voice.error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="font-bold text-red-300">{t("novaTrainer.micError")}</p>
            <p className="mt-2 text-red-200">{voice.error}</p>
            <button
              onClick={retryMic}
              className="mt-4 rounded-2xl bg-yellow-400 px-5 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition"
            >
              {t("novaTrainer.retryMic")}
            </button>
          </div>
        ) : null}

        {/* Selector switcher — only shown to trainers/supervisors */}
        {currentUser?.role !== "selector" && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-lg flex flex-wrap items-center gap-4">
            <p className="text-sm text-slate-400 font-semibold">{t("novaTrainer.selectorId")}</p>
            {selectorAccounts.length > 0 ? (
              <select
                value={selectorUsername}
                onChange={(e) => setSelectorUsername(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
              >
                {selectorAccounts.map((acc) => (
                  <option key={acc.id} value={acc.username}>{acc.username}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  value={selectorUsername}
                  onChange={(e) => setSelectorUsername(e.target.value)}
                  placeholder="Enter selector username"
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none w-52"
                />
                <span className="text-xs text-slate-500">No selectors registered yet — type a username manually</span>
              </div>
            )}
          </div>
        )}

        {/* ── Selector clean view (hidden debug, just NOVA voice) ────────────── */}
        {currentUser?.role === "selector" && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
                  {t("novaTrainer.label")}
                </p>
                <p className="mt-1 text-lg font-bold text-white">
                  {currentUser.fullName} · <span className="text-yellow-400">{currentUser.username}</span>
                </p>
              </div>
              <VoiceStateBadge voice={voice} labels={voiceLabels} />
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-6 min-h-[120px] flex items-center">
              <p className="text-2xl font-bold text-white leading-snug">{promptText}</p>
            </div>

            {voice.lastHeard && (
              <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3">
                <p className="text-xs text-slate-400 mb-1">{t("novaTrainer.heardResponse")}</p>
                <p className="font-semibold text-blue-200">{voice.lastHeard}</p>
              </div>
            )}
          </div>
        )}

        {/* Top stats + main layout — trainer/supervisor/owner only */}
        {currentUser?.role !== "selector" && (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <StatCard label={t("novaTrainer.phase")} value={phase} tone="accent" />
          <StatCard label={t("novaTrainer.selector")} value={selectorUsername} />
          <StatCard label={t("novaTrainer.assignment")} value={activeAssignment ? `#${activeAssignment.assignmentNumber}` : "—"} />
          <StatCard label={t("novaTrainer.currentStop")} value={currentStop ? `${currentStop.stopOrder}` : "—"} />
          <StatCard
            label={t("novaTrainer.voiceState")}
            value={voice.listening ? t("novaTrainer.listening") : voice.speaking ? t("novaTrainer.speaking") : voice.processing ? t("novaTrainer.processing") : t("novaTrainer.idle")}
            tone={voice.listening ? "success" : voice.error ? "danger" : "accent"}
          />
          <StatCard label={t("novaTrainer.invalidCount")} value={invalidCount} tone={invalidCount > 0 ? "danger" : "default"} />
        </div>

        {/* Main layout */}
        <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-6">

          {/* Left column */}
          <div className="space-y-5 sm:space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl sm:text-2xl font-bold">{t("novaTrainer.currentPrompt")}</h2>
                <VoiceStateBadge voice={voice} labels={voiceLabels} />
              </div>

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-lg font-semibold text-white">{promptText}</p>
              </div>

              <div className="mt-5 grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">{t("novaTrainer.heardResponse")}</p>
                  <p className="mt-2 font-semibold text-white">{voice.lastHeard || "—"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">{t("novaTrainer.micPermission")}</p>
                  <p className="mt-2 font-semibold text-white capitalize">{voice.micPermission}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
              <h2 className="text-2xl font-bold">{t("novaTrainer.liveSessionData")}</h2>
              <div className="mt-5 grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">{t("novaTrainer.equipmentId")}</p>
                  <p className="mt-2 font-semibold">{equipmentId || "—"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">{t("novaTrainer.maxPalletCount")}</p>
                  <p className="mt-2 font-semibold">{maxPalletCount || "—"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">{t("novaTrainer.currentAisle")}</p>
                  <p className="mt-2 font-semibold">{currentStop?.aisle ?? "—"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">{t("novaTrainer.currentSlot")}</p>
                  <p className="mt-2 font-semibold">{currentStop?.slot ?? "—"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">{t("novaTrainer.nextStop")}</p>
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
              <h2 className="text-2xl font-bold">{t("novaTrainer.commandLog")}</h2>
              <div className="mt-5 max-h-[420px] overflow-auto space-y-3">
                {commandLog.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-400">{t("novaTrainer.noCommands")}</div>
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
        </> )} {/* end trainer-only block */}

      </div>
    </div>
  );
}
