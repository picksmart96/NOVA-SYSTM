import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

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
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  toggleLanguage: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  language: "en",
  login: async () => ({ ok: false }),
  logout: () => {},
  toggleLanguage: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "es">("en");

  useEffect(() => {
    AsyncStorage.multiGet(["nova_user", "nova_token", "nova_lang"]).then(
      ([userEntry, tokenEntry, langEntry]) => {
        if (userEntry[1]) {
          try { setUser(JSON.parse(userEntry[1])); } catch { /* ignore */ }
        }
        if (tokenEntry[1]) setToken(tokenEntry[1]);
        if (langEntry[1] === "es" || langEntry[1] === "en") setLanguage(langEntry[1]);
      }
    );
  }, []);

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

      setUser(u);
      setToken(jwt);
      await AsyncStorage.multiSet([
        ["nova_user",  JSON.stringify(u)],
        ["nova_token", jwt],
      ]);
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error — check your connection." };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    AsyncStorage.multiRemove(["nova_user", "nova_token"]);
  };

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === "en" ? "es" : "en";
      AsyncStorage.setItem("nova_lang", next);
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, language, login, logout, toggleLanguage }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
