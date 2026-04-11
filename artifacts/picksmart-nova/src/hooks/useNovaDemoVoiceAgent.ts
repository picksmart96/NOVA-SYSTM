import { useEffect, useMemo, useRef, useState } from "react";

type SpeechRecognitionCtor = typeof SpeechRecognition;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  return (
    (window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition ||
    null
  );
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  const exact = voices.find((v) => v.lang === lang);
  if (exact) return exact;
  const partial = voices.find((v) => v.lang?.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
  if (partial) return partial;
  return voices[0] ?? null;
}

export interface TranscriptEntry {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export interface NovaDemoVoiceAgent {
  initialize: () => Promise<boolean>;
  destroy: () => void;
  stopSpeaking: () => void;
  sendText: (text: string) => Promise<void>;
  speakMessage: (text: string) => void;
  unlockAndSpeak: (text: string) => void;
  stateLabel: string;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  ttsEnabled: boolean;
  lastHeard: string;
  lastReply: string;
  transcript: TranscriptEntry[];
  error: string;
  micPermission: "unknown" | "granted" | "denied";
  voiceSupported: boolean;
  language: "en" | "es";
  setLanguage: (lang: "en" | "es") => void;
  showLeadPrompt: boolean;
  setShowLeadPrompt: (v: boolean) => void;
}

export default function useNovaDemoVoiceAgent(): NovaDemoVoiceAgent {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const interruptRef = useRef(false);
  const sessionIdRef = useRef(`demo-agent-${Math.random().toString(36).slice(2)}-${Date.now()}`);
  const voiceSupported = !!getRecognitionCtor();

  const [language, setLanguage] = useState<"en" | "es">("en");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [lastHeard, setLastHeard] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [error, setError] = useState("");
  const [micPermission, setMicPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [showLeadPrompt, setShowLeadPrompt] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  const stateLabel = useMemo(() => {
    if (error) return "Error";
    if (isThinking) return "Thinking";
    if (isSpeaking) return "Speaking";
    if (isListening) return "Listening";
    return "Idle";
  }, [error, isThinking, isSpeaking, isListening]);

  const langCode = language === "es" ? "es-ES" : "en-US";

  const pushTranscript = (role: "user" | "assistant", text: string) => {
    setTranscript((prev) => [
      ...prev.slice(-19),
      { id: `${Date.now()}-${Math.random()}`, role, text },
    ]);
  };

  const stopSpeaking = () => {
    interruptRef.current = true;
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const speak = (text: string, onEnd?: () => void) => {
    stopSpeaking();
    interruptRef.current = false;

    if (!("speechSynthesis" in window)) { onEnd?.(); return; }

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = langCode;
    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 1;

    const voice = pickVoice(langCode);
    if (voice) utter.voice = voice;

    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => {
      setIsSpeaking(false);
      if (!interruptRef.current) onEnd?.();
    };
    utter.onerror = () => { setIsSpeaking(false); onEnd?.(); };

    window.speechSynthesis.speak(utter);
  };

  const sendToAgent = async (text: string) => {
    setIsThinking(true);
    try {
      const res = await fetch("/api/nova-demo-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current, message: text, language }),
      });
      const data = await res.json() as { reply?: string; handoff?: boolean };
      const reply = data.reply || (language === "es"
        ? "¿Quieres que te explique más sobre PickSmart Academy?"
        : "Would you like me to explain more about PickSmart Academy?");

      setLastReply(reply);
      pushTranscript("assistant", reply);
      setShowLeadPrompt(!!data.handoff);
      setIsThinking(false);
      speak(reply);
    } catch {
      setIsThinking(false);
      setError(language === "es" ? "No se pudo conectar con NOVA." : "Could not reach NOVA.");
    }
  };

  // Public method: send a typed message to NOVA
  const sendText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLastHeard(trimmed);
    pushTranscript("user", trimmed);
    await sendToAgent(trimmed);
  };

  const startRecognition = () => {
    const Recognition = getRecognitionCtor();
    if (!Recognition) {
      setError("Speech recognition is not supported on this browser.");
      return false;
    }

    try { recognitionRef.current?.stop(); } catch { /* ignore */ }

    const rec = new Recognition();
    rec.lang = langCode;
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => { setIsListening(true); setError(""); };
    rec.onend = () => {
      setIsListening(false);
      if (!interruptRef.current) {
        try { rec.start(); } catch { /* ignore */ }
      }
    };
    rec.onerror = (event) => {
      setError((event as SpeechRecognitionErrorEvent).error || "Voice recognition error.");
      setIsListening(false);
    };

    rec.onresult = async (event) => {
      const text = event.results?.[event.results.length - 1]?.[0]?.transcript?.trim() ?? "";
      if (!text) return;

      setLastHeard(text);
      pushTranscript("user", text);

      const lower = text.toLowerCase();

      // Interrupt / stop commands
      if (lower.includes("stop nova") || lower === "stop" || lower.includes("be quiet") || lower.includes("parar") || lower.includes("cállate")) {
        stopSpeaking();
        const msg = language === "es"
          ? "Está bien. Me quedaré en silencio hasta que me hagas otra pregunta."
          : "Okay. I'll stay quiet until you ask another question.";
        setLastReply(msg);
        pushTranscript("assistant", msg);
        speak(msg);
        return;
      }

      // Reset commands
      if (lower.includes("reset conversation") || lower.includes("start over") || lower.includes("reiniciar")) {
        stopSpeaking();
        setIsThinking(true);
        try {
          const res = await fetch("/api/nova-demo-agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sessionIdRef.current, reset: true, language }),
          });
          const data = await res.json() as { reply?: string };
          const reply = data.reply || "Conversation reset.";
          setTranscript([]);
          setLastReply(reply);
          pushTranscript("assistant", reply);
          setShowLeadPrompt(false);
          setIsThinking(false);
          speak(reply);
        } catch {
          setIsThinking(false);
          setError("Could not reset conversation.");
        }
        return;
      }

      // Language switch commands
      if (lower.includes("speak spanish") || lower.includes("habla español") || lower.includes("en español")) {
        setLanguage("es");
        const msg = "Claro. Ahora hablaré en español. ¿Qué te gustaría saber?";
        setLastReply(msg);
        pushTranscript("assistant", msg);
        speak(msg);
        return;
      }
      if (lower.includes("speak english") || lower.includes("english please") || lower.includes("in english")) {
        setLanguage("en");
        const msg = "Sure. I'll continue in English. What would you like to know?";
        setLastReply(msg);
        pushTranscript("assistant", msg);
        speak(msg);
        return;
      }

      await sendToAgent(text);
    };

    recognitionRef.current = rec;
    try { rec.start(); return true; } catch { setError("Could not start voice recognition."); return false; }
  };

  const initialize = async (): Promise<boolean> => {
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermission("granted");
      }
    } catch {
      setMicPermission("denied");
      setError("Microphone permission denied.");
      return false;
    }

    const started = startRecognition();
    if (!started) return false;

    const welcome = language === "es"
      ? "Hola, soy NOVA. Estoy aquí para responder cualquier pregunta sobre PickSmart Academy. Solo pregunta."
      : "Hi, I'm NOVA. I'm here to answer any questions you have about PickSmart Academy. Just ask.";

    setLastReply(welcome);
    pushTranscript("assistant", welcome);
    speak(welcome);
    return true;
  };

  const destroy = () => {
    interruptRef.current = true;
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    stopSpeaking();
  };

  useEffect(() => {
    const loadVoices = () => window.speechSynthesis?.getVoices?.();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }
    return () => {
      destroy();
      if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Public TTS-only method — no mic required (requires prior unlock)
  const speakMessage = (text: string) => {
    interruptRef.current = false;
    speak(text);
  };

  // Must be called directly from a user gesture (click/tap).
  // Plays a silent utterance to unlock the browser's autoplay policy,
  // then immediately speaks `text`. All future speak() calls will work.
  const unlockAndSpeak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    // Cancel any pending queue first
    window.speechSynthesis.cancel();
    // Silent unlock utterance — must happen synchronously in the gesture handler
    const silent = new SpeechSynthesisUtterance(" ");
    silent.volume = 0;
    silent.rate = 10; // finish instantly
    silent.onend = () => {
      // Now TTS is unlocked — speak the real message
      interruptRef.current = false;
      setTtsEnabled(true);
      speak(text);
    };
    window.speechSynthesis.speak(silent);
    setTtsEnabled(true);
  };

  return {
    initialize, destroy, stopSpeaking, sendText, speakMessage, unlockAndSpeak,
    stateLabel, isListening, isSpeaking, isThinking, ttsEnabled,
    lastHeard, lastReply, transcript, error, micPermission,
    voiceSupported,
    language, setLanguage, showLeadPrompt, setShowLeadPrompt,
  };
}
