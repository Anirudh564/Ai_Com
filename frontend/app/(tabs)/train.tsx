import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api/client";
import { colors, radii, spacing, typography } from "@/src/theme";
import { Card, SectionTitle, Pill } from "@/src/components/UI";

export default function Train() {
  const router = useRouter();
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await api<{ missions: any[] }>("/missions/today");
      setMissions(r.missions);
    } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe} testID="train-screen">
      <ScrollView contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl tintColor={colors.accent} refreshing={false} onRefresh={load} />}
      >
        <SectionTitle title="Train" subtitle="Daily drills calibrated for your weak spots." />

        {loading ? <ActivityIndicator color={colors.accent} /> : (
          <View style={{ gap: 12 }}>
            {missions.map((m) => (
              <TouchableOpacity
                key={m.id}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: "/mission/[id]", params: { id: m.id } })}
                testID={`train-mission-${m.slug}`}
              >
                <Card>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Pill label={m.category.toUpperCase()} color={colors.accent} />
                    {m.completed ? <Pill label="DONE" color={colors.success} /> : <Text style={[typography.mono, { color: colors.xp }]}>+{m.xp} XP</Text>}
                  </View>
                  <Text style={[typography.h2, { marginTop: spacing.sm }]}>{m.title}</Text>
                  <Text style={[typography.bodyMuted, { marginTop: 6 }]}>{m.description}</Text>
                  <View style={styles.metaRow}>
                    <View style={styles.metaCell}>
                      <Ionicons name="time-outline" color={colors.textSecondary} size={14} />
                      <Text style={[typography.caption, { marginLeft: 4 }]}>{m.duration_min} MIN</Text>
                    </View>
                    <View style={styles.metaCell}>
                      <Ionicons name="construct-outline" color={colors.textSecondary} size={14} />
                      <Text style={[typography.caption, { marginLeft: 4 }]}>{m.framework.toUpperCase()}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[typography.h2, { marginTop: spacing.xl }]}>Pillars</Text>
        <Text style={[typography.bodyMuted, { marginTop: 4 }]}>Every drill targets one core capability.</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.md }}>
          {["Voice", "Pacing", "Articulation", "Confidence", "Structure", "Storytelling", "Assertiveness", "Persuasion", "Interview", "Networking"].map(p =>
            <Pill key={p} label={p} color={colors.textSecondary} />
          )}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  metaRow: { flexDirection: "row", gap: 14, marginTop: spacing.md },
  metaCell: { flexDirection: "row", alignItems: "center" },
});
