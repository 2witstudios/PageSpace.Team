import { pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { users } from './auth';

export const userAiSettings = pgTable('user_ai_settings', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // 'openai', 'anthropic', 'google', 'ollama'
  encryptedApiKey: text('encryptedApiKey'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => {
  return {
    userProviderUnique: unique('user_provider_unique').on(table.userId, table.provider),
  }
});

export const userAiSettingsRelations = relations(userAiSettings, ({ one }) => ({
  user: one(users, {
    fields: [userAiSettings.userId],
    references: [users.id],
  }),
}));