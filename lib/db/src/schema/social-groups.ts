import { pgTable, text, boolean, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sbnUsers } from "./social-users";

export const sbnGroups = pgTable("sbn_groups", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description").notNull().default(""),
  coverImageUrl: text("cover_image_url").notNull().default(""),
  createdByUserId: text("created_by_user_id").notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
  isPrivate: boolean("is_private").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  membersCount: integer("members_count").notNull().default(0),
  postsCount: integer("posts_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sbnGroupMembers = pgTable(
  "sbn_group_members",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    groupId: text("group_id").notNull().references(() => sbnGroups.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("sbn_group_members_group_user_uidx").on(table.groupId, table.userId)],
);

export const insertSbnGroupSchema = createInsertSchema(sbnGroups).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSbnGroupMemberSchema = createInsertSchema(sbnGroupMembers).omit({ id: true, joinedAt: true });

export type SbnGroup = typeof sbnGroups.$inferSelect;
export type InsertSbnGroup = z.infer<typeof insertSbnGroupSchema>;
export type SbnGroupMember = typeof sbnGroupMembers.$inferSelect;
export type InsertSbnGroupMember = z.infer<typeof insertSbnGroupMemberSchema>;
