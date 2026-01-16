# Monorepo Setup Guide

This guide explains how to recreate this monorepo structure from scratch using Bun.

Before starting, make sure you have the name of the project. Otherwise, assume it is the name of the current folder.

## 1. Root Initialization

Initialize the root project directory and package.json:

```bash
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

Run these:
```bash
bun add drizzle-orm
bun add -d drizzle-kit postgres
mkdir src
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
bun add -D @sveltejs/adapter-node
```
Add these to the dependencies in `packages/web/package.json`:
```json
"@[PROJECT_NAME]/shared": "workspace:*",
"@[PROJECT_NAME]/db": "workspace:*"
```

Switch from @sveltejs/adapter-auto to @sveltejs/adapter-node in the svelte.config.js

Add the kit.experimental.remoteFunctions and compilerOptions.experimental.async  option in your svelte.config.js

In `packages/web/src/lib/server/remote/demo.remote.ts` add
```ts
import { query } from '$app/server';
import { takeFirstOrNull } from "@[PROJECT_NAME]/shared/utils/queries";
import { db, userTable } from "@[PROJECT_NAME]/db";

export const getUser = query(async () => {
    const user = await db.select().from(userTable).limit(1).then(takeFirstOrNull);

    return user;
});
```

add this to the +page.svelte:
```svelte
<script lang="ts">
const user = $derived(await getUser());
</script>

<p>
  The lastest user got created at {user.createdAt} and was {user.email}
</p>
```

## 6. Setup Docker
Create docker-compose.yaml
```YAML
services:
  db:
    image: pgvector/pgvector:pg17
    environment:
      POSTGRES_PASSWORD: your_secure_password
      POSTGRES_USER: devuser
      POSTGRES_DB: app_dev
    ports: ["5433:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck: {test: [CMD-SHELL, pg_isready -U devuser -d app_dev], interval: 5s, timeout: 5s, retries: 5}

  migrator:
    build: { context: ., dockerfile: packages/db/Dockerfile }
    environment:
      DATABASE_URL: &url postgres://devuser:your_secure_password@db:5432/app_dev
    depends_on:
      db: { condition: service_healthy }

  web:
    build: { context: ., dockerfile: packages/web/Dockerfile }
    ports: ["3000:3000"]
    environment: 
      DATABASE_URL: *url
      ORIGIN: http://localhost:3000
    depends_on: &deps
      migrator: { condition: service_completed_successfully }
      db: { condition: service_healthy }

  worker:
    build: { context: ., dockerfile: packages/worker/Dockerfile }
    environment: { DATABASE_URL: *url }
    depends_on: *deps

volumes:
  pgdata:
```

Create each of the docker files referenced in the docker compose file.

## 7. Final Configuration

Create a `.env.example` file in the root directory:

```env
DATABASE_URL="postgres://devuser:your_secure_password@db:5432/app_dev"
```

Install all dependencies from the root to link workspaces:

```bash
cd ../..
bun install
```

