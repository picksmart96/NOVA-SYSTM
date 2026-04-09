import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sbnUsers = pgTable("sbn_users", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("selector"),
  subscriptionPlan: text("subscription_plan").notNull().default("personal"),
  isSubscribed: boolean("is_subscribed").notNull().default(false),
  isBanned: boolean("is_banned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sbnProfiles = pgTable("sbn_profiles", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").unique().notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  username: text("username").unique().notNull(),
  bio: text("bio").notNull().default(""),
  avatarUrl: text("avatar_url").notNull().default(""),
  coverImageUrl: text("cover_image_url").notNull().default(""),
  levelBadge: text("level_badge").notNull().default("Beginner"),
  location: text("location").notNull().default(""),
  shiftType: text("shift_type").notNull().default(""),
  statusText: text("status_text").notNull().default(""),
  isOnline: boolean("is_online").notNull().default(false),
  followersCount: integer("followers_count").notNull().default(0),
  followingCount: integer("following_count").notNull().default(0),
  postsCount: integer("posts_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSbnUserSchema = createInsertSchema(sbnUsers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSbnProfileSchema = createInsertSchema(sbnProfiles).omit({ id: true, createdAt: true, updatedAt: true });

export type SbnUser = typeof sbnUsers.$inferSelect;
export type InsertSbnUser = z.infer<typeof insertSbnUserSchema>;
export type SbnProfile = typeof sbnProfiles.$inferSelect;
export type InsertSbnProfile = z.infer<typeof insertSbnProfileSchema>;
