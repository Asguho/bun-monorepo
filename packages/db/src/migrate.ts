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