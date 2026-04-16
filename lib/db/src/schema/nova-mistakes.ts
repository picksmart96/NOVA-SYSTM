import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const novaMistakesTable = pgTable("nova_mistakes", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),

  companyId:  text("company_id"),
  selectorId: text("selector_id"),
  sessionId:  text("session_id"),

  mistakeType:     text("mistake_type"),     // check_error | stacking_error | movement_delay
  description:     text("description"),
  expectedAction:  text("expected_action"),
  actualAction:    text("actual_action"),
  severity:        text("severity"),          // low | medium | high

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNovaMistakeSchema = createInsertSchema(novaMistakesTable).omit({
  id: true,
  createdAt: true,
});

export type NovaMistake = typeof novaMistakesTable.$inferSelect;
export type InsertNovaMistake = z.infer<typeof insertNovaMistakeSchema>;
