/**
 * Elite Communication Mentor - Design tokens.
 * "Elite Obsidian" archetype - dark zinc base, electric blue accent.
 */
export const colors = {
  bg: "#09090B",
  surface: "#18181B",
  surfaceElevated: "#27272A",
  border: "#27272A",
  borderSubtle: "#3F3F46",
  text: "#FAFAFA",
  textSecondary: "#A1A1AA",
  textMuted: "#52525B",
  accent: "#2563EB",
  accentGlow: "rgba(37, 99, 235, 0.35)",
  xp: "#F59E0B",
  success: "#10B981",
  critique: "#F43F5E",
  feedbackBg: "rgba(37, 99, 235, 0.10)",
};

export const radii = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const typography = {
  display: { fontSize: 32, fontWeight: "800" as const, letterSpacing: -0.8, color: colors.text },
  h1: { fontSize: 26, fontWeight: "800" as const, letterSpacing: -0.6, color: colors.text },
  h2: { fontSize: 20, fontWeight: "700" as const, letterSpacing: -0.3, color: colors.text },
  h3: { fontSize: 16, fontWeight: "700" as const, color: colors.text },
  body: { fontSize: 15, fontWeight: "400" as const, color: colors.text, lineHeight: 22 },
  bodyMuted: { fontSize: 14, fontWeight: "400" as const, color: colors.textSecondary, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: "500" as const, color: colors.textMuted, letterSpacing: 0.4 },
  mono: { fontFamily: "Menlo", fontSize: 13, color: colors.textSecondary },
};
