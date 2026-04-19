import { pgTable, text, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const psaUsers = pgTable("psa_users", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").unique(),
  role: text("role").notNull().default("selector"),
  status: text("status").notNull().default("active"),
  subscriptionPlan: text("subscription_plan"),
  isSubscribed: boolean("is_subscribed").notNull().default(false),
  accountNumber: text("account_number").unique().notNull(),
  warehouseId: text("warehouse_id"),
  warehouseSlug: text("warehouse_slug"),
  isMaster: boolean("is_master").notNull().default(false),
  companyName: text("company_name"),
  voiceEnabled: boolean("voice_enabled").notNull().default(true),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const psaInvites = pgTable("psa_invites", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").unique().notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("selector"),
  warehouseId: text("warehouse_id"),
  warehouseSlug: text("warehouse_slug"),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const psaAccountCounter = pgTable("psa_account_counter", {
  id: integer("id").primaryKey().default(1),
  nextNumber: integer("next_number").notNull().default(2),
});

export const insertPsaUserSchema = createInsertSchema(psaUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PsaUser = typeof psaUsers.$inferSelect;
export type InsertPsaUser = z.infer<typeof insertPsaUserSchema>;
export type PsaInvite = typeof psaInvites.$inferSelect;
