import { pgTable, serial, text, boolean } from 'drizzle-orm/pg-core';

export const userTable = pgTable('users', {
    id: serial('id').primaryKey(),
    email: text('email').notNull(),
    isActive: boolean('is_active').default(true),
});