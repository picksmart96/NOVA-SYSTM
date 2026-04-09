import { useEffect, useMemo, useRef, useState } from "react";
import { useVoiceEngine } from "@/hooks/useVoiceEngine";
import { matchCommand } from "@/lib/novaCommandMatcher";

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
  autoAdvance?: boolean;
  autoAdvanceDelayMs?: number;
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

  // Ref-safe speaking state — readable from any closure without staleness
  const isSpeakingRef = useRef(false);
  // Queued prompt to speak once current TTS finishes
  const pendingPromptRef = useRef("");
  // When set, fires __AUTO_NEXT__ after TTS ends instead of checking the queue
  const autoAdvancePendingRef = useRef<{ delayMs: number } | null>(null);
  // Stable ref to the speak-with-queue function (updated every effect)
  const speakPromptRef = useRef<(text: string) => void>(() => {});
  // Stable ref to sendInput (avoids closure staleness in onmessage)
  const sendInputRef = useRef<(text: string) => void>(() => {});
  // Stable ref to voice.speak (always latest) — typed explicitly to avoid forward-ref issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const voiceSpeakRef = useRef<((text: string, opts?: any) => void) | null>(null);

  const [connected, setConnected] = useState(false);
  const [started, setStarted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [heardResponse, setHeardResponse] = useState("");
  const [trainerState, setTrainerState] = useState<TrainerState>(DEFAULT_STATE);

  const voice = useVoiceEngine({
    onHeard: async (_heard: string, raw: string) => {
      const text = raw || _heard;
      const command = matchCommand(text);
      const normalized = command ?? text;
      setHeardResponse(text);
      sendInputRef.current(normalized);
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

  // Keep voiceSpeakRef current — always latest voice.speak, no stale closures
  useEffect(() => { voiceSpeakRef.current = voice.speak; });

  // Keep isSpeakingRef in sync with React state
  useEffect(() => { isSpeakingRef.current = voice.speaking; }, [voice.speaking]);

  // Build the speak-with-queue helper — uses refs so onmessage closures are never stale
  useEffect(() => {
    speakPromptRef.current = (text: string) => {
      isSpeakingRef.current = true;
      voiceSpeakRef.current?.(text, {
        after: "active",
        onEnd: () => {
          isSpeakingRef.current = false;
          // If auto-advance is pending, fire __AUTO_NEXT__ after the delay
          const advance = autoAdvancePendingRef.current;
          if (advance) {
            autoAdvancePendingRef.current = null;
            setTimeout(() => {
              sendInputRef.current("__AUTO_NEXT__");
            }, advance.delayMs);
            return;
          }
          // Otherwise drain the queued prompt (normal flow)
          const queued = pendingPromptRef.current;
          if (queued) {
            pendingPromptRef.current = "";
            speakPromptRef.current(queued);
          }
        },
      });
    };
  });

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
            // Auto-skip WAIT_WAKE when autoStart — no TTS is playing so this is safe
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
            const autoAdvance = msg.state.autoAdvance ?? false;
            const autoAdvanceDelayMs = msg.state.autoAdvanceDelayMs ?? 500;

            if (startedRef.current && newPrompt && newPrompt !== lastSpokenPromptRef.current) {
              lastSpokenPromptRef.current = newPrompt;
              // Prime auto-advance before speaking so onEnd can fire it
              if (autoAdvance) {
                autoAdvancePendingRef.current = { delayMs: autoAdvanceDelayMs };
              }
              // Use ref-based speaking check — never stale inside this closure
              if (isSpeakingRef.current) {
                // Queue it — speakPromptRef.onEnd will pick it up automatically
                pendingPromptRef.current = newPrompt;
              } else {
                speakPromptRef.current(newPrompt);
              }
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

  // Keep sendInputRef always current so onHeard closure never goes stale
  useEffect(() => { sendInputRef.current = sendInput; });

  const startSession = async () => {
    const ok = await voice.initialize();
    if (!ok) return;

    startedRef.current = true;
    setStarted(true);

    // Reset queues on fresh start
    pendingPromptRef.current = "";
    isSpeakingRef.current = false;

    if (!initializedRef.current) {
      initializedRef.current = true;
      connectSocket();
    } else if (!connected) {
      connectSocket();
    }

    setTimeout(() => {
      requestState();
      // When autoStart is true the session skips WAIT_WAKE entirely —
      // no intro speech needed and autoWoke will send "hey nova" once
      // the socket receives the WAIT_WAKE state (while nothing is speaking).
      if (!autoStart) {
        voice.speak('Say "Hey NOVA" to begin.');
      }
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
    pendingPromptRef.current = "";
    isSpeakingRef.current = false;
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
              voice.speaking
                ? "border border-yellow-400/30 bg-yellow-400/5"
                : voice.thinking
                ? "border border-slate-600 bg-slate-900"
                : "border border-red-500/50 bg-red-500/10"
            }`}>
              <div className="flex items-center gap-3">
                {/* Pulsing dot when recording */}
                {!voice.speaking && !voice.thinking && (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                )}
                <span className="text-lg">
                  {voice.speaking ? "🔊" : voice.thinking ? "⏳" : "🎙️"}
                </span>
                <span className={`text-sm font-bold ${
                  voice.speaking ? "text-yellow-300"
                  : voice.thinking ? "text-slate-400"
                  : "text-red-300"
                }`}>
                  {voice.speaking
                    ? "NOVA is speaking…"
                    : voice.thinking
                    ? "Processing your response…"
                    : "Recording — speak now, pause when done"}
                </span>
              </div>
              {/* Live volume bar — always visible while mic is active */}
              {!voice.speaking && !voice.thinking && (
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-400 transition-all duration-75"
                    style={{ width: `${Math.min(100, (voice.volume ?? 0) * 5)}%` }}
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-slate-600">Stop speaking for ~1.5 seconds and NOVA will respond</p>
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
