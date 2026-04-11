import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

type OrbState = "idle" | "wake" | "listening" | "thinking" | "speaking";
interface Message { id: string; role: "nova" | "user"; text: string; }

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
  const insets = useSafeAreaInsets();
  const { language, toggleLanguage } = useAuth();
  const c = colors.dark;
  const isES = language === "es";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [sessionActive, setSessionActive] = useState(false);
  const [errorBanner, setErrorBanner] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const uid = () => Date.now().toString() + Math.random().toString(36).substring(2, 7);

  const addMessage = (role: "nova" | "user", text: string) => {
    setMessages((prev) => [{ id: uid(), role, text }, ...prev]);
  };

  const speakNova = useCallback((text: string, onEnd?: () => void) => {
    setOrbState("speaking");
    Speech.speak(text, {
      language: language === "es" ? "es-ES" : "en-US",
      rate: 1.05,
      pitch: 1.0,
      onDone: () => { setOrbState("wake"); onEnd?.(); },
      onError: () => { setOrbState("wake"); onEnd?.(); },
    });
  }, [language]);

  const sendQuestion = useCallback(async (q: string) => {
    if (!q.trim()) return;
    const trimmed = q.trim();
    setInput("");
    if (!sessionActive) setSessionActive(true);
    addMessage("user", trimmed);
    setOrbState("thinking");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const answer = await askNova(trimmed, language);
      addMessage("nova", answer);
      speakNova(answer);
    } catch {
      const err = isES
        ? "Tuve un problema. Intenta de nuevo."
        : "I had trouble answering that. Please try again.";
      addMessage("nova", err);
      setOrbState("wake");
    }
  }, [sessionActive, language, speakNova, isES]);

  const { state: micState, interimText, start: startMic, stop: stopMic, isSupported } =
    useSpeechRecognition({
      language,
      onResult: (transcript) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        sendQuestion(transcript);
      },
      onError: (msg) => {
        setErrorBanner(msg);
        setTimeout(() => setErrorBanner(""), 5000);
        setOrbState("wake");
      },
    });

  // Sync mic state → orb state
  useEffect(() => {
    if (micState === "listening") setOrbState("listening");
    else if (micState === "processing") setOrbState("thinking");
    else if (orbState === "listening") setOrbState("wake");
  }, [micState]);

  const handleMicPress = () => {
    if (!sessionActive) {
      startSession();
      return;
    }
    if (orbState === "speaking") {
      Speech.stop();
      setOrbState("wake");
      return;
    }
    if (micState === "listening") {
      stopMic();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (orbState !== "thinking") {
      setErrorBanner("");
      startMic();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const startSession = () => {
    setSessionActive(true);
    setMessages([]);
    setOrbState("wake");
    setErrorBanner("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const greeting = isES
      ? "Sesión activa. Toca el micrófono y haz tu pregunta."
      : "Session active. Tap the mic and ask your question.";
    addMessage("nova", greeting);
    speakNova(greeting);
  };

  const endSession = () => {
    Speech.stop();
    stopMic();
    setSessionActive(false);
    setOrbState("idle");
    setMessages([]);
    setErrorBanner("");
  };

  const handleSubmit = () => {
    if (input.trim()) sendQuestion(input.trim());
  };

  useEffect(() => {
    return () => { Speech.stop(); stopMic(); };
  }, []);

  const webTop = Platform.OS === "web" ? 67 : 0;

  const orbLabel =
    orbState === "speaking"  ? (isES ? "Toca el micrófono para interrumpir" : "Tap mic to interrupt")
    : orbState === "thinking" ? (isES ? "Pensando…" : "Thinking…")
    : orbState === "listening" ? (isES ? "Escuchando…" : "Listening…")
    : sessionActive          ? (isES ? "Toca el micrófono para hablar" : "Tap the mic to speak")
    : (isES ? "Toca para comenzar" : "Tap to start");

  const micActive = micState === "listening";
  const micDisabled = orbState === "thinking";

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
          {sessionActive && (
            <Pressable onPress={endSession}
              style={[styles.iconBtn, { backgroundColor: c.muted, borderColor: c.border }]}
            >
              <Feather name="x" size={16} color={c.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Error banner */}
      {errorBanner ? (
        <View style={[styles.errorBanner, { backgroundColor: "rgba(224,53,53,0.15)", borderColor: "rgba(224,53,53,0.35)" }]}>
          <Feather name="alert-circle" size={14} color={c.destructive} />
          <Text style={[styles.errorText, { color: c.destructive }]}>{errorBanner}</Text>
        </View>
      ) : null}

      {/* Orb + mic button area */}
      <View style={styles.orbArea}>
        <NovaOrb state={orbState} size={120} />

        <Text style={[styles.orbLabel, {
          color: orbState === "listening" ? c.primary
          : orbState === "speaking"  ? c.novaPurple
          : orbState === "thinking"  ? c.primary
          : c.mutedForeground,
          marginTop: 14,
        }]}>
          {orbLabel}
        </Text>

        {orbState === "thinking" && (
          <ActivityIndicator color={c.primary} size="small" style={{ marginTop: 6 }} />
        )}

        {/* Interim voice text preview */}
        {interimText ? (
          <View style={[styles.interimBox, { backgroundColor: "rgba(124,58,237,0.12)", borderColor: "rgba(124,58,237,0.3)" }]}>
            <Text style={[styles.interimText, { color: c.mutedForeground }]} numberOfLines={2}>
              "{interimText}"
            </Text>
          </View>
        ) : null}

        {/* Large mic button */}
        <Pressable
          onPress={handleMicPress}
          disabled={micDisabled}
          style={({ pressed }) => [
            styles.bigMicBtn,
            {
              backgroundColor: micActive
                ? c.primary
                : orbState === "speaking"
                ? c.nova
                : c.secondary,
              borderColor: micActive
                ? c.primary
                : orbState === "speaking"
                ? c.nova
                : c.border,
              opacity: micDisabled ? 0.4 : pressed ? 0.75 : 1,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}
        >
          <Feather
            name={micActive ? "mic" : orbState === "speaking" ? "volume-x" : "mic"}
            size={28}
            color={micActive ? c.primaryForeground : orbState === "speaking" ? "#fff" : c.mutedForeground}
          />
        </Pressable>

        {/* Mic label */}
        <Text style={[styles.micHint, { color: c.mutedForeground }]}>
          {micActive
            ? (isES ? "Toca para enviar" : "Tap to send")
            : orbState === "speaking"
            ? (isES ? "Toca para detener" : "Tap to stop")
            : !isSupported
            ? (isES ? "Escribe abajo (voz no disponible)" : "Type below (voice unavailable)")
            : (isES ? "Toca para hablar" : "Tap to speak")}
        </Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        inverted
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: m }) => (
          <View style={[
            styles.bubble,
            m.role === "nova"
              ? { backgroundColor: "rgba(124,58,237,0.15)", borderColor: "rgba(124,58,237,0.3)", alignSelf: "flex-start" as const }
              : { backgroundColor: c.secondary, borderColor: c.border, alignSelf: "flex-end" as const },
          ]}>
            {m.role === "nova" && (
              <Text style={[styles.bubbleLabel, { color: c.nova }]}>NOVA</Text>
            )}
            <Text style={[styles.bubbleText, { color: c.foreground }]}>{m.text}</Text>
          </View>
        )}
        ListEmptyComponent={
          sessionActive ? null : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: c.foreground }]}>
                {isES ? "NOVA lista" : "NOVA ready"}
              </Text>
              <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
                {isES
                  ? "Toca el micrófono arriba para hacer una pregunta de voz, o escribe abajo."
                  : "Tap the mic above to ask a voice question, or type below."}
              </Text>
            </View>
          )
        }
      />

      {/* Text input row */}
      <View style={[
        styles.bottom,
        { backgroundColor: c.card, borderTopColor: c.border, paddingBottom: insets.bottom + 8 + (Platform.OS === "web" ? 34 : 0) }
      ]}>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.textInput, { backgroundColor: c.input, borderColor: c.border, color: c.foreground }]}
            placeholder={isES ? "O escribe tu pregunta aquí…" : "Or type your question here…"}
            placeholderTextColor={c.mutedForeground}
            value={input}
            onChangeText={setInput}
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
            editable={orbState !== "thinking" && !micActive}
          />
          <Pressable
            onPress={handleSubmit}
            disabled={!input.trim() || orbState === "thinking"}
            style={({ pressed }) => [
              styles.sendBtn,
              { backgroundColor: c.nova, opacity: pressed || !input.trim() || orbState === "thinking" ? 0.45 : 1 }
            ]}
          >
            <Feather name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" as const },
  headerSub: { fontSize: 12, marginTop: 2 },
  headerRight: { flexDirection: "row", gap: 8, alignItems: "center" },
  langBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1,
  },
  langBtnText: { fontSize: 12, fontWeight: "700" as const, letterSpacing: 1 },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    margin: 12,
    marginBottom: 0,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  orbArea: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 16,
    gap: 10,
  },
  orbLabel: {
    fontSize: 13,
    fontWeight: "500" as const,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  interimBox: {
    marginHorizontal: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  interimText: { fontSize: 14, fontStyle: "italic" as const, textAlign: "center" },
  bigMicBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  micHint: { fontSize: 12, letterSpacing: 0.2 },
  messageList: { flex: 1 },
  messageContent: { padding: 14, gap: 8, flexGrow: 1, justifyContent: "flex-end" },
  bubble: {
    borderRadius: 14, padding: 13, borderWidth: 1,
    maxWidth: "88%",
  },
  bubbleLabel: { fontSize: 10, fontWeight: "700" as const, letterSpacing: 1, marginBottom: 4 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  emptyState: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600" as const },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  bottom: { borderTopWidth: 1, padding: 10 },
  inputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  textInput: {
    flex: 1, height: 46, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, fontSize: 14,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
});
