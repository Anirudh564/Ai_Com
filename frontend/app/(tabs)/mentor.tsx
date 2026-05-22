import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api/client";
import { storage } from "@/src/utils/storage";
import { colors, radii, spacing, typography } from "@/src/theme";

type Msg = { role: "user" | "assistant"; content: string; id: string };
const SESSION_KEY = "mentor_session_id";

export default function Mentor() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      const sid = await storage.getItem<string>(SESSION_KEY, "");
      if (sid) {
        setSessionId(sid);
        try {
          const h = await api<{ messages: any[] }>(`/mentor/history?session_id=${sid}`);
          setMessages(
            h.messages.map((m, i) => ({ role: m.role, content: m.content, id: m.id || String(i) }))
          );
        } catch { /* ignore */ }
      } else {
        // Seed greeting
        setMessages([
          {
            id: "greet",
            role: "assistant",
            content:
              "I'm Aether — your communication mentor. Tell me what you're working on: a tough conversation, a presentation, an interview, or a moment where you felt your voice slipped. I'll give you precise, honest coaching.",
          },
        ]);
      }
    })();
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const userMsg: Msg = { id: Math.random().toString(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);
    try {
      const res = await api<{ session_id: string; reply: string }>("/mentor/chat", {
        method: "POST",
        body: { session_id: sessionId, message: text },
      });
      if (!sessionId) {
        setSessionId(res.session_id);
        await storage.setItem(SESSION_KEY, res.session_id);
      }
      setMessages(prev => [...prev, { id: Math.random().toString(), role: "assistant", content: res.reply }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
      setMessages(prev => [...prev, {
        id: Math.random().toString(), role: "assistant",
        content: "Connection issue. Please try again."
      }]);
    } finally { setSending(false); }
  };

  const newSession = async () => {
    await storage.removeItem(SESSION_KEY);
    setSessionId(null);
    setMessages([{
      id: "greet2", role: "assistant",
      content: "Fresh session. What do you want to work on?",
    }]);
  };

  return (
    <SafeAreaView style={styles.safe} testID="mentor-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <View>
            <Text style={typography.caption}>MENTOR</Text>
            <Text style={typography.h1}>Aether</Text>
          </View>
          <TouchableOpacity testID="mentor-new-session" onPress={newSession} style={styles.iconBtn}>
            <Ionicons name="refresh" color={colors.textSecondary} size={18} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(m => (
            <View
              key={m.id}
              style={[styles.bubble, m.role === "user" ? styles.user : styles.assistant]}
              testID={`message-${m.role}`}
            >
              {m.role === "assistant" ? (
                <Text style={[typography.caption, { color: colors.accent, marginBottom: 4 }]}>AETHER</Text>
              ) : null}
              <Text style={typography.body}>{m.content}</Text>
            </View>
          ))}
          {sending ? (
            <View style={[styles.bubble, styles.assistant, { flexDirection: "row", alignItems: "center", gap: 8 }]}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={typography.bodyMuted}>Thinking…</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            testID="mentor-input"
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything about your communication…"
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <TouchableOpacity testID="mentor-send" style={styles.send} onPress={send} disabled={sending}>
            <Ionicons name="arrow-up" color="#fff" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  iconBtn: { padding: 10, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  scroll: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: 12 },
  bubble: { padding: spacing.md, borderRadius: radii.lg, maxWidth: "90%" },
  assistant: {
    backgroundColor: colors.feedbackBg, borderWidth: 1, borderColor: "rgba(37,99,235,0.25)",
    alignSelf: "flex-start", borderLeftWidth: 2, borderLeftColor: colors.accent,
  },
  user: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignSelf: "flex-end",
  },
  inputRow: {
    flexDirection: "row", alignItems: "flex-end", gap: 8,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md, paddingTop: spacing.sm,
  },
  input: {
    flex: 1, maxHeight: 120, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 15,
  },
  send: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent,
    justifyContent: "center", alignItems: "center",
  },
});
