import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const novaSessions = pgTable("nova_sessions", {
  id:                 text("id").primaryKey().default(sql`gen_random_uuid()`),
  visitorName:        text("visitor_name").notNull().default(""),
  companyName:        text("company_name").notNull().default(""),
  email:              text("email").notNull().default(""),
  phone:              text("phone").notNull().default(""),
  painPoint:          text("pain_point").notNull().default(""),
  stageReached:       text("stage_reached").notNull().default("greeting"),
  trialClicked:       boolean("trial_clicked").notNull().default(false),
  trialSubmitted:     boolean("trial_submitted").notNull().default(false),
  messageCount:       integer("message_count").notNull().default(0),
  source:             text("source").notNull().default("meet_nova"),
  createdAt:          timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:          timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const novaSessionMessages = pgTable("nova_session_messages", {
  id:          serial("id").primaryKey(),
  sessionId:   text("session_id").notNull().references(() => novaSessions.id, { onDelete: "cascade" }),
  role:        text("role").notNull(),
  content:     text("content").notNull(),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type NovaSession = typeof novaSessions.$inferSelect;
export type NovaSessionMessage = typeof novaSessionMessages.$inferSelect;
