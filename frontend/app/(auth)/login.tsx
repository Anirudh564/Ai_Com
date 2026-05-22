import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { colors, radii, spacing, typography } from "@/src/theme";

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async () => {
    setErr(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setErr(e?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandBlock}>
            <Text style={styles.brandMark}>AETHER</Text>
            <Text style={[typography.caption, { marginTop: 4 }]}>
              ELITE COMMUNICATION MENTOR
            </Text>
          </View>

          <Text style={typography.display}>Welcome back.</Text>
          <Text style={[typography.bodyMuted, { marginTop: 8, marginBottom: spacing.lg }]}>
            Continue your transformation. Speak with clarity, calm and authority.
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            testID="login-email-input"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            testID="login-password-input"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
          />

          {err ? <Text style={styles.error}>{err}</Text> : null}

          <TouchableOpacity
            testID="login-submit-button"
            style={styles.cta}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <Text style={typography.bodyMuted}>New here?</Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity testID="go-signup-link">
                <Text style={styles.link}>Create account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl + 24 },
  brandBlock: { marginBottom: spacing.xl + 8 },
  brandMark: { color: colors.accent, fontSize: 22, fontWeight: "900", letterSpacing: 4 },
  label: {
    ...typography.caption, marginTop: spacing.md, marginBottom: spacing.xs,
    textTransform: "uppercase", color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 14,
    color: colors.text, fontSize: 16,
  },
  cta: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: radii.pill,
    alignItems: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
  bottomRow: {
    marginTop: spacing.lg, flexDirection: "row", gap: 8, justifyContent: "center",
  },
  link: { color: colors.accent, fontWeight: "700" },
  error: { color: colors.critique, marginTop: spacing.md, fontSize: 14 },
});
