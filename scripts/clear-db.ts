import { db } from '../server/db';
import {
  games,
  bottles,
  players,
  rounds,
  submissions,
  gambitSubmissions
} from '../shared/schema';

async function clearDatabase() {
  try {
    console.log('Starting database cleanup...');
    
    // Delete in proper order to respect foreign key constraints
    await db.delete(gambitSubmissions).execute();
    await db.delete(submissions).execute();
    await db.delete(rounds).execute();
    await db.delete(players).execute();
    await db.delete(bottles).execute();
    await db.delete(games).execute();
    
    console.log('Database cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

clearDatabase();
