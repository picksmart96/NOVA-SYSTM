import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ASSIGNMENTS } from "@/data/assignments";
import type { Assignment } from "@/data/assignments";

export interface TrainerSelector {
  id: number;
  userId: string;
  name: string;
  novaId: string;
  novaPin: string | null;
  age: number;
  experience: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  novaActive: boolean;
  assignedAssignmentId: string | null;
  notes: string;
}

export interface TrainingSession {
  id: number;
  selectorId: number;
  selectorName: string;
  trainerName: string;
  sessionType: string;
  notes: string;
  createdAt: string;
}

export interface NewSelectorInput {
  name: string;
  age: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  notes?: string;
}

interface TrainerState {
  trainer: { name: string; role: string };
  selectors: TrainerSelector[];
  assignments: Assignment[];
  sessions: TrainingSession[];

  addSelector: (input: NewSelectorInput) => void;
  toggleNova: (selectorId: number) => void;
  assignAssignment: (selectorId: number, assignmentId: string) => string;
  logSession: (data: { selectorId: number; selectorName: string; sessionType: string; notes: string }) => void;
}

const initialSelectors: TrainerSelector[] = [
  {
    id: 1,
    userId: "user-001",
    name: "soumaila ouedraogo",
    novaId: "NOVA-25917",
    novaPin: null,
    age: 30,
    experience: "3 weeks selector",
    level: "Beginner",
    novaActive: true,
    assignedAssignmentId: null,
    notes: "",
  },
];

function generateNovaPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const useTrainerStore = create<TrainerState>()(
  persist(
    (set, get) => ({
      trainer: { name: "soumaila ouedraogo", role: "trainer" },
      selectors: initialSelectors,
      assignments: ASSIGNMENTS,
      sessions: [],

      addSelector: (input) =>
        set((state) => ({
          selectors: [
            {
              id: Date.now(),
              userId: `user-${String(state.selectors.length + 1).padStart(3, "0")}`,
              novaId: `NOVA-${Math.floor(10000 + Math.random() * 89999)}`,
              novaPin: null,
              novaActive: false,
              assignedAssignmentId: null,
              experience: "New selector",
              notes: input.notes ?? "",
              name: input.name,
              age: input.age,
              level: input.level,
            },
            ...state.selectors,
          ],
        })),

      toggleNova: (selectorId) =>
        set((state) => ({
          selectors: state.selectors.map((s) =>
            s.id === selectorId ? { ...s, novaActive: !s.novaActive } : s
          ),
        })),

      assignAssignment: (selectorId, assignmentId) => {
        const pin = generateNovaPin();
        set((state) => {
          const selector = state.selectors.find((s) => s.id === selectorId);
          return {
            selectors: state.selectors.map((s) =>
              s.id === selectorId
                ? { ...s, assignedAssignmentId: assignmentId, novaPin: pin }
                : s
            ),
            assignments: state.assignments.map((a) =>
              a.id === assignmentId
                ? { ...a, selectorUserId: selector?.userId ?? a.selectorUserId }
                : a
            ),
          };
        });
        return pin;
      },

      logSession: (data) =>
        set((state) => ({
          sessions: [
            {
              id: Date.now(),
              createdAt: new Date().toISOString(),
              trainerName: state.trainer.name,
              ...data,
            },
            ...state.sessions,
          ],
        })),
    }),
    { name: "picksmart-trainer-store" }
  )
);
