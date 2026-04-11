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
  const { user, language, toggleLanguage } = useAuth();
  const c = colors.dark;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [orbState, setOrbState] = useState<OrbState>("wake");
  const [sessionActive, setSessionActive] = useState(false);
  const isSpeakingRef = useRef(false);
  const flatListRef = useRef<FlatList>(null);

  const uid = () => Date.now().toString() + Math.random().toString(36).substring(2, 7);

  const addMessage = (role: "nova" | "user", text: string) => {
    const msg: Message = { id: uid(), role, text };
    setMessages((prev) => [msg, ...prev]);
    return msg;
  };

  const speakNova = useCallback((text: string, onEnd?: () => void) => {
    isSpeakingRef.current = true;
    setOrbState("speaking");
    Speech.speak(text, {
      language: language === "es" ? "es-ES" : "en-US",
      rate: 1.05,
      pitch: 1.0,
      onDone: () => {
        isSpeakingRef.current = false;
        setOrbState("wake");
        onEnd?.();
      },
      onError: () => {
        isSpeakingRef.current = false;
        setOrbState("wake");
        onEnd?.();
      },
    });
  }, [language]);

  const stopSpeaking = () => {
    Speech.stop();
    isSpeakingRef.current = false;
    setOrbState(sessionActive ? "wake" : "idle");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const startSession = () => {
    setSessionActive(true);
    setMessages([]);
    setOrbState("wake");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const greeting = language === "es"
      ? "Sesión activa. Di tu pregunta o escríbela abajo."
      : "Session active. Ask me anything about your warehouse assignment.";
    addMessage("nova", greeting);
    speakNova(greeting);
  };

  const sendQuestion = async (q: string) => {
    if (!q.trim()) return;
    setInput("");
    if (!sessionActive) setSessionActive(true);

    addMessage("user", q.trim());
    setOrbState("thinking");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const answer = await askNova(q.trim(), language);
      addMessage("nova", answer);
      speakNova(answer);
    } catch {
      const err = language === "es"
        ? "Tuve un problema. Intenta de nuevo."
        : "I had trouble answering that. Please try again.";
      addMessage("nova", err);
      speakNova(err);
    }
  };

  const handleSubmit = () => {
    if (input.trim()) sendQuestion(input);
  };

  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  const isLangES = language === "es";

  const phaseLabel =
    orbState === "speaking"  ? (isLangES ? "Toca para detener" : "Tap to stop")
    : orbState === "thinking" ? (isLangES ? "Pensando…" : "Thinking…")
    : orbState === "wake"     ? (isLangES ? "Pregúntame algo" : "Ask me anything")
    : (isLangES ? "NOVA inactiva" : "NOVA idle");

  const webTop = Platform.OS === "web" ? 67 : 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[
        styles.header,
        { paddingTop: insets.top + 12 + webTop, backgroundColor: c.card, borderBottomColor: c.border }
      ]}>
        <View>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>NOVA Help</Text>
          <Text style={[styles.headerSub, { color: c.mutedForeground }]}>
            {isLangES ? "Entrenador de voz" : "Voice coach"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={toggleLanguage}
            style={[styles.langBtn, { backgroundColor: c.secondary, borderColor: c.border }]}
          >
            <Text style={[styles.langBtnText, { color: c.foreground }]}>
              {language.toUpperCase()}
            </Text>
          </Pressable>
          {sessionActive && (
            <Pressable
              onPress={() => { Speech.stop(); setSessionActive(false); setOrbState("idle"); setMessages([]); }}
              style={[styles.endBtn, { backgroundColor: c.muted, borderColor: c.border }]}
            >
              <Feather name="x" size={16} color={c.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Orb area */}
      <Pressable
        onPress={orbState === "speaking" ? stopSpeaking : undefined}
        style={styles.orbArea}
      >
        <NovaOrb state={orbState} size={140} />
        <Text style={[styles.phaseLabel, {
          color: orbState === "thinking" ? c.primary
          : orbState === "speaking" ? c.novaPurple
          : c.mutedForeground,
          marginTop: 16,
        }]}>
          {phaseLabel}
        </Text>
        {orbState === "thinking" && (
          <ActivityIndicator color={c.primary} size="small" style={{ marginTop: 8 }} />
        )}
      </Pressable>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        inverted
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={messages.length > 0}
        renderItem={({ item: m }) => (
          <View style={[
            styles.bubble,
            m.role === "nova"
              ? [styles.novaBubble, { backgroundColor: "rgba(124,58,237,0.15)", borderColor: "rgba(124,58,237,0.3)" }]
              : [styles.userBubble, { backgroundColor: c.secondary, borderColor: c.border }],
          ]}>
            {m.role === "nova" && (
              <Text style={[styles.bubbleLabel, { color: c.nova }]}>NOVA</Text>
            )}
            <Text style={[styles.bubbleText, { color: m.role === "nova" ? c.foreground : c.foreground }]}>
              {m.text}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          !sessionActive ? (
            <View style={styles.emptyState}>
              <Feather name="mic" size={28} color={c.mutedForeground} />
              <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
                {isLangES ? "Inicia una sesión para comenzar" : "Start a session to begin"}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Bottom area */}
      <View style={[
        styles.bottom,
        { backgroundColor: c.card, borderTopColor: c.border, paddingBottom: insets.bottom + 8 + (Platform.OS === "web" ? 34 : 0) }
      ]}>
        {!sessionActive ? (
          <Pressable
            style={({ pressed }) => [styles.startBtn, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}
            onPress={startSession}
          >
            <Feather name="mic" size={20} color={c.primaryForeground} />
            <Text style={[styles.startBtnText, { color: c.primaryForeground }]}>
              {isLangES ? "Iniciar Sesión" : "Start Session"}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.textInput, { backgroundColor: c.input, borderColor: c.border, color: c.foreground }]}
              placeholder={isLangES ? "Escribe tu pregunta…" : "Type your question…"}
              placeholderTextColor={c.mutedForeground}
              value={input}
              onChangeText={setInput}
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
              editable={orbState !== "thinking"}
            />
            <Pressable
              onPress={handleSubmit}
              disabled={!input.trim() || orbState === "thinking"}
              style={({ pressed }) => [
                styles.sendBtn,
                { backgroundColor: c.nova, opacity: pressed || !input.trim() || orbState === "thinking" ? 0.5 : 1 }
              ]}
            >
              <Feather name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        )}
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
  endBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  orbArea: {
    alignItems: "center",
    paddingVertical: 28,
  },
  phaseLabel: { fontSize: 13, fontWeight: "500" as const, letterSpacing: 0.3 },
  messageList: { flex: 1 },
  messageContent: { padding: 16, gap: 10, flexGrow: 1, justifyContent: "flex-end" },
  bubble: {
    borderRadius: 14, padding: 14, borderWidth: 1, maxWidth: "90%",
  },
  novaBubble: { alignSelf: "flex-start" },
  userBubble: { alignSelf: "flex-end" },
  bubbleLabel: { fontSize: 10, fontWeight: "700" as const, letterSpacing: 1, marginBottom: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  emptyState: { alignItems: "center", gap: 10, paddingVertical: 24 },
  emptyText: { fontSize: 14, textAlign: "center" },
  bottom: { borderTopWidth: 1, padding: 12 },
  startBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, height: 54, borderRadius: 14,
  },
  startBtnText: { fontSize: 16, fontWeight: "700" as const },
  inputRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  textInput: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, fontSize: 15,
  },
  sendBtn: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
});
