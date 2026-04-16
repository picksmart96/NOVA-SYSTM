import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Enter your username and password.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await login(username.trim(), password);
    setLoading(false);
    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error ?? "Incorrect username or password.");
    }
  };

  const c = colors.dark;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={[styles.logoCircle, { backgroundColor: c.nova }]}>
            <Text style={styles.logoLetter}>N</Text>
          </View>
          <Text style={[styles.brand, { color: c.foreground }]}>PickSmart</Text>
          <Text style={[styles.brandNova, { color: c.primary }]}>NOVA</Text>
          <Text style={[styles.tagline, { color: c.mutedForeground }]}>
            Warehouse Voice Training
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: c.input, borderColor: c.border, color: c.foreground }]}
            placeholder="Username"
            placeholderTextColor={c.mutedForeground}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <TextInput
            style={[styles.input, { backgroundColor: c.input, borderColor: c.border, color: c.foreground }]}
            placeholder="Password"
            placeholderTextColor={c.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />

          {error ? (
            <Text style={[styles.error, { color: c.destructive }]}>{error}</Text>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: c.primary, opacity: pressed || loading ? 0.8 : 1 },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={c.primaryForeground} />
            ) : (
              <Text style={[styles.buttonText, { color: c.primaryForeground }]}>Sign In</Text>
            )}
          </Pressable>
        </View>

        <Text style={[styles.hint, { color: c.mutedForeground }]}>
          Powered by NOVA ES3 Voice Intelligence
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  logoArea: {
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoLetter: {
    fontSize: 40,
    fontWeight: "900" as const,
    color: "#fff",
    letterSpacing: -1,
  },
  brand: {
    fontSize: 22,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  brandNova: {
    fontSize: 32,
    fontWeight: "900" as const,
    letterSpacing: 2,
    marginTop: -4,
  },
  tagline: {
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  form: {
    gap: 14,
  },
  input: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "500" as const,
  },
  error: {
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500" as const,
  },
  button: {
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  hint: {
    fontSize: 12,
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
