import { pgTable, text, serial, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assignmentsTable = pgTable("assignments", {
  id: text("id").primaryKey(),
  assignmentNumber: integer("assignment_number").notNull(),
  title: text("title").notNull(),
  selectorUserId: text("selector_user_id"),
  trainerUserId: text("trainer_user_id"),
  startAisle: integer("start_aisle").notNull(),
  endAisle: integer("end_aisle").notNull(),
  totalCases: integer("total_cases").notNull(),
  totalCube: real("total_cube").notNull(),
  totalPallets: integer("total_pallets").notNull(),
  estimatedGold: real("estimated_gold"),
  goalTimeMinutes: integer("goal_time_minutes"),
  goalTimeSeconds: integer("goal_time_seconds"),
  doorNumber: integer("door_number").notNull(),
  printerNumber: integer("printer_number").notNull().default(307),
  alphaLabelNumber: integer("alpha_label_number").notNull().default(242),
  bravoLabelNumber: integer("bravo_label_number").notNull().default(578),
  status: text("status").notNull().default("pending"),
  voiceMode: text("voice_mode").notNull().default("training"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  totalDurationSeconds: integer("total_duration_seconds"),
  performancePercent: real("performance_percent"),
  percentComplete: real("percent_complete").notNull().default(0),
});

export const assignmentStopsTable = pgTable("assignment_stops", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id").notNull(),
  stopOrder: integer("stop_order").notNull(),
  aisle: integer("aisle").notNull(),
  slot: integer("slot").notNull(),
  level: text("level"),
  checkCode: text("check_code").notNull(),
  qty: integer("qty").notNull(),
  status: text("status").notNull().default("pending"),
  arrivedAt: timestamp("arrived_at"),
  verifiedAt: timestamp("verified_at"),
  pickedAt: timestamp("picked_at"),
  dwellSeconds: integer("dwell_seconds"),
});

export const insertAssignmentSchema = createInsertSchema(assignmentsTable);
export const insertAssignmentStopSchema = createInsertSchema(assignmentStopsTable);

export type Assignment = typeof assignmentsTable.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type AssignmentStop = typeof assignmentStopsTable.$inferSelect;
export type InsertAssignmentStop = z.infer<typeof insertAssignmentStopSchema>;
