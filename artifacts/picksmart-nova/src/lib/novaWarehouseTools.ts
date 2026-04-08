/**
 * NOVA Warehouse Tool Layer
 * Unified data-access functions for NOVA to query warehouse app data.
 */

import { ASSIGNMENTS, type Assignment } from "@/data/assignments";
import { getStopsForAssignment, type AssignmentStop } from "@/data/assignmentStops";
import { SLOT_MASTER, type SlotEntry } from "@/data/slotMaster";
import { DOOR_CODES, type DoorCode } from "@/data/doorCodes";
import { SYSTEM_DEFAULTS } from "@/data/systemDefaults";
import { useTrainerStore, type TrainerSelector } from "@/lib/trainerStore";

// ─── Selector Tools ──────────────────────────────────────────────────────────

/**
 * Find a registered selector by their NOVA ID (e.g. "NOVA-25917").
 */
export function findSelectorByNovaId(novaId: string): TrainerSelector | null {
  const { selectors } = useTrainerStore.getState();
  const cleaned = novaId.trim().toUpperCase();
  return selectors.find((s) => (s.novaId ?? "").toUpperCase() === cleaned) ?? null;
}

/**
 * Get all assignments assigned to a given selector (by userId).
 */
export function getAssignmentsForSelector(userId: string): Assignment[] {
  return ASSIGNMENTS.filter((a) => a.selectorUserId === userId);
}

// ─── Assignment Tools ─────────────────────────────────────────────────────────

/**
 * Get all stops for a specific assignment.
 */
export function getAssignmentStops(assignmentId: string): AssignmentStop[] {
  return getStopsForAssignment(assignmentId);
}

/**
 * Get a single assignment by ID.
 */
export function getAssignmentById(assignmentId: string): Assignment | null {
  return ASSIGNMENTS.find((a) => a.id === assignmentId) ?? null;
}

// ─── Slot / Check Code Tools ──────────────────────────────────────────────────

/**
 * Look up a slot entry by its check code.
 */
export function getSlotByCode(checkCode: string): SlotEntry | null {
  return SLOT_MASTER.find((s) => s.checkCode === checkCode) ?? null;
}

/**
 * Look up a slot by aisle + slot number.
 */
export function getSlotByLocation(aisle: string, slot: string): SlotEntry | null {
  return SLOT_MASTER.find((s) => s.aisle === aisle && s.slot === slot) ?? null;
}

// ─── Door Tools ───────────────────────────────────────────────────────────────

/**
 * Get door info by door number.
 */
export function getDoorInfo(doorNumber: number): DoorCode | null {
  return DOOR_CODES.find((d) => d.doorNumber === doorNumber) ?? null;
}

// ─── Warehouse Defaults ───────────────────────────────────────────────────────

/**
 * Get current warehouse system defaults.
 */
export function getWarehouseDefaults() {
  return {
    printerNumber: String(SYSTEM_DEFAULTS.printerNumber),
    alphaLabelNumber: String(SYSTEM_DEFAULTS.alphaLabelNumber),
    bravoLabelNumber: String(SYSTEM_DEFAULTS.bravoLabelNumber),
    defaultVoiceMode: SYSTEM_DEFAULTS.defaultVoiceMode,
  };
}

// ─── Session Context Builder ──────────────────────────────────────────────────

/**
 * Build a human-readable context string for the current NOVA session.
 * Inject into the AI system prompt for context-aware answers.
 */
export function buildSessionContext(opts: {
  selectorName?: string;
  equipmentId?: string;
  maxPallets?: string;
  currentAisle?: string;
  currentSlot?: string;
  currentQty?: number;
  assignmentId?: string;
}): string {
  const lines: string[] = [];
  if (opts.selectorName) lines.push(`Selector: ${opts.selectorName}`);
  if (opts.equipmentId) lines.push(`Equipment: ${opts.equipmentId}`);
  if (opts.maxPallets) lines.push(`Max pallets: ${opts.maxPallets}`);
  if (opts.currentAisle && opts.currentSlot)
    lines.push(`Current pick: Aisle ${opts.currentAisle}, Slot ${opts.currentSlot}`);
  if (opts.currentQty !== undefined) lines.push(`Qty to grab: ${opts.currentQty}`);
  if (opts.assignmentId) lines.push(`Assignment: ${opts.assignmentId}`);
  return lines.join("\n");
}
