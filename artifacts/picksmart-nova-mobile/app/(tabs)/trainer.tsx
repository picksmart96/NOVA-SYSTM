import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://nova-warehouse-control.replit.app";
const c = colors.dark;

interface Selector {
  id: number;
  userId: string;
  name: string;
  novaId: string | null;
  status: string;
  performancePercent: number | null;
}

interface Assignment {
  id: string;
  assignmentNumber: string;
  status: string;
  totalCases: number;
  pallets: number;
  goalTimeMinutes: number;
  startAisle: number;
  endAisle: number;
  type: string;
}

function StatusDot({ status }: { status: string }) {
  const color = status === "active" ? "#22c55e"
    : status === "available" ? "#3b82f6"
    : "#475569";
  return <View style={[styles.statusDot, { backgroundColor: color }]} />;
}

function SelectorCard({
  selector,
  token,
  isES,
  onAction,
}: {
  selector: Selector;
  token: string | null;
  isES: boolean;
  onAction: (msg: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAssignments = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/assignments?selectorUserId=${selector.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const d = await r.json();
        setAssignments(Array.isArray(d) ? d : (d.assignments ?? []));
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && assignments.length === 0) loadAssignments();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const perf = selector.performancePercent ?? 100;
  const perfColor = perf >= 100 ? "#22c55e" : perf >= 85 ? "#f59e0b" : "#ef4444";

  return (
    <View style={[styles.selectorCard, { backgroundColor: c.card, borderColor: c.border }]}>
      <Pressable onPress={toggleExpand} style={styles.selectorHeader}>
        <StatusDot status={selector.status} />
        <View style={styles.selectorInfo}>
          <Text style={[styles.selectorName, { color: c.foreground }]}>{selector.name}</Text>
          <Text style={[styles.selectorSub, { color: c.mutedForeground }]}>
            {selector.novaId ? `NOVA: ${selector.novaId}` : (isES ? "Sin NOVA ID" : "No NOVA ID")}
          </Text>
        </View>
        <View style={styles.selectorRight}>
          <Text style={[styles.perfText, { color: perfColor }]}>{perf}%</Text>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={c.mutedForeground} />
        </View>
      </Pressable>

      {expanded && (
        <View style={[styles.selectorBody, { borderTopColor: c.border }]}>
          {loading ? (
            <ActivityIndicator color={c.primary} style={{ marginVertical: 12 }} />
          ) : assignments.length === 0 ? (
            <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
              {isES ? "Sin asignaciones activas." : "No active assignments."}
            </Text>
          ) : (
            assignments.slice(0, 3).map((a) => (
              <View key={a.id} style={[styles.assignRow, { borderColor: c.border }]}>
                <View style={styles.assignInfo}>
                  <Text style={[styles.assignNum, { color: c.primary }]}>#{a.assignmentNumber}</Text>
                  <Text style={[styles.assignSub, { color: c.mutedForeground }]}>
                    {isES
                      ? `Pasillos ${a.startAisle}–${a.endAisle} · ${a.totalCases} cajas`
                      : `Aisles ${a.startAisle}–${a.endAisle} · ${a.totalCases} cases`}
                  </Text>
                </View>
                <View style={[styles.statusBadge, {
                  backgroundColor: a.status === "active" ? "#22c55e22" : "#47556922",
                  borderColor: a.status === "active" ? "#22c55e44" : "#47556944",
                }]}>
                  <Text style={[styles.statusText, { color: a.status === "active" ? "#22c55e" : "#94a3b8" }]}>
                    {a.status}
                  </Text>
                </View>
              </View>
            ))
          )}

          <Pressable
            style={({ pressed }) => [styles.actionBtnSmall, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => onAction(isES ? `Asignar trabajo a ${selector.name}` : `Assign work to ${selector.name}`)}
          >
            <Feather name="plus-circle" size={14} color={c.primary} />
            <Text style={[styles.actionBtnSmallText, { color: c.primary }]}>
              {isES ? "Nueva Asignación" : "New Assignment"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function TrainerScreen() {
  const insets = useSafeAreaInsets();
  const { user, token, language } = useAuth();
  const isES = language === "es";
  const webTop = Platform.OS === "web" ? 67 : 0;

  const isTrainer = user?.role === "trainer" || user?.role === "supervisor" || user?.role === "owner" || user?.role === "manager";

  const [selectors, setSelectors]   = useState<Selector[]>([]);
  const [loading, setLoading]       = useState(false);
  const [err, setErr]               = useState("");
  const [search, setSearch]         = useState("");
  const [toast, setToast]           = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting]     = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setErr("");
    try {
      const r = await fetch(`${API_BASE}/api/trainer/selectors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Failed");
      const d = await r.json();
      setSelectors(Array.isArray(d) ? d : (d.selectors ?? []));
    } catch {
      setErr(isES ? "Error cargando selectores." : "Could not load selectors.");
    } finally { setLoading(false); }
  }, [token, isES]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const sendInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim() || !token) return;
    setInviting(true);
    try {
      const r = await fetch(`${API_BASE}/api/invites/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: inviteName.trim(), email: inviteEmail.trim(), role: "selector" }),
      });
      if (r.ok) {
        setInviteSent(true);
        setInviteName(""); setInviteEmail("");
        showToast(isES ? "¡Invitación enviada!" : "Invite sent!");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        showToast(isES ? "Error enviando invitación." : "Failed to send invite.");
      }
    } catch {
      showToast(isES ? "Error de red." : "Network error.");
    } finally { setInviting(false); setTimeout(() => setInviteSent(false), 3000); }
  };

  const filtered = selectors.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.novaId ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (!isTrainer) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12 + webTop, backgroundColor: c.card, borderBottomColor: c.border }]}>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>Trainer Portal</Text>
        </View>
        <View style={styles.center}>
          <Feather name="lock" size={40} color={c.mutedForeground} />
          <Text style={[styles.lockText, { color: c.mutedForeground }]}>
            {isES ? "Acceso de entrenador requerido." : "Trainer access required."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 + webTop, backgroundColor: c.card, borderBottomColor: c.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>Trainer Portal</Text>
          <Text style={[styles.headerSub, { color: c.mutedForeground }]}>
            {filtered.length} {isES ? "selectores" : "selectors"}
          </Text>
        </View>
        <Pressable onPress={load} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={16} color={c.mutedForeground} />
        </Pressable>
      </View>

      {toast ? (
        <View style={[styles.toast, { backgroundColor: "#22c55e22", borderColor: "#22c55e44" }]}>
          <Feather name="check-circle" size={13} color="#22c55e" />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: isES ? "Total" : "Total", value: selectors.length, color: "#3b82f6" },
            { label: isES ? "Activos" : "Active", value: selectors.filter(s => s.status === "active").length, color: "#22c55e" },
            { label: isES ? "Meta ≥100%" : "At Goal", value: selectors.filter(s => (s.performancePercent ?? 100) >= 100).length, color: "#f5c200" },
          ].map(({ label, value, color }) => (
            <View key={label} style={[styles.statCard, { backgroundColor: c.card, borderColor: color + "33" }]}>
              <Text style={[styles.statValue, { color }]}>{value}</Text>
              <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: c.card, borderColor: c.border }]}>
          <Feather name="search" size={15} color={c.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: c.foreground }]}
            placeholder={isES ? "Buscar selector…" : "Search selectors…"}
            placeholderTextColor={c.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Selectors */}
        {loading ? (
          <ActivityIndicator color={c.primary} style={{ marginVertical: 20 }} />
        ) : err ? (
          <View style={[styles.errBox, { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" }]}>
            <Feather name="alert-circle" size={14} color="#ef4444" />
            <Text style={styles.errText}>{err}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Feather name="users" size={32} color={c.mutedForeground} />
            <Text style={[styles.lockText, { color: c.mutedForeground }]}>
              {isES ? "Sin selectores aún." : "No selectors yet."}
            </Text>
          </View>
        ) : (
          filtered.map(s => (
            <SelectorCard
              key={s.id}
              selector={s}
              token={token}
              isES={isES}
              onAction={showToast}
            />
          ))
        )}

        {/* Invite new selector */}
        <View style={[styles.inviteCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.inviteHeader}>
            <View style={[styles.inviteIconBox, { backgroundColor: "#f5c20022" }]}>
              <Feather name="user-plus" size={15} color="#f5c200" />
            </View>
            <View>
              <Text style={[styles.inviteTitle, { color: c.foreground }]}>
                {isES ? "Invitar Selector" : "Invite Selector"}
              </Text>
              <Text style={[styles.inviteSub, { color: c.mutedForeground }]}>
                {isES ? "Envía un enlace de registro" : "Send a registration link"}
              </Text>
            </View>
          </View>
          <TextInput
            style={[styles.inviteInput, { backgroundColor: c.input, borderColor: c.border, color: c.foreground }]}
            placeholder={isES ? "Nombre completo" : "Full name"}
            placeholderTextColor={c.mutedForeground}
            value={inviteName}
            onChangeText={setInviteName}
          />
          <TextInput
            style={[styles.inviteInput, { backgroundColor: c.input, borderColor: c.border, color: c.foreground, marginTop: 8 }]}
            placeholder={isES ? "Correo electrónico" : "Email address"}
            placeholderTextColor={c.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            value={inviteEmail}
            onChangeText={setInviteEmail}
          />
          <Pressable
            onPress={sendInvite}
            disabled={!inviteName.trim() || !inviteEmail.trim() || inviting}
            style={({ pressed }) => [
              styles.inviteBtn,
              { backgroundColor: inviteSent ? "#22c55e" : c.primary,
                opacity: pressed || !inviteName.trim() || !inviteEmail.trim() ? 0.5 : 1 }
            ]}
          >
            {inviting ? <ActivityIndicator size="small" color="#0a0e1a" />
              : inviteSent ? <Feather name="check" size={16} color="#fff" />
              : <Feather name="send" size={16} color="#0a0e1a" />}
            <Text style={[styles.inviteBtnText, { color: inviteSent ? "#fff" : "#0a0e1a" }]}>
              {inviting ? (isES ? "Enviando…" : "Sending…")
                : inviteSent ? (isES ? "¡Enviado!" : "Sent!")
                : (isES ? "Enviar Invitación" : "Send Invite")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#0a0e1a" },
  header: {
    paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1,
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
  },
  headerTitle:  { fontSize: 22, fontWeight: "800" as const },
  headerSub:    { fontSize: 12, marginTop: 2 },
  refreshBtn:   { padding: 6 },
  toast: {
    flexDirection: "row", alignItems: "center", gap: 8,
    margin: 12, marginBottom: 0, padding: 10,
    borderRadius: 10, borderWidth: 1,
  },
  toastText:    { color: "#22c55e", fontSize: 13, fontWeight: "600" as const },
  statsRow:     { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, alignItems: "center", padding: 12,
    borderRadius: 14, borderWidth: 1,
  },
  statValue:    { fontSize: 22, fontWeight: "900" as const },
  statLabel:    { fontSize: 11, marginTop: 2 },
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput:  { flex: 1, fontSize: 14 },
  selectorCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  selectorHeader: {
    flexDirection: "row", alignItems: "center",
    padding: 14, gap: 12,
  },
  statusDot:    { width: 9, height: 9, borderRadius: 5 },
  selectorInfo: { flex: 1 },
  selectorName: { fontSize: 15, fontWeight: "700" as const },
  selectorSub:  { fontSize: 12, marginTop: 2 },
  selectorRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  perfText:     { fontSize: 13, fontWeight: "800" as const },
  selectorBody: { borderTopWidth: 1, padding: 14, gap: 8 },
  emptyText:    { fontSize: 13, textAlign: "center", paddingVertical: 8 },
  assignRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 8, borderBottomWidth: 1, gap: 12,
  },
  assignInfo:   { flex: 1 },
  assignNum:    { fontSize: 13, fontWeight: "700" as const },
  assignSub:    { fontSize: 12, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
  },
  statusText:   { fontSize: 11, fontWeight: "700" as const },
  actionBtnSmall: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 4, paddingVertical: 8,
  },
  actionBtnSmallText: { fontSize: 13, fontWeight: "600" as const },
  center:       { alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: 12 },
  lockText:     { fontSize: 14, textAlign: "center" },
  errBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  errText:      { color: "#ef4444", fontSize: 13, flex: 1 },
  inviteCard:   { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  inviteHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  inviteIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  inviteTitle:  { fontSize: 14, fontWeight: "800" as const },
  inviteSub:    { fontSize: 12 },
  inviteInput: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
  },
  inviteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 14, paddingVertical: 13, marginTop: 4,
  },
  inviteBtnText: { fontWeight: "800" as const, fontSize: 14 },
});
