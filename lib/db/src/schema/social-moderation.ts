import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sbnUsers } from "./social-users";

export const sbnReports = pgTable("sbn_reports", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterUserId: text("reporter_user_id").notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("open"),
  reviewedByUserId: text("reviewed_by_user_id").references(() => sbnUsers.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sbnBans = pgTable("sbn_bans", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
  bannedByUserId: text("banned_by_user_id").notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const sbnAnnouncements = pgTable("sbn_announcements", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdByUserId: text("created_by_user_id").notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
  isPinned: boolean("is_pinned").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sbnModerationLogs = pgTable("sbn_moderation_logs", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: text("admin_user_id").notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
  actionType: text("action_type").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSbnReportSchema = createInsertSchema(sbnReports).omit({ id: true, createdAt: true });
export const insertSbnBanSchema = createInsertSchema(sbnBans).omit({ id: true, createdAt: true });
export const insertSbnAnnouncementSchema = createInsertSchema(sbnAnnouncements).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSbnModerationLogSchema = createInsertSchema(sbnModerationLogs).omit({ id: true, createdAt: true });

export type SbnReport = typeof sbnReports.$inferSelect;
export type InsertSbnReport = z.infer<typeof insertSbnReportSchema>;
export type SbnBan = typeof sbnBans.$inferSelect;
export type InsertSbnBan = z.infer<typeof insertSbnBanSchema>;
export type SbnAnnouncement = typeof sbnAnnouncements.$inferSelect;
export type InsertSbnAnnouncement = z.infer<typeof insertSbnAnnouncementSchema>;
export type SbnModerationLog = typeof sbnModerationLogs.$inferSelect;
export type InsertSbnModerationLog = z.infer<typeof insertSbnModerationLogSchema>;
