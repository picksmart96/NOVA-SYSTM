export type WarehouseSystemType = "es3" | "standard";

export type WarehouseFeature =
  | "training"
  | "nova-help"
  | "nova-trainer"
  | "common-mistakes"
  | "leaderboard"
  | "selector-breaking-news"
  | "trainer-dashboard"
  | "supervisor-dashboard";

export interface Warehouse {
  id: string;
  name: string;
  slug: string;
  systemType: WarehouseSystemType;
  subscriptionPlan: "personal" | "company" | "owner";
  isSubscribed: boolean;
  isActive: boolean;
  allowedFeatures: WarehouseFeature[];
  createdAt: string;
}

// ─── Feature sets by system type ─────────────────────────────────────────────

export const ES3_FEATURES: WarehouseFeature[] = [
  "training",
  "nova-help",
  "nova-trainer",
  "common-mistakes",
  "leaderboard",
  "selector-breaking-news",
  "trainer-dashboard",
  "supervisor-dashboard",
];

export const STANDARD_FEATURES: WarehouseFeature[] = [
  "training",
  "nova-help",
  "common-mistakes",
  "leaderboard",
  "selector-breaking-news",
  "trainer-dashboard",
  "supervisor-dashboard",
];

// ─── Default warehouse definitions ───────────────────────────────────────────
// The owner can add more warehouses via the Control Center.

export const DEFAULT_WAREHOUSES: Warehouse[] = [
  {
    id: "wh-es3-demo",
    name: "ES3 Demo Warehouse",
    slug: "es3-demo",
    systemType: "es3",
    subscriptionPlan: "company",
    isSubscribed: true,
    isActive: true,
    allowedFeatures: ES3_FEATURES,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "wh-standard-demo",
    name: "Standard Demo Warehouse",
    slug: "standard-demo",
    systemType: "standard",
    subscriptionPlan: "company",
    isSubscribed: true,
    isActive: true,
    allowedFeatures: STANDARD_FEATURES,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getWarehouseBySlug(
  slug: string | null | undefined,
  warehouses: Warehouse[] = DEFAULT_WAREHOUSES,
): Warehouse | null {
  if (!slug) return null;
  return warehouses.find((w) => w.slug === slug) ?? null;
}

export function getWarehouseById(
  id: string | null | undefined,
  warehouses: Warehouse[] = DEFAULT_WAREHOUSES,
): Warehouse | null {
  if (!id) return null;
  return warehouses.find((w) => w.id === id) ?? null;
}

export function featuresForSystemType(type: WarehouseSystemType): WarehouseFeature[] {
  return type === "es3" ? ES3_FEATURES : STANDARD_FEATURES;
}

export const SYSTEM_TYPE_LABEL: Record<WarehouseSystemType, string> = {
  es3: "ES3 Voice Workflow",
  standard: "Standard Warehouse",
};

export const FEATURE_LABEL: Record<WarehouseFeature, string> = {
  "training": "Training Modules",
  "nova-help": "NOVA Help AI Coach",
  "nova-trainer": "NOVA Trainer (ES3 Voice)",
  "common-mistakes": "Common Mistakes Library",
  "leaderboard": "Leaderboard",
  "selector-breaking-news": "Selector Breaking News",
  "trainer-dashboard": "Trainer Dashboard",
  "supervisor-dashboard": "Supervisor Dashboard",
};
