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


function buildWsUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/ws/nova-trainer`;
}

const DEFAULT_STATE: TrainerState = {
  phase: "WAIT_WAKE",
  prompt: "Connecting to NOVA…",
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
  autoStart = false,
}: {
  selector: Selector;
  onExit?: () => void;
  autoStart?: boolean;
}) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);
  const lastSpokenPromptRef = useRef("");
  const startedRef = useRef(false);
  const autoWokeRef = useRef(false);

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
    if (voice.pttRecording) return "Recording…";
    if (voice.thinking) return "Processing…";
    if (voice.listening) return "Listening";
    if (voice.pttMode) return "Tap to Talk";
    return "Idle";
  }, [serverError, voice.error, voice.speaking, voice.pttRecording, voice.thinking, voice.listening, voice.pttMode]);


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
            // Auto-skip WAIT_WAKE phase when autoStart is true
            if (autoStart && msg.state.phase === "WAIT_WAKE" && !autoWokeRef.current) {
              autoWokeRef.current = true;
              setTimeout(() => {
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({ type: "input", text: "hey nova" }));
                }
              }, 200);
              return;
            }

            setTrainerState((prev) => ({ ...prev, ...msg.state }));

            const newPrompt = msg.state.prompt ?? "";
            if (
              startedRef.current &&
              newPrompt &&
              newPrompt !== lastSpokenPromptRef.current &&
              !voice.speaking
            ) {
              lastSpokenPromptRef.current = newPrompt;
              voice.speak(newPrompt, { after: "active" });
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

  // Auto-launch session when autoStart is true (selector just logged in)
  useEffect(() => {
    if (autoStart) {
      startSession();
    }
    return () => {
      startedRef.current = false;
      try { wsRef.current?.close(); } catch {}
      try { voice.stopAll(); } catch {}
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const micIcon = voice.speaking
    ? "🔊"
    : voice.pttRecording
    ? "⏺"
    : voice.listening
    ? "🎙️"
    : voice.pttMode
    ? "👆"
    : "⏸";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* Thin top bar — only selector name + exit */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-yellow-400">{selector.novaId}</span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs text-slate-400">{selector.fullName ?? selector.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-base leading-none">{micIcon}</span>
          {!connected && (
            <span className="text-xs text-red-400">Offline</span>
          )}
          {onExit && (
            <button
              onClick={() => { resetSession(); onExit(); }}
              className="text-xs text-slate-500 hover:text-slate-300 transition"
            >
              Exit
            </button>
          )}
        </div>
      </div>

      {/* Error banners */}
      {(serverError || voice.error) && (
        <div className="mx-4 mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-red-300 text-xs">
          {serverError || voice.error}
        </div>
      )}

      {/* Main — NOVA prompt takes center stage */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6 max-w-xl mx-auto w-full">

        {/* Voice state pill */}
        <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold ${
          voice.speaking
            ? "bg-yellow-500/15 text-yellow-300"
            : voice.pttRecording
            ? "bg-red-500/20 text-red-300"
            : voice.listening
            ? "bg-green-500/15 text-green-300"
            : voice.pttMode
            ? "bg-blue-500/15 text-blue-300"
            : "bg-slate-800 text-slate-400"
        }`}>
          <span className="text-sm">{micIcon}</span>
          {voiceStateLabel}
        </div>

        {/* NOVA prompt */}
        <div className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl text-center">
          <p className="text-xs text-yellow-400 uppercase tracking-widest mb-3">NOVA</p>
          <p className="text-xl sm:text-2xl font-bold leading-snug">
            {trainerState.prompt}
          </p>
        </div>

        {/* Heard */}
        {heardResponse && (
          <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-3 text-center">
            <p className="text-xs text-slate-500 mb-1">You said</p>
            <p className="text-sm font-semibold text-slate-300">{heardResponse}</p>
          </div>
        )}

        {/* Auto-listening indicator — shown when VAD mode is active */}
        {voice.vadMode && started && (
          <div className="w-full flex flex-col items-center gap-3">
            <div className={`w-full rounded-3xl px-6 py-4 flex flex-col items-center gap-3 transition-all ${
              voice.pttRecording
                ? "border border-red-500/40 bg-red-500/10"
                : voice.speaking
                ? "border border-yellow-400/30 bg-yellow-400/5"
                : voice.thinking
                ? "border border-slate-700 bg-slate-900"
                : "border border-green-500/30 bg-green-500/5"
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {voice.pttRecording ? "⏺" : voice.speaking ? "🔊" : voice.thinking ? "⏳" : "🎙️"}
                </span>
                <span className={`text-sm font-bold ${
                  voice.pttRecording ? "text-red-300"
                  : voice.speaking ? "text-yellow-300"
                  : voice.thinking ? "text-slate-400"
                  : "text-green-300"
                }`}>
                  {voice.pttRecording
                    ? "Recording your response…"
                    : voice.speaking
                    ? "NOVA is speaking…"
                    : voice.thinking
                    ? "Processing…"
                    : "Listening — just speak"}
                </span>
              </div>
              {/* Volume bar */}
              {(voice.listening || voice.pttRecording) && (
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-75 ${voice.pttRecording ? "bg-red-400" : "bg-green-400"}`}
                    style={{ width: `${Math.min(100, (voice.volume ?? 0) * 3)}%` }}
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-slate-600">NOVA will hear you automatically — no button needed</p>
          </div>
        )}

        {/* Manual input — always visible */}
        <div className="w-full flex gap-2">
          <input
            id="nova-manual-input"
            type="text"
            placeholder="Type response and press Enter…"
            className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const el = e.currentTarget;
                const val = el.value.trim();
                if (val) { setHeardResponse(val); sendInput(val); el.value = ""; }
              }
            }}
          />
          <button
            onClick={() => {
              const el = document.getElementById("nova-manual-input") as HTMLInputElement | null;
              const val = el?.value.trim();
              if (val) { setHeardResponse(val); sendInput(val); if (el) el.value = ""; }
            }}
            className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-yellow-300 transition"
          >
            Send
          </button>
        </div>

      </div>

      {/* Scrollable log at bottom */}
      <div className="border-t border-slate-800/60 px-5 py-3 max-h-48 overflow-y-auto space-y-1">
        {trainerState.commandLog.length === 0 ? (
          <p className="text-xs text-slate-600 text-center py-2">Session log will appear here</p>
        ) : (
          trainerState.commandLog.map((entry) => (
            <div key={entry.id} className="flex gap-2 text-xs">
              <span className={`font-bold shrink-0 ${entry.type === "NOVA" ? "text-yellow-400" : "text-slate-400"}`}>
                {entry.type === "NOVA" ? "NOVA" : "YOU "}
              </span>
              <span className="text-slate-300">{entry.text}</span>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
