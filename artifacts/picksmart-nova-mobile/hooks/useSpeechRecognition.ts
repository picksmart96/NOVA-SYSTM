import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export type SpeechMode = "wake" | "question";
export type SpeechState = "off" | "starting" | "listening" | "processing";

interface UseWakeWordOptions {
  language?: "en" | "es";
  enabled: boolean;
  onWakeWord: () => void;
  onQuestion: (transcript: string) => void;
  onError?: (msg: string) => void;
}

export function useWakeWordRecognition({
  language = "en",
  enabled,
  onWakeWord,
  onQuestion,
  onError,
}: UseWakeWordOptions) {
  const [mode, setMode] = useState<SpeechMode>("wake");
  const [state, setState] = useState<SpeechState>("off");
  const [interimText, setInterimText] = useState("");

  const modeRef       = useRef<SpeechMode>("wake");
  const recRef        = useRef<any>(null);
  const restartTimer  = useRef<any>(null);
  const enabledRef    = useRef(enabled);
  const langRef       = useRef(language);
  const mountedRef    = useRef(true);

  enabledRef.current = enabled;
  langRef.current    = language;

  const isSupported =
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const stopRec = useCallback(() => {
    clearTimeout(restartTimer.current);
    if (recRef.current) {
      try { recRef.current.abort(); } catch { /* ignore */ }
      recRef.current = null;
    }
    if (mountedRef.current) {
      setState("off");
      setInterimText("");
    }
  }, []);

  const startRec = useCallback((forceMode?: SpeechMode) => {
    if (!isSupported || !enabledRef.current) return;
    clearTimeout(restartTimer.current);
    if (recRef.current) {
      try { recRef.current.abort(); } catch { /* ignore */ }
      recRef.current = null;
    }

    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    recRef.current = rec;

    const currentMode = forceMode ?? modeRef.current;
    rec.continuous      = false;
    rec.interimResults  = true;
    rec.lang            = langRef.current === "es" ? "es-ES" : "en-US";
    rec.maxAlternatives = 1;

    if (mountedRef.current) setState("starting");

    rec.onstart = () => {
      if (mountedRef.current) setState("listening");
    };

    rec.onresult = (e: any) => {
      let interim = "";
      let final   = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      if (mountedRef.current) setInterimText(interim || final);

      if (final.trim()) {
        if (mountedRef.current) {
          setState("processing");
          setInterimText("");
        }

        if (currentMode === "wake") {
          const lower = final.toLowerCase();
          if (lower.includes("nova") || lower.includes("no va") || lower.includes("nova")) {
            modeRef.current = "question";
            setMode("question");
            onWakeWord();
            // immediately start listening for the question
            restartTimer.current = setTimeout(() => startRec("question"), 300);
          } else {
            // not a wake word — keep listening in wake mode
            restartTimer.current = setTimeout(() => startRec("wake"), 400);
          }
        } else {
          // question mode — send transcript
          modeRef.current = "wake";
          setMode("wake");
          onQuestion(final.trim());
          // restart wake mode after question is sent
          restartTimer.current = setTimeout(() => startRec("wake"), 1800);
        }
      }
    };

    rec.onerror = (e: any) => {
      if (!mountedRef.current) return;
      if (e.error === "no-speech") {
        // silence — just restart
        restartTimer.current = setTimeout(() => startRec(), 300);
        return;
      }
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setState("off");
        onError?.("Microphone access denied. Please allow mic permission in your browser settings.");
        return;
      }
      // other errors — restart after brief pause
      restartTimer.current = setTimeout(() => startRec(), 800);
    };

    rec.onend = () => {
      if (!mountedRef.current) return;
      // If still enabled and no timer pending, restart
      if (enabledRef.current && recRef.current === rec) {
        recRef.current = null;
        restartTimer.current = setTimeout(() => startRec(), 350);
      }
    };

    try {
      rec.start();
    } catch {
      recRef.current = null;
      restartTimer.current = setTimeout(() => startRec(), 1000);
    }
  }, [isSupported, onWakeWord, onQuestion, onError]);

  // Auto-start / stop when enabled changes
  useEffect(() => {
    if (enabled && isSupported) {
      modeRef.current = "wake";
      setMode("wake");
      startRec("wake");
    } else {
      stopRec();
    }
  }, [enabled, isSupported]);

  // Reset to wake mode (call after NOVA finishes speaking)
  const returnToWake = useCallback(() => {
    if (!enabledRef.current) return;
    modeRef.current = "wake";
    setMode("wake");
    clearTimeout(restartTimer.current);
    restartTimer.current = setTimeout(() => startRec("wake"), 400);
  }, [startRec]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(restartTimer.current);
      stopRec();
    };
  }, []);

  return { mode, state, interimText, isSupported, returnToWake, stopRec };
}
