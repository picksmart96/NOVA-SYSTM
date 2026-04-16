import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WarehouseProfile {
  id?: string;
  companyId?: string;
  systemType?: string;
  locationFormat?: string;
  checkMethod?: string;
  palletType?: string;
  performanceMetric?: string;
  mainProblems?: string[];
}

interface WarehouseProfileState {
  profile: WarehouseProfile | null;
  loading: boolean;
  setProfile: (p: WarehouseProfile | null) => void;
  fetchProfile: (token: string, apiBase: string) => Promise<void>;
  saveProfile: (token: string, apiBase: string, data: Omit<WarehouseProfile, "id" | "companyId">) => Promise<WarehouseProfile | null>;
}

export const useWarehouseProfileStore = create<WarehouseProfileState>()(
  persist(
    (set) => ({
      profile: null,
      loading: false,

      setProfile(p) {
        set({ profile: p });
      },

      async fetchProfile(token, apiBase) {
        set({ loading: true });
        try {
          const res = await fetch(`${apiBase}/warehouse/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            set({ profile: null, loading: false });
            return;
          }
          const data = await res.json();
          set({ profile: data, loading: false });
        } catch {
          set({ loading: false });
        }
      },

      async saveProfile(token, apiBase, data) {
        try {
          const res = await fetch(`${apiBase}/warehouse/profile`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          });
          if (!res.ok) return null;
          const saved: WarehouseProfile = await res.json();
          set({ profile: saved });
          return saved;
        } catch {
          return null;
        }
      },
    }),
    { name: "picksmart-warehouse-profile" }
  )
);

// ── Profile-driven helpers ─────────────────────────────────────────────────────

export function buildLocationCommand(profile: WarehouseProfile | null, aisle: number, slot: number, qty: number): string {
  if (profile?.locationFormat === "bin") {
    return `Bin B-${aisle}-${slot} pick ${qty}`;
  }
  return `Aisle ${aisle} slot ${slot} pick ${qty}`;
}

export function verifyLocation(profile: WarehouseProfile | null, input: string, correct: string): boolean {
  if (profile?.checkMethod === "scan") return true;
  return input.trim().toUpperCase() === correct.trim().toUpperCase();
}

export function getRecommendedLessons(profile: WarehouseProfile | null): string[] {
  const problems = profile?.mainProblems ?? [];
  const lessons: string[] = [];
  if (problems.includes("stacking")) lessons.push("pallet_building");
  if (problems.includes("speed")) lessons.push("movement_efficiency");
  if (problems.includes("accuracy")) lessons.push("check_digits");
  return lessons;
}
