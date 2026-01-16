import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const userTable = pgTable("userTable", {
    id: serial().primaryKey(),
    email: text().notNull(),
    createdAt: timestamp().defaultNow()
});