import { pgTable, text, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sbnUsers } from "./social-users";

export const sbnConversations = pgTable("sbn_conversations", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationType: text("conversation_type").notNull().default("direct"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sbnConversationMembers = pgTable(
  "sbn_conversation_members",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    conversationId: text("conversation_id").notNull().references(() => sbnConversations.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("sbn_conversation_members_conv_user_uidx").on(table.conversationId, table.userId)],
);

export const sbnMessages = pgTable("sbn_messages", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: text("conversation_id").notNull().references(() => sbnConversations.id, { onDelete: "cascade" }),
  senderUserId: text("sender_user_id").notNull().references(() => sbnUsers.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  imageUrl: text("image_url").notNull().default(""),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSbnConversationSchema = createInsertSchema(sbnConversations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSbnConversationMemberSchema = createInsertSchema(sbnConversationMembers).omit({ id: true, joinedAt: true });
export const insertSbnMessageSchema = createInsertSchema(sbnMessages).omit({ id: true, createdAt: true });

export type SbnConversation = typeof sbnConversations.$inferSelect;
export type InsertSbnConversation = z.infer<typeof insertSbnConversationSchema>;
export type SbnConversationMember = typeof sbnConversationMembers.$inferSelect;
export type InsertSbnConversationMember = z.infer<typeof insertSbnConversationMemberSchema>;
export type SbnMessage = typeof sbnMessages.$inferSelect;
export type InsertSbnMessage = z.infer<typeof insertSbnMessageSchema>;
