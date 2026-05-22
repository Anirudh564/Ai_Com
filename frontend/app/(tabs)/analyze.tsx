import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api/client";
import { colors, radii, spacing, typography } from "@/src/theme";
import { Card, SectionTitle, Pill } from "@/src/components/UI";

const CONTEXTS = ["impromptu", "presentation", "interview", "networking", "storytelling"];

export default function Analyze() {
  const router = useRouter();
  const [transcript, setTranscript] = useState("");
  const [context, setContext] = useState("impromptu");
  const [duration, setDuration] = useState("60");
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);

  const loadReports = useCallback(async () => {
    try {
      const r = await api<{ reports: any[] }>("/speech/reports");
      setReports(r.reports);
    } catch { /* ignore */ }
  }, []);

  useFocusEffect(useCallback(() => { loadReports(); }, [loadReports]));

  const analyze = async () => {
    if (transcript.trim().length < 20) {
      Alert.alert("Need more text", "Please paste at least a couple of sentences from your speech.");
      return;
    }
    setLoading(true);
    try {
      const res = await api<any>("/speech/analyze", {
        method: "POST",
        body: {
          transcript: transcript.trim(),
          context,
          duration_seconds: parseInt(duration || "0") || null,
        },
      });
      setTranscript("");
      await loadReports();
      router.push({ pathname: "/feedback/[id]", params: { id: res.report.id } });
    } catch (e: any) {
      Alert.alert("Analysis failed", e?.message || "Try again.");
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe} testID="analyze-screen">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <SectionTitle title="Analyze speech" subtitle="Paste a transcript. Aether returns a precise scorecard with timestamped corrections." />

          <Card>
            <Text style={typography.caption}>CONTEXT</Text>
            <View style={styles.row}>
              {CONTEXTS.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setContext(c)}
                  testID={`context-${c}`}
                  style={[styles.chip, context === c && styles.chipActive]}
                >
                  <Text style={[styles.chipText, context === c && { color: "#fff" }]}>{c.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[typography.caption, { marginTop: spacing.md }]}>DURATION (SECONDS)</Text>
            <TextInput
              testID="duration-input"
              style={[styles.input, { height: 48 }]}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholder="60"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[typography.caption, { marginTop: spacing.md }]}>TRANSCRIPT</Text>
            <TextInput
              testID="transcript-input"
              style={[styles.input, { minHeight: 150, textAlignVertical: "top" }]}
              value={transcript}
              onChangeText={setTranscript}
              multiline
              placeholder="Paste or type what you said. Include filler words like 'um' if you remember them — they reveal a lot."
              placeholderTextColor={colors.textMuted}
            />

            <TouchableOpacity
              testID="analyze-submit"
              style={styles.cta}
              onPress={analyze}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="analytics" color="#fff" size={18} />
                  <Text style={styles.ctaText}>Analyze speech</Text>
                </View>
              )}
            </TouchableOpacity>
          </Card>

          {reports.length > 0 ? (
            <>
              <Text style={[typography.h2, { marginTop: spacing.xl }]}>Past reports</Text>
              <View style={{ gap: 10, marginTop: spacing.md }}>
                {reports.map(r => {
                  const d = r.data || {};
                  return (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => router.push({ pathname: "/feedback/[id]", params: { id: r.id } })}
                      activeOpacity={0.85}
                      testID={`report-${r.id}`}
                    >
                      <Card>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <Pill label={(r.context || "general").toUpperCase()} color={colors.accent} />
                          <Text style={[typography.mono, { color: colors.text, fontSize: 18 }]}>{d.overall_score ?? "—"}</Text>
                        </View>
                        <Text style={[typography.body, { marginTop: 8 }]} numberOfLines={2}>{d.headline || "Analysis report"}</Text>
                        <Text style={[typography.caption, { marginTop: 6 }]}>{new Date(r.created_at).toLocaleString()}</Text>
                      </Card>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : null}

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  row: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill,
    borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surfaceElevated,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textSecondary, fontWeight: "700", fontSize: 11, letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.md, padding: 12, color: colors.text, fontSize: 15, marginTop: 6,
  },
  cta: {
    marginTop: spacing.md, backgroundColor: colors.accent, paddingVertical: 14,
    borderRadius: radii.pill, alignItems: "center",
  },
  ctaText: { color: "#fff", fontWeight: "800", letterSpacing: 0.3 },
});
