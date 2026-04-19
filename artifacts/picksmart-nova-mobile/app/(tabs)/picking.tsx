import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";
import colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import NovaOrb from "@/components/NovaOrb";
import { useWakeWordRecognition } from "@/hooks/useSpeechRecognition";
import { useBackgroundAudio } from "@/hooks/useBackgroundAudio";
import { useForegroundService } from "@/hooks/useForegroundService";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://nova-warehouse-control.replit.app";
const c = colors.dark;

type Phase = string;

interface Stop {
  aisle: number;
  slot: number;
  checkCode: string;
  qty: number;
  stopOrder: number;
}

interface Assignment {
  id: string;
  assignmentNumber: string;
  startAisle: number;
  endAisle: number;
  totalCases: number;
  pallets: number;
  goalTimeMinutes: number;
  doorNumber: number;
  doorCode: string;
  stops: number;
  type: string;
}

interface TrainerState {
  phase: Phase;
  prompt: string;
  seq: number;
  equipmentId: string;
  maxPalletCount: string;
  activeAssignment: Assignment | null;
  currentStop: Stop | null;
  nextStop: Stop | null;
  invalidCount: number;
  autoAdvance?: boolean;
  autoAdvanceDelayMs?: number;
  commandLog: { id: number; type: string; text: string; at: string }[];
}

function buildWsUrl() {
  const base = API_BASE.replace(/^https?:\/\//, "");
  const proto = API_BASE.startsWith("https") ? "wss" : "ws";
  return `${proto}://${base}/api/ws/nova-trainer`;
}

/** Map a matched command key (from matchCommand) to what the NOVA server expects */
function commandKeyToInput(key: string): string {
  switch (key) {
    case "confirm":    return "confirm";
    case "deny":       return "no";
    case "ready":      return "ready";
    case "load_picks": return "load picks";
    case "stop":       return "stop";
    case "resume":     return "resume";
    case "repeat":     return "repeat";
    case "wake":       return "hey nova";
    default:           return key;
  }
}

export default function PickingScreen() {
  const insets = useSafeAreaInsets();
  const { user, token, language } = useAuth();
  const isES = language === "es";
  const webTop = Platform.OS === "web" ? 67 : 0;

  const wsRef = useRef<WebSocket | null>(null);
  const seqRef = useRef(-1);
  const autoAdvTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState]         = useState<TrainerState | null>(null);
  const [wsStatus, setWsStatus]   = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const [novaIdInput, setNovaIdInput] = useState(user?.novaId ?? "");
  const [checkInput, setCheckInput]   = useState("");
  const [sessionActive, setSessionActive] = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceError, setVoiceError]   = useState<string | null>(null);
  const voicePrefLoadedRef = useRef(false);

  useBackgroundAudio();
  useForegroundService(sessionActive && voiceEnabled, isES);

  // Load persisted voice preference for this user
  useEffect(() => {
    if (!user?.id) return;
    const key = `nova_voice_${user.id}`;
    AsyncStorage.getItem(key).then((val) => {
      if (val !== null) {
        setVoiceEnabled(val === "true");
      }
      voicePrefLoadedRef.current = true;
    });
  }, [user?.id]);

  // Save voice preference whenever it changes (after initial load)
  useEffect(() => {
    if (!user?.id || !voicePrefLoadedRef.current) return;
    const key = `nova_voice_${user.id}`;
    AsyncStorage.setItem(key, String(voiceEnabled));
  }, [voiceEnabled, user?.id]);

  const speak = useCallback((text: string, onDone?: () => void) => {
    if (!text) return;
    setIsSpeaking(true);
    Speech.speak(text, {
      language: isES ? "es-ES" : "en-US",
      rate: 1.0,
      pitch: 1.0,
      onDone: () => { setIsSpeaking(false); onDone?.(); },
      onError: () => { setIsSpeaking(false); onDone?.(); },
    });
  }, [isES]);

  const sendWs = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const sendInput = useCallback((text: string) => {
    sendWs({ type: "input", text });
  }, [sendWs]);

  const handleVoiceAction = useCallback((cmd: string) => {
    sendInput(cmd);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [sendInput]);

  // ── Voice recognition callbacks ────────────────────────────────────────────

  const onWakeWord = useCallback(() => {
    // Wake word detected — trigger the session wake action
    handleVoiceAction("hey nova");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [handleVoiceAction]);

  const onQuestion = useCallback((transcript: string) => {
    // transcript is either a command key (from matchCommand) or raw text (check codes)
    const input = commandKeyToInput(transcript);
    sendInput(input);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [sendInput]);

  const onVoiceError = useCallback((msg: string) => {
    setVoiceError(msg);
  }, []);

  const { state: speechState, interimText, isSupported, returnToWake } =
    useWakeWordRecognition({
      language: (language as "en" | "es") ?? "en",
      enabled: sessionActive && voiceEnabled,
      onWakeWord,
      onQuestion,
      onError: onVoiceError,
    });

  // After NOVA finishes speaking, return mic to wake-word listening mode
  useEffect(() => {
    if (!isSpeaking && sessionActive && voiceEnabled) {
      returnToWake();
    }
  }, [isSpeaking]);

  // ── Session state handler ──────────────────────────────────────────────────

  const handleState = useCallback((s: TrainerState) => {
    if (s.seq <= seqRef.current) return;
    seqRef.current = s.seq;
    setState(s);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (autoAdvTimerRef.current) clearTimeout(autoAdvTimerRef.current);
    if (s.autoAdvance) {
      autoAdvTimerRef.current = setTimeout(() => {
        sendWs({ type: "input", text: "__AUTO_NEXT__" });
        speak(s.prompt);
      }, s.autoAdvanceDelayMs ?? 700);
    } else {
      speak(s.prompt);
    }
  }, [sendWs, speak]);

  // ── WebSocket ──────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (!user) return;
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    setWsStatus("connecting");
    const ws = new WebSocket(buildWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("connected");
      ws.send(JSON.stringify({
        type: "init",
        token: token ?? undefined,
        selector: {
          userId: user.id || `mobile-${user.username}`,
          novaId: novaIdInput.trim() || user.username,
          fullName: user.name,
        },
        lang: language,
      }));
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data));
        if (msg.type === "state") handleState(msg.state);
      } catch { /* ignore */ }
    };

    ws.onclose = () => { setWsStatus("disconnected"); };
    ws.onerror = () => { setWsStatus("disconnected"); };
  }, [user, token, novaIdInput, language, handleState]);

  const startSession = async () => {
    setVoiceError(null);
    // On native, request mic + speech-recognition permissions before starting.
    // If denied, auto-disable voice so the picker can still use touch buttons.
    if (Platform.OS === "ios" || Platform.OS === "android") {
      try {
        const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!granted) {
          setVoiceEnabled(false);
          setVoiceError(
            isES
              ? "Permiso de micrófono denegado. Puedes usar los botones táctiles."
              : "Microphone permission denied. You can still use the touch buttons."
          );
        }
      } catch {
        // Permissions API unavailable (e.g. simulator) — proceed with current voice setting
      }
    }
    setSessionActive(true);
    connect();
  };

  const endSession = () => {
    setSessionActive(false);
    Speech.stop();
    wsRef.current?.close();
    wsRef.current = null;
    setState(null);
    seqRef.current = -1;
    setCheckInput("");
    setVoiceError(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        Speech.stop();
        if (autoAdvTimerRef.current) clearTimeout(autoAdvTimerRef.current);
      };
    }, [])
  );

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      if (autoAdvTimerRef.current) clearTimeout(autoAdvTimerRef.current);
    };
  }, []);

  const handleCheckCode = () => {
    if (!checkInput.trim()) return;
    sendInput(checkInput.trim());
    setCheckInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const phase = state?.phase ?? "";
  const isPickCheck = phase === "PICK_CHECK";
  const isWaiting   = phase === "WAIT_WAKE" || phase === "STOPPED" || !phase;
  const isComplete  = phase.startsWith("COMPLETE");

  // Orb state: voice recognition states take priority while the session is active
  const orbState: "idle" | "wake" | "listening" | "thinking" | "speaking" =
    isSpeaking ? "speaking"
    : wsStatus === "connecting" ? "thinking"
    : sessionActive && voiceEnabled && speechState === "listening" ? "listening"
    : sessionActive && voiceEnabled && speechState === "processing" ? "thinking"
    : sessionActive ? "wake"
    : "idle";

  // ── Pre-session screen ─────────────────────────────────────────────────────

  if (!sessionActive) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: c.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 + webTop, backgroundColor: c.card, borderBottomColor: c.border }]}>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>NOVA Picking</Text>
          <Text style={[styles.headerSub, { color: c.mutedForeground }]}>
            {isES ? "Sistema de selección por voz" : "Voice-directed picking"}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.startContent} showsVerticalScrollIndicator={false}>
          <View style={styles.orbCenter}>
            <NovaOrb state="idle" size={120} />
            <Text style={[styles.orbSubtitle, { color: c.mutedForeground }]}>
              {isES ? "NOVA lista para guiarte" : "NOVA ready to guide you"}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.cardLabel, { color: c.mutedForeground }]}>
              {isES ? "TU ID DE NOVA" : "YOUR NOVA ID"}
            </Text>
            <TextInput
              style={[styles.novaInput, { backgroundColor: c.input, borderColor: c.primary, color: c.foreground }]}
              placeholder={isES ? "Ingresa tu NOVA ID" : "Enter your NOVA ID"}
              placeholderTextColor={c.mutedForeground}
              value={novaIdInput}
              onChangeText={setNovaIdInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={[styles.hint, { color: c.mutedForeground }]}>
              {isES ? "Tu entrenador te dio este código." : "Your trainer provided this code."}
            </Text>
          </View>

          <Pressable
            onPress={startSession}
            disabled={!novaIdInput.trim()}
            style={({ pressed }) => [
              styles.startBtn,
              { backgroundColor: c.primary, opacity: pressed || !novaIdInput.trim() ? 0.5 : 1 }
            ]}
          >
            <Feather name="zap" size={18} color={c.primaryForeground} />
            <Text style={[styles.startBtnText, { color: c.primaryForeground }]}>
              {isES ? "Iniciar Sesión NOVA" : "Start NOVA Session"}
            </Text>
          </Pressable>

          <View style={[styles.infoBox, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.infoTitle, { color: c.foreground }]}>
              {isES ? "Cómo funciona" : "How it works"}
            </Text>
            {[
              isES ? "Ingresa tu NOVA ID para cargar tu asignación" : "Enter your NOVA ID to load your assignment",
              isES ? "Di \"Hola NOVA\" o usa los botones para comenzar" : 'Say "Hey NOVA" or use buttons to start',
              isES ? "NOVA te guía a cada ranura y cantidad" : "NOVA guides you to each slot and quantity",
              isES ? "Di el código de verificación para confirmar" : "Say the check code to confirm each pick",
            ].map((t, i) => (
              <View key={i} style={styles.infoRow}>
                <View style={[styles.infoDot, { backgroundColor: c.primary }]} />
                <Text style={[styles.infoText, { color: c.mutedForeground }]}>{t}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Active session screen ──────────────────────────────────────────────────

  const voiceStatusLabel = (() => {
    if (!isSupported) return null;
    if (!voiceEnabled) return isES ? "Voz desactivada" : "Voice off";
    if (speechState === "listening") return isES ? "Escuchando…" : "Listening…";
    if (speechState === "processing") return isES ? "Procesando…" : "Processing…";
    if (speechState === "starting") return isES ? "Iniciando mic…" : "Starting mic…";
    return isES ? "Di: Hey NOVA" : "Say: Hey NOVA";
  })();

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 + webTop, backgroundColor: c.card, borderBottomColor: c.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>NOVA Picking</Text>
          <Text style={[styles.headerSub, { color: wsStatus === "connected" ? "#22c55e" : c.mutedForeground }]}>
            {wsStatus === "connecting" ? (isES ? "Conectando…" : "Connecting…")
              : wsStatus === "connected" ? (isES ? "Conectado · " + (novaIdInput || user?.username) : "Connected · " + (novaIdInput || user?.username))
              : (isES ? "Desconectado" : "Disconnected")}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {isSupported && (
            <Pressable
              onPress={() => { setVoiceEnabled(v => !v); setVoiceError(null); }}
              style={[
                styles.voiceToggleBtn,
                { borderColor: voiceEnabled ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.15)" },
              ]}
            >
              <Feather
                name={voiceEnabled ? "mic" : "mic-off"}
                size={14}
                color={voiceEnabled ? "#a78bfa" : c.mutedForeground}
              />
            </Pressable>
          )}
          <Pressable onPress={endSession} style={styles.endBtn}>
            <Feather name="x" size={14} color="#ef4444" />
            <Text style={styles.endBtnText}>{isES ? "Salir" : "End"}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.sessionScroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.orbCenter}>
          <NovaOrb state={orbState} size={110} />
          {voiceStatusLabel ? (
            <View style={[
              styles.voiceStatusPill,
              {
                backgroundColor: speechState === "listening"
                  ? "rgba(124,58,237,0.2)"
                  : speechState === "processing"
                  ? "rgba(245,194,0,0.15)"
                  : "rgba(255,255,255,0.06)",
                borderColor: speechState === "listening"
                  ? "rgba(124,58,237,0.5)"
                  : speechState === "processing"
                  ? "rgba(245,194,0,0.4)"
                  : "rgba(255,255,255,0.1)",
              }
            ]}>
              <Feather
                name={voiceEnabled ? "mic" : "mic-off"}
                size={11}
                color={
                  speechState === "listening" ? "#a78bfa"
                  : speechState === "processing" ? "#f5c200"
                  : c.mutedForeground
                }
              />
              <Text style={[
                styles.voiceStatusText,
                {
                  color: speechState === "listening" ? "#a78bfa"
                    : speechState === "processing" ? "#f5c200"
                    : c.mutedForeground
                }
              ]}>
                {voiceStatusLabel}
              </Text>
            </View>
          ) : null}
          {interimText ? (
            <Text style={[styles.interimText, { color: "#a78bfa" }]} numberOfLines={1}>
              "{interimText}"
            </Text>
          ) : null}
        </View>

        {voiceError ? (
          <View style={[styles.invalidBanner, { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)", marginBottom: 8 }]}>
            <Feather name="mic-off" size={13} color="#ef4444" />
            <Text style={styles.invalidText}>{voiceError}</Text>
          </View>
        ) : null}

        {state?.prompt ? (
          <View style={[styles.promptBox, { backgroundColor: "rgba(124,58,237,0.12)", borderColor: "rgba(124,58,237,0.3)" }]}>
            <Text style={[styles.promptLabel, { color: "#a78bfa" }]}>NOVA</Text>
            <Text style={[styles.promptText, { color: c.foreground }]}>{state.prompt}</Text>
          </View>
        ) : (
          <View style={[styles.promptBox, { backgroundColor: c.card, borderColor: c.border }]}>
            <ActivityIndicator color={c.primary} />
            <Text style={[styles.promptText, { color: c.mutedForeground }]}>
              {isES ? "Iniciando NOVA…" : "Starting NOVA…"}
            </Text>
          </View>
        )}

        {state?.currentStop && (
          <View style={[styles.stopCard, { backgroundColor: c.card, borderColor: c.primary + "55" }]}>
            <View style={styles.stopRow}>
              <View style={styles.stopItem}>
                <Text style={[styles.stopLabel, { color: c.mutedForeground }]}>{isES ? "PASILLO" : "AISLE"}</Text>
                <Text style={[styles.stopValue, { color: c.primary }]}>{state.currentStop.aisle}</Text>
              </View>
              <View style={[styles.stopDivider, { backgroundColor: c.border }]} />
              <View style={styles.stopItem}>
                <Text style={[styles.stopLabel, { color: c.mutedForeground }]}>{isES ? "RANURA" : "SLOT"}</Text>
                <Text style={[styles.stopValue, { color: c.primary }]}>{state.currentStop.slot}</Text>
              </View>
              <View style={[styles.stopDivider, { backgroundColor: c.border }]} />
              <View style={styles.stopItem}>
                <Text style={[styles.stopLabel, { color: c.mutedForeground }]}>{isES ? "CANTIDAD" : "QTY"}</Text>
                <Text style={[styles.stopValue, { color: "#22c55e" }]}>{state.currentStop.qty}</Text>
              </View>
            </View>
            {isPickCheck && (
              <View style={[styles.checkCodeRow, { borderTopColor: c.border }]}>
                <Text style={[styles.checkCodeLabel, { color: c.mutedForeground }]}>
                  {isES ? "Código de verificación:" : "Check code:"}
                </Text>
                <Text style={[styles.checkCode, { color: c.primary }]}>
                  {state.currentStop.checkCode}
                </Text>
              </View>
            )}
          </View>
        )}

        {state?.nextStop && (
          <View style={[styles.nextCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.nextLabel, { color: c.mutedForeground }]}>
              {isES ? "SIGUIENTE →" : "NEXT →"}
            </Text>
            <Text style={[styles.nextValue, { color: c.foreground }]}>
              {isES ? `Pasillo ${state.nextStop.aisle} · Ranura ${state.nextStop.slot}`
                     : `Aisle ${state.nextStop.aisle} · Slot ${state.nextStop.slot}`}
            </Text>
          </View>
        )}

        {isPickCheck && (
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.checkInput, { backgroundColor: c.input, borderColor: c.primary, color: c.foreground }]}
              placeholder={isES ? "Código de verificación" : "Check code"}
              placeholderTextColor={c.mutedForeground}
              value={checkInput}
              onChangeText={setCheckInput}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={handleCheckCode}
              autoFocus={!voiceEnabled || !isSupported}
            />
            <Pressable
              onPress={handleCheckCode}
              disabled={!checkInput.trim()}
              style={({ pressed }) => [styles.submitBtn, { backgroundColor: c.primary, opacity: pressed || !checkInput.trim() ? 0.5 : 1 }]}
            >
              <Feather name="check" size={20} color={c.primaryForeground} />
            </Pressable>
          </View>
        )}

        <View style={styles.buttonGrid}>
          {isWaiting && (
            <Pressable style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => handleVoiceAction("hey nova")}>
              <Feather name="mic" size={16} color="#0a0e1a" />
              <Text style={styles.actionBtnTextDark}>Hey NOVA</Text>
            </Pressable>
          )}
          {(phase === "SIGN_ON_EQUIPMENT" || phase === "CONFIRM_EQUIPMENT") && (
            <Pressable style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => handleVoiceAction("confirm")}>
              <Feather name="check-circle" size={16} color="#0a0e1a" />
              <Text style={styles.actionBtnTextDark}>{isES ? "Confirmar" : "Confirm"}</Text>
            </Pressable>
          )}
          {(phase === "SAFETY" || phase === "LOAD_SUMMARY" || phase === "SETUP_ALPHA" || phase === "SETUP_BRAVO" || phase === "PICK_READY") && (
            <Pressable style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => handleVoiceAction(isES ? "listo" : "ready")}>
              <Feather name="check" size={16} color="#0a0e1a" />
              <Text style={styles.actionBtnTextDark}>{isES ? "Listo" : "Ready"}</Text>
            </Pressable>
          )}
          {phase === "WAIT_LOAD_PICKS" && (
            <Pressable style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => handleVoiceAction("load picks")}>
              <Feather name="package" size={16} color="#0a0e1a" />
              <Text style={styles.actionBtnTextDark}>{isES ? "Cargar Picks" : "Load Picks"}</Text>
            </Pressable>
          )}
          {(phase === "SAFETY" || phase === "CONFIRM_EQUIPMENT" || phase === "CONFIRM_MAX_PALLET_COUNT") && (
            <Pressable style={({ pressed }) => [styles.actionBtn, styles.actionBtnSecondary, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => handleVoiceAction("no")}>
              <Feather name="x" size={16} color="#ef4444" />
              <Text style={styles.actionBtnTextRed}>{isES ? "No" : "No"}</Text>
            </Pressable>
          )}
          {(phase === "PICK_CHECK" || phase === "PICK_READY") && (
            <Pressable style={({ pressed }) => [styles.actionBtn, styles.actionBtnGray, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => handleVoiceAction("repeat")}>
              <Feather name="repeat" size={16} color={c.mutedForeground} />
              <Text style={styles.actionBtnTextGray}>{isES ? "Repetir" : "Repeat"}</Text>
            </Pressable>
          )}
          {isComplete && (
            <Pressable style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => handleVoiceAction("confirm")}>
              <Feather name="check-circle" size={16} color="#0a0e1a" />
              <Text style={styles.actionBtnTextDark}>{isES ? "Confirmar Entrega" : "Confirm Delivery"}</Text>
            </Pressable>
          )}
          <Pressable style={({ pressed }) => [styles.actionBtn, styles.actionBtnGray, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => handleVoiceAction("stop")}>
            <Feather name="pause" size={16} color={c.mutedForeground} />
            <Text style={styles.actionBtnTextGray}>{isES ? "Pausa" : "Pause"}</Text>
          </Pressable>
        </View>

        {state?.invalidCount ? (
          <View style={[styles.invalidBanner, { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" }]}>
            <Feather name="alert-triangle" size={13} color="#ef4444" />
            <Text style={styles.invalidText}>
              {state.invalidCount} {isES ? "intento(s) inválido(s)" : "invalid attempt(s)"}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 1, flexDirection: "row",
    alignItems: "flex-end", justifyContent: "space-between",
  },
  headerTitle:  { fontSize: 20, fontWeight: "800" as const, color: "#fff" },
  headerSub:    { fontSize: 12, marginTop: 2 },
  headerRight:  { flexDirection: "row", alignItems: "center", gap: 8 },
  voiceToggleBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  startContent: { padding: 20, gap: 16 },
  orbCenter:    { alignItems: "center", paddingVertical: 20, gap: 8 },
  orbSubtitle:  { fontSize: 13, marginTop: 10, textAlign: "center" },
  voiceStatusPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  voiceStatusText: { fontSize: 11, fontWeight: "600" as const },
  interimText: {
    fontSize: 13, fontStyle: "italic", textAlign: "center",
    paddingHorizontal: 20, opacity: 0.8,
  },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  cardLabel:    { fontSize: 11, fontWeight: "700" as const, letterSpacing: 1 },
  novaInput: {
    borderWidth: 2, borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 18, fontWeight: "700" as const,
    textAlign: "center", letterSpacing: 4,
  },
  hint:       { fontSize: 12, textAlign: "center" },
  startBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, borderRadius: 16, paddingVertical: 16,
  },
  startBtnText: { fontSize: 16, fontWeight: "800" as const },
  infoBox: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  infoTitle:    { fontSize: 14, fontWeight: "700" as const, color: "#fff", marginBottom: 4 },
  infoRow:      { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoDot:      { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  infoText:     { flex: 1, fontSize: 13, lineHeight: 19 },
  endBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderColor: "rgba(239,68,68,0.4)",
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  endBtnText:   { color: "#ef4444", fontSize: 12, fontWeight: "700" as const },
  sessionScroll: { flex: 1 },
  promptBox: {
    margin: 16, borderRadius: 16, borderWidth: 1,
    padding: 16, gap: 6,
  },
  promptLabel:  { fontSize: 10, fontWeight: "800" as const, letterSpacing: 1.5 },
  promptText:   { fontSize: 17, fontWeight: "600" as const, lineHeight: 26 },
  stopCard: {
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 16, borderWidth: 2, overflow: "hidden",
  },
  stopRow:       { flexDirection: "row" },
  stopItem:      { flex: 1, alignItems: "center", padding: 16 },
  stopLabel:     { fontSize: 10, fontWeight: "700" as const, letterSpacing: 1 },
  stopValue:     { fontSize: 32, fontWeight: "900" as const, marginTop: 4 },
  stopDivider:   { width: 1 },
  checkCodeRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 12, paddingHorizontal: 16, borderTopWidth: 1,
  },
  checkCodeLabel: { fontSize: 12, fontWeight: "600" as const },
  checkCode:      { fontSize: 20, fontWeight: "900" as const, letterSpacing: 4 },
  nextCard: {
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 12, borderWidth: 1, padding: 12,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  nextLabel:  { fontSize: 10, fontWeight: "700" as const, letterSpacing: 1 },
  nextValue:  { fontSize: 14, fontWeight: "600" as const },
  inputRow: {
    flexDirection: "row", marginHorizontal: 16, marginBottom: 12, gap: 10,
  },
  checkInput: {
    flex: 1, height: 52, borderWidth: 2, borderRadius: 14,
    paddingHorizontal: 16, fontSize: 22, fontWeight: "800" as const,
    textAlign: "center", letterSpacing: 6,
  },
  submitBtn: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  buttonGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10,
    paddingHorizontal: 16, marginBottom: 12,
  },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1,
  },
  actionBtnPrimary:   { backgroundColor: "#f5c200", borderColor: "#f5c200" },
  actionBtnSecondary: { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" },
  actionBtnGray:      { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" },
  actionBtnTextDark:  { color: "#0a0e1a", fontWeight: "700" as const, fontSize: 14 },
  actionBtnTextRed:   { color: "#ef4444", fontWeight: "700" as const, fontSize: 14 },
  actionBtnTextGray:  { color: "#94a3b8", fontWeight: "700" as const, fontSize: 14 },
  invalidBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginBottom: 12,
    padding: 10, borderRadius: 10, borderWidth: 1,
  },
  invalidText: { color: "#ef4444", fontSize: 12, fontWeight: "600" as const },
});
