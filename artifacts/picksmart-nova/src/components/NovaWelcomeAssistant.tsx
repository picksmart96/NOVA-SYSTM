/**
 * NovaWelcomeAssistant
 * Full-screen AI-powered NOVA welcome overlay for selectors/trainees.
 * Greets by name → friendly chat → safety rules briefing → Q&A → assignment reminder.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { novaSpeak, novaRecogLang } from "@/lib/novaSpeech";
import { Headphones, Mic, MicOff, X, Volume2, ChevronRight, Send } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type AiPhase = "greeting" | "chat" | "safety" | "qa" | "done";
type UiState = "locked" | "thinking" | "speaking" | "listening" | "idle" | "done";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface NovaWelcomeAssistantProps {
  userName: string;
  lang?: string;
  onDismiss: () => void;
}

// ── Storage key (once per day per user) ─────────────────────────────────────

function getWelcomeKey(user: string) {
  const today = new Date().toISOString().slice(0, 10);
  return `nova_welcome_${user}_${today}`;
}

export function hasSeenWelcomeToday(user: string) {
  try { return !!localStorage.getItem(getWelcomeKey(user)); } catch { return false; }
}
export function markWelcomeSeen(user: string) {
  try { localStorage.setItem(getWelcomeKey(user), "1"); } catch {}
}

// ── Component ────────────────────────────────────────────────────────────────

export default function NovaWelcomeAssistant({ userName, lang = "en", onDismiss }: NovaWelcomeAssistantProps) {
  const [uiState, setUiState] = useState<UiState>("locked");
  const [aiPhase, setAiPhase] = useState<AiPhase>("greeting");
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript]   = useState("");
  const [currentText, setCurrentText] = useState("Tap the button to start your shift check-in with NOVA.");
  const [textInput, setTextInput]     = useState("");
  const [chatLog, setChatLog]         = useState<{ who: "nova" | "you"; text: string }[]>([]);
  const [canMic, setCanMic]           = useState(false);

  const recognitionRef        = useRef<any>(null);
  const shouldListenRef       = useRef(false);
  const chatLogRef            = useRef<HTMLDivElement>(null);

  // Detect mic availability
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setCanMic(!!SR);
  }, []);

  // Auto-scroll chat log
  useEffect(() => {
    if (chatLogRef.current) chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [chatLog]);

  // ── TTS ──────────────────────────────────────────────────────────────────

  const speak = useCallback((text: string, onEnd?: () => void) => {
    setUiState("speaking");
    setCurrentText(text);
    setChatLog(prev => [...prev, { who: "nova", text }]);
    // Stop mic while speaking
    shouldListenRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}

    novaSpeak(text, lang, () => {
      onEnd?.();
    }, { rate: 0.92, pitch: 1 });
  }, [lang]);

  // ── STT ──────────────────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setUiState("idle"); return; }

    if (!recognitionRef.current) {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = novaRecogLang(lang);
      rec.onstart  = () => { setUiState("listening"); setTranscript(""); };
      rec.onend    = () => {
        if (shouldListenRef.current) {
          setTimeout(() => { try { rec.start(); } catch {} }, 300);
        }
      };
      rec.onerror  = () => {
        setUiState("idle");
        shouldListenRef.current = false;
      };
      rec.onresult = (e: any) => {
        const heard = e.results?.[0]?.[0]?.transcript?.trim() || "";
        setTranscript(heard);
        shouldListenRef.current = false;
        if (heard) handleUserMessage(heard);
      };
      recognitionRef.current = rec;
    }
    shouldListenRef.current = true;
    try { recognitionRef.current.start(); } catch {}
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── AI call ───────────────────────────────────────────────────────────────

  const callNova = useCallback(async (msgs: Message[], phase: AiPhase) => {
    setUiState("thinking");
    try {
      const res = await fetch("/api/nova-welcome-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, userName, currentPhase: phase }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const text: string = data.text || "I'm here to help. What's on your mind?";
      const newPhase: AiPhase = (data.phase as AiPhase) || phase;
      return { text, phase: newPhase };
    } catch {
      return { text: "Sorry, I had a hiccup. Say 'Hey NOVA' to try again!", phase };
    }
  }, [userName]);

  // ── Start the conversation ────────────────────────────────────────────────

  const startConversation = useCallback(async () => {
    setUiState("thinking");
    // Prime audio with user gesture (iOS requirement)
    try {
      const w = new SpeechSynthesisUtterance("\u200B");
      w.volume = 0;
      window.speechSynthesis.speak(w);
      window.speechSynthesis.cancel();
    } catch {}

    const { text, phase } = await callNova([], "greeting");
    const assistantMsg: Message = { role: "assistant", content: text };
    setMessages([assistantMsg]);
    setAiPhase(phase);

    speak(text, () => {
      if (phase !== "done") {
        setUiState("idle");
        if (canMic) startListening();
      } else {
        setUiState("done");
      }
    });
  }, [callNova, speak, canMic, startListening]);

  // ── Handle user message ───────────────────────────────────────────────────

  const handleUserMessage = useCallback(async (input: string) => {
    if (!input.trim()) return;
    setUiState("thinking");
    setTranscript("");

    // Add user message to log + history
    const userMsg: Message = { role: "user", content: input };
    setChatLog(prev => [...prev, { who: "you", text: input }]);
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);

    const { text, phase } = await callNova(newMsgs, aiPhase);
    const assistantMsg: Message = { role: "assistant", content: text };
    setMessages([...newMsgs, assistantMsg]);
    setAiPhase(phase);

    if (phase === "done") {
      speak(text, () => {
        setUiState("done");
        markWelcomeSeen(userName);
      });
    } else {
      speak(text, () => {
        setUiState("idle");
        if (canMic) startListening();
      });
    }
  }, [messages, aiPhase, callNova, speak, canMic, startListening, userName]);

  // ── Submit text input ─────────────────────────────────────────────────────

  const handleTextSubmit = () => {
    if (!textInput.trim() || uiState === "thinking" || uiState === "speaking") return;
    const val = textInput.trim();
    setTextInput("");
    handleUserMessage(val);
  };

  // ── Mic toggle ────────────────────────────────────────────────────────────

  const handleMicToggle = () => {
    if (uiState === "speaking" || uiState === "thinking") return;
    if (uiState === "listening") {
      shouldListenRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      setUiState("idle");
    } else {
      startListening();
    }
  };

  // ── Dismiss ───────────────────────────────────────────────────────────────

  const handleDismiss = () => {
    shouldListenRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    try { window.speechSynthesis.cancel(); } catch {}
    markWelcomeSeen(userName);
    onDismiss();
  };

  // ── Phase badge label ─────────────────────────────────────────────────────

  const phaseLabel: Record<AiPhase, string> = {
    greeting: "Check-In",
    chat: "Chat",
    safety: "Safety Briefing",
    qa: "Q&A",
    done: "All Set!",
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 bg-[#070c12]/95 backdrop-blur-sm flex flex-col">

      {/* ── Header ── */}
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
          {uiState !== "locked" && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-400/15 text-yellow-300 font-bold uppercase tracking-widest">
              {phaseLabel[aiPhase]}
            </span>
          )}
          <button onClick={handleDismiss} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 overflow-hidden">

        {/* NOVA orb */}
        <div className="relative flex items-center justify-center h-44 w-44">
          {uiState === "speaking" && (
            <>
              <div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping" style={{ animationDuration: "1.4s" }} />
              <div className="absolute inset-[-14px] rounded-full bg-yellow-400/10 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.3s" }} />
              <div className="absolute inset-[-28px] rounded-full bg-yellow-400/05 animate-ping" style={{ animationDuration: "2.6s", animationDelay: "0.5s" }} />
            </>
          )}
          {uiState === "listening" && (
            <div className="absolute inset-0 rounded-full bg-green-400/15 animate-ping" style={{ animationDuration: "1.8s" }} />
          )}
          {uiState === "thinking" && (
            <div className="absolute inset-0 rounded-full bg-blue-400/15 animate-ping" style={{ animationDuration: "1s" }} />
          )}
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
            uiState === "speaking"  ? "bg-yellow-400 scale-110 shadow-yellow-400/40"
            : uiState === "listening" ? "bg-green-500/20 border-2 border-green-400"
            : uiState === "thinking"  ? "bg-blue-500/20 border-2 border-blue-400"
            : uiState === "done"      ? "bg-green-600/30 border-2 border-green-400"
            : "bg-slate-800 border-2 border-slate-700"
          }`}>
            {uiState === "speaking" ? (
              <Volume2 className="h-14 w-14 text-slate-950" />
            ) : uiState === "listening" ? (
              <Mic className="h-14 w-14 text-green-400" />
            ) : uiState === "thinking" ? (
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "160ms" }} />
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "320ms" }} />
              </div>
            ) : (
              <Headphones className={`h-14 w-14 ${uiState === "done" ? "text-green-400" : "text-slate-400"}`} />
            )}
          </div>
        </div>

        {/* Status label */}
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          {uiState === "locked"    && "Ready to start"}
          {uiState === "thinking"  && "NOVA is thinking…"}
          {uiState === "speaking"  && "NOVA is speaking"}
          {uiState === "listening" && "Listening — speak now"}
          {uiState === "idle"      && (canMic ? "Tap mic or type below" : "Type your response below")}
          {uiState === "done"      && "Shift check-in complete!"}
        </p>

        {/* Current transcript text */}
        <div className="w-full max-w-md min-h-[72px] flex items-center justify-center text-center px-2">
          {uiState === "locked" ? (
            <p className="text-slate-400 text-lg">
              Hi <span className="text-yellow-400 font-black">{userName || "there"}</span>! NOVA is ready for your shift check-in.
            </p>
          ) : transcript && uiState === "listening" ? (
            <p className="text-slate-300 text-lg italic">"{transcript}"</p>
          ) : (
            <p className={`text-xl font-medium leading-relaxed ${uiState === "speaking" ? "text-white" : "text-slate-400"}`}>
              {currentText}
            </p>
          )}
        </div>
      </div>

      {/* ── Chat log ── */}
      {chatLog.length > 0 && (
        <div
          ref={chatLogRef}
          className="mx-4 mb-3 max-h-32 overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 space-y-2"
        >
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

      {/* ── Controls ── */}
      <div className="px-5 pb-6 space-y-3">

        {/* Start button */}
        {uiState === "locked" && (
          <button
            onClick={startConversation}
            className="w-full py-5 bg-yellow-400 text-slate-950 font-black text-xl rounded-2xl hover:bg-yellow-300 active:scale-95 transition shadow-xl shadow-yellow-400/25"
          >
            Start Shift Check-In with NOVA
          </button>
        )}

        {/* Done state */}
        {uiState === "done" && (
          <button
            onClick={handleDismiss}
            className="w-full py-4 bg-green-600 text-white font-black text-lg rounded-2xl hover:bg-green-500 active:scale-95 transition"
          >
            Head to the Floor — Have a Great Shift!
          </button>
        )}

        {/* Active session controls */}
        {(uiState === "speaking" || uiState === "listening" || uiState === "idle" || uiState === "thinking") && (
          <div className="space-y-3">
            {/* Text input row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleTextSubmit()}
                placeholder="Type your response…"
                disabled={uiState === "thinking" || uiState === "speaking"}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-yellow-400 transition disabled:opacity-40 text-sm"
              />
              {canMic && (
                <button
                  onClick={handleMicToggle}
                  disabled={uiState === "thinking" || uiState === "speaking"}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition disabled:opacity-40 ${
                    uiState === "listening"
                      ? "bg-green-500 shadow-lg shadow-green-500/30 animate-pulse"
                      : "bg-slate-800 hover:bg-slate-700"
                  }`}
                >
                  {uiState === "listening" ? (
                    <Mic className="h-5 w-5 text-white" />
                  ) : (
                    <MicOff className="h-5 w-5 text-slate-400" />
                  )}
                </button>
              )}
              <button
                onClick={handleTextSubmit}
                disabled={!textInput.trim() || uiState === "thinking" || uiState === "speaking"}
                className="w-12 h-12 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center hover:bg-yellow-300 transition disabled:opacity-40"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>

            {!canMic && (
              <p className="text-center text-xs text-slate-600">
                No mic detected — type your responses above
              </p>
            )}
            {canMic && uiState !== "listening" && uiState !== "speaking" && uiState !== "thinking" && (
              <p className="text-center text-xs text-slate-600">
                Mic is auto-activated after NOVA speaks · or tap the mic icon
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
