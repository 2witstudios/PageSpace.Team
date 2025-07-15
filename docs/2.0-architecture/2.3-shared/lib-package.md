# @pagespace/lib - Shared Utilities

This package contains cross-application business logic and shared utilities.

```typescript
// Cross-application business logic
export * from './src/types';           // Common TypeScript types
export * from './src/auth-utils';      // JWT & authentication helpers  
export * from './src/permissions';     // Permission checking logic
export * from './src/tree-utils';      // Page hierarchy utilities
export * from './src/utils';           // General-purpose helpers
```

### Responsibilities:
- Shared TypeScript types and interfaces
- Authentication and JWT utilities
- Permission checking and access control logic
- Page tree manipulation and hierarchy utilities
- General-purpose utility functions

### Dependency Philosophy:
- Minimal external dependencies (jose for JWT, @tiptap/core for types)
- No framework-specific code (works in both Next.js and Socket.IO contexts)
- Pure TypeScript/JavaScript utilities