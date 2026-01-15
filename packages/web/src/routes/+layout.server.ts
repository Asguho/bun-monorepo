import type { LayoutServerLoad } from './$types';
import { GREETING } from "@auro/shared";
import { db, userTable } from "@auro/db";

export const load = (async () => {
    console.log("Worker says:", GREETING);

    await db.insert(userTable).values({ email: "test@test.dk" })

    const users = await db.select().from(userTable);
    return { users };
}) satisfies LayoutServerLoad;