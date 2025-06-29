import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  createGameSchema, joinGameSchema, setGameConfigSchema, addBottlesSchema, 
  submitTastingSchema, submitGambitSchema 
} from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

function generateGameCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateHostToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function shuffleArray<T>(array: T[], seed: string): T[] {
  const arr = [...array];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  for (let i = arr.length - 1; i > 0; i--) {
    hash = Math.abs(hash * 16807 % 2147483647);
    const j = Math.floor((hash / 2147483647) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function scoreRound(correctOrder: string[], playerRank: string[]): number {
  let pts = 0;
  for (let i = 0; i < 4; i++) {
    if (correctOrder[i] === playerRank[i]) pts++;
  }
  return pts;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new game
  app.post("/api/games", async (req, res) => {
    try {
      const { hostDisplayName } = createGameSchema.parse(req.body);
      
      const gameId = generateGameCode();
      const hostToken = generateHostToken();
      const playerId = generateId();
      
      // Create game
      const game = await storage.createGame({
        id: gameId,
        status: 'setup',
        currentRound: 0,
        hostToken,
      });
      
      // Create host player
      await storage.createPlayer({
        id: playerId,
        gameId,
        displayName: hostDisplayName,
        score: 0,
        isHost: true,
        status: 'active',
      });
      
      res.json({ game, playerId, hostToken });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  // Get game state
  app.get("/api/games/:gameId", async (req, res) => {
    try {
      const { gameId } = req.params;
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }
      
      const [players, bottles, rounds] = await Promise.all([
        storage.getPlayersByGame(gameId),
        storage.getBottlesByGame(gameId),
        storage.getRoundsByGame(gameId),
      ]);
      
      res.json({ game, players, bottles, rounds });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch game' });
    }
  });

  // Join game
  app.post("/api/games/:gameId/join", async (req, res) => {
    try {
      const { gameId } = req.params;
      const { displayName } = joinGameSchema.parse(req.body);
      
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }
      
      if (game.status !== 'setup' && game.status !== 'lobby') {
        return res.status(400).json({ error: 'Game already started' });
      }
      
      const players = await storage.getPlayersByGame(gameId);
      
      if (!displayName) {
        // Spectator mode
        return res.json({ spectator: true, playerCount: players.length });
      }
      
      // Check for duplicate names
      let finalDisplayName = displayName;
      const existingNames = players.map(p => p.displayName);
      let counter = 2;
      while (existingNames.includes(finalDisplayName)) {
        finalDisplayName = `${displayName} #${counter}`;
        counter++;
      }
      
      const playerId = generateId();
      const player = await storage.createPlayer({
        id: playerId,
        gameId,
        displayName: finalDisplayName,
        score: 0,
        isHost: false,
        status: 'active',
      });
      
      res.json({ player });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  // Set game configuration
  app.post("/api/games/:gameId/config", async (req, res) => {
    try {
      const { gameId } = req.params;
      const config = setGameConfigSchema.parse(req.body);
      const hostToken = req.headers.authorization?.replace('Bearer ', '');
      
      const game = await storage.getGame(gameId);
      if (!game || game.hostToken !== hostToken) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      if (game.status !== 'setup') {
        return res.status(400).json({ error: 'Game already started' });
      }
      
      const updatedGame = await storage.updateGame(gameId, {
        maxPlayers: config.maxPlayers,
        totalBottles: config.totalBottles,
        totalRounds: config.totalRounds,
        bottlesPerRound: config.bottlesPerRound,
        bottleEqPerPerson: Math.round(config.bottleEqPerPerson * 100), // Store as integer
        ozPerPersonPerBottle: Math.round(config.ozPerPersonPerBottle * 100), // Store as integer
      });
      
      res.json({ game: updatedGame });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  // Add bottles to game
  app.post("/api/games/:gameId/bottles", async (req, res) => {
    try {
      const { gameId } = req.params;
      const { bottles: bottleData } = addBottlesSchema.parse(req.body);
      const hostToken = req.headers.authorization?.replace('Bearer ', '');
      
      const game = await storage.getGame(gameId);
      if (!game || game.hostToken !== hostToken) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      if (game.status !== 'setup') {
        return res.status(400).json({ error: 'Game already started' });
      }
      
      // Check if bottles already exist for this game
      const existingBottles = await storage.getBottlesByGame(gameId);
      if (existingBottles.length > 0) {
        return res.status(400).json({ 
          error: 'Bottles already exist for this game. Please use PUT endpoint to update them.' 
        });
      }
      
      // Check for unique prices
      const prices = bottleData.map(b => b.price);
      if (new Set(prices).size !== prices.length) {
        return res.status(400).json({ error: 'All wine prices must be unique' });
      }
      
      // Check for unique label names (case insensitive)
      const labelNames = bottleData.map(b => b.labelName.toLowerCase());
      if (new Set(labelNames).size !== labelNames.length) {
        return res.status(400).json({ error: 'All label names must be unique' });
      }
      
      const bottles = bottleData.map(bottle => ({
        id: generateId(),
        gameId,
        labelName: bottle.labelName,
        funName: bottle.funName || null,
        price: Math.round(bottle.price * 100), // Convert to cents and store as integer
        roundIndex: null,
      }));
      
      await storage.createBottles(bottles);
      
      res.json({ bottles });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  // Get bottles for a game
  app.get("/api/games/:gameId/bottles", async (req, res) => {
    try {
      const { gameId } = req.params;
      const hostToken = req.headers.authorization?.replace('Bearer ', '');
      
      const game = await storage.getGame(gameId);
      console.log('[DEBUG] GET bottles - gameId:', gameId, 'hostToken:', hostToken?.substring(0, 10) + '...', 'game.hostToken:', game?.hostToken?.substring(0, 10) + '...');
      
      if (!game || game.hostToken !== hostToken) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      const bottles = await storage.getBottlesByGame(gameId);
      console.log('[DEBUG] Found bottles:', bottles.length);
      res.json({ bottles });
    } catch (error) {
      console.error('[DEBUG] Error fetching bottles:', error);
      res.status(500).json({ error: 'Failed to fetch bottles' });
    }
  });

  // Update (replace) all bottles for a game
  app.put("/api/games/:gameId/bottles", async (req, res) => {
    try {
      const { gameId } = req.params;
      const { bottles: bottleData } = addBottlesSchema.parse(req.body);
      const hostToken = req.headers.authorization?.replace('Bearer ', '');
      
      const game = await storage.getGame(gameId);
      if (!game || game.hostToken !== hostToken) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      if (game.status !== 'setup') {
        return res.status(400).json({ error: 'Game already started' });
      }
      
      // Check for unique prices
      const prices = bottleData.map(b => b.price);
      if (new Set(prices).size !== prices.length) {
        return res.status(400).json({ error: 'All wine prices must be unique' });
      }
      
      // Check for unique label names (case insensitive)
      const labelNames = bottleData.map(b => b.labelName.toLowerCase());
      if (new Set(labelNames).size !== labelNames.length) {
        return res.status(400).json({ error: 'All label names must be unique' });
      }
      
      // Delete existing bottles
      const existingBottles = await storage.getBottlesByGame(gameId);
      for (const bottle of existingBottles) {
        await storage.deleteBottle(bottle.id);
      }
      
      // Create new bottles
      const bottles = bottleData.map(bottle => ({
        id: generateId(),
        gameId,
        labelName: bottle.labelName,
        funName: bottle.funName || null,
        price: Math.round(bottle.price * 100), // Convert to cents
        roundIndex: bottle.roundIndex ?? null,
      }));
      
      await storage.createBottles(bottles);
      
      res.json({ bottles });
    } catch (error) {
      console.error('[DEBUG] Error updating bottles:', error);
      res.status(500).json({ error: 'Failed to update bottles' });
    }
  });

  // Organize bottles into rounds manually
  app.post("/api/games/:gameId/bottles/organize", async (req, res) => {
    try {
      const { gameId } = req.params;
      const { rounds: roundsData } = req.body;
      const hostToken = req.headers.authorization?.replace('Bearer ', '');
      
      const game = await storage.getGame(gameId);
      if (!game || game.hostToken !== hostToken) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      // Validate rounds data
      if (!Array.isArray(roundsData)) {
        return res.status(400).json({ error: 'Rounds data must be an array' });
      }
      
      // Get all existing bottles for this game
      const existingBottles = await storage.getBottlesByGame(gameId);
      const existingBottleIds = new Set(existingBottles.map(b => b.id));
      
      // Comprehensive validation
      const allAssignedIds = new Set<string>();
      const duplicates: string[] = [];
      
      for (const roundData of roundsData) {
        const { roundIndex, bottleIds } = roundData;
        
        if (typeof roundIndex !== 'number' || roundIndex < 0) {
          return res.status(400).json({ error: 'Invalid round index' });
        }
        
        if (!Array.isArray(bottleIds)) {
          return res.status(400).json({ error: 'Bottle IDs must be an array' });
        }
        
        // Check for valid bottle IDs
        for (const bottleId of bottleIds) {
          if (!existingBottleIds.has(bottleId)) {
            return res.status(400).json({ error: `Invalid bottle ID: ${bottleId}` });
          }
          
          if (allAssignedIds.has(bottleId)) {
            const bottle = existingBottles.find(b => b.id === bottleId);
            duplicates.push(bottle?.labelName || bottleId);
          }
          allAssignedIds.add(bottleId);
        }
      }
      
      if (duplicates.length > 0) {
        return res.status(400).json({ 
          error: `Bottles assigned to multiple rounds: ${duplicates.join(", ")}` 
        });
      }
      
      // Validate total bottles assignment if game config exists
      if (game.totalBottles && allAssignedIds.size > game.totalBottles) {
        return res.status(400).json({ 
          error: `Too many bottles assigned (${allAssignedIds.size}), maximum is ${game.totalBottles}` 
        });
      }
      
      // Validate bottles per round if config exists
      if (game.bottlesPerRound) {
        for (const roundData of roundsData) {
          if (roundData.bottleIds.length > game.bottlesPerRound) {
            return res.status(400).json({ 
              error: `Round ${roundData.roundIndex} has too many bottles (${roundData.bottleIds.length}), maximum is ${game.bottlesPerRound}` 
            });
          }
        }
      }
      
      // First, clear all existing round assignments
      for (const bottle of existingBottles) {
        await storage.updateBottle(bottle.id, { roundIndex: null });
      }
      
      // Then assign new round assignments
      for (const roundData of roundsData) {
        const { roundIndex, bottleIds } = roundData;
        
        for (const bottleId of bottleIds) {
          await storage.updateBottle(bottleId, { roundIndex });
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error organizing bottles:', error);
      res.status(500).json({ error: 'Failed to organize bottles' });
    }
  });

  // Create manual rounds organization
  app.post("/api/games/:gameId/rounds", async (req, res) => {
    try {
      const { gameId } = req.params;
      const { rounds: roundsData } = req.body;
      const hostToken = req.headers.authorization?.replace('Bearer ', '');
      
      const game = await storage.getGame(gameId);
      if (!game || game.hostToken !== hostToken) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      const bottles = await storage.getBottlesByGame(gameId);
      const totalBottles = game.totalBottles || bottles.length;
      const totalRounds = game.totalRounds || 4;
      const bottlesPerRound = game.bottlesPerRound || 4;
      
      // Validate rounds data
      if (!Array.isArray(roundsData) || roundsData.length !== totalRounds) {
        return res.status(400).json({ error: `Must have exactly ${totalRounds} rounds` });
      }
      
      const allBottleIds = new Set();
      for (const roundData of roundsData) {
        if (!Array.isArray(roundData.bottles) || roundData.bottles.length !== bottlesPerRound) {
          return res.status(400).json({ error: `Each round must have exactly ${bottlesPerRound} bottles` });
        }
        
        for (const bottleId of roundData.bottles) {
          if (allBottleIds.has(bottleId)) {
            return res.status(400).json({ error: 'Bottle appears in multiple rounds' });
          }
          allBottleIds.add(bottleId);
        }
      }
      
      if (allBottleIds.size !== totalBottles) {
        return res.status(400).json({ error: `Must assign all ${totalBottles} bottles` });
      }
      
      // Update bottles with round assignments and create rounds
      const rounds = [];
      for (const roundData of roundsData) {
        const roundIndex = roundData.index;
        const bottleIds = roundData.bottles;
        
        // Update each bottle with its round assignment
        for (const bottleId of bottleIds) {
          await storage.updateBottle(bottleId, { roundIndex });
        }
        
        rounds.push({
          id: generateId(),
          gameId,
          index: roundIndex,
          bottleIds,
          revealed: false,
        });
      }
      
      await storage.createRounds(rounds);
      await storage.updateGame(gameId, { status: 'lobby' });
      
      res.json({ rounds });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create rounds' });
    }
  });

  // Randomize bottles into rounds
  app.post("/api/games/:gameId/randomize", async (req, res) => {
    try {
      const { gameId } = req.params;
      const hostToken = req.headers.authorization?.replace('Bearer ', '');
      
      const game = await storage.getGame(gameId);
      if (!game || game.hostToken !== hostToken) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      const bottles = await storage.getBottlesByGame(gameId);
      if (bottles.length !== 20) {
        return res.status(400).json({ error: 'Must have exactly 20 bottles' });
      }
      
      // Shuffle bottles deterministically using game ID as seed
      const shuffled = shuffleArray(bottles, gameId);
      
      // Assign to rounds and update bottles
      const rounds = [];
      for (let roundIndex = 0; roundIndex < 5; roundIndex++) {
        const bottleIds = [];
        for (let bottleIndex = 0; bottleIndex < 4; bottleIndex++) {
          const bottle = shuffled[roundIndex * 4 + bottleIndex];
          await storage.updateBottle(bottle.id, { roundIndex });
          bottleIds.push(bottle.id);
        }
        
        rounds.push({
          id: generateId(),
          gameId,
          index: roundIndex,
          bottleIds,
          revealed: false,
        });
      }
      
      await storage.createRounds(rounds);
      await storage.updateGame(gameId, { status: 'lobby' });
      
      res.json({ rounds });
    } catch (error) {
      res.status(500).json({ error: 'Failed to randomize bottles' });
    }
  });

  // Start game
  app.post("/api/games/:gameId/start", async (req, res) => {
    try {
      const { gameId } = req.params;
      const hostToken = req.headers.authorization?.replace('Bearer ', '');
      
      const game = await storage.getGame(gameId);
      if (!game || game.hostToken !== hostToken) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      // Comprehensive pre-start validation
      const errors = [];
      
      // Check if game is in correct status
      if (game.status !== 'setup') {
        return res.status(400).json({ error: 'Game must be in setup status to start' });
      }
      
      // Validate game configuration is complete
      if (!game.totalBottles || !game.totalRounds || !game.bottlesPerRound) {
        return res.status(400).json({ error: 'Game configuration is incomplete. Please complete setup first.' });
      }
      
      // Check bottles exist and are properly configured
      const bottles = await storage.getBottlesByGame(gameId);
      if (bottles.length !== game.totalBottles) {
        errors.push(`Expected ${game.totalBottles} bottles, found ${bottles.length}`);
      }
      
      // Validate all bottles have required data
      const invalidBottles = bottles.filter(b => 
        !b.labelName?.trim() || 
        typeof b.price !== 'number' || 
        b.price <= 0
      );
      if (invalidBottles.length > 0) {
        errors.push(`${invalidBottles.length} bottles have missing or invalid data`);
      }
      
      // Check for duplicate prices
      const prices = bottles.map(b => b.price).filter(p => typeof p === 'number' && p > 0);
      const uniquePrices = new Set(prices);
      if (uniquePrices.size !== prices.length) {
        errors.push('All bottle prices must be unique');
      }
      
      // Check bottle organization (if organization required)
      const assignedBottles = bottles.filter(b => typeof b.roundIndex === 'number');
      if (assignedBottles.length > 0) {
        // If any bottles are assigned, all must be assigned
        if (assignedBottles.length !== bottles.length) {
          errors.push(`${bottles.length - assignedBottles.length} bottles are not assigned to rounds`);
        }
        
        // Validate round distribution
        const roundCounts = new Map<number, number>();
        assignedBottles.forEach(b => {
          const count = roundCounts.get(b.roundIndex!) || 0;
          roundCounts.set(b.roundIndex!, count + 1);
        });
        
        for (let i = 0; i < game.totalRounds!; i++) {
          const count = roundCounts.get(i) || 0;
          if (count !== game.bottlesPerRound) {
            errors.push(`Round ${i + 1} has ${count} bottles, expected ${game.bottlesPerRound}`);
          }
        }
      } else {
        // Auto-assign bottles if none are assigned
        const shuffledBottles = shuffleArray([...bottles], gameId);
        for (let i = 0; i < shuffledBottles.length; i++) {
          const roundIndex = Math.floor(i / game.bottlesPerRound!);
          await storage.updateBottle(shuffledBottles[i].id, { roundIndex });
        }
      }
      
      if (errors.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot start game: ' + errors.join('. ') 
        });
      }
      
      // All validations passed, start the game
      await storage.updateGame(gameId, { 
        status: 'lobby',
        currentRound: 0,
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error starting game:', error);
      res.status(500).json({ error: 'Failed to start game' });
    }
  });

  // Get current round data
  app.get("/api/games/:gameId/rounds/:roundIndex", async (req, res) => {
    try {
      const { gameId, roundIndex } = req.params;
      const roundIdx = parseInt(roundIndex);
      
      const rounds = await storage.getRoundsByGame(gameId);
      const round = rounds.find(r => r.index === roundIdx);
      
      if (!round) {
        return res.status(404).json({ error: 'Round not found' });
      }
      
      // Get bottles for this round
      const bottles = await storage.getBottlesByGame(gameId);
      const roundBottles = bottles.filter(b => round.bottleIds.includes(b.id));
      
      // Sort bottles by price for correct order (only if revealed)
      let correctOrder = null;
      if (round.revealed) {
        correctOrder = roundBottles
          .sort((a, b) => b.price - a.price)
          .map(b => b.id);
      }
      
      const submissions = await storage.getSubmissionsByRound(gameId, roundIdx);
      
      res.json({ round, bottles: roundBottles, correctOrder, submissions });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch round data' });
    }
  });

  // Submit tasting notes and ranking
  app.post("/api/games/:gameId/rounds/:roundIndex/submit", async (req, res) => {
    try {
      const { gameId, roundIndex } = req.params;
      const { tastingNotes, ranking } = submitTastingSchema.parse(req.body);
      const playerId = req.headers['x-player-id'] as string;
      
      if (!playerId) {
        return res.status(400).json({ error: 'Player ID required' });
      }
      
      const game = await storage.getGame(gameId);
      if (!game || game.status !== 'in_round') {
        return res.status(400).json({ error: 'Invalid game state' });
      }
      
      const roundIdx = parseInt(roundIndex);
      if (game.currentRound !== roundIdx + 1) {
        return res.status(400).json({ error: 'Invalid round' });
      }
      
      // Check if player already submitted
      const existing = await storage.getPlayerSubmission(playerId, roundIdx);
      if (existing && existing.locked) {
        return res.status(400).json({ error: 'Already submitted' });
      }
      
      const submissionId = existing?.id || generateId();
      const submission = {
        id: submissionId,
        playerId,
        gameId,
        roundIndex: roundIdx,
        tastingNotes,
        ranking,
        locked: true,
        points: 0,
      };
      
      if (existing) {
        await storage.updateSubmission(submissionId, submission);
      } else {
        await storage.createSubmission(submission);
      }
      
      res.json({ submission });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  // Close round and reveal results
  app.post("/api/games/:gameId/rounds/:roundIndex/close", async (req, res) => {
    try {
      const { gameId, roundIndex } = req.params;
      const hostToken = req.headers.authorization?.replace('Bearer ', '');
      
      const game = await storage.getGame(gameId);
      if (!game || game.hostToken !== hostToken) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      const roundIdx = parseInt(roundIndex);
      const rounds = await storage.getRoundsByGame(gameId);
      const round = rounds.find(r => r.index === roundIdx);
      
      if (!round) {
        return res.status(404).json({ error: 'Round not found' });
      }
      
      // Get bottles and calculate correct order
      const bottles = await storage.getBottlesByGame(gameId);
      const roundBottles = bottles.filter(b => round.bottleIds.includes(b.id));
      const correctOrder = roundBottles
        .sort((a, b) => b.price - a.price)
        .map(b => b.id);
      
      // Score all submissions
      const submissions = await storage.getSubmissionsByRound(gameId, roundIdx);
      for (const submission of submissions) {
        const points = scoreRound(correctOrder, submission.ranking);
        await storage.updateSubmission(submission.id, { points });
        
        // Update player score
        const player = await storage.getPlayer(submission.playerId);
        if (player) {
          await storage.updatePlayer(player.id, { 
            score: player.score + points 
          });
        }
      }
      
      // Mark round as revealed
      await storage.updateRound(round.id, { revealed: true });
      await storage.updateGame(gameId, { status: 'reveal' });
      
      res.json({ success: true, correctOrder });
    } catch (error) {
      res.status(500).json({ error: 'Failed to close round' });
    }
  });

  // Advance to next round
  app.post("/api/games/:gameId/next-round", async (req, res) => {
    try {
      const { gameId } = req.params;
      const hostToken = req.headers.authorization?.replace('Bearer ', '');
      
      const game = await storage.getGame(gameId);
      if (!game || game.hostToken !== hostToken) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      if (game.currentRound >= 5) {
        // Move to Sommelier's Gambit
        await storage.updateGame(gameId, { status: 'gambit' });
      } else {
        // Next round
        await storage.updateGame(gameId, { 
          status: 'in_round',
          currentRound: game.currentRound + 1,
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to advance round' });
    }
  });

  // Submit Sommelier's Gambit
  app.post("/api/games/:gameId/gambit", async (req, res) => {
    try {
      const { gameId } = req.params;
      const { mostExpensive, leastExpensive, favorite } = submitGambitSchema.parse(req.body);
      const playerId = req.headers['x-player-id'] as string;
      
      if (!playerId) {
        return res.status(400).json({ error: 'Player ID required' });
      }
      
      const game = await storage.getGame(gameId);
      if (!game || game.status !== 'gambit') {
        return res.status(400).json({ error: 'Invalid game state' });
      }
      
      if (mostExpensive === leastExpensive) {
        return res.status(400).json({ error: 'Most and least expensive cannot be the same' });
      }
      
      const gambitSubmission = {
        id: generateId(),
        playerId,
        gameId,
        mostExpensive,
        leastExpensive,
        favorite,
        points: 0,
      };
      
      await storage.createGambitSubmission(gambitSubmission);
      
      res.json({ gambitSubmission });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  // Finish game and calculate final scores
  app.post("/api/games/:gameId/finish", async (req, res) => {
    try {
      const { gameId } = req.params;
      const hostToken = req.headers.authorization?.replace('Bearer ', '');
      
      const game = await storage.getGame(gameId);
      if (!game || game.hostToken !== hostToken) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      // Calculate gambit scores
      const bottles = await storage.getBottlesByGame(gameId);
      const sortedByPrice = bottles.sort((a, b) => b.price - a.price);
      const mostExpensiveId = sortedByPrice[0].id;
      const leastExpensiveId = sortedByPrice[sortedByPrice.length - 1].id;
      
      const gambitSubmissions = await storage.getGambitSubmissionsByGame(gameId);
      for (const submission of gambitSubmissions) {
        let points = 0;
        if (submission.mostExpensive === mostExpensiveId) points += 2;
        if (submission.leastExpensive === leastExpensiveId) points += 2;
        
        // Update player score
        const player = await storage.getPlayer(submission.playerId);
        if (player) {
          await storage.updatePlayer(player.id, { 
            score: player.score + points 
          });
        }
      }
      
      await storage.updateGame(gameId, { status: 'final' });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to finish game' });
    }
  });

  // Get leaderboard
  app.get("/api/games/:gameId/leaderboard", async (req, res) => {
    try {
      const { gameId } = req.params;
      const players = await storage.getPlayersByGame(gameId);
      
      const leaderboard = players
        .filter(p => p.status === 'active')
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.displayName.localeCompare(b.displayName);
        });
      
      res.json({ leaderboard });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
