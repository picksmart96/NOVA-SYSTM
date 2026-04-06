import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const systemDefaultsTable = pgTable("system_defaults", {
  id: text("id").primaryKey(),
  printerNumber: integer("printer_number").notNull().default(307),
  alphaLabelNumber: integer("alpha_label_number").notNull().default(242),
  bravoLabelNumber: integer("bravo_label_number").notNull().default(578),
});

export const doorCodesTable = pgTable("door_codes", {
  id: text("id").primaryKey(),
  doorNumber: integer("door_number").notNull(),
  stagingCode: text("staging_code").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const slotMasterTable = pgTable("slot_master", {
  id: text("id").primaryKey(),
  aisle: integer("aisle").notNull(),
  slot: integer("slot").notNull(),
  level: text("level"),
  checkCode: text("check_code").notNull(),
  label: text("label").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertSystemDefaultsSchema = createInsertSchema(systemDefaultsTable);
export const insertDoorCodeSchema = createInsertSchema(doorCodesTable);
export const insertSlotMasterSchema = createInsertSchema(slotMasterTable);

export type SystemDefault = typeof systemDefaultsTable.$inferSelect;
export type DoorCode = typeof doorCodesTable.$inferSelect;
export type SlotEntry = typeof slotMasterTable.$inferSelect;
export type InsertSystemDefault = z.infer<typeof insertSystemDefaultsSchema>;
export type InsertDoorCode = z.infer<typeof insertDoorCodeSchema>;
export type InsertSlotEntry = z.infer<typeof insertSlotMasterSchema>;
