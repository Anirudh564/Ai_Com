import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api/client";
import { colors, radii, spacing, typography } from "@/src/theme";
import { Card, Pill } from "@/src/components/UI";

export default function MissionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [mission, setMission] = useState<any>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    // Pull from missions list
    api<{ missions: any[] }>("/missions/today").then(r => {
      const m = r.missions.find(x => x.id === id);
      setMission(m || null);
    }).catch(() => setMission(null));
  }, [id]);

  const complete = async () => {
    setCompleting(true);
    try {
      const r = await api<any>("/missions/complete", { method: "POST", body: { mission_id: id } });
      setMission(r.mission);
      const xp = r.xp?.awarded || 0;
      Alert.alert("Mission complete", xp ? `+${xp} XP earned. Keep going.` : "Already done — onto the next.");
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "");
    } finally { setCompleting(false); }
  };

  if (!mission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} testID="mission-screen">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="mission-back">
          <Ionicons name="chevron-back" color={colors.text} size={26} />
        </TouchableOpacity>
        <Text style={[typography.h3, { marginLeft: 8 }]}>Drill</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Pill label={mission.category.toUpperCase()} color={colors.accent} />
        <Text style={[typography.display, { marginTop: spacing.md }]}>{mission.title}</Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: spacing.sm }}>
          <View style={styles.metaCell}><Ionicons name="time-outline" color={colors.textSecondary} size={14} /><Text style={[typography.caption, { marginLeft: 4 }]}>{mission.duration_min} MIN</Text></View>
          <View style={styles.metaCell}><Ionicons name="flame" color={colors.xp} size={14} /><Text style={[typography.caption, { marginLeft: 4, color: colors.xp }]}>+{mission.xp} XP</Text></View>
          <View style={styles.metaCell}><Ionicons name="construct-outline" color={colors.textSecondary} size={14} /><Text style={[typography.caption, { marginLeft: 4 }]}>{mission.framework.toUpperCase()}</Text></View>
        </View>

        <Card style={{ marginTop: spacing.lg }}>
          <Text style={typography.caption}>INSTRUCTIONS</Text>
          <Text style={[typography.body, { marginTop: spacing.sm }]}>{mission.description}</Text>
        </Card>

        <Card style={{ marginTop: spacing.md, borderColor: colors.accent }}>
          <Text style={[typography.caption, { color: colors.accent }]}>HOW TO DO IT WELL</Text>
          <Text style={[typography.body, { marginTop: spacing.sm }]}>
            1. Find a quiet spot. Stand if you can — posture changes voice.{"\n"}
            2. Set a timer for {mission.duration_min} minutes.{"\n"}
            3. Record yourself if possible — playback exposes patterns.{"\n"}
            4. After: note one thing you'd change next time.
          </Text>
        </Card>

        <TouchableOpacity
          testID="mission-complete"
          style={[styles.cta, mission.completed && { backgroundColor: colors.success }]}
          onPress={complete}
          disabled={completing || mission.completed}
        >
          {completing ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.ctaText}>{mission.completed ? "Completed ✓" : "Mark complete"}</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
    flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  metaCell: { flexDirection: "row", alignItems: "center" },
  cta: {
    marginTop: spacing.xl, backgroundColor: colors.accent, paddingVertical: 16,
    borderRadius: radii.pill, alignItems: "center",
  },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
});
