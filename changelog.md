## 2025-07-16 13:27

**Change Type:** [BUGFIX]
**Component:** [Frontend]
**Description:** Fixed a compilation error in the AI editor caused by an unused `useEffect` import.
**Files Modified:**
- `apps/web/src/components/ai-editor/MarkdownLineEditor.tsx`
**Breaking Changes:** No

## 2025-07-16 13:23

**Change Type:** [BUGFIX]
**Component:** [Frontend]
**Description:** Fixed an issue where the editor would lose focus after every keystroke. Implemented a debounced update mechanism to prevent re-renders during continuous typing.
**Files Modified:**
- `apps/web/src/components/ai-editor/MarkdownLineEditor.tsx`
- `apps/web/src/components/ai-editor/store.ts`
- `apps/web/src/components/ai-editor/types.ts`
**Breaking Changes:** No

## 2025-07-16 12:00

**Change Type:** [BUGFIX]
**Component:** [Frontend]
**Description:** Fixed several compilation errors in the AI editor components caused by unused variables and incorrect function usage after recent refactoring.
**Files Modified:**
- `apps/web/src/components/ai-editor/EditorCanvas.tsx`
- `apps/web/src/components/ai-editor/MarkdownLineEditor.tsx`
**Breaking Changes:** No

## 2025-07-16 11:58

**Change Type:** [REFACTOR]
**Component:** [Frontend]
**Description:** Refactored the AI-native text editor to provide a more fluid and intuitive user experience. Replaced the dual-mode editing system with a single `contentEditable` component and implemented automatic line wrapping.
**Files Modified:**
- `apps/web/src/components/ai-editor/MarkdownLineEditor.tsx`
- `apps/web/src/components/ai-editor/store.ts`
- `apps/web/src/components/ai-editor/types.ts`
**Breaking Changes:** No

## 2025-07-16 11:42

**Change Type:** [REFACTOR]
**Component:** [Frontend]
**Description:** Refactored the AI-native text editor to provide a more fluid and intuitive user experience. Replaced the dual-mode editing system with a single `contentEditable` component and implemented automatic line wrapping.
**Files Modified:**
- `apps/web/src/components/ai-editor/MarkdownLineEditor.tsx`
- `apps/web/src/components/ai-editor/store.ts`
- `apps/web/src/components/ai-editor/types.ts`
**Breaking Changes:** No

## 2025-07-16 11:20

**Change Type:** [BUGFIX]
**Component:** [Frontend]
**Description:** Fixed several compilation errors in the AI editor components caused by unused variables and incorrect function usage after recent refactoring.
**Files Modified:**
- `apps/web/src/components/ai-editor/EditorCanvas.tsx`
- `apps/web/src/components/ai-editor/MarkdownLineEditor.tsx`
- `apps/web/src/components/ai-editor/store.ts`
- `apps/web/src/lib/markdown-conversion.ts`
**Breaking Changes:** No

## 2025-07-16 10:17

**Change Type:** [DOCS]
**Component:** [AI]
**Description:** Updated the AI-native rich text editor documentation to clarify that the AI operates on semantic content, not fixed line counts. The editor is now responsible for all line wrapping and layout, allowing the AI to generate more fluid and natural text.
**Files Modified:**
- `docs/4.0-future-plans/ai-native-rich-text-editor.md`
**Breaking Changes:** No

## 2025-07-16 00:07

**Change Type:** [FEATURE]
**Component:** [Frontend]
**Description:** Added a new `NOTE` page type to render the AI-native rich text editor. This allows for testing the new editor without replacing the existing Tiptap implementation for `DOCUMENT` pages.
**Files Modified:**
- `packages/db/src/schema/core.ts`
- `packages/lib/src/enums.ts`
- `apps/web/src/components/layout/middle-content/page-views/note/NoteView.tsx`
- `apps/web/src/components/layout/middle-content/index.tsx`
- `docs/3.0-guides-and-tools/adding-page-type.md`
**Breaking Changes:** No

## 2025-07-15 23:41

**Change Type:** [FEATURE]
**Component:** [Frontend]
**Description:** Implemented line merging functionality. Users can now merge a line with the one above it by pressing Backspace at the beginning of the line. This preserves the line ID lineage for tracking.
**Files Modified:**
- `apps/web/src/components/ai-editor/store.ts`
- `apps/web/src/components/ai-editor/LineEditor.tsx`
- `apps/web/src/components/ai-editor/EditorCanvas.tsx`
**Breaking Changes:** No

## 2025-07-15 23:40

**Change Type:** [FEATURE]
**Component:** [Frontend]
**Description:** Improved the mobile editing experience by adjusting font sizes, line heights, and margins for smaller screens.
**Files Modified:**
- `apps/web/src/hooks/use-mobile.ts`
- `apps/web/src/components/ai-editor/EditorCanvas.tsx`
**Breaking Changes:** No

## 2025-07-15 23:40

**Change Type:** [FEATURE]
**Component:** [Frontend]
**Description:** Implemented document export to Plaintext, Markdown, and DOCX formats. Added an "Export" dropdown to the editor toolbar.
**Files Modified:**
- `apps/web/src/components/ai-editor/store.ts`
- `apps/web/src/components/ai-editor/EditorCanvas.tsx`
- `apps/web/src/lib/export-utils.ts`
- `apps/web/package.json`
**Breaking Changes:** No

## 2025-07-15 23:34

**Change Type:** [FEATURE]
**Component:** [Frontend]
**Description:** Added export functionality for plaintext and Markdown formats. An "Export" dropdown menu is now available in the editor toolbar.
**Files Modified:**
- `apps/web/src/components/ai-editor/store.ts`
- `apps/web/src/components/ai-editor/EditorCanvas.tsx`
**Breaking Changes:** No

## 2025-07-15 23:34

**Change Type:** [FEATURE]
**Component:** [Frontend]
**Description:** Added functionality to copy selected text to the clipboard, preserving line breaks and Markdown formatting. A "Copy" button now appears in the toolbar when text is selected.
**Files Modified:**
- `apps/web/src/components/ai-editor/store.ts`
- `apps/web/src/components/ai-editor/RewriteToolbar.tsx`
**Breaking Changes:** No

## 2025-07-15 23:33

**Change Type:** [FEATURE]
**Component:** [Frontend]
**Description:** Implemented in-document search functionality for the AI-native text editor. This includes a search toolbar, state management for search queries and results, highlighting of search terms within the editor, and keyboard navigation between results.
**Files Modified:** 
- `apps/web/src/components/ai-editor/types.ts`
- `apps/web/src/components/ai-editor/store.ts`
- `apps/web/src/components/ai-editor/SearchToolbar.tsx`
- `apps/web/src/components/ai-editor/EditorCanvas.tsx`
- `apps/web/src/components/ai-editor/LineEditor.tsx`
**Breaking Changes:** No

## 2025-07-15 23:20

**Change Type:** FEATURE
**Component:** Frontend
**Description:** Implemented Phase 3 of the AI-Native Rich Text Editor, adding Markdown-lite parsing for bold and italic formatting, a mention system with autocomplete, and tiered search with debouncing.
**Files Modified:**
- `apps/web/src/components/ai-editor/types.ts`
- `apps/web/src/lib/markdown-parser.ts`
- `apps/web/src/components/ai-editor/LineEditor.tsx`
- `apps/web/src/components/ai-editor/MentionAutocomplete.tsx`
- `apps/web/src/app/api/mentions/search/route.ts`
- `docs/2.0-architecture/2.4-api/pages-mentions.md`
- `docs/3.0-guides-and-tools/markdown-parser.md`
**Breaking Changes:** No

## 2025-07-15 21:54

**Change Type:** DOCS
**Component:** Frontend
**Description:** Updated `ai-native-rich-text-editor.md` with complete technical decisions for the AI-Native Text Editor, including details on state management, document layout, line ID management, virtualization, mention autocomplete, plugin architecture, metadata storage, AI error handling, performance benchmarks, concurrency and conflict resolution, cross-line formatting, offline strategy, testing strategy, document rendering architecture, print compatibility, and AI integration with document context.
**Files Modified:**
- docs/4.0-future-plans/ai-native-rich-text-editor.md
**Breaking Changes:** No

## 2025-07-15 21:30

**Change Type:** DOCS
**Component:** Frontend
**Description:** Updated `ai-native-rich-text-editor.md` to reflect the replacement of Tiptap with a new custom AI-native text editor. Detailed the architectural shift, system design, and future plans for the editor.
**Files Modified:**
- docs/4.0-future-plans/ai-native-rich-text-editor.md
**Breaking Changes:** No