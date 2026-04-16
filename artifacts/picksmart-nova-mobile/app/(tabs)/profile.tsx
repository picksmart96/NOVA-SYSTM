import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

interface RowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightEl?: React.ReactNode;
}

function Row({ icon, label, value, onPress, rightEl }: RowProps) {
  const c = colors.dark;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: c.card, borderColor: c.border, opacity: pressed && onPress ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: c.muted }]}>
        <Feather name={icon as any} size={16} color={c.mutedForeground} />
      </View>
      <Text style={[styles.rowLabel, { color: c.foreground }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={[styles.rowValue, { color: c.mutedForeground }]}>{value}</Text> : null}
        {rightEl ?? null}
        {onPress && !rightEl ? <Feather name="chevron-right" size={16} color={c.mutedForeground} /> : null}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, language, toggleLanguage, logout } = useAuth();
  const c = colors.dark;
  const isES = language === "es";
  const webTop = Platform.OS === "web" ? 67 : 0;

  if (!user) {
    router.replace("/login");
    return null;
  }

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    logout();
    router.replace("/login");
  };

  const roleLabel = {
    owner: "Owner",
    manager: "Manager",
    supervisor: "Supervisor",
    trainer: "Trainer",
    selector: "Selector",
  }[user.role] ?? user.role;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[
        styles.header,
        { paddingTop: insets.top + 12 + webTop, backgroundColor: c.card, borderBottomColor: c.border }
      ]}>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>
          {isES ? "Perfil" : "Profile"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 24 + (Platform.OS === "web" ? 34 : 0) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar card */}
        <View style={[styles.avatarCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.avatar, { backgroundColor: c.nova }]}>
            <Text style={styles.avatarLetter}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={[styles.userName, { color: c.foreground }]}>{user.name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: c.primary + "20", borderColor: c.primary + "40" }]}>
              <Text style={[styles.roleText, { color: c.primary }]}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>
          {isES ? "CONFIGURACIÓN" : "SETTINGS"}
        </Text>
        <View style={styles.section}>
          <Row
            icon="globe"
            label={isES ? "Idioma" : "Language"}
            value={language === "es" ? "Español" : "English"}
            rightEl={
              <Switch
                value={language === "es"}
                onValueChange={toggleLanguage}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* Account */}
        <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>
          {isES ? "CUENTA" : "ACCOUNT"}
        </Text>
        <View style={styles.section}>
          <Row icon="user" label={isES ? "Usuario" : "Username"} value={user.username} />
          <Row icon="shield" label={isES ? "Rol" : "Role"} value={roleLabel} />
        </View>

        {/* App info */}
        <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>
          {isES ? "ACERCA DE" : "ABOUT"}
        </Text>
        <View style={styles.section}>
          <Row icon="zap" label="NOVA Version" value="NOVA Mobile" />
          <Row icon="info" label="PickSmart Academy" value="v1.0" />
        </View>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutBtn,
            { backgroundColor: c.destructive + "15", borderColor: c.destructive + "40", opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="log-out" size={16} color={c.destructive} />
          <Text style={[styles.logoutText, { color: c.destructive }]}>
            {isES ? "Cerrar Sesión" : "Sign Out"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: "800" as const },
  scroll: { padding: 16, gap: 6 },
  avatarCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontSize: 28, fontWeight: "800" as const, color: "#fff" },
  userName: { fontSize: 18, fontWeight: "700" as const },
  roleBadge: {
    alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1,
  },
  roleText: { fontSize: 12, fontWeight: "600" as const },
  sectionLabel: {
    fontSize: 11, fontWeight: "700" as const, letterSpacing: 1.2,
    paddingHorizontal: 4, paddingTop: 12, paddingBottom: 6,
  },
  section: { gap: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  rowIcon: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, fontSize: 15 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowValue: { fontSize: 14 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutText: { fontSize: 15, fontWeight: "700" as const },
});
