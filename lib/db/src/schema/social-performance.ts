import { pgTable, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sbnUsers } from "./social-users";

export const sbnPerformanceLogs = pgTable("sbn_performance_logs", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
  rate: numeric("rate").notNull(),
  casesPicked: integer("cases_picked").notNull().default(0),
  accuracy: numeric("accuracy").notNull().default("100"),
  shift: text("shift").notNull().default("day"),
  warehouseId: text("warehouse_id").notNull().default("A"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSbnPerformanceLogSchema = createInsertSchema(sbnPerformanceLogs).omit({ id: true, createdAt: true });

export type SbnPerformanceLog = typeof sbnPerformanceLogs.$inferSelect;
export type InsertSbnPerformanceLog = z.infer<typeof insertSbnPerformanceLogSchema>;
