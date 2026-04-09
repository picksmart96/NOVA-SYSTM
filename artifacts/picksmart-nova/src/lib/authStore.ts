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
  status: "active" | "inactive" | "banned";
  subscriptionPlan: "owner" | "personal" | "company" | null;
  isSubscribed: boolean;
  createdAt: string;
  /** Warehouse this user belongs to. Null = unassigned (owner sees all). */
  warehouseId?: string | null;
  warehouseSlug?: string | null;
}

export interface PendingInvite {
  token: string;
  fullName: string;
  email: string;
  role: AuthRole;
  createdAt: string;
  warehouseId?: string | null;
  warehouseSlug?: string | null;
}

interface AuthState {
  currentUser: AuthAccount | null;
  accounts: AuthAccount[];
  pendingInvites: PendingInvite[];
  usedTokens: string[];
  locked: boolean;

  login: (username: string, password: string) => boolean;
  logout: () => void;
  lock: () => void;
  unlock: (password: string) => boolean;
  updateSubscription: (plan: "personal" | "company") => void;
  banUser: (accountId: string) => void;
  unbanUser: (accountId: string) => void;
  changeRole: (accountId: string, role: AuthRole) => void;
  createAccount: (data: { username: string; password: string; fullName: string; role: AuthRole }) => void;
  removeAccount: (accountId: string) => void;
  addInvite: (data: { fullName: string; email: string; role: AuthRole; warehouseId?: string | null; warehouseSlug?: string | null }) => string;
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
  subscriptionPlan: "owner",
  isSubscribed: true,
  createdAt: new Date().toISOString(),
};

// ── Self-contained invite token helpers ──────────────────────────────────
// Tokens encode invite data as base64 JSON so they work across devices.

function encodeInviteToken(data: { fullName: string; email: string; role: AuthRole; warehouseId?: string | null; warehouseSlug?: string | null }): string {
  const payload = {
    fullName: data.fullName,
    email: data.email,
    role: data.role,
    warehouseId: data.warehouseId ?? null,
    warehouseSlug: data.warehouseSlug ?? null,
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
      warehouseId: obj.warehouseId ?? null,
      warehouseSlug: obj.warehouseSlug ?? null,
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
      locked: false,

      login: (username, password) => {
        // Master credentials always work regardless of persisted accounts list
        if (username === MASTER_ACCOUNT.username && password === MASTER_ACCOUNT.password) {
          set({ currentUser: MASTER_ACCOUNT, locked: false });
          return true;
        }
        const found = get().accounts.find(
          (a) => a.username === username && a.password === password && a.status === "active"
        );
        if (found) {
          set({ currentUser: found, locked: false });
          return true;
        }
        return false;
      },

      lock: () => set({ locked: true }),

      unlock: (password) => {
        const user = get().currentUser;
        if (!user) return false;
        const found = get().accounts.find(
          (a) => a.id === user.id && a.password === password && a.status === "active"
        );
        if (found) {
          set({ locked: false });
          return true;
        }
        return false;
      },

      logout: () => set({ currentUser: null }),

      updateSubscription: (plan) =>
        set((state) => {
          if (!state.currentUser) return {};
          const updated: AuthAccount = {
            ...state.currentUser,
            subscriptionPlan: plan,
            isSubscribed: true,
          };
          return {
            currentUser: updated,
            accounts: state.accounts.map((a) =>
              a.id === updated.id ? updated : a
            ),
          };
        }),

      banUser: (accountId) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === accountId && a.id !== "master"
              ? { ...a, status: "banned" as const }
              : a
          ),
        })),

      unbanUser: (accountId) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === accountId ? { ...a, status: "active" as const } : a
          ),
        })),

      changeRole: (accountId, role) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === accountId && a.id !== "master" ? { ...a, role } : a
          ),
        })),

      removeAccount: (accountId) =>
        set((state) => ({
          // Never allow deleting the master account
          accounts: state.accounts.filter(
            (a) => a.id !== accountId || a.id === "master"
          ),
        })),

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
              subscriptionPlan: null,
              isSubscribed: false,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      addInvite: (data) => {
        const token = encodeInviteToken(data);
        set((state) => ({
          pendingInvites: [
            ...state.pendingInvites,
            {
              token,
              fullName: data.fullName,
              email: data.email,
              role: data.role,
              warehouseId: data.warehouseId ?? null,
              warehouseSlug: data.warehouseSlug ?? null,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return token;
      },

      getInvite: (token) => {
        // Decode invite data from the token itself — works on any device.
        // No expiry or single-use restriction: invite links stay valid forever
        // so the owner can forward the same link as many times as needed.
        return decodeInviteToken(token) ?? undefined;
      },

      acceptInvite: (token, username, password) => {
        const invite = decodeInviteToken(token);
        if (!invite) return false;
        // Only enforce unique usernames — prevents duplicate accounts while
        // keeping the link itself permanently reusable.
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
              subscriptionPlan: "company" as const,
              isSubscribed: true,
              createdAt: new Date().toISOString(),
              warehouseId: invite.warehouseId ?? null,
              warehouseSlug: invite.warehouseSlug ?? null,
            },
          ],
          // Remove from pending list if present (cosmetic — link stays valid)
          pendingInvites: state.pendingInvites.filter((i) => i.token !== token),
        }));
        return true;
      },
    }),
    {
      name: "picksmart-auth-store",
      partialize: (state) => ({
        accounts: state.accounts,
        pendingInvites: state.pendingInvites,
        // usedTokens intentionally excluded — invite links are now permanent.
        // Persist currentUser so sessions survive page refresh and direct link visits.
        // locked is excluded so the screen never auto-locks on load.
        currentUser: state.currentUser,
      }),
    }
  )
);
