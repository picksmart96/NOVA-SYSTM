import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const psaAlerts = pgTable("psa_alerts", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: text("company_id"),
  userId: text("user_id"),
  type: text("type").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull().default("medium"),
  read: boolean("read").notNull().default(false),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const psaAuditLogs = pgTable("psa_audit_logs", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  companyId: text("company_id"),
  action: text("action").notNull(),
  entity: text("entity"),
  entityId: text("entity_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const psaSelectorPositions = pgTable("psa_selector_positions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  selectorId: text("selector_id").notNull().unique(),
  companyId: text("company_id"),
  selectorName: text("selector_name"),
  currentAisle: text("current_aisle"),
  currentSlot: text("current_slot"),
  nextAisle: text("next_aisle"),
  nextSlot: text("next_slot"),
  status: text("status").notNull().default("active"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const psaCoachingMessages = pgTable("psa_coaching_messages", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  selectorId: text("selector_id").notNull(),
  fromUserId: text("from_user_id"),
  fromName: text("from_name"),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
