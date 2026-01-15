import { defineConfig } from 'drizzle-kit';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw "Please setup DATABASE_URL environment variable"

export default defineConfig({
	schema: './src/schema.ts',
	dialect: 'postgresql',
	dbCredentials: {
		url: connectionString
	},
});
