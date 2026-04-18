import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { matchCommand } from "@workspace/nova-shared";
import {
  ExpoWebSpeechRecognition,
  ExpoSpeechRecognitionModule,
} from "expo-speech-recognition";

export type SpeechMode = "wake" | "question";
export type SpeechState = "off" | "starting" | "listening" | "processing";

interface UseWakeWordOptions {
  language?: "en" | "es";
  enabled: boolean;
  onWakeWord: () => void;
  onQuestion: (transcript: string) => void;
  onError?: (msg: string) => void;
}

/**
 * Minimal interface covering the subset of the Web Speech API that this hook
 * actually uses. Both `window.SpeechRecognition` (web) and
 * `ExpoWebSpeechRecognition` (native) satisfy this shape.
 */
interface SpeechRecognizer {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((ev: Event) => void) | null;
  onresult: ((ev: { resultIndex: number; results: SpeechRecognitionResultList }) => void) | null;
  onerror: ((ev: { error?: string; code?: string }) => void) | null;
  onend: ((ev: Event) => void) | null;
  start(): void;
  abort(): void;
}

interface SpeechRecognizerCtor {
  new(): SpeechRecognizer;
}

/** Returns true if speech recognition is available on this platform/device. */
function checkIsSupported(): boolean {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    return ExpoSpeechRecognitionModule.isRecognitionAvailable();
  }
  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
}

/** Returns the SpeechRecognizer constructor appropriate for the current platform. */
function getSRClass(): SpeechRecognizerCtor | null {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    return ExpoWebSpeechRecognition as unknown as SpeechRecognizerCtor;
  }
  if (typeof window !== "undefined") {
    const w = window as typeof window & {
      SpeechRecognition?: SpeechRecognizerCtor;
      webkitSpeechRecognition?: SpeechRecognizerCtor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  }
  return null;
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

  const modeRef      = useRef<SpeechMode>("wake");
  const recRef       = useRef<SpeechRecognizer | null>(null);
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef   = useRef(enabled);
  const langRef      = useRef(language);
  const mountedRef   = useRef(true);

  enabledRef.current = enabled;
  langRef.current    = language;

  const isSupported = checkIsSupported();

  const stopRec = useCallback(() => {
    if (restartTimer.current) clearTimeout(restartTimer.current);
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
    if (!checkIsSupported() || !enabledRef.current) return;
    if (restartTimer.current) clearTimeout(restartTimer.current);
    if (recRef.current) {
      try { recRef.current.abort(); } catch { /* ignore */ }
      recRef.current = null;
    }

    const SRClass = getSRClass();
    if (!SRClass) return;

    const rec = new SRClass();
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

    rec.onresult = (e) => {
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
          const cmd = matchCommand(final);
          if (cmd === "wake") {
            modeRef.current = "question";
            setMode("question");
            onWakeWord();
            restartTimer.current = setTimeout(() => startRec("question"), 300);
          } else {
            restartTimer.current = setTimeout(() => startRec("wake"), 400);
          }
        } else {
          modeRef.current = "wake";
          setMode("wake");
          const matched = matchCommand(final);
          onQuestion(matched ?? final.trim());
          restartTimer.current = setTimeout(() => startRec("wake"), 1800);
        }
      }
    };

    rec.onerror = (e) => {
      if (!mountedRef.current) return;
      const errCode = e.error ?? e.code ?? "";
      if (errCode === "no-speech") {
        restartTimer.current = setTimeout(() => startRec(), 300);
        return;
      }
      if (errCode === "not-allowed" || errCode === "service-not-allowed") {
        setState("off");
        onError?.("Microphone access denied. Please allow mic permission in your device settings.");
        return;
      }
      restartTimer.current = setTimeout(() => startRec(), 800);
    };

    rec.onend = () => {
      if (!mountedRef.current) return;
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
  }, [onWakeWord, onQuestion, onError]);

  useEffect(() => {
    if (enabled && isSupported) {
      modeRef.current = "wake";
      setMode("wake");
      startRec("wake");
    } else {
      stopRec();
    }
  }, [enabled, isSupported]);

  const returnToWake = useCallback(() => {
    if (!enabledRef.current) return;
    modeRef.current = "wake";
    setMode("wake");
    if (restartTimer.current) clearTimeout(restartTimer.current);
    restartTimer.current = setTimeout(() => startRec("wake"), 400);
  }, [startRec]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (restartTimer.current) clearTimeout(restartTimer.current);
      stopRec();
    };
  }, []);

  return { mode, state, interimText, isSupported, returnToWake, stopRec };
}
