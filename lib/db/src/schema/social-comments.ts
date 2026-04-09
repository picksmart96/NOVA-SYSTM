import { pgTable, text, boolean, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sbnUsers } from "./social-users";
import { sbnPosts } from "./social-posts";

export const sbnComments = pgTable("sbn_comments", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: text("post_id").notNull().references(() => sbnPosts.id, { onDelete: "cascade" }),
  authorUserId: text("author_user_id").notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
  parentCommentId: text("parent_comment_id"),
  content: text("content").notNull(),
  isDeleted: boolean("is_deleted").notNull().default(false),
  reactionsCount: integer("reactions_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sbnCommentReactions = pgTable(
  "sbn_comment_reactions",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    commentId: text("comment_id").notNull().references(() => sbnComments.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
    reactionType: text("reaction_type").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("sbn_comment_reactions_comment_user_uidx").on(table.commentId, table.userId)],
);

export const insertSbnCommentSchema = createInsertSchema(sbnComments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSbnCommentReactionSchema = createInsertSchema(sbnCommentReactions).omit({ id: true, createdAt: true });

export type SbnComment = typeof sbnComments.$inferSelect;
export type InsertSbnComment = z.infer<typeof insertSbnCommentSchema>;
export type SbnCommentReaction = typeof sbnCommentReactions.$inferSelect;
export type InsertSbnCommentReaction = z.infer<typeof insertSbnCommentReactionSchema>;
