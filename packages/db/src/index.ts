import { drizzle } from 'drizzle-orm/bun-sql';
import { SQL } from 'bun';
import * as schema from './schema';
import { building } from '$app/environment';

const connectionString = process.env.DATABASE_URL;
if (!connectionString && !building) throw "Please setup DATABASE_URL environment variable"

const client = new SQL(process.env.DATABASE_URL!);

export const db = drizzle(client, { schema });

export * from './schema';