import { 
  Game, InsertGame, Bottle, InsertBottle, Player, InsertPlayer, 
  Round, InsertRound, Submission, InsertSubmission, 
  GambitSubmission, InsertGambitSubmission 
} from "@shared/schema";

export interface IStorage {
  // Games
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: string): Promise<Game | undefined>;
  updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined>;
  
  // Bottles
  createBottles(bottles: InsertBottle[]): Promise<Bottle[]>;
  getBottlesByGame(gameId: string): Promise<Bottle[]>;
  updateBottle(id: string, updates: Partial<Bottle>): Promise<Bottle | undefined>;
  
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

export class MemStorage implements IStorage {
  private games: Map<string, Game> = new Map();
  private bottles: Map<string, Bottle> = new Map();
  private players: Map<string, Player> = new Map();
  private rounds: Map<string, Round> = new Map();
  private submissions: Map<string, Submission> = new Map();
  private gambitSubmissions: Map<string, GambitSubmission> = new Map();

  async createGame(game: InsertGame): Promise<Game> {
    const newGame: Game = {
      ...game,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.games.set(game.id, newGame);
    return newGame;
  }

  async getGame(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    
    const updatedGame = { ...game, ...updates, updatedAt: new Date() };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  async createBottles(bottles: InsertBottle[]): Promise<Bottle[]> {
    const createdBottles = bottles.map(bottle => {
      this.bottles.set(bottle.id, bottle);
      return bottle;
    });
    return createdBottles;
  }

  async getBottlesByGame(gameId: string): Promise<Bottle[]> {
    return Array.from(this.bottles.values()).filter(bottle => bottle.gameId === gameId);
  }

  async updateBottle(id: string, updates: Partial<Bottle>): Promise<Bottle | undefined> {
    const bottle = this.bottles.get(id);
    if (!bottle) return undefined;
    
    const updatedBottle = { ...bottle, ...updates };
    this.bottles.set(id, updatedBottle);
    return updatedBottle;
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const newPlayer: Player = {
      ...player,
      createdAt: new Date(),
    };
    this.players.set(player.id, newPlayer);
    return newPlayer;
  }

  async getPlayersByGame(gameId: string): Promise<Player[]> {
    return Array.from(this.players.values()).filter(player => player.gameId === gameId);
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;
    
    const updatedPlayer = { ...player, ...updates };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  async createRounds(rounds: InsertRound[]): Promise<Round[]> {
    const createdRounds = rounds.map(round => {
      this.rounds.set(round.id, round);
      return round;
    });
    return createdRounds;
  }

  async getRoundsByGame(gameId: string): Promise<Round[]> {
    return Array.from(this.rounds.values()).filter(round => round.gameId === gameId);
  }

  async updateRound(id: string, updates: Partial<Round>): Promise<Round | undefined> {
    const round = this.rounds.get(id);
    if (!round) return undefined;
    
    const updatedRound = { ...round, ...updates };
    this.rounds.set(id, updatedRound);
    return updatedRound;
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const newSubmission: Submission = {
      ...submission,
      createdAt: new Date(),
    };
    this.submissions.set(submission.id, newSubmission);
    return newSubmission;
  }

  async getSubmissionsByRound(gameId: string, roundIndex: number): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(
      submission => submission.gameId === gameId && submission.roundIndex === roundIndex
    );
  }

  async getPlayerSubmission(playerId: string, roundIndex: number): Promise<Submission | undefined> {
    return Array.from(this.submissions.values()).find(
      submission => submission.playerId === playerId && submission.roundIndex === roundIndex
    );
  }

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    if (!submission) return undefined;
    
    const updatedSubmission = { ...submission, ...updates };
    this.submissions.set(id, updatedSubmission);
    return updatedSubmission;
  }

  async createGambitSubmission(gambitSubmission: InsertGambitSubmission): Promise<GambitSubmission> {
    const newGambitSubmission: GambitSubmission = {
      ...gambitSubmission,
      createdAt: new Date(),
    };
    this.gambitSubmissions.set(gambitSubmission.id, newGambitSubmission);
    return newGambitSubmission;
  }

  async getGambitSubmissionsByGame(gameId: string): Promise<GambitSubmission[]> {
    return Array.from(this.gambitSubmissions.values()).filter(
      submission => submission.gameId === gameId
    );
  }

  async getPlayerGambitSubmission(playerId: string): Promise<GambitSubmission | undefined> {
    return Array.from(this.gambitSubmissions.values()).find(
      submission => submission.playerId === playerId
    );
  }
}

export const storage = new MemStorage();
