import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api/client";
import { colors, radii, spacing, typography } from "@/src/theme";
import { Card, Pill } from "@/src/components/UI";

const TYPES: { key: any; label: string }[] = [
  { key: "hr", label: "HR" },
  { key: "college", label: "College" },
  { key: "leadership", label: "Leadership" },
  { key: "internship", label: "Internship" },
  { key: "stress", label: "Stress" },
];

export default function MockInterview() {
  const router = useRouter();
  const [type, setType] = useState<any>("hr");
  const [interview, setInterview] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const start = async () => {
    setLoading(true);
    try {
      const d = await api<any>("/interview/start", { method: "POST", body: { interview_type: type } });
      setInterview(d);
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "");
    } finally { setLoading(false); }
  };

  const submit = async () => {
    if (!answer.trim() || loading) return;
    setLoading(true);
    try {
      await api<any>("/interview/answer", { method: "POST", body: { interview_id: interview.id, answer: answer.trim() } });
      const d = await api<any>(`/interview/${interview.id}`);
      setInterview(d);
      setAnswer("");
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "");
    } finally { setLoading(false); }
  };

  useEffect(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, [interview?.turns?.length]);

  return (
    <SafeAreaView style={styles.safe} testID="interview-screen">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} testID="interview-back">
            <Ionicons name="chevron-back" color={colors.text} size={26} />
          </TouchableOpacity>
          <Text style={[typography.h3, { marginLeft: 8 }]}>Mock interview</Text>
        </View>

        {!interview ? (
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={typography.h2}>Choose interview type</Text>
            <Text style={[typography.bodyMuted, { marginTop: 4 }]}>Aether will conduct a focused 5-question simulation with live scoring.</Text>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: spacing.md }}>
              {TYPES.map(t => (
                <TouchableOpacity
                  key={t.key} testID={`interview-type-${t.key}`}
                  onPress={() => setType(t.key)}
                  style={[styles.chip, type === t.key && styles.chipActive]}
                >
                  <Text style={[styles.chipText, type === t.key && { color: "#fff" }]}>{t.label.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity testID="interview-start" style={styles.cta} onPress={start} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Begin interview</Text>}
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <>
            <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
              {interview.turns.map((t: any, i: number) => {
                if (t.role === "ai") {
                  const d = t.data || {};
                  return (
                    <View key={i} style={styles.aiTurn}>
                      <Text style={[typography.caption, { color: colors.accent }]}>INTERVIEWER</Text>
                      <Text style={[typography.body, { marginTop: 6 }]}>{d.question}</Text>
                      {d.evaluation && (d.evaluation.clarity || d.evaluation.confidence || d.evaluation.structure) ? (
                        <View style={styles.evalBox}>
                          <Text style={typography.caption}>EVALUATION OF LAST ANSWER</Text>
                          <View style={styles.evalRow}>
                            <EvalCell label="Clarity" v={d.evaluation.clarity} />
                            <EvalCell label="Conf." v={d.evaluation.confidence} />
                            <EvalCell label="Struct." v={d.evaluation.structure} />
                            <EvalCell label="STAR" v={d.evaluation.star_usage} />
                          </View>
                          {d.evaluation.notes ? <Text style={[typography.bodyMuted, { marginTop: 8 }]}>{d.evaluation.notes}</Text> : null}
                        </View>
                      ) : null}
                    </View>
                  );
                }
                return (
                  <View key={i} style={styles.userTurn}>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>YOU</Text>
                    <Text style={[typography.body, { marginTop: 6 }]}>{t.content}</Text>
                  </View>
                );
              })}
              {interview.finished ? (
                <Card style={{ marginTop: spacing.md, borderColor: colors.success }}>
                  <Pill label="INTERVIEW COMPLETE" color={colors.success} />
                  <Text style={[typography.body, { marginTop: 8 }]}>
                    Great work. Review the per-answer evaluations above to spot patterns.
                  </Text>
                </Card>
              ) : null}
              <View style={{ height: 100 }} />
            </ScrollView>

            {!interview.finished ? (
              <View style={styles.inputRow}>
                <TextInput
                  testID="interview-answer-input"
                  style={styles.input}
                  value={answer}
                  onChangeText={setAnswer}
                  placeholder="Your answer (use STAR)…"
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
                <TouchableOpacity testID="interview-submit-answer" style={styles.send} onPress={submit} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="arrow-up" color="#fff" size={20} />}
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function EvalCell({ label, v }: { label: string; v: number }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={[typography.mono, { color: colors.accent, fontSize: 16 }]}>{v ?? 0}</Text>
      <Text style={typography.caption}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
    flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  scroll: { padding: spacing.lg, gap: 12, paddingBottom: spacing.xl * 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surfaceElevated },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textSecondary, fontWeight: "700", fontSize: 12, letterSpacing: 0.5 },
  cta: { marginTop: spacing.lg, backgroundColor: colors.accent, paddingVertical: 14, borderRadius: radii.pill, alignItems: "center" },
  ctaText: { color: "#fff", fontWeight: "800", letterSpacing: 0.3 },
  aiTurn: {
    padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.feedbackBg,
    borderWidth: 1, borderColor: "rgba(37,99,235,0.25)", borderLeftWidth: 2, borderLeftColor: colors.accent,
  },
  userTurn: { padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  evalBox: {
    marginTop: spacing.md, padding: spacing.sm, backgroundColor: colors.bg,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
  },
  evalRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  inputRow: {
    flexDirection: "row", gap: 8, padding: spacing.md, alignItems: "flex-end",
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg,
  },
  input: {
    flex: 1, maxHeight: 140, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 15,
  },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, justifyContent: "center", alignItems: "center" },
});
