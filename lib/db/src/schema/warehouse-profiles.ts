import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const warehouseProfilesTable = pgTable("warehouse_profiles", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),

  companyId: text("company_id").notNull().unique(),

  systemType: text("system_type"),
  locationFormat: text("location_format"),
  checkMethod: text("check_method"),
  palletType: text("pallet_type"),
  performanceMetric: text("performance_metric"),
  mainProblems: text("main_problems").array().notNull().default(sql`ARRAY[]::text[]`),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWarehouseProfileSchema = createInsertSchema(warehouseProfilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WarehouseProfile = typeof warehouseProfilesTable.$inferSelect;
export type InsertWarehouseProfile = z.infer<typeof insertWarehouseProfileSchema>;
