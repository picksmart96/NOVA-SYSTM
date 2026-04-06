import { pgTable, text, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trainingModulesTable = pgTable("training_modules", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull().default("beginner"),
  duration: integer("duration").notNull(),
  category: text("category").notNull(),
  image: text("image").notNull(),
  lessons: jsonb("lessons").notNull().default([]),
  commonMistakes: jsonb("common_mistakes").notNull().default([]),
  objectives: jsonb("objectives").notNull().default([]),
});

export const leaderboardTable = pgTable("leaderboard", {
  userId: text("user_id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  totalAssignments: integer("total_assignments").notNull().default(0),
  avgPerformance: integer("avg_performance").notNull().default(0),
  totalCases: integer("total_cases").notNull().default(0),
  rank: integer("rank").notNull().default(0),
});

export const insertTrainingModuleSchema = createInsertSchema(trainingModulesTable);
export const insertLeaderboardSchema = createInsertSchema(leaderboardTable);

export type TrainingModule = typeof trainingModulesTable.$inferSelect;
export type LeaderboardEntry = typeof leaderboardTable.$inferSelect;
export type InsertTrainingModule = z.infer<typeof insertTrainingModuleSchema>;
export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
