import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TalkRequest {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  topic: string;
  createdAt: string;
  status: "unread" | "read" | "resolved";
}

interface TalkRequestStore {
  requests: TalkRequest[];
  addRequest: (data: Omit<TalkRequest, "id" | "createdAt" | "status">) => void;
  markRead: (id: string) => void;
  markResolved: (id: string) => void;
  deleteRequest: (id: string) => void;
}

export const useTalkRequestStore = create<TalkRequestStore>()(
  persist(
    (set) => ({
      requests: [],

      addRequest: (data) =>
        set((state) => ({
          requests: [
            {
              ...data,
              id: `tr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              createdAt: new Date().toISOString(),
              status: "unread",
            },
            ...state.requests,
          ],
        })),

      markRead: (id) =>
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id && r.status === "unread" ? { ...r, status: "read" } : r
          ),
        })),

      markResolved: (id) =>
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id ? { ...r, status: "resolved" } : r
          ),
        })),

      deleteRequest: (id) =>
        set((state) => ({
          requests: state.requests.filter((r) => r.id !== id),
        })),
    }),
    { name: "psa-talk-requests" }
  )
);
