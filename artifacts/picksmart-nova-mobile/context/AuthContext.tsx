import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://nova-warehouse-control.replit.app";

interface User {
  id: string;
  username: string;
  role: "selector" | "trainer" | "supervisor" | "manager" | "owner";
  name: string;
  fullName?: string;
  companyName?: string;
  novaId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  language: "en" | "es";
  voiceEnabled: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  toggleLanguage: () => void;
  updateVoiceEnabled: (enabled: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  language: "en",
  voiceEnabled: true,
  login: async () => ({ ok: false }),
  logout: () => {},
  toggleLanguage: () => {},
  updateVoiceEnabled: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [token, setToken]       = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    AsyncStorage.multiGet(["nova_user", "nova_token", "nova_lang", "nova_voice_global"]).then(
      ([userEntry, tokenEntry, langEntry, voiceEntry]) => {
        if (userEntry[1]) {
          try { setUser(JSON.parse(userEntry[1])); } catch { /* ignore */ }
        }
        if (tokenEntry[1]) {
          setToken(tokenEntry[1]);
          tokenRef.current = tokenEntry[1];
          // Refresh voice preference from server on app startup
          fetchAndApplyVoicePref(tokenEntry[1]);
        }
        if (langEntry[1] === "es" || langEntry[1] === "en") setLanguage(langEntry[1]);
        // Apply cached value immediately; server fetch will override
        if (voiceEntry[1] !== null && voiceEntry[1] !== undefined) {
          setVoiceEnabled(voiceEntry[1] === "true");
        }
      }
    );
  }, []);

  async function fetchAndApplyVoicePref(jwt: string) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const serverValue: boolean = data.user?.voiceEnabled ?? true;
      setVoiceEnabled(serverValue);
      AsyncStorage.setItem("nova_voice_global", String(serverValue));
    } catch {
      // Network unavailable — keep cached value
    }
  }

  const login = async (username: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data?.error ?? "Invalid credentials" };

      const u: User = {
        id:          data.user?.id ?? "",
        username:    data.user?.username ?? username,
        role:        data.user?.role ?? "selector",
        name:        data.user?.fullName ?? data.user?.username ?? username,
        fullName:    data.user?.fullName,
        companyName: data.user?.companyName,
        novaId:      data.user?.novaId,
      };
      const jwt = data.token ?? data.jwtToken ?? "";

      // Apply server voice preference from login response
      const serverVoice: boolean = data.user?.voiceEnabled ?? true;

      setUser(u);
      setToken(jwt);
      tokenRef.current = jwt;
      setVoiceEnabled(serverVoice);

      await AsyncStorage.multiSet([
        ["nova_user",         JSON.stringify(u)],
        ["nova_token",        jwt],
        ["nova_voice_global", String(serverVoice)],
      ]);

      return { ok: true };
    } catch {
      return { ok: false, error: "Network error — check your connection." };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    tokenRef.current = null;
    setVoiceEnabled(true);
    AsyncStorage.multiRemove(["nova_user", "nova_token", "nova_voice_global"]);
  };

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === "en" ? "es" : "en";
      AsyncStorage.setItem("nova_lang", next);
      return next;
    });
  };

  const updateVoiceEnabled = async (enabled: boolean) => {
    setVoiceEnabled(enabled);
    // Update local cache immediately for offline resilience
    await AsyncStorage.setItem("nova_voice_global", String(enabled));
    // Sync to server in background
    const jwt = tokenRef.current;
    if (!jwt) return;
    try {
      await fetch(`${API_BASE}/api/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ voiceEnabled: enabled }),
      });
    } catch {
      // Network unavailable — local cache already updated, will sync next login
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, language, voiceEnabled, login, logout, toggleLanguage, updateVoiceEnabled }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
