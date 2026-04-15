import { pgTable, text, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contractsTable = pgTable("contracts", {
  id:                   text("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName:          text("company_name").notNull(),
  contactName:          text("contact_name"),
  email:                text("email"),
  contractTerm:         text("contract_term").notNull().default("1 Year"),
  weeklyPrice:          numeric("weekly_price").notNull().default("1660"),
  totalContractValue:   numeric("total_contract_value"),
  signedName:           text("signed_name"),
  signedAt:             timestamp("signed_at"),
  stripeCustomerId:     text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeSessionId:      text("stripe_session_id"),
  status:               text("status").notNull().default("pending"),
  startDate:            timestamp("start_date").defaultNow(),
  endDate:              timestamp("end_date"),
  autoRenew:            boolean("auto_renew").notNull().default(true),
  renewalAlertSent:     boolean("renewal_alert_sent").notNull().default(false),
  createdAt:            timestamp("created_at").notNull().defaultNow(),
});

export const insertContractSchema = createInsertSchema(contractsTable).omit({
  id: true,
  createdAt: true,
});

export type ContractRecord = typeof contractsTable.$inferSelect;
export type InsertContract  = z.infer<typeof insertContractSchema>;
