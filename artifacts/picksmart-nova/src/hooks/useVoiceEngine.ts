import { useState, useCallback, useRef } from "react";

export interface UseVoiceEngineReturn {
  transcript: string;
  isSpeaking: boolean;
  speak: (text: string, onDone?: () => void) => void;
  stop: () => void;
}

export function useVoiceEngine(): UseVoiceEngineReturn {
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string, onDone?: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTranscript(text);
    setIsSpeaking(true);

    const wordsPerMinute = 140;
    const words = text.trim().split(/\s+/).length;
    const durationMs = Math.max(1200, Math.round((words / wordsPerMinute) * 60 * 1000));

    timerRef.current = setTimeout(() => {
      setIsSpeaking(false);
      if (onDone) onDone();
    }, durationMs);
  }, []);

  return { transcript, isSpeaking, speak, stop };
}
