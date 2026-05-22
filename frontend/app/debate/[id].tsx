import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api/client";
import { colors, radii, spacing, typography } from "@/src/theme";
import { Card, Pill } from "@/src/components/UI";

export default function DebateSession() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [debate, setDebate] = useState<any>(null);
  const [arg, setArg] = useState("");
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const d = await api<any>(`/debate/${id}`);
    setDebate(d);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!arg.trim() || sending) return;
    setSending(true);
    try {
      await api<any>("/debate/turn", { method: "POST", body: { debate_id: id, user_argument: arg.trim() } });
      setArg("");
      await load();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Try again");
    } finally { setSending(false); }
  };

  const finish = async () => {
    setFinishing(true);
    try {
      const r = await api<any>(`/debate/${id}/finish`, { method: "POST" });
      await load();
      Alert.alert("Debate finished", `Logic ${r.result.logic} · Persuasion ${r.result.persuasion} · Calm ${r.result.calmness} · Rebuttal ${r.result.rebuttal}`);
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "");
    } finally { setFinishing(false); }
  };

  if (!debate) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} testID="debate-session-screen">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} testID="debate-back">
            <Ionicons name="chevron-back" color={colors.text} size={26} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={typography.caption}>LVL {debate.level} · YOU: {debate.user_stance.toUpperCase()}</Text>
            <Text style={typography.h3} numberOfLines={2}>{debate.topic}</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {debate.turns.map((t: any, i: number) => {
            if (t.role === "ai") {
              const d = t.data || {};
              return (
                <View key={i} style={styles.aiTurn} testID={`debate-ai-turn-${i}`}>
                  <Text style={[typography.caption, { color: colors.accent }]}>AETHER</Text>
                  <Text style={[typography.body, { marginTop: 6 }]}>{d.opponent_reply}</Text>
                  {d.cross_examination ? (
                    <View style={styles.crossExam}>
                      <Text style={[typography.caption, { color: colors.critique }]}>CROSS-EXAMINATION</Text>
                      <Text style={[typography.body, { marginTop: 4 }]}>{d.cross_examination}</Text>
                    </View>
                  ) : null}
                  {d.coaching_tip ? (
                    <View style={styles.coach}>
                      <Ionicons name="bulb" color={colors.xp} size={14} />
                      <Text style={[typography.bodyMuted, { color: colors.xp, marginLeft: 6, flex: 1 }]}>
                        {d.coaching_tip}
                      </Text>
                    </View>
                  ) : null}
                  {d.fallacies_detected && d.fallacies_detected.length > 0 ? (
                    <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {d.fallacies_detected.map((f: string, j: number) => (
                        <Pill key={j} label={f} color={colors.critique} />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            }
            return (
              <View key={i} style={styles.userTurn} testID={`debate-user-turn-${i}`}>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>YOU</Text>
                <Text style={[typography.body, { marginTop: 6 }]}>{t.content}</Text>
              </View>
            );
          })}

          {debate.finished && debate.result ? (
            <Card style={{ marginTop: spacing.md, borderColor: colors.accent }}>
              <Text style={[typography.h2, { color: colors.accent }]}>Final breakdown</Text>
              <Text style={[typography.body, { marginTop: 4 }]}>{debate.result.summary?.verdict}</Text>
              <View style={styles.scoreGrid}>
                <ScoreCell label="Logic" v={debate.result.logic} />
                <ScoreCell label="Persuasion" v={debate.result.persuasion} />
                <ScoreCell label="Calm" v={debate.result.calmness} />
                <ScoreCell label="Rebuttal" v={debate.result.rebuttal} />
              </View>
              {debate.result.summary?.top_weaknesses?.length ? (
                <View style={{ marginTop: spacing.md }}>
                  <Text style={typography.caption}>FOCUS NEXT</Text>
                  {(debate.result.summary.transformation_focus || []).map((s: string, i: number) =>
                    <Text key={i} style={[typography.body, { marginTop: 4 }]}>• {s}</Text>
                  )}
                </View>
              ) : null}
            </Card>
          ) : null}

          <View style={{ height: 100 }} />
        </ScrollView>

        {!debate.finished ? (
          <View style={styles.inputRow}>
            <TextInput
              testID="debate-arg-input"
              style={styles.input}
              value={arg}
              onChangeText={setArg}
              placeholder="Your argument…"
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <TouchableOpacity testID="debate-send" style={styles.send} onPress={send} disabled={sending}>
              {sending ? <ActivityIndicator color="#fff" /> : <Ionicons name="arrow-up" color="#fff" size={20} />}
            </TouchableOpacity>
            <TouchableOpacity testID="debate-finish" style={styles.finishBtn} onPress={finish} disabled={finishing}>
              {finishing ? <ActivityIndicator color={colors.accent} /> : <Ionicons name="flag" color={colors.accent} size={20} />}
            </TouchableOpacity>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ScoreCell({ label, v }: { label: string; v: number }) {
  return (
    <View style={styles.scoreCell}>
      <Text style={[typography.mono, { fontSize: 22, color: colors.accent }]}>{v}</Text>
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
  scroll: { padding: spacing.lg, gap: 12 },
  aiTurn: {
    padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.feedbackBg,
    borderWidth: 1, borderColor: "rgba(37,99,235,0.25)", borderLeftWidth: 2, borderLeftColor: colors.accent,
  },
  userTurn: {
    padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  crossExam: {
    marginTop: spacing.md, padding: spacing.sm, backgroundColor: "rgba(244,63,94,0.08)",
    borderRadius: radii.md, borderLeftWidth: 2, borderLeftColor: colors.critique,
  },
  coach: {
    marginTop: spacing.sm, flexDirection: "row", alignItems: "flex-start",
    padding: spacing.sm, backgroundColor: "rgba(245,158,11,0.08)", borderRadius: radii.md,
  },
  inputRow: {
    flexDirection: "row", gap: 8, padding: spacing.md, alignItems: "flex-end",
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg,
  },
  input: {
    flex: 1, maxHeight: 120, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 15,
  },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, justifyContent: "center", alignItems: "center" },
  finishBtn: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.accent,
    justifyContent: "center", alignItems: "center", backgroundColor: colors.surface,
  },
  scoreGrid: { flexDirection: "row", gap: 8, marginTop: spacing.md },
  scoreCell: {
    flex: 1, padding: spacing.sm, borderRadius: radii.md, backgroundColor: colors.surfaceElevated,
    borderWidth: 1, borderColor: colors.border, alignItems: "center",
  },
});
