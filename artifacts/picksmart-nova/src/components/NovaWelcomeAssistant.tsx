/**
 * NovaWelcomeAssistant
 * Auto-listening NOVA shift check-in:
 *  - Auto-starts conversation on mount (no button needed)
 *  - Chat→Safety phase auto-advances without user input
 *  - Mic auto-restarts after every NOVA sentence
 *  - "Hey NOVA" wake word re-activates when mic is idle
 *  - Silent "wake" state with indigo Radio icon when waiting
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { novaSpeak, novaRecogLang } from "@/lib/novaSpeech";
import { Headphones, Mic, MicOff, X, Volume2, Send, Radio } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type AiPhase = "greeting" | "chat" | "safety" | "qa" | "done";
type UiState = "booting" | "thinking" | "speaking" | "listening" | "wake" | "idle" | "done";

interface Message { role: "user" | "assistant"; content: string; }

interface NovaWelcomeAssistantProps {
  userName: string;
  lang?: string;
  onDismiss: () => void;
}

// After these phase transitions NOVA continues speaking automatically
// (no user response needed between phases)
const AUTO_ADVANCE: Partial<Record<AiPhase, AiPhase>> = {
  chat: "safety",   // after chat→safety, speak safety immediately
};

// ── Storage helpers ───────────────────────────────────────────────────────────

export function hasSeenWelcomeToday(user: string) {
  try {
    const key = `nova_welcome_${user}_${new Date().toISOString().slice(0, 10)}`;
    return !!localStorage.getItem(key);
  } catch { return false; }
}
export function markWelcomeSeen(user: string) {
  try {
    const key = `nova_welcome_${user}_${new Date().toISOString().slice(0, 10)}`;
    localStorage.setItem(key, "1");
  } catch {}
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NovaWelcomeAssistant({ userName, lang = "en", onDismiss }: NovaWelcomeAssistantProps) {
  const [uiState,     setUiState]     = useState<UiState>("booting");
  const [aiPhase,     setAiPhase]     = useState<AiPhase>("greeting");
  const [currentText, setCurrentText] = useState("NOVA is starting up…");
  const [transcript,  setTranscript]  = useState("");
  const [textInput,   setTextInput]   = useState("");
  const [chatLog,     setChatLog]     = useState<{ who: "nova" | "you"; text: string }[]>([]);
  const [canMic,      setCanMic]      = useState(false);

  // Stable refs — avoids stale closures in recognition callbacks
  const messagesRef   = useRef<Message[]>([]);
  const aiPhaseRef    = useRef<AiPhase>("greeting");
  const processingRef = useRef(false);
  const mainRecRef    = useRef<any>(null);
  const wakeRecRef    = useRef<any>(null);
  const wakeActiveRef = useRef(false);
  const chatLogRef    = useRef<HTMLDivElement>(null);

  useEffect(() => { aiPhaseRef.current = aiPhase; }, [aiPhase]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatLogRef.current) chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [chatLog]);

  // Detect mic support
  useEffect(() => {
    setCanMic(!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const killRec = () => {
    try { mainRecRef.current?.abort(); } catch {}
    mainRecRef.current = null;
  };
  const killWake = () => {
    wakeActiveRef.current = false;
    try { wakeRecRef.current?.abort(); } catch {}
    wakeRecRef.current = null;
  };

  // ── TTS ──────────────────────────────────────────────────────────────────

  const speak = useCallback((text: string, onEnd: () => void) => {
    setUiState("speaking");
    setCurrentText(text);
    setChatLog(prev => [...prev, { who: "nova", text }]);
    killRec();
    killWake();
    novaSpeak(text, lang, onEnd, { rate: 0.92, pitch: 1 });
  }, [lang]);

  // ── AI call ───────────────────────────────────────────────────────────────

  const callNova = useCallback(async (msgs: Message[], phase: AiPhase) => {
    processingRef.current = true;
    setUiState("thinking");
    try {
      const BASE = (import.meta as any).env?.BASE_URL?.replace(/\/$/, "") || "";
      const res  = await fetch(`${BASE}/api/nova-welcome-chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: msgs, userName, currentPhase: phase }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      return { text: (data.text as string) || "I'm here!", phase: (data.phase as AiPhase) || phase };
    } catch {
      return { text: "Sorry, had a hiccup. Say 'Hey NOVA' to try again!", phase };
    } finally {
      processingRef.current = false;
    }
  }, [userName]);

  // ── Forward-declare so speak/wake/listen can call each other ─────────────

  const startWakeRef     = useRef<() => void>(() => {});
  const startListenRef   = useRef<() => void>(() => {});
  const handleSpeechRef  = useRef<(text: string) => void>(() => {});

  // ── Wake-word listener (always-on when idle) ──────────────────────────────

  const startWakeListen = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR || wakeActiveRef.current || processingRef.current) return;

    const rec = new SR();
    rec.continuous     = false;
    rec.interimResults = false;
    rec.lang = novaRecogLang(lang);

    rec.onstart  = () => { wakeActiveRef.current = true; };
    rec.onend    = () => {
      wakeActiveRef.current = false;
      if (!processingRef.current) {
        setTimeout(() => startWakeRef.current(), 500);
      }
    };
    rec.onerror  = () => {
      wakeActiveRef.current = false;
      setTimeout(() => startWakeRef.current(), 800);
    };
    rec.onresult = (e: any) => {
      const heard = (e.results?.[0]?.[0]?.transcript || "").toLowerCase().trim();
      const isWake = heard.includes("hey nova") || heard.includes("hola nova") || heard === "nova";
      if (isWake) {
        killWake();
        setUiState("listening");
        setTimeout(() => startListenRef.current(), 200);
      }
    };

    wakeRecRef.current = rec;
    try { rec.start(); } catch {}
  }, [lang]);

  // ── Full speech recognition → handleSpeech ────────────────────────────────

  const startListen = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR || processingRef.current) return;
    killWake();

    const rec = new SR();
    rec.continuous     = false;
    rec.interimResults = true;
    rec.lang = novaRecogLang(lang);

    let finalText = "";

    rec.onstart = () => {
      setUiState("listening");
      setTranscript("");
      finalText = "";
    };
    rec.onresult = (e: any) => {
      let fin = "", interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t;
        else interim += t;
      }
      if (fin) finalText = fin;
      setTranscript(fin || interim);
    };
    rec.onend = () => {
      mainRecRef.current = null;
      if (finalText.trim()) {
        // Check if user said wake word mid-session (ignore it, just re-listen)
        const lower = finalText.toLowerCase();
        if (lower === "hey nova" || lower === "hola nova" || lower === "nova") {
          setUiState("listening");
          setTimeout(() => startListenRef.current(), 200);
          return;
        }
        handleSpeechRef.current(finalText.trim());
      } else {
        // Nothing heard → go to wake mode
        setUiState("wake");
        setTimeout(() => startWakeRef.current(), 300);
      }
    };
    rec.onerror = (e: any) => {
      mainRecRef.current = null;
      if (e.error === "no-speech") {
        setUiState("wake");
        setTimeout(() => startWakeRef.current(), 300);
      } else if (e.error !== "aborted") {
        setUiState("wake");
        setTimeout(() => startWakeRef.current(), 500);
      }
    };

    mainRecRef.current = rec;
    try { rec.start(); } catch {}
  }, [lang]);

  // Sync refs
  useEffect(() => { startWakeRef.current   = startWakeListen; }, [startWakeListen]);
  useEffect(() => { startListenRef.current = startListen;     }, [startListen]);

  // ── After speaking: auto-start listening ─────────────────────────────────

  const afterSpeak = useCallback((micOk: boolean) => {
    if (micOk) {
      setUiState("listening");
      startListenRef.current();
    } else {
      setUiState("idle");
    }
  }, []);

  // ── Process a NOVA response + handle auto-advance ─────────────────────────

  const deliverResponse = useCallback(async (
    msgs: Message[], text: string, newPhase: AiPhase, prevPhase: AiPhase, micOk: boolean,
  ) => {
    const assistantMsg: Message = { role: "assistant", content: text };
    const updated = [...msgs, assistantMsg];
    messagesRef.current = updated;
    setAiPhase(newPhase);

    // Should we auto-advance (e.g. chat→safety)?
    const autoTarget = AUTO_ADVANCE[prevPhase];
    const shouldAutoAdvance = !!autoTarget && newPhase === autoTarget;

    if (newPhase === "done") {
      speak(text, () => {
        setUiState("done");
        markWelcomeSeen(userName);
      });
    } else if (shouldAutoAdvance) {
      // Speak transition line, then immediately fetch & speak next phase
      speak(text, async () => {
        const { text: nextText, phase: nextPhase } = await callNova(updated, newPhase);
        await deliverResponse(updated, nextText, nextPhase, newPhase, micOk);
      });
    } else {
      // Wait for user
      speak(text, () => afterSpeak(micOk));
    }
  }, [speak, callNova, afterSpeak, userName]);

  // ── Handle user speech / text ─────────────────────────────────────────────

  const handleSpeech = useCallback(async (input: string) => {
    if (!input.trim() || processingRef.current) return;
    killRec();
    setTranscript("");
    setChatLog(prev => [...prev, { who: "you", text: input.trim() }]);

    const userMsg: Message = { role: "user", content: input.trim() };
    const msgs = [...messagesRef.current, userMsg];
    messagesRef.current = msgs;

    const prevPhase = aiPhaseRef.current;
    const { text, phase: newPhase } = await callNova(msgs, prevPhase);
    await deliverResponse(msgs, text, newPhase, prevPhase, canMic);
  }, [callNova, deliverResponse, canMic]);

  // Sync ref
  useEffect(() => { handleSpeechRef.current = handleSpeech; }, [handleSpeech]);

  // ── Start conversation ────────────────────────────────────────────────────

  const startConversation = useCallback(async (micOk: boolean) => {
    // Prime TTS (iOS needs a user-gesture audio context)
    try {
      const u = new SpeechSynthesisUtterance("\u200B");
      u.volume = 0;
      window.speechSynthesis.speak(u);
      window.speechSynthesis.cancel();
    } catch {}

    const { text, phase } = await callNova([], "greeting");
    const assistantMsg: Message = { role: "assistant", content: text };
    messagesRef.current = [assistantMsg];
    setAiPhase(phase);

    speak(text, () => afterSpeak(micOk));
  }, [callNova, speak, afterSpeak]);

  // ── Tap-gate: wait for user gesture before starting TTS ──────────────────
  // (browsers block auto-play TTS without a user gesture)

  const [ttsGated, setTtsGated] = useState(true);

  const didStartRef = useRef(false);
  useEffect(() => {
    if (didStartRef.current) return;
    didStartRef.current = true;
    const micOk = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
    setCanMic(micOk);
    // Do NOT auto-start — wait for the tap gate below
  }, []); // eslint-disable-line

  const handleTapStart = useCallback(() => {
    setTtsGated(false);
    const micOk = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
    startConversation(micOk);
  }, [startConversation]);

  // ── Manual mic toggle ─────────────────────────────────────────────────────

  const handleMicToggle = () => {
    if (uiState === "speaking" || uiState === "thinking") return;
    if (uiState === "listening") {
      killRec();
      setUiState("wake");
      startWakeRef.current();
    } else {
      killWake();
      setUiState("listening");
      startListenRef.current();
    }
  };

  // ── Text submit ───────────────────────────────────────────────────────────

  const handleTextSubmit = () => {
    if (!textInput.trim() || uiState === "thinking" || uiState === "speaking") return;
    const val = textInput.trim();
    setTextInput("");
    handleSpeech(val);
  };

  // ── Dismiss ───────────────────────────────────────────────────────────────

  const handleDismiss = () => {
    killRec();
    killWake();
    try { window.speechSynthesis.cancel(); } catch {}
    markWelcomeSeen(userName);
    onDismiss();
  };

  // ── Derived booleans for clarity ──────────────────────────────────────────

  const isSpeaking = uiState === "speaking";
  const isListening = uiState === "listening";
  const isThinking  = uiState === "thinking";
  const isWake      = uiState === "wake";
  const isActive    = isSpeaking || isListening || isThinking || isWake || uiState === "idle";

  const phaseLabel: Record<AiPhase, string> = {
    greeting: "Check-In",
    chat:     "Chat",
    safety:   "Safety Briefing",
    qa:       "Q&A",
    done:     "All Set!",
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 bg-[#070c12]/95 backdrop-blur-sm flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center">
            <Headphones className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <p className="text-white font-black text-base leading-none">NOVA</p>
            <p className="text-slate-500 text-xs">AI Shift Check-In</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {uiState !== "booting" && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-400/15 text-yellow-300 font-bold uppercase tracking-widest">
              {phaseLabel[aiPhase]}
            </span>
          )}
          <button onClick={handleDismiss} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Orb */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 overflow-hidden">
        <div className="relative flex items-center justify-center h-44 w-44">

          {/* Pulse rings */}
          {isSpeaking && <>
            <div className="absolute inset-0      rounded-full bg-yellow-400/20 animate-ping" style={{ animationDuration: "1.4s" }} />
            <div className="absolute inset-[-14px] rounded-full bg-yellow-400/10 animate-ping" style={{ animationDuration: "2s",   animationDelay: "0.3s" }} />
            <div className="absolute inset-[-28px] rounded-full bg-yellow-400/05 animate-ping" style={{ animationDuration: "2.6s", animationDelay: "0.5s" }} />
          </>}
          {isListening && <div className="absolute inset-0 rounded-full bg-green-400/15  animate-ping" style={{ animationDuration: "1.8s" }} />}
          {isThinking  && <div className="absolute inset-0 rounded-full bg-blue-400/15   animate-ping" style={{ animationDuration: "1s"   }} />}
          {isWake      && <div className="absolute inset-0 rounded-full bg-indigo-400/10 animate-ping" style={{ animationDuration: "3s"   }} />}

          {/* Orb core */}
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
            isSpeaking   ? "bg-yellow-400 scale-110 shadow-yellow-400/40"
            : isListening ? "bg-green-500/20  border-2 border-green-400"
            : isThinking  ? "bg-blue-500/20   border-2 border-blue-400"
            : uiState === "done" ? "bg-green-600/30 border-2 border-green-400"
            : isWake      ? "bg-indigo-500/10 border-2 border-indigo-400/40"
            : "bg-slate-800 border-2 border-slate-700"
          }`}>
            {isSpeaking   && <Volume2 className="h-14 w-14 text-slate-950" />}
            {isListening  && <Mic     className="h-14 w-14 text-green-400" />}
            {isThinking   && (
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "160ms" }} />
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "320ms" }} />
              </div>
            )}
            {isWake && <Radio className="h-14 w-14 text-indigo-400 opacity-60" />}
            {uiState === "done"    && <Headphones className="h-14 w-14 text-green-400" />}
            {(uiState === "booting" || uiState === "idle") && <Headphones className="h-14 w-14 text-slate-400" />}
          </div>
        </div>

        {/* Tap-to-start gate */}
        {ttsGated && uiState === "booting" && (
          <button
            onClick={handleTapStart}
            className="mt-2 px-8 py-4 rounded-2xl bg-yellow-400 text-slate-950 font-black text-lg hover:bg-yellow-300 active:scale-95 transition shadow-lg shadow-yellow-400/30"
          >
            Tap to Talk with NOVA
          </button>
        )}

        {/* Status */}
        {!ttsGated && (
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {uiState === "booting"  && "NOVA starting…"}
            {isThinking             && "NOVA is thinking…"}
            {isSpeaking             && "NOVA is speaking"}
            {isListening            && "Listening — speak now"}
            {isWake                 && 'Say "Hey NOVA" to respond'}
            {uiState === "idle"     && (canMic ? "Tap mic or type below" : "Type your response below")}
            {uiState === "done"     && "Shift check-in complete!"}
          </p>
        )}

        {/* Live transcript or current text */}
        <div className="w-full max-w-md min-h-[72px] flex items-center justify-center text-center px-2">
          {transcript && isListening ? (
            <p className="text-slate-300 text-lg italic">"{transcript}"</p>
          ) : (
            <p className={`text-xl font-medium leading-relaxed ${isSpeaking ? "text-white" : "text-slate-400"}`}>
              {currentText}
            </p>
          )}
        </div>
      </div>

      {/* Chat log */}
      {chatLog.length > 0 && (
        <div ref={chatLogRef}
          className="mx-4 mb-3 max-h-32 overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 space-y-2">
          {chatLog.map((entry, i) => (
            <div key={i} className={`flex gap-2 text-xs ${entry.who === "nova" ? "text-yellow-300/80" : "text-slate-300"}`}>
              <span className={`font-black shrink-0 ${entry.who === "nova" ? "text-yellow-400" : "text-slate-500"}`}>
                {entry.who === "nova" ? "NOVA:" : "You:"}
              </span>
              <span>{entry.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="px-5 pb-6 space-y-3">

        {uiState === "done" && (
          <button onClick={handleDismiss}
            className="w-full py-4 bg-green-600 text-white font-black text-lg rounded-2xl hover:bg-green-500 active:scale-95 transition">
            Head to the Floor — Have a Great Shift!
          </button>
        )}

        {isActive && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleTextSubmit()}
                placeholder="Type your response…"
                disabled={isThinking || isSpeaking}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-yellow-400 transition disabled:opacity-40 text-sm"
              />
              {canMic && (
                <button
                  onClick={handleMicToggle}
                  disabled={isThinking || isSpeaking}
                  title={isListening ? "Stop mic" : "Start mic"}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition disabled:opacity-40 ${
                    isListening ? "bg-green-500 shadow-lg shadow-green-500/30 animate-pulse"
                    : isWake    ? "bg-indigo-600/30 border border-indigo-400/30 hover:bg-indigo-500/40"
                    : "bg-slate-800 hover:bg-slate-700"
                  }`}
                >
                  {isListening ? <Mic    className="h-5 w-5 text-white" />
                  : isWake     ? <Radio  className="h-5 w-5 text-indigo-300" />
                  :              <MicOff className="h-5 w-5 text-slate-400" />}
                </button>
              )}
              <button
                onClick={handleTextSubmit}
                disabled={!textInput.trim() || isThinking || isSpeaking}
                className="w-12 h-12 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center hover:bg-yellow-300 transition disabled:opacity-40"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>

            {isWake && canMic && (
              <p className="text-center text-xs text-indigo-400/70">
                Say <span className="font-bold text-indigo-300">"Hey NOVA"</span> to respond · or type above
              </p>
            )}
            {isListening && (
              <p className="text-center text-xs text-green-400/60">
                Speak now · mic stops automatically when you finish
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
