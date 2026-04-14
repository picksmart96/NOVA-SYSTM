import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const novaMetricsTable = pgTable("nova_metrics", {
  id:        text("id").primaryKey().default(sql`gen_random_uuid()`),
  event:     text("event").notNull(),
  userId:    text("user_id"),
  dealId:    text("deal_id"),
  meta:      text("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type NovaMetric = typeof novaMetricsTable.$inferSelect;
