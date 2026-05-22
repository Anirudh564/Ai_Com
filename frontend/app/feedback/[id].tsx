import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api/client";
import { colors, radii, spacing, typography } from "@/src/theme";
import { Card, ScoreRing, Pill } from "@/src/components/UI";

export default function FeedbackDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    api<any>(`/speech/reports/${id}`).then(setReport).catch(() => setReport(null));
  }, [id]);

  if (!report) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }
  const d = report.data || {};

  return (
    <SafeAreaView style={styles.safe} testID="feedback-screen">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="feedback-back">
          <Ionicons name="chevron-back" color={colors.text} size={26} />
        </TouchableOpacity>
        <Text style={[typography.h3, { marginLeft: 8 }]}>Speech analysis</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Pill label={(report.context || "general").toUpperCase()} color={colors.accent} />
        <Text style={[typography.h1, { marginTop: spacing.md }]}>{d.headline || "Your scorecard"}</Text>

        <View style={styles.ringRow}>
          <ScoreRing label="Overall" value={d.overall_score ?? 0} color={colors.accent} size={110} />
        </View>

        <View style={styles.scoreGrid}>
          {[
            ["Voice", d.voice_score],
            ["Confidence", d.confidence_score],
            ["Body Lang.", d.body_language_score],
            ["Structure", d.structure_score],
            ["Charisma", d.charisma_score],
            ["Assertive", d.assertiveness_score],
            ["Public Spk.", d.public_speaking_score],
          ].map(([label, v]) => (
            <View key={label as string} style={styles.scoreCell}>
              <Text style={[typography.mono, { fontSize: 22, color: colors.text }]}>{v ?? 0}</Text>
              <Text style={typography.caption}>{(label as string).toUpperCase()}</Text>
            </View>
          ))}
        </View>

        {d.strengths?.length ? (
          <Card style={{ marginTop: spacing.lg, borderLeftWidth: 2, borderLeftColor: colors.success }}>
            <Text style={[typography.caption, { color: colors.success }]}>WHAT WORKED</Text>
            {d.strengths.map((s: string, i: number) => (
              <Text key={i} style={[typography.body, { marginTop: 6 }]}>• {s}</Text>
            ))}
          </Card>
        ) : null}

        {d.weaknesses?.length ? (
          <Card style={{ marginTop: spacing.md, borderLeftWidth: 2, borderLeftColor: colors.critique }}>
            <Text style={[typography.caption, { color: colors.critique }]}>WEAK SPOTS</Text>
            {d.weaknesses.map((s: string, i: number) => (
              <Text key={i} style={[typography.body, { marginTop: 6 }]}>• {s}</Text>
            ))}
          </Card>
        ) : null}

        {d.mistakes?.length ? (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={typography.h2}>Mistakes & fixes</Text>
            {d.mistakes.map((m: any, i: number) => (
              <Card key={i} style={{ marginTop: spacing.md, borderLeftWidth: 2, borderLeftColor: colors.critique }}>
                {m.quote ? <Text style={[typography.mono, { color: colors.textSecondary }]}>"{m.quote}"</Text> : null}
                <Text style={[typography.body, { marginTop: 6, color: colors.critique }]}>{m.issue}</Text>
                <Text style={[typography.body, { marginTop: 6 }]}>Fix: {m.fix}</Text>
              </Card>
            ))}
          </View>
        ) : null}

        {d.recommended_drills?.length ? (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={typography.h2}>Recommended drills</Text>
            {d.recommended_drills.map((dr: any, i: number) => (
              <Card key={i} style={{ marginTop: spacing.md }}>
                <Text style={typography.h3}>{dr.name}</Text>
                <Text style={[typography.bodyMuted, { marginTop: 4 }]}>{dr.why}</Text>
                <Text style={[typography.body, { marginTop: 6 }]}>{dr.how}</Text>
              </Card>
            ))}
          </View>
        ) : null}

        {d.next_steps?.length ? (
          <Card style={{ marginTop: spacing.lg, borderColor: colors.accent }}>
            <Text style={[typography.caption, { color: colors.accent }]}>NEXT 24 HOURS</Text>
            {d.next_steps.map((s: string, i: number) =>
              <Text key={i} style={[typography.body, { marginTop: 6 }]}>{i + 1}. {s}</Text>
            )}
          </Card>
        ) : null}

        <View style={{ height: 80 }} />
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
  ringRow: { alignItems: "center", marginTop: spacing.lg },
  scoreGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.lg },
  scoreCell: {
    flexBasis: "30%", flexGrow: 1, padding: spacing.sm, backgroundColor: colors.surface,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, alignItems: "center",
  },
});
