import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

// Local database connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'winetasting_user',
  password: '', // No password for local development
  database: 'winetasting',
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Successfully connected to database for consol-wine-game');
  release();
});

export const db = drizzle(pool, { schema });