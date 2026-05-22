import React from "react";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { Platform, View, ActivityIndicator } from "react-native";

export default function TabsLayout() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(9,9,11,0.95)",
          borderTopColor: "rgba(255,255,255,0.06)",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 70,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", letterSpacing: 0.2 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarTestID: "tab-home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: "Train",
          tabBarTestID: "tab-train",
          tabBarIcon: ({ color, size }) => <Ionicons name="flame" color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="debate"
        options={{
          title: "Debate",
          tabBarTestID: "tab-debate",
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="analyze"
        options={{
          title: "Analyze",
          tabBarTestID: "tab-analyze",
          tabBarIcon: ({ color, size }) => <Ionicons name="analytics" color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="mentor"
        options={{
          title: "Mentor",
          tabBarTestID: "tab-mentor",
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" color={color} size={size - 2} />,
        }}
      />
    </Tabs>
  );
}
