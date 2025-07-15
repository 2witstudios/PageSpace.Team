# @pagespace/db - Database Layer

This package centralizes all database-related concerns for the pagespace application.

```typescript
// Centralized database concerns
export { db } from './src/index.ts';           // Drizzle client
export * from './src/schema';                  // All table schemas
export { migrate } from './src/migrate.ts';    // Migration runner
```

### Responsibilities:
- PostgreSQL connection & client configuration
- Drizzle ORM schema definitions (core, auth, chat, permissions)
- Database migrations and schema versioning
- Type-safe query builders and relations

### Key Files:
- `src/schema/` - Modular schema organization by domain
- `src/migrate.ts` - Database migration runner
- `drizzle.config.ts` - Drizzle Kit configuration