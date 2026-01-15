import { migrate } from "drizzle-orm/bun-sql/migrator";
import { drizzle } from "drizzle-orm/bun-sql";

const db = drizzle(process.env.DATABASE_URL!);
try {
    await migrate(db, { migrationsFolder: "../drizzle" });
    console.info("Migrations succeeded")
} catch (error) {
    console.error("Migrations failed", error)
}