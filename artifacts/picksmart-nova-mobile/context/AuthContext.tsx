import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  username: string;
  role: "selector" | "trainer" | "supervisor" | "manager" | "owner";
  name: string;
}

interface AuthContextType {
  user: User | null;
  language: "en" | "es";
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  toggleLanguage: () => void;
}

const USERS: Record<string, { password: string; user: User }> = {
  draogo96: {
    password: "Draogo1996#",
    user: { username: "draogo96", role: "owner", name: "Owner" },
  },
  selector1: {
    password: "selector123",
    user: { username: "selector1", role: "selector", name: "Alex Rivera" },
  },
  trainer1: {
    password: "trainer123",
    user: { username: "trainer1", role: "trainer", name: "Sam Torres" },
  },
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  language: "en",
  login: async () => false,
  logout: () => {},
  toggleLanguage: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<"en" | "es">("en");

  useEffect(() => {
    AsyncStorage.multiGet(["nova_user", "nova_lang"]).then(([userEntry, langEntry]) => {
      if (userEntry[1]) {
        try { setUser(JSON.parse(userEntry[1])); } catch { /* ignore */ }
      }
      if (langEntry[1] === "es" || langEntry[1] === "en") {
        setLanguage(langEntry[1]);
      }
    });
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const entry = USERS[username.toLowerCase()];
    if (!entry || entry.password !== password) return false;
    setUser(entry.user);
    await AsyncStorage.setItem("nova_user", JSON.stringify(entry.user));
    return true;
  };

  const logout = () => {
    setUser(null);
    AsyncStorage.removeItem("nova_user");
  };

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === "en" ? "es" : "en";
      AsyncStorage.setItem("nova_lang", next);
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, language, login, logout, toggleLanguage }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
