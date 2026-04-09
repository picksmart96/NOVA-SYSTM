import { pgTable, text, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sbnUsers } from "./social-users";

export const sbnFollows = pgTable(
  "sbn_follows",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    followerUserId: text("follower_user_id").notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
    followingUserId: text("following_user_id").notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("sbn_follows_pair_uidx").on(table.followerUserId, table.followingUserId)],
);

export const sbnNotifications = pgTable("sbn_notifications", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id").references(() => sbnUsers.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSbnFollowSchema = createInsertSchema(sbnFollows).omit({ id: true, createdAt: true });
export const insertSbnNotificationSchema = createInsertSchema(sbnNotifications).omit({ id: true, createdAt: true });

export type SbnFollow = typeof sbnFollows.$inferSelect;
export type InsertSbnFollow = z.infer<typeof insertSbnFollowSchema>;
export type SbnNotification = typeof sbnNotifications.$inferSelect;
export type InsertSbnNotification = z.infer<typeof insertSbnNotificationSchema>;
