import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import NovaOrb from "@/components/NovaOrb";
import { useWakeWordRecognition } from "@/hooks/useSpeechRecognition";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useBackgroundAudio } from "@/hooks/useBackgroundAudio";

type OrbState = "idle" | "wake" | "listening" | "thinking" | "speaking";
interface Message { id: string; role: "nova" | "user"; text: string; }

// Unlock browser audio policy with a silent utterance (must be called
// synchronously inside a user-gesture handler before any async speak calls).
function unlockWebAudio() {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  try {
    const u = new (window as any).SpeechSynthesisUtterance("");
    u.volume = 0;
    (window as any).speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

async function askNova(question: string, lang: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/nova-help`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, language: lang }),
  });
  if (!res.ok) throw new Error("API error");
  const data = (await res.json()) as { response?: string; answer?: string };
  return data.response ?? data.answer ?? "Sorry, I couldn't get an answer right now.";
}

export default function NovaScreen() {
  const insets      = useSafeAreaInsets();
  const { language, toggleLanguage } = useAuth();
  const c           = colors.dark;
  const isES        = language === "es";

  // Keep native audio session active in background (mic + speaker through lock screen)
  useBackgroundAudio();

  const [messages,      setMessages]      = useState<Message[]>([]);
  const [input,         setInput]         = useState("");
  const [orbState,      setOrbState]      = useState<OrbState>("wake");
  const [micEnabled,    setMicEnabled]    = useState(true);
  const [errorMsg,      setErrorMsg]      = useState("");

  // Keep screen awake on web while mic is on so the lock screen doesn't cut the mic
  useWakeLock(micEnabled);
  // Web audio autoplay policy: speechSynthesis must be triggered by a user gesture.
  // On native it's always unlocked; on web we need a tap first.
  const [audioUnlocked, setAudioUnlocked] = useState(Platform.OS !== "web");
  const isBusyRef        = useRef(false);
  const audioUnlockedRef = useRef(Platform.OS !== "web"); // sync ref mirrors state
  const pendingSpeakRef  = useRef<{ text: string; onEnd?: () => void } | null>(null);

  const uid = () => Date.now().toString() + Math.random().toString(36).substring(2, 7);
  const addMessage = (role: "nova" | "user", text: string) =>
    setMessages(prev => [{ id: uid(), role, text }, ...prev]);

  // ─── TTS ────────────────────────────────────────────────────────────────
  const speakNova = useCallback((text: string, onEnd?: () => void) => {
    isBusyRef.current = true;
    setOrbState("speaking");
    if (!audioUnlockedRef.current) {
      // Audio locked — store pending, show visual state, onEnd fires after unlock
      pendingSpeakRef.current = { text, onEnd };
      return;
    }
    pendingSpeakRef.current = null;
    Speech.speak(text, {
      language: language === "es" ? "es-ES" : "en-US",
      rate: 1.05,
      pitch: 1.0,
      onDone:  () => { isBusyRef.current = false; setOrbState("wake"); onEnd?.(); },
      onError: () => { isBusyRef.current = false; setOrbState("wake"); onEnd?.(); },
    });
  }, [language]);

  // ─── Unlock audio (MUST be called synchronously in a gesture handler) ───
  const handleUnlockAudio = () => {
    unlockWebAudio();                      // fires synchronously — unlocks policy
    audioUnlockedRef.current = true;
    setAudioUnlocked(true);
    // If there's a queued utterance, speak it now
    const pending = pendingSpeakRef.current;
    pendingSpeakRef.current = null;
    const greeting = isES ? "Audio activado. Di Hey NOVA para comenzar." : "Audio enabled. Say Hey NOVA to begin.";
    const toSpeak  = pending ? pending.text : greeting;
    const toEnd    = pending?.onEnd;
    Speech.speak(toSpeak, {
      language: language === "es" ? "es-ES" : "en-US",
      rate: 1.05,
      pitch: 1.0,
      onDone:  () => { isBusyRef.current = false; setOrbState("wake"); toEnd?.(); },
      onError: () => { isBusyRef.current = false; setOrbState("wake"); toEnd?.(); },
    });
    if (!pending) addMessage("nova", greeting);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ─── Send a question to NOVA AI ─────────────────────────────────────────
  const sendQuestion = useCallback(async (q: string) => {
    if (!q.trim() || isBusyRef.current) return;
    const trimmed = q.trim();
    setInput("");
    setErrorMsg("");
    addMessage("user", trimmed);
    isBusyRef.current = true;
    setOrbState("thinking");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const answer = await askNova(trimmed, language);
      addMessage("nova", answer);
      speakNova(answer, () => {
        // Return mic to wake-word mode after speaking finishes
        wakeWordHook.returnToWake();
      });
    } catch {
      const err = isES
        ? "Tuve un problema. Intenta de nuevo."
        : "I had trouble answering. Try again.";
      addMessage("nova", err);
      isBusyRef.current = false;
      setOrbState("wake");
      wakeWordHook.returnToWake();
    }
  }, [language, speakNova, isES]);

  // ─── Wake word hook ──────────────────────────────────────────────────────
  const wakeWordHook = useWakeWordRecognition({
    language,
    enabled: micEnabled,
    onWakeWord: () => {
      if (isBusyRef.current) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOrbState("wake");
      const ack = isES ? "Sí, dime." : "Yes, go ahead.";
      addMessage("nova", ack);
      speakNova(ack);
    },
    onQuestion: (transcript) => {
      if (isBusyRef.current) return;
      sendQuestion(transcript);
    },
    onError: (msg) => {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 7000);
    },
  });

  const { mode, state: micState, interimText, isSupported } = wakeWordHook;

  // Auto-enable mic when screen gains focus; disable when leaving
  useFocusEffect(
    useCallback(() => {
      setMicEnabled(true);
      setOrbState("wake");
      return () => {
        setMicEnabled(false);
        Speech.stop();
        isBusyRef.current = false;
      };
    }, [])
  );

  // Sync orb to mic state
  const derivedOrb: OrbState =
    orbState === "thinking" || orbState === "speaking" ? orbState
    : micState === "listening" && mode === "wake"     ? "wake"
    : micState === "listening" && mode === "question"  ? "listening"
    : micState === "processing"                        ? "thinking"
    : "wake";

  // ─── Labels ─────────────────────────────────────────────────────────────
  const topLabel =
    derivedOrb === "speaking"  ? (isES ? "Respuesta de NOVA" : "NOVA responding")
    : derivedOrb === "thinking" ? (isES ? "Pensando…" : "Thinking…")
    : derivedOrb === "listening" ? (isES ? "Escuchando tu pregunta…" : "Listening for your question…")
    : mode === "wake"           ? (isES ? 'Di "Hey NOVA" para activar' : 'Say "Hey NOVA" to activate')
    : "";

  const subLabel =
    !isSupported
      ? (isES ? "Micrófono no disponible. Usa texto abajo." : "Mic unavailable. Use text below.")
      : micState === "starting"
      ? (isES ? "Iniciando micrófono…" : "Starting mic…")
      : "";

  const webTop = Platform.OS === "web" ? 67 : 0;

  // ─── Manual text submit ──────────────────────────────────────────────────
  const handleSubmit = () => { if (input.trim()) sendQuestion(input); };

  // ─── Manual tap on orb / mic area ───────────────────────────────────────
  const handleOrbTap = () => {
    if (derivedOrb === "speaking") {
      Speech.stop();
      isBusyRef.current = false;
      setOrbState("wake");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={[
        styles.header,
        { paddingTop: insets.top + 12 + webTop, backgroundColor: c.card, borderBottomColor: c.border }
      ]}>
        <View>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>NOVA Help</Text>
          <Text style={[styles.headerSub, { color: c.mutedForeground }]}>
            {isES ? "Entrenador de voz IA" : "AI Voice Coach"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={toggleLanguage}
            style={[styles.langBtn, { backgroundColor: c.secondary, borderColor: c.border }]}
          >
            <Text style={[styles.langBtnText, { color: c.foreground }]}>{language.toUpperCase()}</Text>
          </Pressable>
          {/* Mic toggle */}
          <Pressable
            onPress={() => setMicEnabled(v => !v)}
            style={[
              styles.iconBtn,
              { backgroundColor: micEnabled ? c.nova + "30" : c.muted, borderColor: micEnabled ? c.nova : c.border }
            ]}
          >
            <Feather name={micEnabled ? "mic" : "mic-off"} size={15}
              color={micEnabled ? c.novaPurple : c.mutedForeground} />
          </Pressable>
        </View>
      </View>

      {/* ── Audio unlock banner (web only, one-time tap) ── */}
      {!audioUnlocked && (
        <Pressable
          onPress={handleUnlockAudio}
          style={({ pressed }) => [
            styles.unlockBanner,
            { backgroundColor: pressed ? c.primary + "ee" : c.primary, opacity: pressed ? 0.92 : 1 },
          ]}
        >
          <Feather name="volume-2" size={16} color={c.primaryForeground} />
          <Text style={[styles.unlockText, { color: c.primaryForeground }]}>
            {isES ? "Toca aquí para activar el audio de NOVA" : "Tap here to enable NOVA's voice"}
          </Text>
          <Feather name="chevron-right" size={16} color={c.primaryForeground} />
        </Pressable>
      )}

      {/* Error banner */}
      {errorMsg ? (
        <View style={[styles.banner, { backgroundColor: "rgba(224,53,53,0.12)", borderColor: "rgba(224,53,53,0.3)" }]}>
          <Feather name="alert-circle" size={13} color={c.destructive} />
          <Text style={[styles.bannerText, { color: c.destructive }]}>{errorMsg}</Text>
        </View>
      ) : null}

      {/* ── Orb section ── */}
      <Pressable style={styles.orbArea} onPress={handleOrbTap}>
        <NovaOrb state={derivedOrb} size={130} />

        {/* Wake word ring label */}
        {mode === "wake" && micState === "listening" && (
          <View style={[styles.wakeRing, { borderColor: c.nova + "50", backgroundColor: c.nova + "10" }]}>
            <View style={[styles.wakeRingDot, { backgroundColor: c.nova }]} />
            <Text style={[styles.wakeRingText, { color: c.novaPurple }]}>
              {isES ? 'Esperando "Hey NOVA"' : 'Waiting for "Hey NOVA"'}
            </Text>
          </View>
        )}

        <Text style={[
          styles.orbLabel,
          {
            color: derivedOrb === "speaking"  ? c.novaPurple
              : derivedOrb === "thinking"     ? c.primary
              : derivedOrb === "listening"    ? c.primary
              : c.mutedForeground,
            marginTop: mode === "wake" && micState === "listening" ? 8 : 14,
          }
        ]}>
          {topLabel}
        </Text>

        {subLabel ? (
          <Text style={[styles.subLabel, { color: c.mutedForeground }]}>{subLabel}</Text>
        ) : null}

        {(derivedOrb === "thinking" || micState === "starting") && (
          <ActivityIndicator color={c.primary} size="small" style={{ marginTop: 6 }} />
        )}

        {derivedOrb === "speaking" && (
          <Text style={[styles.tapHint, { color: c.mutedForeground }]}>
            {isES ? "Toca para detener" : "Tap to stop"}
          </Text>
        )}
      </Pressable>

      {/* Interim transcript preview */}
      {interimText ? (
        <View style={[styles.interimBox, { backgroundColor: c.nova + "15", borderColor: c.nova + "35" }]}>
          <Text style={[styles.interimText, { color: c.mutedForeground }]} numberOfLines={2}>
            "{interimText}"
          </Text>
        </View>
      ) : null}

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        inverted
        style={styles.msgList}
        contentContainerStyle={styles.msgContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: m }) => (
          <View style={[
            styles.bubble,
            m.role === "nova"
              ? { backgroundColor: "rgba(124,58,237,0.14)", borderColor: "rgba(124,58,237,0.28)", alignSelf: "flex-start" as const }
              : { backgroundColor: c.secondary, borderColor: c.border, alignSelf: "flex-end" as const },
          ]}>
            {m.role === "nova" && <Text style={[styles.bubbleRole, { color: c.nova }]}>NOVA</Text>}
            <Text style={[styles.bubbleText, { color: c.foreground }]}>{m.text}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>
              {isES ? "NOVA lista para ayudarte" : "NOVA is ready for you"}
            </Text>
            <Text style={[styles.emptyBody, { color: c.mutedForeground }]}>
              {isSupported
                ? (isES
                  ? 'Di "Hey NOVA" para comenzar, o escribe tu pregunta abajo.'
                  : 'Say "Hey NOVA" to start, or type your question below.')
                : (isES
                  ? "El micrófono no está disponible en este navegador. Escribe tu pregunta abajo."
                  : "Mic unavailable in this browser. Type your question below.")}
            </Text>
          </View>
        }
      />

      {/* Text input */}
      <View style={[
        styles.inputBar,
        { backgroundColor: c.card, borderTopColor: c.border, paddingBottom: insets.bottom + 8 + (Platform.OS === "web" ? 34 : 0) }
      ]}>
        <TextInput
          style={[styles.textInput, { backgroundColor: c.input, borderColor: c.border, color: c.foreground }]}
          placeholder={isES ? 'O escribe tu pregunta…' : 'Or type your question…'}
          placeholderTextColor={c.mutedForeground}
          value={input}
          onChangeText={setInput}
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
          editable={derivedOrb !== "thinking" && derivedOrb !== "speaking"}
        />
        <Pressable
          onPress={handleSubmit}
          disabled={!input.trim() || derivedOrb === "thinking"}
          style={({ pressed }) => [
            styles.sendBtn,
            { backgroundColor: c.nova, opacity: pressed || !input.trim() || derivedOrb === "thinking" ? 0.4 : 1 }
          ]}
        >
          <Feather name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" as const },
  headerSub:   { fontSize: 12, marginTop: 2 },
  headerRight: { flexDirection: "row", gap: 8, alignItems: "center" },
  langBtn:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  langBtnText: { fontSize: 12, fontWeight: "700" as const, letterSpacing: 1 },
  iconBtn:     { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  unlockBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    margin: 10, marginBottom: 0, padding: 14, borderRadius: 12,
  },
  unlockText: { flex: 1, fontSize: 14, fontWeight: "600" as const },
  banner: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    margin: 10, marginBottom: 0, padding: 11, borderRadius: 10, borderWidth: 1,
  },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 18 },
  orbArea: { alignItems: "center", paddingTop: 22, paddingBottom: 10, gap: 6 },
  wakeRing: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 10, paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  wakeRingDot:  { width: 6, height: 6, borderRadius: 3 },
  wakeRingText: { fontSize: 13, fontWeight: "600" as const },
  orbLabel:     { fontSize: 13, fontWeight: "500" as const, textAlign: "center", letterSpacing: 0.2 },
  subLabel:     { fontSize: 12, textAlign: "center" },
  tapHint:      { fontSize: 12, marginTop: 2 },
  interimBox:   { marginHorizontal: 20, marginBottom: 4, padding: 10, borderRadius: 10, borderWidth: 1 },
  interimText:  { fontSize: 14, fontStyle: "italic" as const, textAlign: "center" },
  msgList:      { flex: 1 },
  msgContent:   { padding: 14, gap: 8, flexGrow: 1, justifyContent: "flex-end" },
  bubble:       { borderRadius: 14, padding: 12, borderWidth: 1, maxWidth: "88%" },
  bubbleRole:   { fontSize: 10, fontWeight: "700" as const, letterSpacing: 1, marginBottom: 4 },
  bubbleText:   { fontSize: 14, lineHeight: 21 },
  emptyState:   { alignItems: "center", gap: 8, paddingVertical: 20, paddingHorizontal: 28 },
  emptyTitle:   { fontSize: 16, fontWeight: "600" as const, textAlign: "center" },
  emptyBody:    { fontSize: 14, textAlign: "center", lineHeight: 20 },
  inputBar:     { borderTopWidth: 1, padding: 10 },
  inputRow:     { flexDirection: "row", gap: 8, alignItems: "center" },
  textInput: {
    flex: 1, height: 46, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, fontSize: 14,
  },
  sendBtn: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
