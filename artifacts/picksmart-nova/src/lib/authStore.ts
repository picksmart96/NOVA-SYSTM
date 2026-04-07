import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthRole = "selector" | "trainer" | "supervisor" | "manager" | "owner";

export const ROLE_RANK: Record<AuthRole, number> = {
  selector: 0,
  trainer: 1,
  supervisor: 2,
  manager: 3,
  owner: 4,
};

export function atLeastRole(min: AuthRole, role: AuthRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

export interface AuthAccount {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: AuthRole;
  status: "active" | "inactive";
  createdAt: string;
}

export interface PendingInvite {
  token: string;
  fullName: string;
  email: string;
  role: AuthRole;
  createdAt: string;
}

interface AuthState {
  currentUser: AuthAccount | null;
  accounts: AuthAccount[];
  pendingInvites: PendingInvite[];
  usedTokens: string[];

  login: (username: string, password: string) => boolean;
  logout: () => void;
  createAccount: (data: { username: string; password: string; fullName: string; role: AuthRole }) => void;
  addInvite: (data: { fullName: string; email: string; role: AuthRole }) => string;
  acceptInvite: (token: string, username: string, password: string) => boolean;
  getInvite: (token: string) => PendingInvite | undefined;
}

const MASTER_ACCOUNT: AuthAccount = {
  id: "master",
  username: "draogo96",
  password: "Draogo1996#",
  fullName: "soumaila ouedraogo",
  role: "owner",
  status: "active",
  createdAt: new Date().toISOString(),
};

// ── Self-contained invite token helpers ──────────────────────────────────
// Tokens encode invite data as base64 JSON so they work across devices.

function encodeInviteToken(data: { fullName: string; email: string; role: AuthRole }): string {
  const payload = {
    fullName: data.fullName,
    email: data.email,
    role: data.role,
    nonce: Math.random().toString(36).slice(2, 10),
    createdAt: new Date().toISOString(),
  };
  try {
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    // Convert to URL-safe base64 (no +, /, = in URLs)
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return "";
  }
}

function decodeInviteToken(token: string): PendingInvite | null {
  try {
    // Restore standard base64 from URL-safe base64
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = decodeURIComponent(escape(atob(padded)));
    const obj = JSON.parse(json);
    if (!obj.fullName || !obj.email || !obj.role || !obj.nonce) return null;
    return {
      token,
      fullName: obj.fullName,
      email: obj.email,
      role: obj.role as AuthRole,
      createdAt: obj.createdAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      accounts: [MASTER_ACCOUNT],
      pendingInvites: [],
      usedTokens: [],

      login: (username, password) => {
        const found = get().accounts.find(
          (a) => a.username === username && a.password === password && a.status === "active"
        );
        if (found) {
          set({ currentUser: found });
          return true;
        }
        return false;
      },

      logout: () => set({ currentUser: null }),

      createAccount: (data) =>
        set((state) => ({
          accounts: [
            ...state.accounts,
            {
              id: crypto.randomUUID(),
              username: data.username,
              password: data.password,
              fullName: data.fullName,
              role: data.role,
              status: "active",
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      addInvite: (data) => {
        const token = encodeInviteToken(data);
        // Also store a record for the invites list view (optional UI use)
        set((state) => ({
          pendingInvites: [
            ...state.pendingInvites,
            {
              token,
              fullName: data.fullName,
              email: data.email,
              role: data.role,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return token;
      },

      getInvite: (token) => {
        // First check if already used
        if (get().usedTokens.includes(token)) return undefined;
        // Decode from token itself (works on any device)
        return decodeInviteToken(token) ?? undefined;
      },

      acceptInvite: (token, username, password) => {
        if (get().usedTokens.includes(token)) return false;
        const invite = decodeInviteToken(token);
        if (!invite) return false;
        const taken = get().accounts.find((a) => a.username === username);
        if (taken) return false;

        set((state) => ({
          accounts: [
            ...state.accounts,
            {
              id: crypto.randomUUID(),
              username,
              password,
              fullName: invite.fullName,
              role: invite.role,
              status: "active",
              createdAt: new Date().toISOString(),
            },
          ],
          // Mark token as used so it can't be reused
          usedTokens: [...state.usedTokens, token],
          // Remove from pending list if present
          pendingInvites: state.pendingInvites.filter((i) => i.token !== token),
        }));
        return true;
      },
    }),
    { name: "picksmart-auth-store" }
  )
);
