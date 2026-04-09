/**
 * Access Control — PickSmart NOVA
 *
 * Centralizes feature-gate decisions based on:
 *  - The user's role (owner always bypasses)
 *  - The current warehouse's allowedFeatures list
 *  - The user's subscription status
 */

import type { AuthRole } from "@/lib/authStore";
import type { Warehouse, WarehouseFeature } from "@/data/warehouses";

/**
 * Returns true if the user can access a given feature.
 * Owner always returns true.
 * Non-owner requires the feature to be in the warehouse's allowedFeatures.
 */
export function canAccessFeature(
  feature: WarehouseFeature,
  warehouse: Warehouse | null,
  role: AuthRole | undefined,
): boolean {
  if (role === "owner") return true;
  if (!warehouse || !warehouse.isActive || !warehouse.isSubscribed) return false;
  return warehouse.allowedFeatures.includes(feature);
}

/**
 * Returns true if the user's role meets the minimum required role.
 */
export function hasMinimumRole(
  requiredRole: AuthRole,
  userRole: AuthRole | undefined,
): boolean {
  const RANK: Record<AuthRole, number> = {
    selector: 0,
    trainer: 1,
    supervisor: 2,
    manager: 3,
    owner: 4,
  };
  if (!userRole) return false;
  return RANK[userRole] >= RANK[requiredRole];
}

/**
 * Returns the full set of allowed features for a user.
 * Owner gets all features regardless of warehouse.
 */
export function getAllowedFeatures(
  warehouse: Warehouse | null,
  role: AuthRole | undefined,
): WarehouseFeature[] {
  const ALL_FEATURES: WarehouseFeature[] = [
    "training",
    "nova-help",
    "nova-trainer",
    "common-mistakes",
    "leaderboard",
    "selector-breaking-news",
    "trainer-dashboard",
    "supervisor-dashboard",
  ];
  if (role === "owner") return ALL_FEATURES;
  if (!warehouse) return [];
  return warehouse.allowedFeatures;
}
