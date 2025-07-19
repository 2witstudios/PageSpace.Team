# System Prompt

## System Summary

PageSpace is a local-first, AI-powered knowledge base for document-centric teams. Built on Next.js 15 (App Router), TypeScript, and Tailwind with shadcn/ui. AI capabilities run via local Ollama models using the Vercel AI SDK. PostgreSQL with Drizzle ORM and pgvector power structured and semantic search. The entire stack runs locally in Docker.

---

## Architecture Overview

### Frontend
- **Framework:** Next.js 15 App Router
- **UI:** Tailwind + shadcn/ui
- **Editor:** Richline Editor
- **Layout:** Three-column (Nav / Content / AI Assistant)

### Backend (API Routes)
- **Location:** `apps/web/src/app/api/`
- **Pattern:** All handlers must be `async` and return `Response`
- **AI Routes:** Integrate with Ollama through Vercel AI SDK
- **Auth:** Custom user/session management
- **Real-time:** Socket.io server in `apps/realtime`

### Database
- **Primary:** PostgreSQL
- **ORM:** Drizzle
- **Search:** pgvector for embeddings
- **File Storage:** Files on disk, metadata in database

### Monorepo
- **Manager:** pnpm
- **Workspace:** `apps/`, `packages/`, `docs/`

---

## Key Code Locations
- **API Endpoints:** `apps/web/src/app/api/`
- **AI Page:** `components/layout/middle-content/page-views/ai-page/`
- **Message Rendering:** `components/messages/MessagePartRenderer.tsx`
- **Richline Editor:** `packages/richline-editor/`
- **DB Schema:** `packages/db/src/schema.ts`
- **Shared Types:** `packages/lib/src/types/`

---

## Critical Rules

### Next.js 15 Dynamic Params
- Dynamic route params are `Promise`s:
  ```typescript
  export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
  ) {
    const { id } = await context.params;
    return Response.json({ id });
  }
  ```
- **Wrong:** `{ params: { id: string } }`
- **Correct:** `{ params: Promise<{ id: string }> }` → must `await`

### TypeScript Rules
- **NO `any`** — always use explicit types
- Use specific interfaces (e.g., `LanguageModelV1`) over `unknown`
- Avoid temporary hacks; aim for right-first architecture

### Planning Philosophy
1. Define ideal end state
2. Work backwards from there
3. Phase only if it improves quality or lowers risk
4. Never compromise quality for speed

---

## Features Summary
- **Universal Content:** Nestable docs (PDF, Word, emails, chats, etc.)
- **Smart Tags:** Contextual labels (client, project, date, etc.)
- **Dynamic Folders:** Auto-grouping based on tags
- **Contextual AI Chat:** Chat across docs with inherited context
- **Institutional Memory:** Templates, precedent mining, SOP reuse

---

## Task Context

Use this file to:
- Answer questions about system architecture
- Suggest proper API handler structure
- Recommend accurate types or functions
- Trace how AI, pages, and messages flow through the app
- Locate files for context, refactor, or bugfixing

---

## Deployment Notes
- All systems must run locally (Docker-based)
- No cloud dependencies allowed in core logic
- Air-gapped capability supported
- Role-based permissions with audit trails