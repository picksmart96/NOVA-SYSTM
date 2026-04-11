import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

interface Module {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number;
  category: string;
}

const STATIC_MODULES: Module[] = [
  { id: "1", title: "ES3 Voice Basics", description: "Learn the fundamentals of ES3 voice-directed picking and NOVA commands.", difficulty: "beginner", duration: 25, category: "Voice" },
  { id: "2", title: "Safety First", description: "Pre-shift safety check procedures, forklift awareness, and PPE requirements.", difficulty: "beginner", duration: 20, category: "Safety" },
  { id: "3", title: "Slot & Check Code System", description: "Master reading slot numbers, levels, and 4-digit check codes.", difficulty: "beginner", duration: 30, category: "Picking" },
  { id: "4", title: "Batch & Assignment Flow", description: "How batches work, assignment numbers, door staging, and label printing.", difficulty: "intermediate", duration: 35, category: "Workflow" },
  { id: "5", title: "Performance & GOLD Rate", description: "Understand cases-per-hour goals, GOLD rate calculation, and bonus structure.", difficulty: "intermediate", duration: 40, category: "Performance" },
  { id: "6", title: "Damage & Error Reporting", description: "Correct procedures for damaged product, slot errors, and supervisor escalation.", difficulty: "intermediate", duration: 30, category: "Compliance" },
  { id: "7", title: "Ultra-Fast Mode", description: "Advanced picking strategies for experienced selectors hitting top performance.", difficulty: "advanced", duration: 45, category: "Advanced" },
  { id: "8", title: "Multi-Temp Zones", description: "Freezer, cooler, and ambient zone transitions, safety protocols, and time management.", difficulty: "advanced", duration: 50, category: "Advanced" },
];

const DIFF_COLOR: Record<string, string> = {
  beginner:     "#22c55e",
  intermediate: "#f59e0b",
  advanced:     "#ef4444",
};

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

async function fetchModules(): Promise<Module[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/training/modules`);
    if (!res.ok) throw new Error("not ok");
    return (await res.json()) as Module[];
  } catch {
    return STATIC_MODULES;
  }
}

export default function TrainingScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useAuth();
  const c = colors.dark;
  const isES = language === "es";
  const webTop = Platform.OS === "web" ? 67 : 0;

  const { data: modules, isLoading } = useQuery({
    queryKey: ["training-modules"],
    queryFn: fetchModules,
    staleTime: 5 * 60 * 1000,
  });

  const [expanded, setExpanded] = useState<string | null>(null);

  const renderModule = ({ item }: { item: Module }) => {
    const isOpen = expanded === item.id;
    return (
      <Pressable
        onPress={() => setExpanded(isOpen ? null : item.id)}
        style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.diffDot, { backgroundColor: DIFF_COLOR[item.difficulty] }]} />
          <View style={styles.cardMeta}>
            <Text style={[styles.cardCat, { color: c.primary }]}>{item.category.toUpperCase()}</Text>
            <Text style={[styles.cardTitle, { color: c.foreground }]}>{item.title}</Text>
          </View>
          <View style={styles.cardRight}>
            <View style={styles.duration}>
              <Feather name="clock" size={12} color={c.mutedForeground} />
              <Text style={[styles.durationText, { color: c.mutedForeground }]}>{item.duration}m</Text>
            </View>
            <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={c.mutedForeground} />
          </View>
        </View>

        {isOpen && (
          <View style={[styles.cardBody, { borderTopColor: c.border }]}>
            <Text style={[styles.desc, { color: c.mutedForeground }]}>{item.description}</Text>
            <View style={[styles.diffBadge, { backgroundColor: DIFF_COLOR[item.difficulty] + "20", borderColor: DIFF_COLOR[item.difficulty] + "40" }]}>
              <Text style={[styles.diffText, { color: DIFF_COLOR[item.difficulty] }]}>
                {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
              </Text>
            </View>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[
        styles.header,
        { paddingTop: insets.top + 12 + webTop, backgroundColor: c.card, borderBottomColor: c.border }
      ]}>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>
          {isES ? "Entrenamiento" : "Training"}
        </Text>
        <Text style={[styles.headerSub, { color: c.mutedForeground }]}>
          {isES ? `${STATIC_MODULES.length} módulos` : `${STATIC_MODULES.length} modules`}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={c.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={modules ?? STATIC_MODULES}
          keyExtractor={(m) => m.id}
          renderItem={renderModule}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 16 + (Platform.OS === "web" ? 34 : 0) }
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  headerSub: { fontSize: 13, marginTop: 2 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 10 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  diffDot: { width: 10, height: 10, borderRadius: 5 },
  cardMeta: { flex: 1 },
  cardCat: { fontSize: 10, fontWeight: "700" as const, letterSpacing: 1 },
  cardTitle: { fontSize: 15, fontWeight: "600" as const, marginTop: 2 },
  cardRight: { alignItems: "flex-end", gap: 6 },
  duration: { flexDirection: "row", alignItems: "center", gap: 4 },
  durationText: { fontSize: 12 },
  cardBody: {
    padding: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  desc: { fontSize: 14, lineHeight: 20 },
  diffBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  diffText: { fontSize: 12, fontWeight: "600" as const },
});
