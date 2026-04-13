import { pgTable, text, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ownerLeadsTable = pgTable("owner_leads", {
  id:              text("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName:     text("company_name").notNull().default(""),
  contactName:     text("contact_name").notNull().default(""),
  contactRole:     text("contact_role").notNull().default(""),
  email:           text("email").notNull().default(""),
  phone:           text("phone").notNull().default(""),
  city:            text("city").notNull().default(""),
  state:           text("state").notNull().default(""),
  warehouseType:   text("warehouse_type").notNull().default(""),
  status:          text("status").notNull().default("new_lead"),
  nextAction:      text("next_action").notNull().default(""),
  nextActionDate:  date("next_action_date"),
  notes:           text("notes").notNull().default(""),
  contractValue:   numeric("contract_value"),
  weeklyPrice:     numeric("weekly_price"),
  demoDate:        date("demo_date"),
  proposalDate:    date("proposal_date"),
  trialStart:      date("trial_start"),
  trialEnd:        date("trial_end"),
  contractSigned:  date("contract_signed"),
  renewalDate:     date("renewal_date"),
  signedBy:        text("signed_by"),
  signedAt:        timestamp("signed_at", { withTimezone: true }),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertOwnerLeadSchema = createInsertSchema(ownerLeadsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type OwnerLead = typeof ownerLeadsTable.$inferSelect;
export type InsertOwnerLead = z.infer<typeof insertOwnerLeadSchema>;
