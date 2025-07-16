import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './auth';

export const aiAuditLog = pgTable('ai_audit_log', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  timestamp: timestamp('timestamp').defaultNow(),
  action: text('action').notNull(), // e.g., 'rewrite-accepted', 'rewrite-rejected'
  details: jsonb('details'), // e.g., { rewriteId, originalText, suggestedText }
});