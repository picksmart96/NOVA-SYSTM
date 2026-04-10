import { useEffect, useRef, useState, useCallback } from "react";
import DemoBanner from "@/components/DemoBanner";

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = "idle" | "listening" | "thinking" | "speaking";
interface LogEntry { role: "NOVA" | "YOU"; text: string; }

// ─── SpeechRecognition compat shim ────────────────────────────────────────────
function getSpeechRecognition(): typeof SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  return (
    (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition ||
    null
  );
}

// ─── TTS ─────────────────────────────────────────────────────────────────────
function speak(text: string, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) { onEnd?.(); return; }
  try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 1.05;
  u.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((v) => /samantha|aria|ava|zira|karen/i.test(v.name) && v.lang.startsWith("en"))
    || voices.find((v) => v.lang.startsWith("en"));
  if (preferred) u.voice = preferred;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
}

// ─── Animated NOVA Orb ────────────────────────────────────────────────────────
function NovaOrb({ phase }: { phase: Phase }) {
  const isListening = phase === "listening";
  const isThinking  = phase === "thinking";
  const isSpeaking  = phase === "speaking";
  const isActive    = isListening || isThinking || isSpeaking;

  return (
    <div className="relative flex items-center justify-center w-56 h-56 select-none">
      {/* Outer glow rings */}
      {isListening && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-yellow-400/20 animate-[ping_2s_ease-in-out_infinite]" />
          <div className="absolute inset-4 rounded-full border border-yellow-400/15 animate-[ping_2s_ease-in-out_0.6s_infinite]" />
        </>
      )}
      {isSpeaking && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-[ping_1.4s_ease-in-out_infinite]" />
          <div className="absolute inset-3 rounded-full border border-purple-400/20 animate-[ping_1.4s_ease-in-out_0.4s_infinite]" />
        </>
      )}
      {isThinking && (
        <div className="absolute inset-0 rounded-full border-2 border-blue-400/25 animate-[pulse_1.5s_ease-in-out_infinite]" />
      )}

      {/* Main orb */}
      <div className={`
        relative w-44 h-44 rounded-full flex flex-col items-center justify-center
        border-2 transition-all duration-500
        ${isListening ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_60px_rgba(250,204,21,0.35)]"
          : isSpeaking ? "border-purple-400 bg-purple-900/40 shadow-[0_0_60px_rgba(168,85,247,0.35)]"
          : isThinking ? "border-blue-400 bg-blue-900/30 shadow-[0_0_40px_rgba(96,165,250,0.3)]"
          : "border-slate-700 bg-slate-900/60 shadow-none"}
      `}>
        {/* N icon */}
        <span className={`text-5xl font-black leading-none transition-colors duration-300 ${
          isListening ? "text-yellow-400"
          : isSpeaking ? "text-purple-300"
          : isThinking ? "text-blue-300"
          : "text-slate-600"
        }`}>N</span>
        <span className={`text-xs font-bold tracking-[0.3em] mt-1 transition-colors duration-300 ${
          isActive ? "text-slate-300" : "text-slate-600"
        }`}>NOVA</span>
      </div>

      {/* Phase label under orb */}
      <div className={`absolute -bottom-7 text-xs font-semibold tracking-widest uppercase transition-all duration-300 ${
        isListening ? "text-yellow-400"
        : isSpeaking ? "text-purple-300"
        : isThinking ? "text-blue-300"
        : "text-slate-600"
      }`}>
        {isListening ? "Listening…"
          : isSpeaking ? "Speaking…"
          : isThinking ? "Thinking…"
          : "Tap to wake"}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DemoNovaHelpPage() {
  const [phase, setPhase]         = useState<Phase>("idle");
  const [started, setStarted]     = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [youSaid, setYouSaid]     = useState("");
  const [log, setLog]             = useState<LogEntry[]>([]);
  const [textInput, setTextInput] = useState("");
  const [noSpeechAPI]             = useState(() => !getSpeechRecognition());

  const recognitionRef  = useRef<SpeechRecognition | null>(null);
  const isSpeakingRef   = useRef(false);
  const isActiveRef     = useRef(false);
  const phaseRef        = useRef<Phase>("idle");

  const addLog = (role: "NOVA" | "YOU", text: string) =>
    setLog((prev) => [{ role, text }, ...prev].slice(0, 30));

  const setPhaseSync = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  // ── Ask the demo brain AI ─────────────────────────────────────────────────
  const askNova = useCallback(async (message: string) => {
    const q = message.trim();
    if (!q) return;

    addLog("YOU", q);
    setYouSaid(q);
    setCurrentText("");
    setPhaseSync("thinking");

    // Stop recognition while thinking/speaking
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }

    try {
      const res = await fetch("/api/nova-demo-brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, language: "en" }),
      });
      const data = (await res.json()) as { reply?: string };
      const reply = data.reply || "Ask me anything about NOVA, training, safety, or picking rate. Want me to go deeper, or show you how it works for your team?";

      setCurrentText(reply);
      addLog("NOVA", reply);
      setPhaseSync("speaking");
      isSpeakingRef.current = true;

      speak(reply, () => {
        isSpeakingRef.current = false;
        if (isActiveRef.current) {
          setPhaseSync("listening");
          startListeningLoop();
        }
      });
    } catch {
      const fallback = "I had a little trouble answering. Try asking again — I'm here to help. Want me to go deeper, or show you how it works for your team?";
      setCurrentText(fallback);
      addLog("NOVA", fallback);
      setPhaseSync("speaking");
      speak(fallback, () => {
        isSpeakingRef.current = false;
        if (isActiveRef.current) {
          setPhaseSync("listening");
          startListeningLoop();
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Continuous SpeechRecognition loop ─────────────────────────────────────
  const startListeningLoop = useCallback(() => {
    const RecognitionClass = getSpeechRecognition();
    if (!RecognitionClass || !isActiveRef.current) return;

    try { recognitionRef.current?.abort(); } catch { /* ignore */ }

    const rec = new RecognitionClass();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      if (isActiveRef.current && !isSpeakingRef.current) {
        setPhaseSync("listening");
      }
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[event.results.length - 1][0].transcript.trim();
      if (!text) return;

      const lower = text.toLowerCase();

      // Wake word — just acknowledge
      if ((lower.includes("hey nova") || lower === "nova") && lower.split(" ").length <= 3) {
        setYouSaid(text);
        setCurrentText("Yes! How can I help you?");
        setPhaseSync("speaking");
        isSpeakingRef.current = true;
        speak("Yes! How can I help you?", () => {
          isSpeakingRef.current = false;
          if (isActiveRef.current) {
            setPhaseSync("listening");
            startListeningLoop();
          }
        });
        return;
      }

      // Real question — send to AI
      askNova(text);
    };

    rec.onend = () => {
      // Auto-restart as long as session is active and not speaking/thinking
      if (isActiveRef.current && phaseRef.current === "listening") {
        setTimeout(() => {
          if (isActiveRef.current && phaseRef.current === "listening") {
            startListeningLoop();
          }
        }, 120);
      }
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "aborted" || e.error === "no-speech") {
        // Normal — restart
        if (isActiveRef.current && phaseRef.current === "listening") {
          setTimeout(() => startListeningLoop(), 300);
        }
      }
    };

    rec.start();
    recognitionRef.current = rec;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askNova]);

  // ── Start session ─────────────────────────────────────────────────────────
  const startSession = useCallback(() => {
    // iOS audio unlock: fire a near-silent TTS synchronously on tap
    try {
      window.speechSynthesis.cancel();
      const unlock = new SpeechSynthesisUtterance(" ");
      unlock.volume = 0.01;
      unlock.rate = 10;
      window.speechSynthesis.speak(unlock);
    } catch { /* older iOS */ }

    isActiveRef.current = true;
    setStarted(true);

    const greeting = "Hi, I'm NOVA. I'm here to help you understand how PickSmart Academy improves warehouse training. Just ask me anything.";
    setCurrentText(greeting);
    addLog("NOVA", greeting);
    setPhaseSync("speaking");
    isSpeakingRef.current = true;

    speak(greeting, () => {
      isSpeakingRef.current = false;
      if (isActiveRef.current) {
        setPhaseSync("listening");
        startListeningLoop();
      }
    });
  }, [startListeningLoop]);

  // ── Stop session ─────────────────────────────────────────────────────────
  const stopSession = useCallback(() => {
    isActiveRef.current = false;
    isSpeakingRef.current = false;
    try { recognitionRef.current?.abort(); } catch { /* ignore */ }
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    recognitionRef.current = null;
    setStarted(false);
    setPhaseSync("idle");
    setCurrentText("");
    setYouSaid("");
  }, []);

  // ── Text input fallback ───────────────────────────────────────────────────
  const handleTextSend = () => {
    const q = textInput.trim();
    if (!q) return;
    setTextInput("");
    if (!started) {
      isActiveRef.current = true;
      setStarted(true);
    }
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    try { recognitionRef.current?.abort(); } catch { /* ignore */ }
    askNova(q);
  };

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      try { recognitionRef.current?.abort(); } catch { /* ignore */ }
      try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    };
  }, []);

  // ─── Suggested questions ─────────────────────────────────────────────────
  const suggestions = [
    "How does NOVA improve picking rate?",
    "How does pallet building training work?",
    "How do you fix mispick mistakes?",
    "What ROI do warehouses see?",
    "How does the safety check work?",
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <DemoBanner />

      <div className="flex-1 flex flex-col items-center px-4 py-8 gap-8 max-w-xl mx-auto w-full">

        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest">PickSmart Academy</p>
          <h1 className="text-3xl font-black text-white">NOVA Voice Agent</h1>
          <p className="text-slate-400 text-sm">
            Ask anything about warehouse training, picking rate, safety, or NOVA
          </p>
        </div>

        {/* Orb */}
        <div className="py-4">
          <NovaOrb phase={phase} />
        </div>

        {/* Tap to start */}
        {!started ? (
          <button
            onClick={startSession}
            className="rounded-3xl bg-yellow-400 text-slate-950 font-black text-lg px-10 py-4 hover:bg-yellow-300 active:scale-95 transition-all shadow-[0_0_30px_rgba(250,204,21,0.3)]"
          >
            🎤 Tap to Start NOVA
          </button>
        ) : (
          <button
            onClick={stopSession}
            className="rounded-2xl border border-slate-700 bg-slate-900 text-slate-400 text-xs font-semibold px-5 py-2.5 hover:border-slate-500 hover:text-slate-300 transition"
          >
            Stop Session
          </button>
        )}

        {/* Current reply card */}
        {currentText && (
          <div className={`w-full rounded-3xl border px-6 py-5 transition-all ${
            phase === "speaking"
              ? "border-purple-500/40 bg-purple-900/20"
              : "border-slate-800 bg-slate-900"
          }`}>
            {youSaid && (
              <p className="text-xs text-slate-500 mb-2">
                <span className="font-bold text-slate-400">You:</span> {youSaid}
              </p>
            )}
            <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2">NOVA</p>
            <p className="text-base leading-relaxed text-white">{currentText}</p>
          </div>
        )}

        {/* Suggested questions — only shown before session starts */}
        {!started && (
          <div className="w-full space-y-2">
            <p className="text-xs text-slate-600 uppercase tracking-widest text-center">Try asking</p>
            {suggestions.map((q) => (
              <button
                key={q}
                onClick={() => {
                  if (!started) {
                    // Start session then ask
                    isActiveRef.current = true;
                    setStarted(true);
                    try {
                      window.speechSynthesis.cancel();
                      const unlock = new SpeechSynthesisUtterance(" ");
                      unlock.volume = 0.01;
                      unlock.rate = 10;
                      window.speechSynthesis.speak(unlock);
                    } catch { /* ignore */ }
                  }
                  askNova(q);
                }}
                className="w-full text-left rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300 hover:border-yellow-400/40 hover:bg-yellow-400/5 hover:text-white transition"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Text input fallback — always visible when started */}
        {(started || noSpeechAPI) && (
          <div className="w-full flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTextSend()}
              placeholder="Or type your question…"
              className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
            />
            <button
              onClick={handleTextSend}
              className="rounded-2xl bg-yellow-400 text-slate-950 font-black px-5 py-3 text-sm hover:bg-yellow-300 transition"
            >
              Ask
            </button>
          </div>
        )}

        {noSpeechAPI && (
          <p className="text-xs text-slate-600 text-center">
            Voice input is not supported in this browser. Use the text box above.
          </p>
        )}

        {/* Conversation log */}
        {log.length > 0 && (
          <div className="w-full border-t border-slate-800/60 pt-4 space-y-2 max-h-52 overflow-y-auto">
            <p className="text-xs text-slate-600 uppercase tracking-widest text-center mb-3">Conversation</p>
            {log.map((entry, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className={`font-bold shrink-0 w-10 ${entry.role === "NOVA" ? "text-yellow-400" : "text-slate-400"}`}>
                  {entry.role === "NOVA" ? "NOVA" : "You"}
                </span>
                <span className="text-slate-300 leading-relaxed">{entry.text}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
