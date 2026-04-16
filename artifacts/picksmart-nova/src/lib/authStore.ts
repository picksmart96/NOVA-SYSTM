import { create } from "zustand";
import { persist } from "zustand/middleware";
import { psaApi, type ServerUser } from "./psaApi";

export type AuthRole = "selector" | "trainer" | "supervisor" | "manager" | "director" | "owner";

export const ROLE_RANK: Record<AuthRole, number> = {
  selector: 0,
  trainer: 1,
  supervisor: 2,
  manager: 3,
  director: 4,
  owner: 5,
};

export function atLeastRole(min: AuthRole, role: AuthRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

export interface AuthAccount {
  id: string;
  username: string;
  password: string;
  fullName: string;
  email?: string;
  role: AuthRole;
  status: "active" | "inactive" | "banned";
  subscriptionPlan: "owner" | "personal" | "company" | null;
  isSubscribed: boolean;
  createdAt: string;
  accountNumber?: string;
  warehouseId?: string | null;
  warehouseSlug?: string | null;
  isDemoUser?: boolean;
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
  nextAccountNumber: number;
  jwtToken: string | null;

  login: (username: string, password: string) => boolean;
  loginAsync: (username: string, password: string) => Promise<boolean>;
  loginWithToken: (token: string, user: ServerUser) => void;
  restoreSession: () => Promise<void>;
  syncUsersFromServer: () => Promise<void>;
  loginAsDemo: (role?: AuthRole) => void;
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
  getUserByEmail: (email: string) => AuthAccount | undefined;
  getAccountByNumber: (accountNumber: string) => AuthAccount | undefined;
  resetPassword: (email: string, newPassword: string) => boolean;
}

const MASTER_ACCOUNT: AuthAccount = {
  id: "master",
  username: "draogo96",
  password: "",
  fullName: "soumaila ouedraogo",
  role: "owner",
  status: "active",
  subscriptionPlan: "owner",
  isSubscribed: true,
  accountNumber: "PSA-0001",
  createdAt: new Date().toISOString(),
};

function formatAccountNumber(n: number): string {
  return "PSA-" + String(n).padStart(4, "0");
}

function serverUserToAccount(u: ServerUser): AuthAccount {
  return {
    id: u.id,
    username: u.username,
    password: "",
    fullName: u.fullName,
    email: u.email ?? undefined,
    role: u.role as AuthRole,
    status: u.status as "active" | "inactive" | "banned",
    subscriptionPlan: (u.subscriptionPlan as AuthAccount["subscriptionPlan"]) ?? null,
    isSubscribed: u.isSubscribed,
    accountNumber: u.accountNumber,
    warehouseId: u.warehouseId,
    warehouseSlug: u.warehouseSlug,
    createdAt: u.createdAt,
  };
}

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
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return "";
  }
}

function decodeInviteToken(token: string): PendingInvite | null {
  try {
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
      nextAccountNumber: 2,
      jwtToken: null,

      // ── Synchronous local login (offline / demo fallback) ───────────────
      login: (username, password) => {
        const found = get().accounts.find(
          (a) => a.username === username && a.status === "active"
        );
        if (found) {
          set({ currentUser: found, locked: false });
          return true;
        }
        return false;
      },

      // ── Server-backed async login ───────────────────────────────────────
      loginAsync: async (username, password) => {
        try {
          const { token, user } = await psaApi.login(username, password);
          const account = serverUserToAccount(user);
          set({ currentUser: account, jwtToken: token, locked: false });

          // Sync full user list in background (supervisor+)
          if (ROLE_RANK[account.role as AuthRole] >= ROLE_RANK.supervisor) {
            get().syncUsersFromServer().catch(() => {});
          }
          return true;
        } catch {
          // Server unavailable — fall back to local store
          return get().login(username, password);
        }
      },

      // ── Restore session from stored JWT on app startup ──────────────────
      restoreSession: async () => {
        const { jwtToken } = get();
        if (!jwtToken) return;
        try {
          const { user } = await psaApi.me();
          const account = serverUserToAccount(user);
          set({ currentUser: account, locked: false });
        } catch {
          set({ jwtToken: null });
        }
      },

      // ── Pull all users from server into local cache ─────────────────────
      syncUsersFromServer: async () => {
        try {
          const { users } = await psaApi.listUsers();
          const accounts = users.map(serverUserToAccount);
          set({ accounts });
        } catch {
          // Not supervisor or server unavailable — keep local cache
        }
      },

      lock: () => set({ locked: true }),

      unlock: (password) => {
        const user = get().currentUser;
        if (!user) return false;
        const found = get().accounts.find(
          (a) => a.id === user.id && a.status === "active"
        );
        if (found) {
          set({ locked: false });
          return true;
        }
        return false;
      },

      loginAsDemo: (role: AuthRole = "selector") => {
        set({
          currentUser: {
            id: "demo-session",
            username: "demo",
            password: "",
            fullName: "Demo User",
            role,
            status: "active",
            subscriptionPlan: "company",
            isSubscribed: true,
            createdAt: new Date().toISOString(),
            isDemoUser: true,
          },
          locked: false,
        });
      },

      // ── Log in directly with a token + user from trial/registration ────
      loginWithToken: (token: string, user: ServerUser) => {
        const account = serverUserToAccount(user);
        set({ currentUser: account, jwtToken: token, locked: false });
      },

      logout: () => set({ currentUser: null, jwtToken: null }),

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

      banUser: (accountId) => {
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === accountId && a.id !== "master"
              ? { ...a, status: "banned" as const }
              : a
          ),
        }));
        psaApi.banUser(accountId).catch(() => {});
      },

      unbanUser: (accountId) => {
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === accountId ? { ...a, status: "active" as const } : a
          ),
        }));
        psaApi.unbanUser(accountId).catch(() => {});
      },

      changeRole: (accountId, role) => {
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === accountId && a.id !== "master" ? { ...a, role } : a
          ),
        }));
        psaApi.changeRole(accountId, role).catch(() => {});
      },

      removeAccount: (accountId) => {
        set((state) => ({
          accounts: state.accounts.filter(
            (a) => a.id !== accountId || a.id === "master"
          ),
        }));
        psaApi.deleteUser(accountId).catch(() => {});
      },

      createAccount: (data) => {
        set((state) => {
          const num = state.nextAccountNumber;
          const newAccount: AuthAccount = {
            id: crypto.randomUUID(),
            username: data.username,
            password: "",
            fullName: data.fullName,
            role: data.role,
            status: "active",
            subscriptionPlan: null,
            isSubscribed: false,
            accountNumber: formatAccountNumber(num),
            createdAt: new Date().toISOString(),
          };
          psaApi.createUser(data).then((res) => {
            set((s) => ({
              accounts: s.accounts.map((a) =>
                a.accountNumber === newAccount.accountNumber
                  ? serverUserToAccount(res.user)
                  : a
              ),
            }));
          }).catch(() => {});
          return {
            nextAccountNumber: num + 1,
            accounts: [...state.accounts, newAccount],
          };
        });
      },

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
        return decodeInviteToken(token) ?? undefined;
      },

      acceptInvite: (token, username, password) => {
        const invite = decodeInviteToken(token);
        if (!invite) return false;
        const taken = get().accounts.find((a) => a.username === username);
        if (taken) return false;

        set((state) => {
          const num = state.nextAccountNumber;
          return {
            nextAccountNumber: num + 1,
            accounts: [
              ...state.accounts,
              {
                id: crypto.randomUUID(),
                username,
                password: "",
                fullName: invite.fullName,
                email: invite.email,
                role: invite.role,
                status: "active",
                subscriptionPlan: "company" as const,
                isSubscribed: true,
                accountNumber: formatAccountNumber(num),
                createdAt: new Date().toISOString(),
                warehouseId: invite.warehouseId ?? null,
                warehouseSlug: invite.warehouseSlug ?? null,
              },
            ],
            pendingInvites: state.pendingInvites.filter((i) => i.token !== token),
          };
        });

        psaApi.acceptInvite(token, username, password)
          .then(({ user }) => {
            set((s) => ({
              accounts: s.accounts.map((a) =>
                a.username === username ? serverUserToAccount(user) : a
              ),
            }));
          })
          .catch(() => {});

        return true;
      },

      getUserByEmail: (email) => {
        const lower = email.toLowerCase();
        return get().accounts.find((a) => a.email?.toLowerCase() === lower);
      },

      getAccountByNumber: (accountNumber) => {
        const num = accountNumber.trim().toUpperCase();
        if (num === "PSA-0001") return MASTER_ACCOUNT;
        return get().accounts.find(
          (a) => (a.accountNumber ?? "").toUpperCase() === num
        );
      },

      resetPassword: (email, newPassword) => {
        const lower = email.toLowerCase();
        const account = get().accounts.find((a) => a.email?.toLowerCase() === lower);
        if (!account) return false;
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.email?.toLowerCase() === lower ? { ...a } : a
          ),
        }));
        psaApi.resetPassword(email, newPassword).catch(() => {});
        return true;
      },
    }),
    {
      name: "picksmart-auth-store",
      partialize: (state) => ({
        accounts: state.accounts,
        pendingInvites: state.pendingInvites,
        nextAccountNumber: state.nextAccountNumber,
        jwtToken: state.jwtToken,
      }),
    }
  )
);
