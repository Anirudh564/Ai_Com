import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/contexts/AuthContext";
import { api } from "@/src/api/client";
import { colors, radii, spacing, typography } from "@/src/theme";
import { Card, ScoreRing, Pill } from "@/src/components/UI";

type Stats = {
  user: any;
  today: { missions_total: number; missions_done: number; missions: any[] };
  scores: { overall: number; confidence: number; structure: number; voice: number };
  trend: any[];
  totals: { debates: number; interviews: number; reports: number };
};

export default function Home() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await api<Stats>("/dashboard/stats");
      setStats(s);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading || !stats) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const u = stats.user;
  const xpToNext = (u.level) * 250;

  return (
    <SafeAreaView style={styles.safe} testID="home-screen">
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl tintColor={colors.accent} refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={typography.caption}>GOOD TO SEE YOU</Text>
            <Text style={typography.h1}>{u.name?.split(" ")[0] || "Speaker"}</Text>
          </View>
          <TouchableOpacity testID="logout-button" onPress={signOut} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Streak + XP */}
        <Card style={{ marginTop: spacing.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={typography.caption}>STREAK</Text>
              <Text style={[typography.display, { color: colors.xp, marginTop: 2 }]} testID="streak-value">
                {u.streak_days}<Text style={[typography.h2, { color: colors.xp }]}>d</Text>
              </Text>
              <Text style={typography.bodyMuted}>Consistency builds confidence.</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Pill label={`LVL ${u.level}`} color={colors.accent} />
              <Text style={[typography.mono, { marginTop: 6 }]} testID="xp-value">
                {u.xp} / {xpToNext} XP
              </Text>
              <View style={styles.xpBar}>
                <View style={[styles.xpFill, { width: `${Math.min(100, (u.xp % 250) / 250 * 100)}%` }]} />
              </View>
            </View>
          </View>
        </Card>

        {/* Scores */}
        <Text style={[typography.h2, { marginTop: spacing.xl }]}>Latest performance</Text>
        <Text style={[typography.bodyMuted, { marginTop: 4 }]}>From your most recent speech analysis.</Text>
        <View style={styles.ringsRow}>
          <ScoreRing label="Overall" value={stats.scores.overall} color={colors.accent} />
          <ScoreRing label="Voice" value={stats.scores.voice} color={colors.success} />
          <ScoreRing label="Structure" value={stats.scores.structure} color="#A78BFA" />
        </View>

        {/* Today's Missions */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xl }}>
          <Text style={typography.h2}>Today's missions</Text>
          <Text style={[typography.mono, { color: colors.textSecondary }]} testID="missions-progress">
            {stats.today.missions_done}/{stats.today.missions_total}
          </Text>
        </View>
        <View style={{ marginTop: spacing.md, gap: 12 }}>
          {stats.today.missions.map((m) => (
            <TouchableOpacity
              key={m.id}
              testID={`mission-${m.slug}`}
              onPress={() => router.push({ pathname: "/mission/[id]", params: { id: m.id } })}
              activeOpacity={0.8}
            >
              <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={[styles.checkbox, m.completed && styles.checkboxDone]}>
                  {m.completed ? <Ionicons name="checkmark" color="#fff" size={16} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h3, m.completed && { color: colors.textMuted, textDecorationLine: "line-through" }]}>
                    {m.title}
                  </Text>
                  <Text style={typography.caption}>{m.category.toUpperCase()} · {m.duration_min} MIN · +{m.xp} XP</Text>
                </View>
                <Ionicons name="chevron-forward" color={colors.textMuted} size={18} />
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick actions */}
        <Text style={[typography.h2, { marginTop: spacing.xl }]}>Continue training</Text>
        <View style={styles.quickRow}>
          <QuickAction icon="chatbubbles" label="Debate" testID="quick-debate" onPress={() => router.push("/(tabs)/debate")} />
          <QuickAction icon="briefcase" label="Mock interview" testID="quick-interview" onPress={() => router.push("/interview")} />
          <QuickAction icon="analytics" label="Analyze speech" testID="quick-analyze" onPress={() => router.push("/(tabs)/analyze")} />
          <QuickAction icon="sparkles" label="Ask mentor" testID="quick-mentor" onPress={() => router.push("/(tabs)/mentor")} />
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginTop: spacing.xl }}>
          <StatCell label="Debates" value={stats.totals.debates} />
          <StatCell label="Interviews" value={stats.totals.interviews} />
          <StatCell label="Analyses" value={stats.totals.reports} />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ icon, label, onPress, testID }: { icon: any; label: string; onPress: () => void; testID: string }) {
  return (
    <TouchableOpacity style={styles.quick} onPress={onPress} testID={testID}>
      <Ionicons name={icon} color={colors.accent} size={20} />
      <Text style={[typography.body, { marginTop: 6 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <View style={[styles.statCell]}>
      <Text style={[typography.mono, { fontSize: 22, color: colors.text }]}>{value}</Text>
      <Text style={typography.caption}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logoutBtn: { padding: 10, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  xpBar: { width: 140, height: 6, backgroundColor: colors.surfaceElevated, borderRadius: 3, marginTop: 8, overflow: "hidden" },
  xpFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 3 },
  ringsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  checkbox: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.borderSubtle,
    justifyContent: "center", alignItems: "center",
  },
  checkboxDone: { backgroundColor: colors.success, borderColor: colors.success },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: spacing.md },
  quick: {
    flexBasis: "47%", padding: spacing.md, backgroundColor: colors.surface,
    borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border,
  },
  statCell: {
    flex: 1, padding: spacing.md, backgroundColor: colors.surface,
    borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, alignItems: "center",
  },
});
