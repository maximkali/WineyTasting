// [players, bottles, rounds, bottlesPerRound, bottleEqPerPerson, ozPerPersonPerBottle]
type GameSetup = [number, number, number, number, number, number];

export const wineySetups: GameSetup[] = [
  [22, 20, 5, 4, 0.91, 1.15],
  [20, 20, 5, 4, 1.0, 1.27],
  [20, 16, 4, 4, 0.8, 1.27],
  [20, 15, 5, 3, 0.75, 1.27],
  [20, 12, 4, 3, 0.6, 1.27],
  [20, 12, 3, 4, 0.6, 1.27],
  [20, 9, 3, 3, 0.45, 1.27],
  [18, 16, 4, 4, 0.89, 1.41],
  [16, 16, 4, 4, 1.0, 1.58],
  [16, 15, 5, 3, 0.94, 1.58],
  [16, 12, 4, 3, 0.75, 1.58],
  [16, 12, 3, 4, 0.75, 1.58],
  [16, 9, 3, 3, 0.56, 1.58],
  [14, 12, 4, 3, 0.86, 1.81],
  [14, 12, 3, 4, 0.86, 1.81],
  [12, 12, 3, 4, 1.0, 2.11],
  [12, 12, 4, 3, 1.0, 2.11],
  [12, 9, 3, 3, 0.75, 2.11],
  [10, 9, 3, 3, 0.9, 2.54],
];

export interface GameSetupOption {
  players: number;
  bottles: number;
  rounds: number;
  bottlesPerRound: number;
  bottleEqPerPerson: number;
  ozPerPersonPerBottle: number;
}

export function getUniquePlayerCounts(): number[] {
  const playerCounts = new Set<number>();
  wineySetups.forEach(setup => playerCounts.add(setup[0]));
  return Array.from(playerCounts).sort((a, b) => b - a); // Sort in descending order
}

export function getBottleOptionsForPlayers(playerCount: number): GameSetupOption[] {
  // First get all options for the player count
  const allOptions = wineySetups.filter(([players]) => players === playerCount);
  
  // Create a map to store unique bottle counts with their configurations
  const uniqueBottles = new Map<number, GameSetupOption>();
  
  // For each option, only keep the one with the most rounds (most tastings)
  allOptions.forEach(option => {
    const bottles = option[1];
    const existing = uniqueBottles.get(bottles);
    
    // If we haven't seen this bottle count yet, or if this one has more rounds
    if (!existing || option[2] > existing.rounds) {
      const [players, bottles, rounds, bottlesPerRound, bottleEqPerPerson, ozPerPersonPerBottle] = option;
      uniqueBottles.set(bottles, {
        players,
        bottles,
        rounds,
        bottlesPerRound,
        bottleEqPerPerson,
        ozPerPersonPerBottle,
      });
    }
  });
  
  // Convert back to array and sort by bottle count in descending order
  return Array.from(uniqueBottles.values())
    .sort((a, b) => b.bottles - a.bottles);
}

export function getRoundOptions(playerCount: number, bottleCount: number): GameSetupOption[] {
  const options = wineySetups
    .filter(([players, bottles, rounds]) => players === playerCount && bottles === bottleCount && rounds > 0)
    .map(([players, bottles, rounds, bottlesPerRound, bottleEqPerPerson, ozPerPersonPerBottle]) => ({
      players,
      bottles,
      rounds,
      bottlesPerRound,
      bottleEqPerPerson,
      ozPerPersonPerBottle,
    }));
  return options.sort((a, b) => b.rounds - a.rounds);
}