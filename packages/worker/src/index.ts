import { GREETING } from "@auro/shared";
import { db, userTable } from "@auro/db";

console.log("Worker says:", GREETING);

await db.insert(userTable).values({ email: "test@test.dk" })

const users = await db.select().from(userTable);
console.log("users", users);
