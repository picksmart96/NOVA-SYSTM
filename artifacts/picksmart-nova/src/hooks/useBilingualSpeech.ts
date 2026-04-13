import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { novaSpeak } from "@/lib/novaSpeech";

/**
 * Drop-in replacement for the raw useSpeech hook used in lesson pages.
 * Automatically picks the correct Spanish or English voice based on i18n language.
 */
export function useBilingualSpeech() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("es") ? "es" : "en";

  const speakingRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    if (mutedRef.current && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      speakingRef.current = false;
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      if (mutedRef.current) { onDone?.(); return; }
      speakingRef.current = true;
      setIsSpeaking(true);
      novaSpeak(text, lang, () => {
        speakingRef.current = false;
        setIsSpeaking(false);
        onDone?.();
      });
    },
    [lang]
  );

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    speakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, muted, toggleMute, speak, stopSpeaking, lang };
}
