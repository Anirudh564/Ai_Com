import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api/client";
import { colors, radii, spacing, typography } from "@/src/theme";
import { Card, SectionTitle, Pill } from "@/src/components/UI";

export default function Debate() {
  const router = useRouter();
  const [topics, setTopics] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [stance, setStance] = useState<"for" | "against">("for");
  const [level, setLevel] = useState(2);
  const [history, setHistory] = useState<any[]>([]);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    try {
      const t = await api<{ topics: string[] }>("/debate/topics/suggest", { auth: false });
      setTopics(t.topics);
    } catch { /* ignore */ }
    try {
      const h = await api<{ debates: any[] }>("/debate");
      setHistory(h.debates);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const start = async (topic: string) => {
    if (!topic.trim()) { Alert.alert("Pick a topic", "Type a topic or choose one above."); return; }
    setStarting(true);
    try {
      const d = await api<any>("/debate/start", {
        method: "POST",
        body: { topic: topic.trim(), user_stance: stance, level },
      });
      router.push({ pathname: "/debate/[id]", params: { id: d.id } });
    } catch (e: any) {
      Alert.alert("Could not start debate", e?.message || "");
    } finally { setStarting(false); }
  };

  return (
    <SafeAreaView style={styles.safe} testID="debate-screen">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <SectionTitle title="Debate arena" subtitle="Spar with Aether. Build calm clarity under pressure." />

          <Card>
            <Text style={typography.caption}>YOUR STANCE</Text>
            <View style={styles.row}>
              <Toggle label="FOR" active={stance === "for"} onPress={() => setStance("for")} testID="stance-for" />
              <Toggle label="AGAINST" active={stance === "against"} onPress={() => setStance("against")} testID="stance-against" />
            </View>

            <Text style={[typography.caption, { marginTop: spacing.md }]}>DIFFICULTY · LEVEL {level}/6</Text>
            <View style={styles.row}>
              {[1, 2, 3, 4, 5, 6].map(l => (
                <TouchableOpacity
                  key={l}
                  testID={`level-${l}`}
                  style={[styles.levelBtn, level === l && styles.levelBtnActive]}
                  onPress={() => setLevel(l)}
                >
                  <Text style={[typography.mono, { color: level === l ? "#fff" : colors.textSecondary }]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[typography.caption, { marginTop: spacing.md }]}>CUSTOM TOPIC</Text>
            <TextInput
              testID="debate-custom-input"
              style={styles.input}
              value={custom}
              onChangeText={setCustom}
              placeholder="e.g. Should AI write college essays?"
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <TouchableOpacity
              testID="debate-start-custom"
              style={styles.cta}
              onPress={() => start(custom)}
              disabled={starting}
            >
              {starting ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Start debate</Text>}
            </TouchableOpacity>
          </Card>

          <Text style={[typography.h2, { marginTop: spacing.xl }]}>Suggested topics</Text>
          <View style={{ gap: 10, marginTop: spacing.md }}>
            {topics.map((t, idx) => (
              <TouchableOpacity
                key={idx}
                testID={`debate-topic-${idx}`}
                onPress={() => start(t)}
                activeOpacity={0.85}
              >
                <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Ionicons name="megaphone-outline" color={colors.accent} size={18} />
                  <Text style={[typography.body, { flex: 1 }]}>{t}</Text>
                  <Ionicons name="play" color={colors.accent} size={18} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          {history.length > 0 ? (
            <>
              <Text style={[typography.h2, { marginTop: spacing.xl }]}>Recent debates</Text>
              <View style={{ gap: 10, marginTop: spacing.md }}>
                {history.slice(0, 8).map(d => (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => router.push({ pathname: "/debate/[id]", params: { id: d.id } })}
                    activeOpacity={0.85}
                    testID={`history-debate-${d.id}`}
                  >
                    <Card>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Pill label={d.finished ? "FINISHED" : "IN PROGRESS"} color={d.finished ? colors.success : colors.xp} />
                        <Text style={[typography.mono, { color: colors.textMuted }]}>LVL {d.level}</Text>
                      </View>
                      <Text style={[typography.h3, { marginTop: 8 }]} numberOfLines={2}>{d.topic}</Text>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Toggle({ label, active, onPress, testID }: { label: string; active: boolean; onPress: () => void; testID: string }) {
  return (
    <TouchableOpacity onPress={onPress} testID={testID} style={[styles.toggle, active && styles.toggleActive]}>
      <Text style={[styles.toggleText, active && { color: "#fff" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  row: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  toggle: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: radii.pill,
    borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surfaceElevated,
  },
  toggleActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  toggleText: { color: colors.textSecondary, fontWeight: "700", fontSize: 12, letterSpacing: 0.5 },
  levelBtn: {
    width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.borderSubtle,
    justifyContent: "center", alignItems: "center", backgroundColor: colors.surfaceElevated,
  },
  levelBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  input: {
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.md, padding: 12, color: colors.text, fontSize: 15, minHeight: 60, marginTop: 6,
  },
  cta: {
    marginTop: spacing.md, backgroundColor: colors.accent, paddingVertical: 14,
    borderRadius: radii.pill, alignItems: "center",
  },
  ctaText: { color: "#fff", fontWeight: "800", letterSpacing: 0.3 },
});
