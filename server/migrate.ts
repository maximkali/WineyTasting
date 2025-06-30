import { db } from './db';
import { games, bottles, players, rounds, submissions, gambitSubmissions } from '@shared/schema';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Running database migrations...');
  
  try {
    // Drop all tables if they exist
    console.log('Dropping existing tables...');
    await db.execute(sql`DROP TABLE IF EXISTS gambit_submissions CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS submissions CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS rounds CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS bottles CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS players CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS games CASCADE`);

    // Create tables using Drizzle's schema
    console.log('Creating tables...');
    
    // Create games table
    await db.execute(sql`
      CREATE TABLE games (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'setup',
        current_round INTEGER NOT NULL DEFAULT 0,
        host_token TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        host_name TEXT,
        host_email TEXT,
        max_players INTEGER,
        total_bottles INTEGER,
        total_rounds INTEGER,
        bottles_per_round INTEGER,
        bottle_eq_per_person NUMERIC,
        oz_per_person_per_bottle NUMERIC,
        wines_locked BOOLEAN DEFAULT false,
        rounds_locked BOOLEAN DEFAULT false
      )
    `);

    // Create players table
    await db.execute(sql`
      CREATE TABLE players (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        display_name TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        is_host BOOLEAN NOT NULL DEFAULT false,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create bottles table
    await db.execute(sql`
      CREATE TABLE bottles (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        label_name TEXT NOT NULL,
        fun_name TEXT,
        price INTEGER NOT NULL,
        round_index INTEGER,
        order_index INTEGER NOT NULL
      )
    `);

    // Create rounds table
    await db.execute(sql`
      CREATE TABLE rounds (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        index INTEGER NOT NULL,
        bottle_ids JSONB NOT NULL,
        revealed BOOLEAN NOT NULL DEFAULT false
      )
    `);

    // Create submissions table
    await db.execute(sql`
      CREATE TABLE submissions (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        round_index INTEGER NOT NULL,
        tasting_notes JSONB NOT NULL,
        ranking JSONB NOT NULL,
        locked BOOLEAN NOT NULL DEFAULT false,
        points INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create gambit_submissions table
    await db.execute(sql`
      CREATE TABLE gambit_submissions (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        most_expensive TEXT NOT NULL,
        least_expensive TEXT NOT NULL,
        favorite TEXT NOT NULL,
        points INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrate();
