import { useEffect, useMemo, useRef, useState } from "react";
import { useVoiceEngine } from "@/hooks/useVoiceEngine";

interface Selector {
  userId: string;
  novaId: string;
  name?: string;
  fullName?: string;
}

interface ServerStop {
  stopOrder: number;
  aisle: number;
  slot: number;
  checkCode: string;
  qty: number;
}

interface ServerAssignment {
  id: string;
  assignmentNumber: string;
  selectorUserId: string;
  startAisle: number;
  endAisle: number;
  totalCases: number;
  pallets: number;
  goalTimeMinutes: number;
  stops: number;
  doorNumber: number;
  doorCode: string;
  type: string;
}

interface TrainerState {
  phase: string;
  prompt: string;
  equipmentId: string;
  maxPalletCount: string;
  failedSafetyItem: string;
  activeAssignment: ServerAssignment | null;
  currentStop: ServerStop | null;
  nextStop: ServerStop | null;
  invalidCount: number;
  commandLog: { id: number; type: string; text: string; at: string }[];
  defaults: { printerNumber: string; alphaLabelNumber: string; bravoLabelNumber: string };
}

function StatCard({ label, value, tone = "default" }: { label: string; value: string | number; tone?: string }) {
  const toneClass =
    tone === "success" ? "text-green-300" :
    tone === "danger"  ? "text-red-300" :
    tone === "accent"  ? "text-yellow-300" :
    "text-white";

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-lg">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-2 text-xl font-black break-words ${toneClass}`}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold break-words">{value}</p>
    </div>
  );
}

function buildWsUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/ws/nova-trainer`;
}

const DEFAULT_STATE: TrainerState = {
  phase: "WAIT_WAKE",
  prompt: 'Tap "Start Session" then say "Hey NOVA".',
  equipmentId: "",
  maxPalletCount: "2",
  failedSafetyItem: "",
  activeAssignment: null,
  currentStop: null,
  nextStop: null,
  invalidCount: 0,
  commandLog: [],
  defaults: { printerNumber: "307", alphaLabelNumber: "242", bravoLabelNumber: "578" },
};

export default function NovaTrainerSession({
  selector,
  onExit,
}: {
  selector: Selector;
  onExit?: () => void;
}) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);
  const lastSpokenPromptRef = useRef("");
  const startedRef = useRef(false);

  const [connected, setConnected] = useState(false);
  const [started, setStarted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [heardResponse, setHeardResponse] = useState("");
  const [trainerState, setTrainerState] = useState<TrainerState>(DEFAULT_STATE);

  const voice = useVoiceEngine({
    onHeard: async (_heard: string, raw: string) => {
      const text = raw || _heard;
      setHeardResponse(text);
      sendInput(text);
    },
  });

  const voiceStateLabel = useMemo(() => {
    if (serverError || voice.error) return "Error";
    if (voice.speaking) return "Speaking";
    if (voice.listening) return "Listening";
    return "Idle";
  }, [serverError, voice.error, voice.speaking, voice.listening]);

  const progressPercent = useMemo(() => {
    const { activeAssignment, currentStop } = trainerState;
    if (!activeAssignment || !currentStop) return "—";
    const total = Number(activeAssignment.stops ?? 0);
    const current = Number(currentStop.stopOrder ?? 0);
    if (!total || !current) return "—";
    return `${Math.round((current / total) * 100)}%`;
  }, [trainerState]);

  const connectSocket = () => {
    try {
      const ws = new WebSocket(buildWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setServerError("");
        ws.send(
          JSON.stringify({
            type: "init",
            selector: {
              userId: selector.userId,
              novaId: selector.novaId,
              fullName: selector.fullName ?? selector.name ?? "",
            },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { type: string; state?: TrainerState; error?: string };

          if (msg.type === "error") {
            setServerError(msg.error ?? "Server error.");
            return;
          }

          if (msg.type === "state" && msg.state) {
            setTrainerState((prev) => ({ ...prev, ...msg.state }));

            const newPrompt = msg.state.prompt ?? "";
            if (
              startedRef.current &&
              newPrompt &&
              newPrompt !== lastSpokenPromptRef.current &&
              !voice.speaking
            ) {
              lastSpokenPromptRef.current = newPrompt;
              voice.speak(newPrompt);
            }
          }
        } catch {
          setServerError("Failed to read server message.");
        }
      };

      ws.onerror = () => {
        setServerError("Realtime trainer connection error.");
      };

      ws.onclose = () => {
        setConnected(false);
        if (startedRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            connectSocket();
          }, 1500);
        }
      };
    } catch {
      setServerError("Unable to connect to realtime trainer.");
    }
  };

  const requestState = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "get_state" }));
    }
  };

  const sendInput = (text: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      setServerError("Trainer connection is not ready. Please retry.");
      return;
    }
    wsRef.current.send(JSON.stringify({ type: "input", text }));
  };

  const startSession = async () => {
    const ok = await voice.initialize();
    if (!ok) return;

    startedRef.current = true;
    setStarted(true);

    if (!initializedRef.current) {
      initializedRef.current = true;
      connectSocket();
    } else if (!connected) {
      connectSocket();
    }

    setTimeout(() => {
      requestState();
      voice.speak('Say "Hey NOVA" to begin.');
    }, 400);
  };

  const retryMic = async () => {
    const ok = await voice.retryMic();
    if (!ok) return;
    if (!connected) {
      connectSocket();
      setTimeout(() => requestState(), 400);
    } else {
      requestState();
    }
  };

  const resetSession = () => {
    voice.stopAll();
    startedRef.current = false;
    setStarted(false);
    setHeardResponse("");
    lastSpokenPromptRef.current = "";
    setTrainerState(DEFAULT_STATE);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    initializedRef.current = false;
    setConnected(false);
  };

  useEffect(() => {
    return () => {
      startedRef.current = false;
      try { wsRef.current?.close(); } catch {}
      try { voice.stopAll(); } catch {}
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { activeAssignment, currentStop, nextStop, defaults } = trainerState;

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
          <div>
            <p className="text-yellow-400 text-xs uppercase tracking-widest">NOVA Trainer</p>
            <h1 className="text-2xl sm:text-3xl font-black">ES3 Script Mode</h1>
            <p className="text-slate-400 text-sm">Server-driven voice workflow</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={startSession}
              className="rounded-2xl bg-yellow-400 px-5 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition"
            >
              {started ? "Restart" : "Start Session"}
            </button>

            <button
              onClick={retryMic}
              className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold hover:border-yellow-400 transition"
            >
              Retry Mic
            </button>

            <button
              onClick={resetSession}
              className="rounded-2xl border border-red-500/30 bg-slate-900 px-5 py-3 font-semibold text-red-300 hover:bg-red-500/10 transition"
            >
              Reset
            </button>

            {onExit && (
              <button
                onClick={onExit}
                className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold hover:border-yellow-400 transition"
              >
                Exit
              </button>
            )}
          </div>
        </div>

        {/* Selector bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-3xl border border-slate-800 bg-slate-900 px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold text-yellow-300">
              {selector.novaId}
            </span>
            <span className="font-semibold">
              {selector.fullName ?? selector.name ?? "Selector"}
            </span>
          </div>
          <div className="text-sm text-slate-400">
            User ID: {selector.userId}
          </div>
        </div>

        {/* Errors */}
        {serverError && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="font-bold text-red-300">Connection Error</p>
            <p className="mt-1 text-red-200 text-sm">{serverError}</p>
          </div>
        )}

        {voice.error && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="font-bold text-red-300">Voice Error</p>
            <p className="mt-1 text-red-200 text-sm">{voice.error}</p>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-3">
          <StatCard label="Phase" value={trainerState.phase} tone="accent" />
          <StatCard
            label="Assignment"
            value={activeAssignment ? `#${activeAssignment.assignmentNumber}` : "—"}
          />
          <StatCard
            label="Stop"
            value={currentStop ? `${currentStop.stopOrder}/${activeAssignment?.stops ?? "—"}` : "—"}
          />
          <StatCard label="Voice" value={voiceStateLabel} tone="success" />
          <StatCard
            label="Errors"
            value={trainerState.invalidCount ?? 0}
            tone={(trainerState.invalidCount ?? 0) > 0 ? "danger" : "default"}
          />
          <StatCard label="Progress" value={progressPercent} tone="accent" />
          <StatCard
            label="Socket"
            value={connected ? "Live" : "Offline"}
            tone={connected ? "success" : "danger"}
          />
        </div>

        {/* Main grid */}
        <div className="grid xl:grid-cols-[1.3fr_0.7fr] gap-5">

          {/* Left: prompt + live data */}
          <div className="space-y-5">

            {/* Current Prompt */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
              <h2 className="text-lg font-bold mb-4">Current Prompt</h2>
              <div className="rounded-2xl border border-yellow-500/20 bg-slate-950 p-5 text-lg font-semibold leading-relaxed min-h-[80px]">
                {trainerState.prompt}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <MiniStat label="Heard" value={heardResponse || "—"} />
                <MiniStat label="Mic" value={voice.micPermission ?? "—"} />
              </div>

              {/* Quick-type input (fallback for voice failures) */}
              <div className="mt-4 flex gap-2">
                <input
                  id="quick-input"
                  type="text"
                  placeholder='Type input (e.g. "hey nova", check code…)'
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none focus:border-yellow-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const el = e.currentTarget;
                      const val = el.value.trim();
                      if (val) {
                        setHeardResponse(val);
                        sendInput(val);
                        el.value = "";
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const el = document.getElementById("quick-input") as HTMLInputElement | null;
                    const val = el?.value.trim();
                    if (val) {
                      setHeardResponse(val);
                      sendInput(val);
                      if (el) el.value = "";
                    }
                  }}
                  className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-yellow-300 transition"
                >
                  Send
                </button>
              </div>
            </div>

            {/* Live data */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
              <h2 className="text-lg font-bold mb-4">Live Data</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <MiniStat label="Equipment" value={trainerState.equipmentId || "—"} />
                <MiniStat label="Max Pallets" value={trainerState.maxPalletCount || "2"} />
                <MiniStat label="Aisle" value={currentStop?.aisle ?? "—"} />
                <MiniStat label="Slot" value={currentStop?.slot ?? "—"} />
                <MiniStat label="Qty" value={currentStop?.qty ?? "—"} />
                <MiniStat
                  label="Next"
                  value={nextStop ? `${nextStop.aisle} / ${nextStop.slot}` : "—"}
                />
                <MiniStat label="Door" value={activeAssignment?.doorNumber ?? "—"} />
                <MiniStat label="Door Code" value={activeAssignment?.doorCode ?? "—"} />
                <MiniStat label="Type" value={activeAssignment?.type ?? "—"} />
                <MiniStat label="Cases" value={activeAssignment?.totalCases ?? "—"} />
                <MiniStat label="Printer" value={defaults.printerNumber} />
                <MiniStat
                  label="Labels"
                  value={`A:${defaults.alphaLabelNumber} B:${defaults.bravoLabelNumber}`}
                />
              </div>
            </div>

          </div>

          {/* Right: command log */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <h2 className="text-lg font-bold mb-4">Command Log</h2>
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {trainerState.commandLog.length === 0 ? (
                <p className="text-slate-500 text-sm">No commands yet.</p>
              ) : (
                trainerState.commandLog.map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded-xl px-3 py-2 text-xs ${
                      entry.type === "NOVA"
                        ? "border border-yellow-500/20 bg-yellow-500/5 text-yellow-200"
                        : "border border-slate-700 bg-slate-950 text-slate-300"
                    }`}
                  >
                    <span className="font-bold mr-2 opacity-60">
                      {entry.type === "NOVA" ? "NOVA" : "YOU"}
                    </span>
                    {entry.text}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Assignment info */}
        {activeAssignment && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-sm font-bold text-slate-400 mb-3">Active Assignment</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <MiniStat label="Number" value={activeAssignment.assignmentNumber} />
              <MiniStat label="Aisles" value={`${activeAssignment.startAisle}–${activeAssignment.endAisle}`} />
              <MiniStat label="Goal" value={`${activeAssignment.goalTimeMinutes} min`} />
              <MiniStat label="Pallets" value={activeAssignment.pallets} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
