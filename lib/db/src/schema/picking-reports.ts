import { pgTable, text, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const pickingSessionEventsTable = pgTable("picking_session_events", {
  id:               text("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId:     text("assignment_id").notNull(),
  stopId:           text("stop_id"),
  traineeId:        text("trainee_id"),
  eventType:        text("event_type").notNull(),
  expectedValue:    text("expected_value"),
  actualValue:      text("actual_value"),
  slotTimeSeconds:  integer("slot_time_seconds"),
  createdAt:        timestamp("created_at").defaultNow(),
});

export const pickingReportsTable = pgTable("picking_reports", {
  id:                    text("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId:          text("assignment_id").notNull(),
  traineeId:             text("trainee_id"),
  traineeUsername:       text("trainee_username"),
  traineeName:           text("trainee_name"),
  trainerUserId:         text("trainer_user_id"),
  reportDate:            text("report_date").notNull(),

  totalCases:            integer("total_cases"),
  pickedCases:           integer("picked_cases"),
  totalDurationSeconds:  integer("total_duration_seconds"),
  goalTimeMinutes:       integer("goal_time_minutes"),
  uphActual:             real("uph_actual"),
  uphStandard:           real("uph_standard"),
  efficiencyPercent:     real("efficiency_percent"),

  wrongCodeCount:        integer("wrong_code_count").default(0),
  overPickCount:         integer("over_pick_count").default(0),
  shortPickCount:        integer("short_pick_count").default(0),
  avgSlotTimeSeconds:    real("avg_slot_time_seconds"),

  performanceBand:       text("performance_band"),
  novaFeedback:          text("nova_feedback"),
  improvements:          text("improvements"),
  mistakeSummary:        text("mistake_summary"),
  howToImprove:          text("how_to_improve"),

  createdAt:             timestamp("created_at").defaultNow(),
});

export type PickingSessionEvent = typeof pickingSessionEventsTable.$inferSelect;
export type PickingReport = typeof pickingReportsTable.$inferSelect;
