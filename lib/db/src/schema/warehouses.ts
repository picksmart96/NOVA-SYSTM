import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const warehousesTable = pgTable("warehouses", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  systemType: text("system_type").notNull().default("standard"),
  subscriptionPlan: text("subscription_plan").notNull().default("company"),
  isSubscribed: boolean("is_subscribed").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  allowedFeatures: text("allowed_features").array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const warehouseUsersTable = pgTable("warehouse_users", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  warehouseId: text("warehouse_id").notNull().references(() => warehousesTable.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  role: text("role").notNull().default("selector"),
  isActive: boolean("is_active").notNull().default(true),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertWarehouseSchema = createInsertSchema(warehousesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWarehouseUserSchema = createInsertSchema(warehouseUsersTable).omit({ id: true, joinedAt: true });

export type WarehouseRecord = typeof warehousesTable.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type WarehouseUserRecord = typeof warehouseUsersTable.$inferSelect;
export type InsertWarehouseUser = z.infer<typeof insertWarehouseUserSchema>;
