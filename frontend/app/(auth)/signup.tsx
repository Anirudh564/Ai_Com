import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { colors, radii, spacing, typography } from "@/src/theme";

export default function Signup() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async () => {
    setErr(null);
    if (password.length < 6) { setErr("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await signUp(name.trim(), email.trim(), password);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setErr(e?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={styles.brandMark}>AETHER</Text>
            <Text style={[typography.caption, { marginTop: 4 }]}>BEGIN YOUR TRANSFORMATION</Text>
          </View>

          <Text style={typography.display}>Build the voice you deserve.</Text>
          <Text style={[typography.bodyMuted, { marginTop: 8, marginBottom: spacing.lg }]}>
            Daily drills, AI debates, mock interviews — coached with precision.
          </Text>

          <Text style={styles.label}>Full name</Text>
          <TextInput
            testID="signup-name-input" style={styles.input}
            value={name} onChangeText={setName}
            placeholder="Arjun Patel" placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            testID="signup-email-input" style={styles.input}
            value={email} onChangeText={setEmail}
            autoCapitalize="none" keyboardType="email-address"
            placeholder="you@example.com" placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            testID="signup-password-input" style={styles.input}
            value={password} onChangeText={setPassword} secureTextEntry
            placeholder="At least 6 characters" placeholderTextColor={colors.textMuted}
          />

          {err ? <Text style={styles.error}>{err}</Text> : null}

          <TouchableOpacity
            testID="signup-submit-button" style={styles.cta}
            onPress={onSubmit} disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Create account</Text>}
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <Text style={typography.bodyMuted}>Already a member?</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity testID="go-login-link"><Text style={styles.link}>Sign in</Text></TouchableOpacity>
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
    marginTop: spacing.xl, backgroundColor: colors.accent, paddingVertical: 16,
    borderRadius: radii.pill, alignItems: "center",
    shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 18, shadowOffset: { width: 0, height: 0 },
  },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
  bottomRow: { marginTop: spacing.lg, flexDirection: "row", gap: 8, justifyContent: "center" },
  link: { color: colors.accent, fontWeight: "700" },
  error: { color: colors.critique, marginTop: spacing.md, fontSize: 14 },
});
