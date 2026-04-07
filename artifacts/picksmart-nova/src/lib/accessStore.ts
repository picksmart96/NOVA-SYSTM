import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  status: "invited" | "active" | "inactive";
  inviteLink: string;
  createdAt: string;
}

export interface NovaAccount {
  id: number;
  fullName: string;
  username: string;
  password: string;
  role: "Trainer" | "Supervisor";
  status: "active" | "inactive";
  createdAt: string;
}

export interface TrainerInviteRequest {
  id: number;
  fullName: string;
  email: string;
  requestedRole: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface NovaSession {
  id: number;
  selectorName: string;
  novaId: string;
  assignmentTitle: string;
  trainerName: string;
  createdAt: string;
}

interface AccessState {
  appUsers: AppUser[];
  novaAccounts: NovaAccount[];
  trainerInviteRequests: TrainerInviteRequest[];
  novaSessions: NovaSession[];

  inviteAppUser: (data: { fullName: string; email: string; role: string; inviteLink: string }) => void;
  createNovaAccount: (data: { fullName: string; username: string; password: string; role: "Trainer" | "Supervisor" }) => void;
  deactivateNovaAccount: (id: number) => void;
  stopNovaSession: (id: number) => void;
}

const seedAppUsers: AppUser[] = [
  {
    id: 1,
    fullName: "soumaila ouedraogo",
    email: "soumaila@picksmart.com",
    role: "Trainer",
    status: "active",
    inviteLink: "/trainer-portal",
    createdAt: new Date().toISOString(),
  },
];

const seedNovaAccounts: NovaAccount[] = [
  {
    id: 1,
    fullName: "soumaila ouedraogo",
    username: "soumaila.o",
    password: "Nova2024!",
    role: "Trainer",
    status: "active",
    createdAt: new Date().toISOString(),
  },
];

export const useAccessStore = create<AccessState>()(
  persist(
    (set) => ({
      appUsers: seedAppUsers,
      novaAccounts: seedNovaAccounts,
      trainerInviteRequests: [],
      novaSessions: [],

      inviteAppUser: (data) =>
        set((state) => ({
          appUsers: [
            ...state.appUsers,
            {
              id: Date.now(),
              fullName: data.fullName,
              email: data.email,
              role: data.role,
              status: "invited",
              inviteLink: data.inviteLink,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      createNovaAccount: (data) =>
        set((state) => ({
          novaAccounts: [
            ...state.novaAccounts,
            {
              id: Date.now(),
              fullName: data.fullName,
              username: data.username,
              password: data.password,
              role: data.role,
              status: "active",
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      deactivateNovaAccount: (id) =>
        set((state) => ({
          novaAccounts: state.novaAccounts.map((a) =>
            a.id === id ? { ...a, status: "inactive" } : a
          ),
        })),

      stopNovaSession: (id) =>
        set((state) => ({
          novaSessions: state.novaSessions.filter((s) => s.id !== id),
        })),
    }),
    { name: "picksmart-access-store" }
  )
);
