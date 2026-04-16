import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import colors from "@/constants/colors";

export default function TabLayout() {
  const c = colors.dark;
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.mutedForeground,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : c.card,
          borderTopWidth: 1,
          borderTopColor: c.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: c.card }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="picking"
        options={{
          title: "Picking",
          tabBarIcon: ({ color }) => <Feather name="zap" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trainer"
        options={{
          title: "Trainer",
          tabBarIcon: ({ color }) => <Feather name="users" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "NOVA Help",
          tabBarIcon: ({ color }) => <Feather name="mic" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: "Training",
          tabBarIcon: ({ color }) => <Feather name="book-open" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Command",
          tabBarIcon: ({ color }) => <Feather name="command" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
