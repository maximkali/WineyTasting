// Moving all DB-related code here
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

export const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'winetasting_user',
  database: 'winetasting'
});

export const db = drizzle(pool, { schema });
