import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ASSIGNMENTS } from "@/data/assignments";
import { getStopsForAssignment } from "@/data/assignmentStops";
import { SYSTEM_DEFAULTS } from "@/data/systemDefaults";
import { useVoiceEngine } from "@/hooks/useVoiceEngine";
import { useAssignmentRunner } from "@/hooks/useAssignmentRunner";
import { useAppStore } from "@/lib/store";
import { useTrainerStore } from "@/lib/trainerStore";
import {
  Headphones, Play, RotateCcw, ChevronRight, Mic,
  Clock, Activity, Package, AlertTriangle, CheckCircle2, Box, User, Lock
} from "lucide-react";

type VoiceModeOption = "training" | "production" | "ultra_fast";

export default function NovaTrainerPage() {
  const { userId } = useAppStore();
  const { selectors } = useTrainerStore();

  const [selectedSelectorId, setSelectedSelectorId] = useState<string>("");
  const selectedSelector = selectors.find(s => String(s.id) === selectedSelectorId) ?? null;
  const selectedAssignmentId = selectedSelector?.assignedAssignmentId ?? null;
  const hasAssignment = !!selectedAssignmentId;
  const [voiceMode, setVoiceMode] = useState<VoiceModeOption>("training");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const assignment = (selectedAssignmentId ? ASSIGNMENTS.find(a => a.id === selectedAssignmentId) : null) ?? ASSIGNMENTS[0];
  const allStops = selectedAssignmentId ? getStopsForAssignment(selectedAssignmentId) : [];

  const { transcript, isSpeaking, speak, stop } = useVoiceEngine();
  const runner = useAssignmentRunner();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (runner.runnerState !== 'idle' && runner.runnerState !== 'completed') {
      timerRef.current = setInterval(() => {
        runner.setElapsedSeconds(s => s + 1);
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [runner.runnerState]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const currentStop = allStops[runner.currentStopIndex];
  const nextStop = allStops[runner.currentStopIndex + 1];
  const progress = runner.progressPercent(allStops);

  const handleStart = () => {
    runner.start(assignment, allStops);
    speak(
      `Assignment ${assignment.assignmentNumber}. Start aisle ${assignment.startAisle}. End aisle ${assignment.endAisle}. ` +
      `Total cases ${assignment.totalCases}. Total pallets ${assignment.totalPallets}. ` +
      `Goal time ${assignment.goalTimeMinutes} minutes. Say ready to begin.`
    );
  };

  const handleAdvance = () => {
    if (isSpeaking) return;
    if (runner.runnerState === 'intro') {
      runner.advance(assignment, allStops);
      speak("Position Alpha pallet. Get CHEP pallet from stack. Say ready when set.");
    } else if (runner.runnerState === 'pallet_alpha') {
      runner.advance(assignment, allStops);
      if (assignment.totalPallets > 1) {
        speak("Position Bravo pallet. Say ready when set.");
      } else {
        speak(`${allStops[0]?.aisle ?? ''} ${allStops[0]?.slot ?? ''} check.`);
      }
    } else if (runner.runnerState === 'pallet_bravo') {
      runner.advance(assignment, allStops);
      if (allStops[0]) speak(`${allStops[0].aisle} ${allStops[0].slot} check.`);
    } else if (runner.runnerState === 'outro') {
      runner.advance(assignment, allStops);
      speak("Assignment complete. Good work.");
    }
  };

  const handleCheckCode = () => {
    if (!currentStop || isSpeaking) return;
    const result = runner.submitCode(codeInput, currentStop, allStops);
    setCodeInput("");
    if (result === "correct") {
      setCodeError(false);
      speak(`Confirmed. Grab ${currentStop.qty}.`);
      setTimeout(() => {
        // transition to confirm_qty handled via runnerState
      }, 0);
    } else {
      setCodeError(true);
      speak(`Invalid. ${codeInput}. ${currentStop.aisle} ${currentStop.slot} check.`);
    }
  };

  const handleConfirmQty = () => {
    if (isSpeaking) return;
    runner.confirmQty(assignment, allStops);
    const nextIdx = runner.currentStopIndex + 1;
    if (nextIdx < allStops.length) {
      const next = allStops[nextIdx];
      speak(`${next.aisle} ${next.slot} check.`);
    } else {
      speak(
        `Last case complete. Proceed to printer ${SYSTEM_DEFAULTS.printerNumber}. ` +
        `Apply label ${SYSTEM_DEFAULTS.alphaLabelNumber} to pallet Alpha. ` +
        `Apply label ${SYSTEM_DEFAULTS.bravoLabelNumber} to pallet Bravo. ` +
        `Deliver to door ${assignment.doorNumber}. Say ready to complete.`
      );
    }
  };

  const handleReset = () => {
    stop();
    runner.reset();
    setCodeInput("");
    setCodeError(false);
  };

  const paceStatus = (() => {
    const goalSecs = assignment.goalTimeMinutes * 60;
    if (progress === 0) return null;
    const expectedProgress = Math.min(100, (runner.elapsedSeconds / goalSecs) * 100);
    const diff = progress - expectedProgress;
    if (diff > 5) return { label: "AHEAD", color: "text-green-400" };
    if (diff < -5) return { label: "BEHIND", color: "text-red-400" };
    return { label: "ON PACE", color: "text-yellow-400" };
  })();

  const performancePercent = (() => {
    if (runner.elapsedSeconds < 10 || progress === 0) return null;
    const goalSecs = assignment.goalTimeMinutes * 60;
    const expectedProgress = (runner.elapsedSeconds / goalSecs) * 100;
    return Math.round((progress / Math.max(1, expectedProgress)) * 100);
  })();

  const isIdle = runner.runnerState === 'idle';
  const isCompleted = runner.runnerState === 'completed';
  const isPicking = runner.runnerState === 'picking' || runner.runnerState === 'wrong_code';
  const isConfirmQty = runner.runnerState === 'confirm_qty';

  return (
    <div className="min-h-screen bg-[#080e17] text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-400 rounded-lg">
            <Headphones className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">NOVA Trainer</h1>
            <p className="text-xs text-slate-400">Voice-Directed Picking Simulator</p>
          </div>
        </div>
        {!isIdle && !isCompleted && (
          <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:border-yellow-400 hover:text-white text-sm transition">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid xl:grid-cols-3 gap-8">
        {/* Left: Controls */}
        <div className="xl:col-span-1 space-y-6">

          {/* Selector Picker */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <User className="h-4 w-4" /> Selector
            </h2>
            {selectors.length === 0 ? (
              <p className="text-slate-500 text-sm">No selectors registered. Add one in the Trainer Dashboard.</p>
            ) : (
              <select
                disabled={!isIdle}
                value={selectedSelectorId}
                onChange={e => { setSelectedSelectorId(e.target.value); runner.reset(); }}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 text-white px-4 py-3 text-sm font-mono focus:outline-none focus:border-yellow-400 disabled:opacity-50"
              >
                <option value="">— Choose selector —</option>
                {selectors.map(s => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name} ({s.novaId})
                  </option>
                ))}
              </select>
            )}

            {selectedSelector && (
              <div className="mt-3">
                {hasAssignment ? (
                  <div className="rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm">
                    <p className="text-green-300 font-bold">Assignment #{assignment.assignmentNumber}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{assignment.type} · {assignment.totalCases} cases · Aisles {assignment.startAisle}–{assignment.endAisle}</p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm flex items-start gap-2">
                    <Lock className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-red-300 font-bold">No assignment assigned</p>
                      <p className="text-slate-400 text-xs mt-0.5">A trainer must assign an assignment to this selector before starting a session.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Voice Mode */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Voice Mode</h2>
            <div className="space-y-2">
              {(["training", "production", "ultra_fast"] as VoiceModeOption[]).map(mode => (
                <button
                  key={mode}
                  disabled={!isIdle}
                  onClick={() => setVoiceMode(mode)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition disabled:opacity-50 ${
                    voiceMode === mode
                      ? "border-yellow-400 bg-yellow-400/10 text-yellow-300"
                      : "border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {mode === "training" ? "Training Mode" : mode === "production" ? "Production Mode" : "Ultra-Fast Mode"}
                </button>
              ))}
            </div>
          </div>

          {/* Assignment Summary */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Assignment Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Assignment</span><span className="font-mono text-white">#{assignment.assignmentNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Aisles</span><span className="font-mono text-white">{assignment.startAisle} → {assignment.endAisle}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Total Cases</span><span className="font-mono text-white">{assignment.totalCases}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Pallets</span><span className="font-mono text-white">{assignment.totalPallets}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Goal Time</span><span className="font-mono text-white">{assignment.goalTimeMinutes}m</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Stops</span><span className="font-mono text-white">{allStops.length}</span></div>
              <div className="border-t border-slate-800 pt-3 flex justify-between"><span className="text-slate-400">Printer</span><span className="font-mono text-yellow-400">{SYSTEM_DEFAULTS.printerNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Alpha Label</span><span className="font-mono text-yellow-400">{SYSTEM_DEFAULTS.alphaLabelNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Bravo Label</span><span className="font-mono text-yellow-400">{SYSTEM_DEFAULTS.bravoLabelNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Door</span><span className="font-mono text-yellow-400">{assignment.doorNumber}</span></div>
            </div>
          </div>
        </div>

        {/* Right: Voice Panel */}
        <div className="xl:col-span-2 space-y-6">

          {/* NOVA Orb + Transcript */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 flex flex-col items-center">
            {/* Orb */}
            <div className="relative flex items-center justify-center h-40 w-40 mb-6">
              {isSpeaking && (
                <>
                  <div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping" style={{ animationDuration: "1.4s" }} />
                  <div className="absolute inset-[-16px] rounded-full bg-yellow-400/10 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.3s" }} />
                </>
              )}
              <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${isSpeaking ? "bg-yellow-400 scale-105 shadow-yellow-400/40" : "bg-slate-800 border-2 border-slate-700"}`}>
                <Headphones className={`h-12 w-12 ${isSpeaking ? "text-slate-950" : "text-slate-500"}`} />
              </div>
            </div>

            {/* Transcript */}
            <div className="w-full min-h-[80px] flex items-center justify-center text-center px-4 mb-6">
              {transcript ? (
                <p className={`text-xl md:text-2xl font-medium leading-relaxed transition-all ${isSpeaking ? "text-white" : "text-slate-500"}`}>
                  "{transcript}"
                </p>
              ) : (
                <p className="text-slate-600 text-lg">NOVA is ready.</p>
              )}
            </div>

            {/* Action zone */}
            {isIdle && !selectedSelector && (
              <div className="text-center text-slate-500 text-sm">
                <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Choose a selector on the left to begin.
              </div>
            )}

            {isIdle && selectedSelector && !hasAssignment && (
              <div className="text-center">
                <Lock className="h-10 w-10 mx-auto mb-3 text-red-400 opacity-80" />
                <p className="text-red-300 font-bold mb-1">Session Locked</p>
                <p className="text-slate-500 text-sm">Go to the Trainer Dashboard and assign an assignment to <span className="text-white font-semibold capitalize">{selectedSelector.name}</span> first.</p>
              </div>
            )}

            {isIdle && selectedSelector && hasAssignment && (
              <button
                onClick={handleStart}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-yellow-400 text-slate-950 font-black text-lg hover:bg-yellow-300 transition shadow-lg shadow-yellow-400/20"
              >
                <Play className="h-6 w-6" /> Start Session
              </button>
            )}

            {isCompleted && (
              <div className="text-center">
                <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <p className="text-2xl font-black text-white mb-2">Session Complete</p>
                <p className="text-slate-400 mb-6">Assignment {assignment.assignmentNumber} finished.</p>
                <button onClick={handleReset} className="px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold hover:border-yellow-400 transition">
                  Run Another
                </button>
              </div>
            )}

            {!isIdle && !isCompleted && !isPicking && !isConfirmQty && (
              <button
                onClick={handleAdvance}
                disabled={isSpeaking}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-800 text-white font-bold text-lg border border-slate-700 hover:border-yellow-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Mic className="h-5 w-5 text-yellow-400" /> Say "READY"
              </button>
            )}

            {isConfirmQty && (
              <div className="w-full text-center">
                <div className="inline-block rounded-2xl bg-yellow-400/10 border border-yellow-400/30 px-10 py-6 mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-yellow-400/70 mb-2">Grab Quantity</p>
                  <p className="text-6xl font-black text-yellow-400">{currentStop?.qty}</p>
                </div>
                <br />
                <button
                  onClick={handleConfirmQty}
                  disabled={isSpeaking}
                  className="flex items-center gap-2 mx-auto px-8 py-4 rounded-2xl bg-yellow-400 text-slate-950 font-black text-lg hover:bg-yellow-300 transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Mic className="h-5 w-5" /> READY
                </button>
              </div>
            )}

            {isPicking && (
              <div className="w-full max-w-sm">
                <div className="text-center mb-5">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Current Location</p>
                  <p className="text-5xl font-black text-white">{currentStop?.aisle ?? "—"} – {currentStop?.slot ?? "—"}</p>
                </div>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={codeInput}
                    onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeError(false); }}
                    onKeyDown={e => e.key === "Enter" && handleCheckCode()}
                    disabled={isSpeaking}
                    maxLength={6}
                    placeholder="Check Code"
                    className={`flex-1 bg-slate-950 border rounded-xl px-4 py-3 text-white font-mono text-center text-xl uppercase placeholder:text-slate-600 focus:outline-none transition disabled:opacity-40 ${codeError ? "border-red-500 focus:border-red-400" : "border-slate-700 focus:border-yellow-400"}`}
                  />
                  <button
                    onClick={handleCheckCode}
                    disabled={!codeInput || isSpeaking}
                    className="px-5 py-3 rounded-xl bg-yellow-400 text-slate-950 font-black hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
                {codeError && !isSpeaking && (
                  <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                    <AlertTriangle className="h-4 w-4" /> Invalid check code. Try again.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* HUD: Live Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
              <Clock className="h-5 w-5 mx-auto text-slate-500 mb-2" />
              <p className="text-2xl font-black text-white font-mono">{formatTime(runner.elapsedSeconds)}</p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Elapsed</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
              <Activity className="h-5 w-5 mx-auto text-slate-500 mb-2" />
              <p className={`text-2xl font-black font-mono ${performancePercent && performancePercent >= 100 ? "text-green-400" : performancePercent && performancePercent >= 85 ? "text-yellow-400" : "text-slate-400"}`}>
                {performancePercent ? `${performancePercent}%` : "—"}
              </p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Performance</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
              <Package className="h-5 w-5 mx-auto text-slate-500 mb-2" />
              <p className="text-2xl font-black text-white">{progress}%</p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Progress</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
              <Box className="h-5 w-5 mx-auto text-slate-500 mb-2" />
              <p className={`text-xl font-black ${paceStatus?.color ?? "text-slate-500"}`}>{paceStatus?.label ?? "—"}</p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Pace</p>
            </div>
          </div>

          {/* Next Stop */}
          {nextStop && !isIdle && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex items-center gap-4">
              <Box className="h-5 w-5 text-slate-500 shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-0.5">Next Stop</p>
                <p className="font-mono font-bold text-white">Aisle {nextStop.aisle} — Slot {nextStop.slot}</p>
              </div>
            </div>
          )}

          {/* Voice Mode + Mode Chips */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Headphones className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-400">Voice Mode</span>
              <span className="px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-bold uppercase tracking-wider">
                {voiceMode.replace("_", " ")}
              </span>
            </div>
            <Link href="/nova/voice-commands" className="text-xs text-slate-500 hover:text-yellow-400 transition underline">
              Command Reference
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
