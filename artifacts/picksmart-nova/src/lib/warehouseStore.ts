import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type Warehouse,
  type WarehouseFeature,
  DEFAULT_WAREHOUSES,
  getWarehouseBySlug,
  getWarehouseById,
} from "@/data/warehouses";

interface WarehouseState {
  currentWarehouseSlug: string | null;
  customWarehouses: Warehouse[];

  // Derived (not stored, computed on access)
  // Use useWarehouse() hook for the resolved object.

  setWarehouseBySlug: (slug: string) => void;
  setWarehouseById: (id: string) => void;
  clearWarehouse: () => void;
  addWarehouse: (warehouse: Warehouse) => void;
  updateWarehouse: (id: string, updates: Partial<Warehouse>) => void;
  removeWarehouse: (id: string) => void;
  getAllWarehouses: () => Warehouse[];
}

export const useWarehouseStore = create<WarehouseState>()(
  persist(
    (set, get) => ({
      currentWarehouseSlug: null,
      customWarehouses: [],

      setWarehouseBySlug: (slug) => set({ currentWarehouseSlug: slug }),

      setWarehouseById: (id) => {
        const wh = getWarehouseById(id, get().getAllWarehouses());
        if (wh) set({ currentWarehouseSlug: wh.slug });
      },

      clearWarehouse: () => set({ currentWarehouseSlug: null }),

      addWarehouse: (warehouse) =>
        set((state) => ({
          customWarehouses: [...state.customWarehouses, warehouse],
        })),

      updateWarehouse: (id, updates) =>
        set((state) => ({
          customWarehouses: state.customWarehouses.map((w) =>
            w.id === id ? { ...w, ...updates } : w,
          ),
        })),

      removeWarehouse: (id) =>
        set((state) => ({
          customWarehouses: state.customWarehouses.filter((w) => w.id !== id),
        })),

      getAllWarehouses: () => {
        const state = get();
        return [...DEFAULT_WAREHOUSES, ...state.customWarehouses];
      },
    }),
    {
      name: "picksmart-warehouse-store",
      partialize: (state) => ({
        currentWarehouseSlug: state.currentWarehouseSlug,
        customWarehouses: state.customWarehouses,
      }),
    },
  ),
);

// ─── Convenience hook ─────────────────────────────────────────────────────────

export function useWarehouse(): {
  warehouse: Warehouse | null;
  hasFeature: (feature: WarehouseFeature) => boolean;
  allWarehouses: Warehouse[];
} {
  const { currentWarehouseSlug, getAllWarehouses, customWarehouses } = useWarehouseStore();
  const allWarehouses = [...DEFAULT_WAREHOUSES, ...customWarehouses];
  const warehouse = getWarehouseBySlug(currentWarehouseSlug, allWarehouses);

  return {
    warehouse,
    allWarehouses,
    hasFeature: (feature: WarehouseFeature) => {
      if (!warehouse) return false;
      return warehouse.allowedFeatures.includes(feature);
    },
  };
}
