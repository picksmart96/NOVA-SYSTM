import React, { useState } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Linking, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import colors from "@/constants/colors";

const c = colors.dark;

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://nova-warehouse-control.replit.app";
const WEB_BASE = "https://nova-warehouse-control.replit.app";

// ─── All pages list ──────────────────────────────────────────────────────────
const SECTIONS = [
  {
    label: "Public",
    color: "#3b82f6",
    items: [
      { label: "Home", path: "/" },
      { label: "Pricing", path: "/pricing" },
      { label: "Download", path: "/download" },
      { label: "Privacy Policy", path: "/privacy" },
      { label: "Terms of Service", path: "/terms" },
    ],
  },
  {
    label: "Training",
    color: "#f5c200",
    items: [
      { label: "Training Hub", path: "/training" },
      { label: "Progress", path: "/progress" },
      { label: "Leaderboard", path: "/leaderboard" },
      { label: "Common Mistakes", path: "/mistakes" },
      { label: "Selector Nation", path: "/selector-nation" },
    ],
  },
  {
    label: "NOVA Voice",
    color: "#7c3aed",
    items: [
      { label: "NOVA Selector", path: "/selector" },
      { label: "NOVA Help", path: "/nova-help" },
      { label: "NOVA Trainer", path: "/nova-trainer" },
      { label: "NOVA Control", path: "/nova/control" },
      { label: "NOVA Tracking", path: "/nova/tracking" },
      { label: "Voice Commands", path: "/nova/voice-commands" },
    ],
  },
  {
    label: "Management",
    color: "#22c55e",
    items: [
      { label: "Trainer Portal", path: "/trainer-portal" },
      { label: "Supervisor", path: "/supervisor" },
      { label: "Users & Access", path: "/users-access" },
      { label: "Owner Dashboard", path: "/owner" },
      { label: "Command Center", path: "/command" },
    ],
  },
  {
    label: "Demo",
    color: "#f97316",
    items: [
      { label: "Demo Landing", path: "/demo" },
      { label: "Demo Training", path: "/demo/training" },
      { label: "Demo NOVA Agent", path: "/demo/nova-agent" },
    ],
  },
];

const ACTIVITY = [
  { icon: "lock", text: "Owner logged in", time: "just now", color: "#f5c200" },
  { icon: "mail", text: "Invite sent to trainer", time: "11m ago", color: "#3b82f6" },
  { icon: "mic", text: "Selector started NOVA session", time: "24m ago", color: "#7c3aed" },
  { icon: "users", text: "Role changed: selector → trainer", time: "2h ago", color: "#22c55e" },
  { icon: "trending-up", text: "New company subscription", time: "3h ago", color: "#f5c200" },
  { icon: "book-open", text: "Module 3 completed", time: "4h ago", color: "#3b82f6" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={styles.sectionHeader}>{title}</Text>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + "33" }]}>
      <Feather name={icon as any} size={18} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Quick Invite ────────────────────────────────────────────────────────────
function QuickInvite() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("selector");
  const [inviteUrl, setInviteUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const ROLES = ["selector", "trainer", "supervisor", "owner"];

  function generateUrl() {
    if (!name || !email) return;
    const payload = { name, email, role, exp: Date.now() + 7 * 86400000 };
    const token = btoa(JSON.stringify(payload));
    const url = `${WEB_BASE}/invite/${token}`;
    setInviteUrl(url);
    setSent(false);
    setErr("");
  }

  async function sendEmail() {
    if (!inviteUrl) return;
    setSending(true); setErr("");
    try {
      const r = await fetch(`${API_BASE}/api/invites/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role, inviteUrl }),
      });
      if (r.ok) setSent(true);
      else setErr("Send failed — try opening the link instead.");
    } catch {
      setErr("Network error.");
    } finally {
      setSending(false);
    }
  }

  function openInvite() {
    if (inviteUrl) Linking.openURL(inviteUrl);
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Feather name="user-plus" size={16} color="#f5c200" />
        <Text style={styles.cardTitle}>Quick Invite</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Full name"
        placeholderTextColor={c.mutedForeground}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={[styles.input, { marginTop: 8 }]}
        placeholder="Email address"
        placeholderTextColor={c.mutedForeground}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <View style={styles.roleRow}>
        {ROLES.map(r => (
          <TouchableOpacity
            key={r}
            onPress={() => setRole(r)}
            style={[styles.roleChip, role === r && styles.roleChipActive]}
          >
            <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.btnYellow, (!name || !email) && { opacity: 0.4 }]}
        onPress={generateUrl}
        disabled={!name || !email}
      >
        <Text style={styles.btnYellowText}>Generate Invite Link</Text>
      </TouchableOpacity>

      {inviteUrl !== "" && (
        <View style={{ marginTop: 12, gap: 8 }}>
          <View style={styles.urlBox}>
            <Text style={styles.urlText} numberOfLines={2}>{inviteUrl}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={[styles.btnPurple, { flex: 1 }, sending && { opacity: 0.6 }]}
              onPress={sendEmail}
              disabled={sending}
            >
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : sent
                ? <><Feather name="check" size={14} color="#86efac" /><Text style={[styles.btnPurpleText, { color: "#86efac" }]}> Sent!</Text></>
                : <><Feather name="send" size={14} color="#fff" /><Text style={styles.btnPurpleText}> Send Email</Text></>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline} onPress={openInvite}>
              <Feather name="external-link" size={14} color="#fff" />
              <Text style={styles.btnOutlineText}> Open</Text>
            </TouchableOpacity>
          </View>
          {err !== "" && <Text style={{ color: "#f87171", fontSize: 12 }}>{err}</Text>}
          {sent && <Text style={{ color: "#86efac", fontSize: 12 }}>✓ Email sent to {email}</Text>}
        </View>
      )}
    </View>
  );
}

// ─── Pages section ───────────────────────────────────────────────────────────
function PagesSection() {
  const [expanded, setExpanded] = useState<string | null>("Management");

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Feather name="layout" size={16} color="#f5c200" />
        <Text style={styles.cardTitle}>All Pages</Text>
      </View>
      {SECTIONS.map(s => (
        <View key={s.label}>
          <TouchableOpacity
            style={styles.sectionToggle}
            onPress={() => setExpanded(expanded === s.label ? null : s.label)}
          >
            <View style={[styles.sectionDot, { backgroundColor: s.color }]} />
            <Text style={[styles.sectionToggleText, { color: s.color }]}>{s.label}</Text>
            <Text style={styles.sectionCount}>{s.items.length}</Text>
            <Feather name={expanded === s.label ? "chevron-up" : "chevron-down"} size={14} color={c.mutedForeground} />
          </TouchableOpacity>
          {expanded === s.label && s.items.map(item => (
            <TouchableOpacity
              key={item.path}
              style={styles.pageRow}
              onPress={() => Linking.openURL(`${WEB_BASE}${item.path}`)}
            >
              <Feather name="link" size={13} color={s.color} style={{ marginRight: 8 }} />
              <Text style={styles.pageLabel}>{item.label}</Text>
              <Feather name="external-link" size={12} color={c.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── Activity ────────────────────────────────────────────────────────────────
function ActivityFeed() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Feather name="activity" size={16} color="#7c3aed" />
        <Text style={styles.cardTitle}>Recent Activity</Text>
      </View>
      {ACTIVITY.map((a, i) => (
        <View key={i} style={[styles.activityRow, i === ACTIVITY.length - 1 && { borderBottomWidth: 0 }]}>
          <Feather name={a.icon as any} size={14} color={a.color} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.activityText}>{a.text}</Text>
            <Text style={styles.activityTime}>{a.time}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function AdminScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Feather name="command" size={20} color="#0a0e1a" />
        </View>
        <View>
          <Text style={styles.headerTitle}>Command Center</Text>
          <Text style={styles.headerSub}>Owner · Full access</Text>
        </View>
        <TouchableOpacity
          style={styles.openWebBtn}
          onPress={() => Linking.openURL(`${WEB_BASE}/command`)}
        >
          <Feather name="external-link" size={13} color="#f5c200" />
          <Text style={styles.openWebText}> Web</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard icon="layout" label="Pages" value="47" color="#3b82f6" />
        <StatCard icon="users" label="Active" value="37" color="#22c55e" />
        <StatCard icon="mic" label="Sessions" value="981" color="#7c3aed" />
        <StatCard icon="trending-up" label="Subs" value="148" color="#f5c200" />
      </View>

      {/* Quick actions */}
      <View style={styles.quickRow}>
        {[
          { label: "Owner Dashboard", path: "/owner", icon: "shield", color: "#f5c200" },
          { label: "Users & Access", path: "/users-access", icon: "users", color: "#3b82f6" },
          { label: "NOVA Selector", path: "/selector", icon: "mic", color: "#7c3aed" },
        ].map(a => (
          <TouchableOpacity
            key={a.path}
            style={[styles.quickBtn, { borderColor: a.color + "44" }]}
            onPress={() => Linking.openURL(`${WEB_BASE}${a.path}`)}
          >
            <Feather name={a.icon as any} size={15} color={a.color} />
            <Text style={[styles.quickBtnText, { color: a.color }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <QuickInvite />
      <PagesSection />
      <ActivityFeed />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0e1a", paddingHorizontal: 16 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 16,
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#f5c200", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: c.mutedForeground, marginTop: 1 },
  openWebBtn: {
    marginLeft: "auto", flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#f5c200" + "44", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  openWebText: { fontSize: 12, color: "#f5c200", fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1, alignItems: "center", borderRadius: 14, borderWidth: 1,
    backgroundColor: c.card, padding: 10, gap: 4,
  },
  statValue: { fontSize: 16, fontWeight: "900" },
  statLabel: { fontSize: 10, color: c.mutedForeground, textAlign: "center" },
  quickRow: { gap: 8, marginBottom: 16 },
  quickBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: c.card, borderRadius: 14, borderWidth: 1,
    padding: 14,
  },
  quickBtnText: { fontSize: 13, fontWeight: "700" },
  card: {
    backgroundColor: c.card, borderRadius: 20, borderWidth: 1,
    borderColor: c.border, padding: 16, marginBottom: 16,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#fff" },
  sectionHeader: {
    fontSize: 11, fontWeight: "700", color: c.mutedForeground,
    textTransform: "uppercase", letterSpacing: 1, marginTop: 16, marginBottom: 6,
  },
  input: {
    backgroundColor: "#0a0e1a", borderWidth: 1, borderColor: c.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#fff",
  },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginVertical: 10 },
  roleChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: c.border, backgroundColor: "#0a0e1a",
  },
  roleChipActive: { borderColor: "#f5c200", backgroundColor: "#f5c200" + "22" },
  roleChipText: { fontSize: 12, fontWeight: "600", color: c.mutedForeground },
  roleChipTextActive: { color: "#f5c200" },
  btnYellow: {
    backgroundColor: "#f5c200", borderRadius: 14, paddingVertical: 13,
    alignItems: "center", marginTop: 4,
  },
  btnYellowText: { fontWeight: "800", color: "#0a0e1a", fontSize: 14 },
  urlBox: {
    backgroundColor: "#0a0e1a", borderRadius: 10, borderWidth: 1,
    borderColor: c.border, padding: 10,
  },
  urlText: { fontSize: 11, color: c.mutedForeground, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  btnPurple: {
    backgroundColor: "#7c3aed", borderRadius: 12, paddingVertical: 11,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
  },
  btnPurpleText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  btnOutline: {
    borderWidth: 1, borderColor: c.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 11,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
  },
  btnOutlineText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  sectionToggle: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.border,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionToggleText: { fontSize: 13, fontWeight: "700", flex: 1 },
  sectionCount: { fontSize: 11, color: c.mutedForeground, marginRight: 4 },
  pageRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 9, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: c.border + "55",
  },
  pageLabel: { flex: 1, fontSize: 13, color: "#e2e8f0" },
  activityRow: {
    flexDirection: "row", paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  activityText: { fontSize: 13, color: "#e2e8f0" },
  activityTime: { fontSize: 11, color: c.mutedForeground, marginTop: 2 },
});
