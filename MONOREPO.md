# Monorepo Setup Guide

This guide explains how to recreate this monorepo structure from scratch using Bun.

Before starting, make sure you have the name of the project. Otherwise, assume it is the name of the current folder.

## 1. Root Initialization

Initialize the root project directory and package.json:

```bash
bun init -y
rm index.ts # Cleanup default file
mkdir packages
```

Edit `package.json` to define the workspaces and set as private:

```json
{
  "name": "[PROJECT_NAME]",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "devDependencies": {
    "@types/bun": "latest"
  }
}
```

## 2. Shared Package Setup

Set up the `@[PROJECT_NAME]/shared` package which contains shared code and constants.

```bash
mkdir -p packages/shared
cd packages/shared
bun init -y
rm index.ts # Cleanup default file
mkdir src
```

Update `packages/shared/package.json` to set the correct name:

```json
{
  "name": "@[PROJECT_NAME]/shared",
  "version": "0.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    "./*": "./src/*.ts"
  },
  "private": true
}
```

Create `packages/shared/src/utils/queries.ts`:

```typescript
export function takeFirstOrNull<T>(array: T[]): T | null {
    return array.length >= 1 ? array[0] : null
}
```

Create `packages/shared/src/index.ts`:

```typescript
export * from './utils/queries';
```

## 3. Database Package Setup

Set up the `@[PROJECT_NAME]/db` package for database schema and migrations.

```bash
cd ../.. # Return to root
mkdir -p packages/db
cd packages/db
bun init -y
bun add drizzle-orm
bun add -d drizzle-kit postgres
rm index.ts
mkdir src
```

Update `packages/db/package.json` to set the name and scripts:

```json
{
  "name": "@[PROJECT_NAME]/db",
  "version": "0.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "generate": "bun --env-file=../../.env drizzle-kit generate",
    "migrate": "bun --env-file=../../.env drizzle-kit migrate",
    "migrate:prod": "bun src/migrate.ts",
    "push": "bun --env-file=../../.env drizzle-kit push"
  }
}
```

Create `packages/db/drizzle.config.ts`:

```typescript
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
```

Create `packages/db/src/schema.ts`:

```typescript
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const userTable = pgTable("userTable", {
    id: serial().primaryKey(),
    email: text().notNull(),
    createdAt: timestamp().defaultNow()
});
```

Create `packages/db/src/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/bun-sql';
import { SQL } from 'bun';
import * as schema from './schema';

const client = new SQL(process.env.DATABASE_URL!);

export const db = drizzle(client, { schema });

export * from './schema';
```

Create `packages/db/src/migrate.ts`:

```typescript
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { drizzle } from "drizzle-orm/bun-sql";
import { join } from "node:path";

const db = drizzle(process.env.DATABASE_URL!);
try {
    await migrate(db, { migrationsFolder: join(import.meta.dir, "../drizzle") });
    console.info("Migrations succeeded")
} catch (error) {
    console.error("Migrations failed", error);
    process.exit(1);
}
```

## 4. Worker Package Setup

Set up the `worker` service consuming both shared and db packages.

```bash
cd ../.. # Return to root
mkdir -p packages/worker
cd packages/worker
bun init -y
rm index.ts
mkdir src
```

Update `packages/worker/package.json` scripts:

```json
{
  "name": "worker",
  "scripts": {
    "dev": "bun --env-file=../../.env src/index.ts",
    "start": "bun src/index.ts"
  },
  "dependencies": {
    "@[PROJECT_NAME]/shared": "workspace:*",
    "@[PROJECT_NAME]/db": "workspace:*"
  }
}
```

Create `packages/worker/src/index.ts`:

```typescript
import { db, userTable } from "@[PROJECT_NAME]/db";

const result = await db.insert(userTable).values({ email: "test@test.dk" }).returning()

console.log("Inserted user result", result);
```
## 5. Setup SvelteKit web

```bash
cd ../.. # Return to root
mkdir -p packages/web
cd packages/web
bunx sv create . --template="minimal" --types="ts" --no-install --no-dir-check --add tailwind="plugins:typography"
```
Add these to the dependencies in `packages/web/package.json`:
```json
"@[PROJECT_NAME]/shared": "workspace:*",
"@[PROJECT_NAME]/db": "workspace:*"`svelte.config.js`.

In `packages/web/src/lib/server/remote/demo.remote.ts`,emoteFunctions and the compilerOptions.experimental.async option in your svelte.config.js.

in lib/server/remote/demo.remote.ts add 
```ts
import { query } from '$app/server';
import { takeFirstOrNull } from "@[PROJECT_NAME]/shared/utils/queries";
import { db, userTable } from "@[PROJECT_NAME]/db";

export const getUser = query(async () => {
    const user = await db.select().from(userTable).limit(1).then(takeFirstOrNull);

    return user;
});


```

## 6. Final Configuration

Create a `.env.example` file in the root directory:

```env
DATABASE_URL=
```

Install all dependencies from the root to link workspaces:

```bash
cd ../..
bun install
```

