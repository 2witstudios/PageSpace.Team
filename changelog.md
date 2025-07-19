# Changelog

## 2025-07-19 14:52

**Change Type:** REFACTOR
**Component:** Frontend
**Description:** Removed all Tiptap-related dependencies, migration utilities, and legacy support code.
**Files Modified:**
- `packages/lib/package.json`
- `apps/web/package.json`
- `packages/lib/src/content-migration.ts` (deleted)
- `packages/lib/src/content-validation.ts` (deleted)
- `packages/lib/src/page-content-parser.ts`
- `apps/web/src/lib/mention-context.ts`
- `apps/web/src/components/layout/middle-content/page-views/document/DocumentView.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/api/ai/ai-assistant/messages/route.ts`
- `apps/web/src/app/api/ai/ai-page/messages/[pageId]/route.ts`
- `apps/web/src/app/api/pages/[pageId]/route.ts`
- `packages/lib/src/index.ts`
- `README.md`
- `docs/3.0-guides-and-tools/system-prompts.md`
- `docs/2.0-architecture/2.1-frontend/components.md`
- `docs/2.0-architecture/2.6-features/ai/ai-mentions.md`
- `docs/3.0-guides-and-tools/naming-conventions.md`
- `tiptap-replacement-plan.md` (deleted)
**Breaking Changes:** No, this change removes legacy code and does not introduce any breaking changes.
## 2025-07-19 14:17

**Change Type:** REFACTOR
**Component:** Frontend
**Description:** Replaced the Tiptap editor with the custom Richline editor. This included replacing the data flow from Tiptap to Richline for saves and creating a new suggestion/mention system based on Richline. The NOTE page has been renamed to the Document page.
**Files Modified:**
- `apps/web/src/components/layout/middle-content/page-views/document/Editor.tsx` (deleted)
- `apps/web/src/components/layout/middle-content/page-views/document/Toolbar.tsx` (deleted)
- `apps/web/src/components/layout/middle-content/page-views/note/NoteView.tsx` (renamed to `DocumentView.tsx`)
- `apps/web/src/components/layout/middle-content/index.tsx`
- `packages/richline-editor/src/RichlineEditor.tsx`
- `apps/web/src/components/mentions/RichlineMentionAdapter.ts` (created)
- `apps/web/src/hooks/useSuggestion.ts`
- `apps/web/src/components/mentions/SuggestionPopup.tsx`
- `apps/web/src/lib/mention-system.ts`
- `apps/web/package.json`
- `apps/web/src/components/tiptap` (deleted)
- `apps/web/src/components/rich-text/Tiptap*` (deleted)
- `apps/web/src/components/messages/TiptapChatInput.tsx` (deleted)
- `apps/web/src/components/mentions/TiptapMentionAdapter.ts` (deleted)
- `apps/web/src/components/mentions/MentionSuggestionPlugin.ts` (deleted)
- `apps/web/src/components/mentions/MentionComponent.tsx` (deleted)
- `apps/web/src/components/mentions/Mention.ts` (deleted)
- `apps/web/src/components/layout/right-sidebar/ai-assistant/AssistantChat.tsx`
- `apps/web/src/components/layout/middle-content/page-views/ai-page/ChannelView.tsx`
- `apps/web/src/app/api/pages/[pageId]/route.ts`
- `docs/2.0-architecture/2.3-shared/lib-package.md`
- `docs/3.0-guides-and-tools/coding-standards.md`
- `docs/1.0-overview/1.1-table-of-contents.md`
- `docs/2.0-architecture/2.1-frontend/components.md`
- `docs/2.0-architecture/2.5-integrations/tiptap.md` (deleted)
**Breaking Changes:** Yes, the editor has been replaced and the data format has changed from JSON to a line-based format.