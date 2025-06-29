import { 
  Game, InsertGame, Bottle, InsertBottle, Player, InsertPlayer, 
  Round, InsertRound, Submission, InsertSubmission, 
  GambitSubmission, InsertGambitSubmission,
  games, bottles, players, rounds, submissions, gambitSubmissions
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Games
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: string): Promise<Game | undefined>;
  updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined>;
  
  // Bottles
  createBottles(bottles: InsertBottle[]): Promise<Bottle[]>;
  getBottlesByGame(gameId: string): Promise<Bottle[]>;
  updateBottle(id: string, updates: Partial<Bottle>): Promise<Bottle | undefined>;
  deleteBottle(id: string): Promise<void>;
  
  // Players
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayersByGame(gameId: string): Promise<Player[]>;
  getPlayer(id: string): Promise<Player | undefined>;
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined>;
  
  // Rounds
  createRounds(rounds: InsertRound[]): Promise<Round[]>;
  getRoundsByGame(gameId: string): Promise<Round[]>;
  updateRound(id: string, updates: Partial<Round>): Promise<Round | undefined>;
  
  // Submissions
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmissionsByRound(gameId: string, roundIndex: number): Promise<Submission[]>;
  getPlayerSubmission(playerId: string, roundIndex: number): Promise<Submission | undefined>;
  updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | undefined>;
  
  // Gambit Submissions
  createGambitSubmission(gambitSubmission: InsertGambitSubmission): Promise<GambitSubmission>;
  getGambitSubmissionsByGame(gameId: string): Promise<GambitSubmission[]>;
  getPlayerGambitSubmission(playerId: string): Promise<GambitSubmission | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Games
  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db.insert(games).values(game).returning();
    return newGame;
  }

  async getGame(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined> {
    const [updatedGame] = await db
      .update(games)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(games.id, id))
      .returning();
    return updatedGame || undefined;
  }

  // Bottles
  async createBottles(bottleList: InsertBottle[]): Promise<Bottle[]> {
    const createdBottles = await db.insert(bottles).values(bottleList).returning();
    return createdBottles;
  }

  async getBottlesByGame(gameId: string): Promise<Bottle[]> {
    return await db.select().from(bottles).where(eq(bottles.gameId, gameId));
  }

  async updateBottle(id: string, updates: Partial<Bottle>): Promise<Bottle | undefined> {
    const [updatedBottle] = await db
      .update(bottles)
      .set(updates)
      .where(eq(bottles.id, id))
      .returning();
    return updatedBottle || undefined;
  }

  async deleteBottle(id: string): Promise<void> {
    await db.delete(bottles).where(eq(bottles.id, id));
  }

  // Players
  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [newPlayer] = await db.insert(players).values(player).returning();
    return newPlayer;
  }

  async getPlayersByGame(gameId: string): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.gameId, gameId));
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player || undefined;
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined> {
    const [updatedPlayer] = await db
      .update(players)
      .set(updates)
      .where(eq(players.id, id))
      .returning();
    return updatedPlayer || undefined;
  }

  // Rounds
  async createRounds(roundList: InsertRound[]): Promise<Round[]> {
    const createdRounds = await db.insert(rounds).values(roundList).returning();
    return createdRounds;
  }

  async getRoundsByGame(gameId: string): Promise<Round[]> {
    return await db.select().from(rounds).where(eq(rounds.gameId, gameId));
  }

  async updateRound(id: string, updates: Partial<Round>): Promise<Round | undefined> {
    const [updatedRound] = await db
      .update(rounds)
      .set(updates)
      .where(eq(rounds.id, id))
      .returning();
    return updatedRound || undefined;
  }

  // Submissions
  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [newSubmission] = await db.insert(submissions).values(submission).returning();
    return newSubmission;
  }

  async getSubmissionsByRound(gameId: string, roundIndex: number): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.gameId, gameId), eq(submissions.roundIndex, roundIndex)));
  }

  async getPlayerSubmission(playerId: string, roundIndex: number): Promise<Submission | undefined> {
    const [submission] = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.playerId, playerId), eq(submissions.roundIndex, roundIndex)));
    return submission || undefined;
  }

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | undefined> {
    const [updatedSubmission] = await db
      .update(submissions)
      .set(updates)
      .where(eq(submissions.id, id))
      .returning();
    return updatedSubmission || undefined;
  }

  // Gambit Submissions
  async createGambitSubmission(gambitSubmission: InsertGambitSubmission): Promise<GambitSubmission> {
    const [newGambitSubmission] = await db.insert(gambitSubmissions).values(gambitSubmission).returning();
    return newGambitSubmission;
  }

  async getGambitSubmissionsByGame(gameId: string): Promise<GambitSubmission[]> {
    return await db.select().from(gambitSubmissions).where(eq(gambitSubmissions.gameId, gameId));
  }

  async getPlayerGambitSubmission(playerId: string): Promise<GambitSubmission | undefined> {
    const [gambitSubmission] = await db
      .select()
      .from(gambitSubmissions)
      .where(eq(gambitSubmissions.playerId, playerId));
    return gambitSubmission || undefined;
  }
}

export const storage = new DatabaseStorage();