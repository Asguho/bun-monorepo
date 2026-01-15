import { drizzle } from 'drizzle-orm/bun-sql';
import { SQL } from 'bun';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw "Please setup DATABASE_URL environment variable"

const client = new SQL(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });

export * from './schema';
