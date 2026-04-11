import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export type SpeechState = "idle" | "listening" | "processing" | "error";

interface UseSpeechRecognitionOptions {
  language?: "en" | "es";
  onResult: (transcript: string) => void;
  onError?: (msg: string) => void;
}

export function useSpeechRecognition({ language = "en", onResult, onError }: UseSpeechRecognitionOptions) {
  const [state, setState] = useState<SpeechState>("idle");
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<any>(null);
  const activeRef = useRef(false);

  const isSupported = Platform.OS === "web" && (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    activeRef.current = false;
    setState("idle");
    setInterimText("");
  }, []);

  const start = useCallback(() => {
    if (!isSupported) {
      onError?.("Voice recognition is not supported in this browser. Use Chrome for best results, or type your question below.");
      return;
    }
    if (activeRef.current) {
      stop();
      return;
    }

    const SpeechRecognition: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    recognitionRef.current = rec;

    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = language === "es" ? "es-ES" : "en-US";
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      activeRef.current = true;
      setState("listening");
      setInterimText("");
    };

    rec.onresult = (e: any) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setInterimText(interim);
      if (final.trim()) {
        setState("processing");
        setInterimText("");
        activeRef.current = false;
        onResult(final.trim());
      }
    };

    rec.onerror = (e: any) => {
      activeRef.current = false;
      setState("error");
      setInterimText("");
      if (e.error === "not-allowed") {
        onError?.("Microphone access was denied. Please allow mic permission in your browser and try again.");
      } else if (e.error === "no-speech") {
        setState("idle");
      } else {
        onError?.(`Voice error: ${e.error}`);
      }
    };

    rec.onend = () => {
      if (activeRef.current) {
        activeRef.current = false;
        setState("idle");
      }
      setInterimText("");
    };

    try {
      rec.start();
    } catch (err) {
      onError?.("Could not start microphone.");
      setState("idle");
    }
  }, [isSupported, language, onResult, onError, stop]);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return { state, interimText, start, stop, isSupported };
}
