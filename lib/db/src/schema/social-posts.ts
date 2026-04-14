import { pgTable, text, boolean, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sbnUsers } from "./social-users";

export const sbnPosts = pgTable("sbn_posts", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  authorUserId: text("author_user_id").notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
  groupId: text("group_id"),
  postType: text("post_type").notNull().default("text"),
  content: text("content").notNull(),
  imageUrl: text("image_url").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  visibility: text("visibility").notNull().default("public"),
  status: text("status").notNull().default("pending"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  isPinned: boolean("is_pinned").notNull().default(false),
  isDeleted: boolean("is_deleted").notNull().default(false),
  likeCount: integer("like_count").notNull().default(0),
  loveCount: integer("love_count").notNull().default(0),
  funnyCount: integer("funny_count").notNull().default(0),
  wowCount: integer("wow_count").notNull().default(0),
  frustratedCount: integer("frustrated_count").notNull().default(0),
  commentsCount: integer("comments_count").notNull().default(0),
  sharesCount: integer("shares_count").notNull().default(0),
  savesCount: integer("saves_count").notNull().default(0),
  reportsCount: integer("reports_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sbnPostHashtags = pgTable("sbn_post_hashtags", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: text("post_id").notNull().references(() => sbnPosts.id, { onDelete: "cascade" }),
  hashtag: text("hashtag").notNull(),
});

export const sbnPostReactions = pgTable(
  "sbn_post_reactions",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    postId: text("post_id").notNull().references(() => sbnPosts.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
    reactionType: text("reaction_type").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("sbn_post_reactions_post_user_uidx").on(table.postId, table.userId)],
);

export const sbnSavedPosts = pgTable(
  "sbn_saved_posts",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id").notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
    postId: text("post_id").notNull().references(() => sbnPosts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("sbn_saved_posts_user_post_uidx").on(table.userId, table.postId)],
);

export const insertSbnPostSchema = createInsertSchema(sbnPosts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSbnPostHashtagSchema = createInsertSchema(sbnPostHashtags).omit({ id: true });
export const insertSbnPostReactionSchema = createInsertSchema(sbnPostReactions).omit({ id: true, createdAt: true });
export const insertSbnSavedPostSchema = createInsertSchema(sbnSavedPosts).omit({ id: true, createdAt: true });

export type SbnPost = typeof sbnPosts.$inferSelect;
export type InsertSbnPost = z.infer<typeof insertSbnPostSchema>;
export type SbnPostHashtag = typeof sbnPostHashtags.$inferSelect;
export type InsertSbnPostHashtag = z.infer<typeof insertSbnPostHashtagSchema>;
export type SbnPostReaction = typeof sbnPostReactions.$inferSelect;
export type InsertSbnPostReaction = z.infer<typeof insertSbnPostReactionSchema>;
export type SbnSavedPost = typeof sbnSavedPosts.$inferSelect;
export type InsertSbnSavedPost = z.infer<typeof insertSbnSavedPostSchema>;
