import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const games = pgTable("games", {
  id: text("id").primaryKey(),
  status: text("status").$type<'setup' | 'lobby' | 'in_round' | 'countdown' | 'reveal' | 'gambit' | 'final'>().notNull().default('setup'),
  currentRound: integer("current_round").notNull().default(0),
  hostToken: text("host_token").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Game setup configuration
  maxPlayers: integer("max_players"),
  totalBottles: integer("total_bottles"),
  totalRounds: integer("total_rounds"),
  bottlesPerRound: integer("bottles_per_round"),
  bottleEqPerPerson: integer("bottle_eq_per_person"), // Store as integer (multiplied by 100)
  ozPerPersonPerBottle: integer("oz_per_person_per_bottle"), // Store as integer (multiplied by 100)
});

export const bottles = pgTable("bottles", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull(),
  labelName: text("label_name").notNull(),
  funName: text("fun_name"),
  price: integer("price").notNull(),
  roundIndex: integer("round_index"),
});

export const players = pgTable("players", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull(),
  displayName: text("display_name").notNull(),
  score: integer("score").notNull().default(0),
  isHost: boolean("is_host").notNull().default(false),
  status: text("status").$type<'active' | 'kicked' | 'spectator'>().notNull().default('active'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rounds = pgTable("rounds", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull(),
  index: integer("index").notNull(),
  bottleIds: jsonb("bottle_ids").$type<string[]>().notNull(),
  revealed: boolean("revealed").notNull().default(false),
});

export const submissions = pgTable("submissions", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull(),
  gameId: text("game_id").notNull(),
  roundIndex: integer("round_index").notNull(),
  tastingNotes: jsonb("tasting_notes").$type<Record<string, string>>().notNull(),
  ranking: jsonb("ranking").$type<string[]>().notNull(),
  locked: boolean("locked").notNull().default(false),
  points: integer("points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gambitSubmissions = pgTable("gambit_submissions", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull(),
  gameId: text("game_id").notNull(),
  mostExpensive: text("most_expensive").notNull(),
  leastExpensive: text("least_expensive").notNull(),
  favorite: text("favorite").notNull(),
  points: integer("points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertGameSchema = createInsertSchema(games).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertBottleSchema = createInsertSchema(bottles);

export const insertPlayerSchema = createInsertSchema(players).omit({
  createdAt: true,
});

export const insertRoundSchema = createInsertSchema(rounds);

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  createdAt: true,
});

export const insertGambitSubmissionSchema = createInsertSchema(gambitSubmissions).omit({
  createdAt: true,
});

// Types
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Bottle = typeof bottles.$inferSelect;
export type InsertBottle = z.infer<typeof insertBottleSchema>;
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Round = typeof rounds.$inferSelect;
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type GambitSubmission = typeof gambitSubmissions.$inferSelect;
export type InsertGambitSubmission = z.infer<typeof insertGambitSubmissionSchema>;

// Additional validation schemas
export const createGameSchema = z.object({
  hostDisplayName: z.string().min(3).max(15),
  maxPlayers: z.number().min(10).max(22).optional(),
  totalBottles: z.number().min(9).max(20).optional(),
  totalRounds: z.number().min(3).max(5).optional(),
  bottlesPerRound: z.number().min(3).max(4).optional(),
  bottleEqPerPerson: z.number().min(0.1).max(1.0).optional(),
  ozPerPersonPerBottle: z.number().min(1.0).max(3.0).optional(),
});

export const joinGameSchema = z.object({
  displayName: z.string().min(3).max(15).optional(),
});

export const setGameConfigSchema = z.object({
  maxPlayers: z.number().min(10).max(22),
  totalBottles: z.number().min(9).max(20),
  totalRounds: z.number().min(3).max(5),
  bottlesPerRound: z.number().min(3).max(4),
  bottleEqPerPerson: z.number().min(0.1).max(1.0),
  ozPerPersonPerBottle: z.number().min(1.0).max(3.0),
});

export const addBottlesSchema = z.object({
  bottles: z.array(z.object({
    labelName: z.string().min(3).max(60),
    funName: z.string().max(40).optional().nullable(),
    price: z.number().min(1),
  })).min(9).max(20),
});

export const submitTastingSchema = z.object({
  tastingNotes: z.record(z.string().min(10).max(300)),
  ranking: z.array(z.string()).length(4),
});

export const submitGambitSchema = z.object({
  mostExpensive: z.string(),
  leastExpensive: z.string(),
  favorite: z.string(),
});
