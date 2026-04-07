import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthRole = "owner" | "supervisor" | "trainer";

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      accounts: [MASTER_ACCOUNT],
      pendingInvites: [],

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
        const token = Math.random().toString(36).slice(2, 10).toUpperCase();
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

      acceptInvite: (token, username, password) => {
        const invite = get().pendingInvites.find((i) => i.token === token);
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
          pendingInvites: state.pendingInvites.filter((i) => i.token !== token),
        }));
        return true;
      },

      getInvite: (token) => get().pendingInvites.find((i) => i.token === token),
    }),
    { name: "picksmart-auth-store" }
  )
);
