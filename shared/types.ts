import { Game, Player, Bottle, Round, Submission, GambitSubmission } from './schema';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GameResponse {
  game: Game;
  players: Player[];
  bottles: Bottle[];
  rounds: Round[];
}

export interface JoinGameResponse {
  player: Player;
  game: Game;
}

export interface SubmitTastingNotesRequest {
  playerId: string;
  tastingNotes: Record<string, string>;
  ranking: string[];
}

export interface SubmitGambitRequest {
  playerId: string;
  mostExpensive: string;
  leastExpensive: string;
  favorite: string;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  totalPoints: number;
  roundPoints: number[];
  gambitPoints: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  currentRound: number;
  totalRounds: number;
}
