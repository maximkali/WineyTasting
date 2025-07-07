import { Game } from "@shared/schema";

export interface Bottle {
  id?: string;
  labelName: string;
  funName: string;
  price: string;
  roundIndex?: number;
  orderIndex?: number;
}

export interface GameSetupOption {
  id: string;
  label: string;
  players: number;
  bottles: number;
  rounds: number;
  bottlesPerRound: number;
  bottleEqPerPerson: number;
  ozPerPersonPerBottle: number;
}

export interface GameSetupData {
  game: Game;
  bottles: Bottle[];
  players: Array<{
    id: string;
    displayName: string;
    isHost: boolean;
    status: 'active' | 'kicked';
  }>;
}

export interface GameConfig {
  maxPlayers: number;
  totalBottles: number;
  totalRounds: number;
  bottlesPerRound: number;
  bottleEqPerPerson: number;
  ozPerPersonPerBottle: number;
}
