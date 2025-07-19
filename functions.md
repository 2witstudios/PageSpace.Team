# Functions

## RichlineMentionAdapter

### constructor(editorRef: React.RefObject<RichlineEditorRef>, allowedTypes?: MentionType[])

**Purpose:** Creates a new instance of the RichlineMentionAdapter.
**Location:** apps/web/src/components/mentions/RichlineMentionAdapter.ts
**Dependencies:** RichlineEditorRef, MentionType
**Last Updated:** 2025-07-19

### onKeyDown(event: React.KeyboardEvent<HTMLDivElement>)

**Purpose:** Handles the keydown event and triggers the mention system when the '@' key is pressed.
**Location:** apps/web/src/components/mentions/RichlineMentionAdapter.ts
**Dependencies:** mentionSystem
**Last Updated:** 2025-07-19

### insert(suggestion: MentionSuggestion)

**Purpose:** Inserts the selected mention into the RichlineEditor.
**Location:** apps/web/src/components/mentions/RichlineMentionAdapter.ts
**Dependencies:** useSuggestionStore
**Last Updated:** 2025-07-19