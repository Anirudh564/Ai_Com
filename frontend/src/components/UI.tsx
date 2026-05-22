import React from "react";
import { View, Text, StyleSheet, ViewStyle, StyleProp, TextStyle } from "react-native";
import { colors, radii, spacing, typography } from "@/src/theme";

export function Card({
  children,
  style,
  testID,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  return (
    <View style={[styles.card, style]} testID={testID}>
      {children}
    </View>
  );
}

export function ScoreRing({ value, label, color = colors.accent, size = 88 }: {
  value: number; label: string; color?: string; size?: number;
}) {
  // Simple visual ring using border + inner number (no SVG for MVP)
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View style={{ alignItems: "center", width: size + 8 }}>
      <View style={[styles.ringOuter, { width: size, height: size, borderRadius: size / 2, borderColor: color, opacity: 0.85 }]}>
        <Text style={[typography.h2, { color }]}>{clamped}</Text>
      </View>
      <Text style={[typography.caption, { marginTop: 6, textTransform: "uppercase" }]}>{label}</Text>
    </View>
  );
}

export function Pill({ label, color = colors.accent, style, textStyle, testID }: {
  label: string; color?: string; style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle>; testID?: string;
}) {
  return (
    <View style={[styles.pill, { borderColor: color }, style]} testID={testID}>
      <Text style={[styles.pillText, { color }, textStyle]}>{label}</Text>
    </View>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={typography.h1}>{title}</Text>
      {subtitle ? <Text style={[typography.bodyMuted, { marginTop: 4 }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  ringOuter: {
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    backgroundColor: "transparent",
    alignSelf: "flex-start",
  },
  pillText: { fontSize: 12, fontWeight: "600", letterSpacing: 0.4 },
});
