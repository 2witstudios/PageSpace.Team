**Product Requirements Document (PRD): PageSpace AI-Native Text Editor**

---

**Title:** PageSpace AI-Native Text Editor
**Owner:** [You]
**Stakeholders:** Engineering, Product, AI Team, Design
**Last Updated:** 2025-07-16

---

### **1. Overview**

The PageSpace AI-Native Text Editor is a user-centric, fluid text editor designed for a seamless writing experience, with powerful AI collaboration features built on a robust, line-addressable foundation. It serves as the primary writing and thinking surface in PageSpace, prioritizing a natural, intuitive user experience while enabling deterministic, versionable, and human-in-the-loop AI workflows. This new editor replaces the previous Tiptap-based implementation to better align with our user-first, AI-assisted document model.

**Key Innovation: Markdown-Based Dual Interface**
The editor implements a dual-representation architecture where:
- **AI Interface**: Markdown text for semantic manipulation (`**bold**`, `*italic*`, `@user:123`, `[[page:456]]`)
- **Human Interface**: Rich visual formatting with professional editing experience
- **Storage**: Line-based with both markdown source and parsed formatting metadata
- **AI Control**: AI agents can format specific words/sections by returning markdown syntax

This architecture enables AI to provide precise formatting control while users experience a fully rich document editor that scales to compete with professional tools like Google Docs.

PageSpace is deployed both as a local Docker environment and as a cloud-hosted platform. The architecture and document structure are consistent across both environments.

---

### **2. Goals & Success Criteria**

**Primary Goals:**

*   Enable precise, AI-powered rewriting of individual lines or line ranges
*   Enable AI-controlled formatting of specific words/sections within lines
*   Provide a fluid, intuitive, and rich document editing experience that scales to compete with professional tools.
*   Preserve visual and structural consistency between what users and agents see
*   Ensure copy-paste/export compatibility with tools like Google Docs
*   Support mentionable, block-aware, agent-invocable content architecture
*   Store content in semantic markdown format for AI manipulation

**Success Metrics:**

*   100% line-addressable content structure with markdown semantic storage
*   <200ms rendering time for up to 1,000 lines (with virtualization)
*   AI-driven rewrite accuracy >90% acceptance on first pass (post-review)
*   AI-driven formatting accuracy >95% for word-level formatting operations
*   <10% discrepancy rate between agent-visible lines and user-visible lines
*   Fluid and intuitive rich text editing experience comparable to Google Docs/Notion for user satisfaction.

---

### **3. Scope**

#### In Scope:

*   **Dual-Interface Architecture**: Markdown for AI, rich formatting for humans
*   **Fluid document model** with automatic word wrapping and a configurable maximum width (default 120-140 characters) to ensure a natural writing experience.
*   **Visual line numbers** and agent-visible line references
*   **AI rewrite capabilities** via tagged replacements (`<replace start_line= end_line=>`)
*   **AI word-level formatting** via markdown syntax (`**bold**`, `*italic*`, etc.)
*   **Rich text editing experience** with professional-grade features
*   **Inline mentions** using stable ID formats (`@user:123`, `[[page:456]]`) with internal ID storage
*   **Markdown-based storage** for semantic AI manipulation
*   **Copy/paste compatibility** with Markdown/plaintext/rich text
*   **Merge layer** for human review and application of agent-generated artifacts
*   **Undo/redo functionality** across human and AI operations
*   **Search within documents** with highlighting
*   **Basic accessibility features**

#### Out of Scope (v1):

*   WYSIWYG rich-text formatting (fonts, colors, etc.) beyond Markdown-lite
*   Real-time collaborative cursors or comments
*   Embedded images/media (to be rendered as placeholders or links)

---

### **4. Architecture & Model**

**Core Architectural Shift (Why we're replacing Tiptap):**
Tiptap is built on ProseMirror, which is ideal for rich WYSIWYG interfaces but overly complex, DOM-bound, and not structured in a way that aligns with how LLMs think or how we want agents to interact with the editor.

Instead, we’re replacing it with a line-addressable, structured text model, more like VS Code or Roo Code — where:
*   Each line is a discrete, addressable unit in a flat array
*   The editor provides a fluid, continuous writing experience with automatic word wrapping, while the underlying model remains line-addressable for AI operations.
*   Edits can be made by AI agents that operate on specific line ranges
*   All AI edits are mergeable, previewable, and traceable (like Git diffs)

**Summary of What We're Building:**
A fully React-based, markdown-driven, hard-wrapped, AI-editable rich text editor that supports mentionable content, deterministic structure, and AI integration at both the line range and word-level formatting. Users experience professional rich text editing while AI agents work with semantic markdown.

### **3.1 Technical Architecture: Markdown-Based Dual Interface**

**Core Concept:** The editor maintains two representations of the same content:
1. **Markdown Source** (AI Interface): `"Hello **world** @user:123 this is *italic*"`
2. **Rich Display** (Human Interface): Rich formatted text with styled elements

**Data Flow:**
```
AI Agent → Markdown Text → Parser → Marks → Rich Display → User
User Input → Rich Changes → Markdown Conversion → Storage → AI Agent
```

**Line Data Structure:**
```typescript
interface Line {
  id: string;
  markdownText: string;    // "Hello **world** @user:123"
  displayText: string;     // "Hello world @John Doe"
  marks: Mark[];           // [{type: 'bold', start: 6, end: 11}, ...]
  pageNumber: number;
  lineOnPage: number;
  createdAt: Date;
  createdBy: 'human' | 'ai' | string;
  metadata?: Record<string, any>;
}
```

**AI Formatting Workflow:**
1. AI receives line markdown: `"Hello world"`
2. AI returns formatted: `"Hello **bold world**"`
3. System parses markdown to marks
4. User sees rich formatting applied seamlessly

**Benefits:**
- AI can format any word/section via standard markdown
- Users get rich editing experience
- Storage is semantic and human-readable
- Debugging is straightforward with visible markdown

**System Design Breakdown:**

#### 4.1 State Management Choice
Decision: Zustand with Immer middleware for markdown-based dual interface
```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface EditorState {
  lines: Line[]  // Now includes markdownText + displayText + marks
  cursor: { lineIndex: number, charIndex: number }
  selection: { start: LinePosition, end: LinePosition } | null
  aiQueue: AIRewrite[]
  viewState: ViewState
  document: DocumentTemplate
  searchState: SearchState
}

interface Line {
  id: string;
  markdownText: string;    // Source for AI: "Hello **world** @user:123"
  displayText: string;     // Display for humans: "Hello world @John Doe"
  marks: Mark[];           // Parsed formatting metadata
  pageNumber: number;
  lineOnPage: number;
  createdAt: Date;
  createdBy: 'human' | 'ai' | string;
  metadata?: Record<string, any>;
}

interface Mark {
  type: MarkType;          // 'bold' | 'italic' | 'mention'
  start: number;           // Position in displayText
  end: number;
  value?: string;          // For mentions: stable ID
  displayName?: string;    // For mentions: resolved display name
  metadata?: {
    mentionType?: 'user' | 'page';
    mentionId?: string;
    isStableId?: boolean;
  };
}
```

#### 4.2 Document Layout Strategy
Decision: Fixed document dimensions with user-controlled zoom (Google Docs style)
```ts
interface DocumentTemplate {
  name: string
  pageWidth: number     // in inches
  pageHeight: number    // in inches
  margins: { top: number, right: number, bottom: number, left: number }
  fontFamily: string
  fontSize: number      // in points
  lineHeight: number
  charsPerLine: number  // calculated from above
  linesPerPage: number  // calculated from above
}

const TEMPLATES = {
  LEGAL_US: {
    name: "US Legal",
    pageWidth: 8.5,
    pageHeight: 11,
    margins: { top: 1, right: 1, bottom: 1, left: 1.5 },
    fontFamily: "Times New Roman",
    fontSize: 12,
    lineHeight: 1.5,
    charsPerLine: 80,
    linesPerPage: 54
  }
}

interface ViewState {
  zoomLevel: number     // 0.5, 0.75, 1.0, 1.25, 1.5, 2.0
  template: DocumentTemplate
  showPageBreaks: boolean
  showMargins: boolean
}
```

#### 4.3 Line ID Management & Lineage
Decision: UUID chaining with parent references
The `Line.id` (UUID) serves as a stable, unique identifier for a specific line *instance* at a given point in time. This means:

*   **Line Splits:** When a user hits Enter mid-line, the original line is logically replaced by two new lines. Each of these new lines will be assigned a fresh, unique UUID. The original line's UUID will no longer be active in the document's current state.
*   **AI Rewrites:** When an AI agent rewrites a range of lines, the original lines within that range are replaced by new lines. Each new line generated by the AI will receive a new, unique UUID. This ensures that AI-generated content is clearly identifiable as new instances.
*   **Mention References:** Mentions (e.g., `@User`, `[[Doc]]`) do not rely on line IDs for their stability. Instead, they store stable internal entity IDs (e.g., `userId`, `pageId`). This design ensures that mention references remain valid even if the lines they appear on are modified, split, or rewritten, as the underlying entity ID remains constant.
*   **Lineage Tracking:** For auditing, versioning, and "Git-like" diffs, the system will track changes at a higher level, utilizing the "hybrid versioning model" (document snapshots plus per-line deltas) as described in the Document Model section. This lineage tracking will focus on the evolution of content blocks and document states, rather than relying on the persistence of individual line UUIDs across transformations.
```ts
type Line = {
  id: string           // Current UUID
  parentId?: string    // Previous line ID if this is a modification
  text: string
  pageNumber: number
  lineOnPage: number
  createdAt: Date
  createdBy: 'human' | 'ai' | string // agent ID
  marks?: Mark[]
  metadata?: Record<string, any>
}
```

#### 4.4 Virtualization Strategy
Decision: Custom virtualization with react-window for variable line heights
```ts
import { VariableSizeList } from 'react-window'

const getLineHeight = (index: number) => {
  const line = lines[index]
  return calculateDynamicHeight(line) // Based on content, mentions, formatting
}

<VariableSizeList
  height={editorHeight}
  itemCount={lines.length}
  itemSize={getLineHeight}
  overscanCount={5}
>
  {LineRenderer}
</VariableSizeList>
```

#### 4.5 Mention Autocomplete Performance
Decision: Tiered search with caching and debouncing
```ts
const mentionSearch = {
  debounceMs: 300,
  maxResults: 10,
  strategy: [
    'recent_mentions',    // Cache recent mentions locally
    'same_document',      // Prioritize mentions in current doc
    'fuzzy_match'         // Broader search with ranking
  ]
}
```

#### 4.6 Plugin Architecture Foundation
Decision: Event-driven hooks built into core architecture
```ts
interface PluginHook {
  onLineChange?: (lineId: string, newText: string) => void
  onAIRewrite?: (range: LineRange, suggestion: string) => void
  onMentionCreate?: (mention: Mention) => void
}

// Add to core editor state
interface EditorState {
  // ... other state
  pluginHooks: PluginHook[]
}
```

#### 4.7 Metadata Storage Strategy
Decision: Hybrid approach - critical metadata inline, audit trail in logs
Inline metadata: mention IDs, formatting marks, block types, page/line numbers
Log metadata: edit timestamps, agent confidence scores, full change history
```ts
interface Line {
  // ... core properties
  metadata?: {
    mentions: MentionReference[]
    formatting: FormatMark[]
    blockType?: 'normal' | 'header' | 'quote' | 'code'
    isPageBreak?: boolean
  }
}

interface EditLog {
  lineId: string
  timestamp: Date
  agentId?: string
  confidence?: number
  changeType: 'human_edit' | 'ai_rewrite' | 'split' | 'merge'
  before: string
  after: string
}
```

#### 4.8 AI Error Handling Strategy
Decision: Comprehensive error boundaries with graceful degradation
```ts
enum AIErrorType {
  INVALID_RANGE = 'invalid_range',
  MALFORMED_XML = 'malformed_xml', 
  CONTENT_TOO_LONG = 'content_too_long',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit'
}

interface ErrorRecovery {
  retry: () => void
  skip: () => void
  editManually: () => void
}

const handleAIError = (error: AIError) => {
  // Log error, show user-friendly message, provide recovery options
  // System continues working even if AI fails
}
```

#### 4.9 Performance Benchmarks
Decision: Specific measurable targets
```ts
const PERFORMANCE_TARGETS = {
  initialRender: 200,      // ms for 1000 lines
  scrollPerformance: 60,   // fps maintained
  aiRewritePreview: 500,   // ms from request to preview
  memoryUsage: 50,         // MB for 1000-line document
  searchResponse: 100,     // ms for search query
  zoomChange: 100,         // ms to re-render at new zoom
}
```

#### 4.10 Concurrency & Conflict Resolution
Decision: Human-always-wins with FIFO AI queue
```ts
interface ConflictResolution {
  strategy: 'human_wins' | 'queue_pending' | 'merge_attempt'
  aiQueueing: 'fifo'     // First-in, first-out for AI rewrites
  lockRanges: false      // Don't lock lines during AI operations in v1
}

// User controls
interface AIQueueControls {
  viewPending: () => AIRewrite[]
  cancelRewrite: (id: string) => void
  prioritizeRewrite: (id: string) => void // Future feature
}
```

#### 4.11 Cross-line Formatting Strategy
Decision: Metadata-based block types instead of spanning marks
```ts
// Multi-line constructs handled as special line types
interface CodeBlockLine extends Line {
  metadata: {
    blockType: 'code'
    codeBlockId: string
    language?: string
    isFirstLine: boolean
    isLastLine: boolean
  }
}

interface QuoteBlockLine extends Line {
  metadata: {
    blockType: 'quote'
    quoteLevel: number
    quoteBlockId: string
  }
}
```

#### 4.12 Offline Strategy
Decision: Optimistic updates with sync queue
```ts
interface OfflineState {
  isOnline: boolean
  pendingChanges: EditOperation[]
  lastSyncTimestamp: Date
  conflictResolution: 'manual' | 'auto_merge'
}

// Implementation
const offlineMiddleware = {
  cacheDocument: true,
  optimisticUpdates: true,
  syncOnReconnect: true,
  conflictResolutionUI: true
}
```

#### 4.13 Testing Strategy
Decision: Multi-layer approach with AI mocking
```ts
const testStrategy = {
  unit: [
    'line operations',
    'mention parsing', 
    'AI response parsing',
    'document template calculations'
  ],
  integration: [
    'AI rewrite flows',
    'merge conflicts',
    'error handling',
    'zoom and pagination'
  ],
  e2e: [
    'full user workflows',
    'mock AI responses',
    'document export/print',
    'cross-device consistency'
  ],
  performance: [
    'automated regression tests',
    'memory leak detection',
    'zoom performance',
    'large document handling'
  ]
}
```

#### 4.14 Document Rendering Architecture
Decision: Page-aware editor with CSS scaling
```tsx
const PageAwareEditor = ({ document, template, zoomLevel }) => {
  const pagesCount = Math.ceil(document.lines.length / template.linesPerPage)
  
  return (
    <div 
      className="document-container" 
      style={{ 
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'top left',
        width: `${template.pageWidth}in`,
        fontFamily: template.fontFamily,
        fontSize: `${template.fontSize}pt`
      }}
    >
      {Array.from({ length: pagesCount }, (_, pageIndex) => (
        <DocumentPage 
          key={pageIndex}
          lines={document.lines.slice(
            pageIndex * template.linesPerPage,
            (pageIndex + 1) * template.linesPerPage
          )}
          pageNumber={pageIndex + 1}
          template={template}
        />
      ))}
    </div>
  )
}
```

#### 4.15 Print Compatibility
Decision: CSS print styles that match screen layout exactly
```css
@media print {
  .document-page {
    page-break-after: always;
    transform: none !important;
  }
  .document-toolbar { display: none; }
  .line-numbers { display: none; }
}

@page {
  size: 8.5in 11in;
  margin: 1in 1in 1in 1.5in;
}
```

#### 4.16 AI Integration with Markdown-Based Formatting
Decision: AI operates on markdown source with word-level formatting control
```ts
interface AIDocumentContext {
  lines: DocumentLine[]
  template: DocumentTemplate
  currentPage: number
  totalPages: number
  legalFormatting: boolean
}

// AI receives and returns markdown text
const sendToAI = (context: AIDocumentContext, range: LineRange) => {
  const markdownLines = context.lines.slice(range.start, range.end + 1)
    .map(line => line.markdownText);
  
  return aiService.rewrite({
    lines: markdownLines,
    constraints: {
      maintainPageBreaks: true,
      allowMarkdownFormatting: true
    }
  })
}

// AI can format specific words/sections
const exampleAIResponse = {
  originalLine: "Hello world this is a test",
  formattedLine: "Hello **world** this is a *test*",
  changes: [
    { type: 'format', word: 'world', formatting: 'bold' },
    { type: 'format', word: 'test', formatting: 'italic' }
  ]
}
```

#### 4.17 Framework & Stack:
*   Next.js (our existing stack)
*   React for the editor surface with rich text rendering
*   Zustand with Immer for markdown-based line state management
*   CSS-in-JS or Tailwind for styling (monospaced layout with rich formatting)
*   Markdown + custom mention syntax for AI semantic manipulation
*   Dual-interface architecture: markdown source + rich display
*   OpenAI or Claude (via API) for AI rewriting and formatting

#### 4.18 Enhanced Document Model:
At the core, each document is a flat array of lines with dual representation:
```ts
type Line = {
  id: string; // stable unique ID (UUID)
  markdownText: string; // AI interface: "Hello **world** @user:123"
  displayText: string;  // Human display: "Hello world @John Doe"
  marks?: Mark[]; // parsed formatting: bold, italic, mentions
  pageNumber: number;
  lineOnPage: number;
  createdAt: Date;
  createdBy: 'human' | 'ai' | string;
  metadata?: Record<string, any>; // For special line types like code blocks, quotes
};

type Document = Line[];
```

**Key Properties:**
- **Dual Interface**: Lines maintain both markdown source (for AI) and rich display (for humans)
- **Semantic Storage**: Everything stored as markdown text for AI manipulation
- **Visual Stability**: Lines are visually stable and semantically atomic
- **No Complex Trees**: No ProseMirror tree, no nested schema
- **AI-First**: Everything is diffable, exportable, and AI-visible in markdown format
- **Cross-line Formatting**: Handled by defining special `Line` types with appropriate `metadata`
- **Bidirectional Mentions**: Contribute to system-wide backlinking
- **Hybrid Versioning**: Document snapshots plus per-line deltas

**AI Formatting Examples:**
```ts
// AI receives:
"Hello world this is a test"

// AI can return:
"Hello **world** this is a *test*"  // Bold + italic formatting
"Hello world @user:123 this is a test"  // Add mention
"Hello **world** @user:123 this is a *test*"  // Combined formatting
```

#### 4.19 Line Wrapping & Layout:
We’ll enforce a configurable hard character limit (e.g. 120-140 chars) per line. The editor will not wrap visually based on container size — instead, text will be hard-wrapped at the renderer level (like a terminal or code editor). This ensures line numbers stay consistent across devices, viewports, and AI calls. When the AI generates content, the editor is responsible for splitting it into lines that respect the character limit. This allows the AI to focus on semantic content generation without being constrained by visual layout rules.

#### 4.20 Rendering Components:
*   `LineEditor`: Renders a single line, with line number, text input, and inline formatting. Will leverage virtualization (e.g., `react-window`) for efficient rendering of 1,000+ line documents.
*   `EditorCanvas`: Maps and renders the full array of lines, integrating virtualization.
*   `MentionAutocomplete`: Popover component for mention triggers.
*   `DiffHighlighter`: Used to show what the agent changed.

#### 4.21 AI Rewrite Architecture:
AI works in 2-step agentic passes:
*   **Step 1: Line Selection**
    An AI agent can decide which lines to rewrite by inspecting the document and outputting something like:
    ```json
    { "replace": { "start": 25, "end": 60 }, "reason": "Redundant argument" }
    ```
*   **Step 2: Rewrite**
    Agent receives just those lines and the goal, and responds in Roo-style XML format:
    ```xml
    <replace start_line="25" end_line="60">
    <original>
    Original content block here.
    </original>
    <replacement>
    New rewritten text that replaces the original lines.
    </replacement>
    </replace>
    ```
This gets parsed, previewed in the UI, and merged if accepted.
Suggestions, comments, or non-destructive hints may use different tags (e.g., `<suggest>`, `<comment>`) in future iterations.
**AI Error Handling:**
*   **Invalid Line Ranges:** If an agent returns invalid `start_line` or `end_line` values (e.g., out of bounds, `start > end`), the system will reject the rewrite, log the error, and notify the user.
*   **Malformed XML:** If the AI output is not valid XML or does not conform to the `<replace>` tag schema, the system will reject the rewrite, log the error, and prompt the agent for a valid response or notify the user.

#### 4.22 Mention & Formatting System:
We’ll support lightweight inline syntax similar to Markdown or Roam-style linking:
*   `@username` → mention token (internally stores stable user ID)
*   `[[Page Title]]` → link to another page (internally stores stable page ID)
*   `**bold**`, `_italic_` for formatting
This will likely be handled via a span parser, not a WYSIWYG system. The system will ensure that mentions store stable internal IDs, so that if a username or page title changes, the reference remains valid.

#### 4.23 Plugin System (Later):
Long-term, the editor will support:
*   Agent plugins (e.g., rewriters, summarizers, tone changers)
*   Export plugins (PDF, Markdown, DOCX)
*   Content annotations (e.g., AI-generated tags)
Each plugin will register rewrite strategies or render overlays on the editor.

#### 4.24 AI Merge Layer:
We'll build a deterministic merge system:
*   Receives `startLine`, `endLine`, and `replacement`
*   Shows human preview (original vs rewritten)
*   Applies only if validated and accepted
*   Logs artifacts for audit/history
Handles conflicting or concurrent agent outputs by queueing and prioritizing merges.
This lets us run agent chains asynchronously and maintain trust.

#### 4.25 Concurrency & Conflict Resolution:
Given the asynchronous nature of AI agents and potential for human-AI interaction, a robust concurrency and conflict resolution strategy is essential.

*   **Human-AI Edit Conflicts:**
    *   If a human edits a line that an AI agent has a pending rewrite for (i.e., the AI's proposed changes are in the merge queue), the system will detect this conflict.
    *   The human's edit will take immediate precedence and be applied to the document.
    *   The AI's pending rewrite for the conflicting range will be marked as "stale" or "invalidated" and removed from the merge queue. The user will be notified that the AI's suggestion was superseded by their direct edit.
    *   Alternatively, for critical AI operations, the system might temporarily lock the affected line range for human edits while the AI rewrite is in progress, but this would require careful UX consideration to avoid user frustration. For v1, the "human always wins" approach is simpler and safer.
*   **Rapid Successive AI Rewrites:**
    *   The AI merge layer (4.9) will manage a queue of proposed AI rewrites.
    *   If multiple AI agents propose overlapping or successive rewrites on the same or adjacent line ranges, the system will process them sequentially based on their arrival in the queue.
    *   Each subsequent rewrite will be applied to the *current* state of the document after the previous rewrite has been merged (or rejected). This prevents race conditions and ensures a deterministic application order.
    *   The system will perform preemptive validation (as mentioned in 4.6) before adding a rewrite to the queue, ensuring that only valid proposals are considered.
*   **User Controls for Agent Priority/Interruption:**
    *   **Priority:** In v1, a simple FIFO (First-In, First-Out) queue for AI merges is sufficient. Future iterations may introduce user-configurable priorities for different agent types or specific rewrite tasks.
    *   **Interruption/Cancellation:** Users will have the ability to view the pending AI merge queue and explicitly cancel any pending AI rewrite before it is applied. This provides a "human-in-the-loop" override.
    *   **Review & Accept/Reject:** All AI rewrites will require explicit human review and acceptance before being applied to the main document, serving as the primary conflict resolution mechanism.

#### 4.26 Synchronization Model:
*   Server-authoritative document source with optional local cache
*   Real-time collaboration not supported in v1, but system is forward-compatible with multi-user concurrency
*   All edits routed through deterministic, line-referenced mutations

#### 4.27 AI Content Generation Model:
The AI operates on semantic content, not storage lines. For example, if it receives lines 45–60 as context, it reads them as plain text (in Markdown format) to understand their meaning. But when generating a replacement, the AI doesn’t need to preserve or match the original line count. It can return a natural paragraph or multiple paragraphs of content, and the editor will handle splitting, wrapping, and assigning line boundaries. Lines are used purely for addressing and replacement—not as creative constraints. This design keeps the system addressable and mergeable for humans, while letting the AI focus on writing fluid, meaningful text.

---

### **5. Functional Requirements**

#### 5.1 Editing & Input

*   Enforce configurable hard line wrapping (default 120-140 chars)
*   Display line numbers
*   Support Markdown-style formatting and mentions with stable ID resolution
*   Implement undo/redo functionality across all editor operations (human and AI)
*   Handle very long lines gracefully (truncation with indicator or horizontal scrolling)
*   Provide a responsive mobile editing experience
*   Support splitting and merging lines while preserving line IDs and metadata lineage

#### 5.2 AI Rewrite System

*   Trigger rewrite on selected line range or entire doc
*   Support multi-agent rewrite queues
*   Parse and validate `<replace>` tags, including robust error handling for invalid ranges and malformed XML.
*   All `<replace>` operations must include the original content being replaced for verification before merge. This avoids offset drift across sequential agent edits and enables fail-safe application if the underlying text has changed.
*   Allow for human merge decision and conflict resolution
*   Preemptive validation of agent rewrites

#### 5.3 Copy/Export

*   Copy block preserves line structure and Markdown formatting
*   Export as plaintext, Markdown, or DOCX
*   Mentions and metadata optionally included in frontmatter or embedded tags

#### 5.4 Performance

*   Must support 1,000+ line documents without lag, utilizing virtualization (e.g., `react-window`)
*   Lightweight line diffing engine

#### 5.5 Search & Accessibility

*   Implement in-document search functionality
*   Ensure basic accessibility features (keyboard navigation, screen reader compatibility)

---

### **6. Non-Functional Requirements**

*   UX parity between AI agent and human user views
*   Fail gracefully on malformed AI output (invalid tag, bad range, content issues) with clear user feedback and logging.
*   Rewrite region validation should be whitespace-insensitive where possible to avoid merge conflicts from formatting-only changes.
*   Offline-first compatible (local mutation cache + retry queue)
*   Auditability of changes (agent identity, timestamp, confidence score)
*   Support plugin architecture for AI model routing and agent definition

---

### **7. Open Questions**

*   Should merged artifacts retain metadata inline or only in logs? (Further discussion needed)
*   Will we eventually support semantic paragraph folding/grouping on top of lines? (Future consideration)
*   What strategy is best for line ID preservation under heavy edits (UUID chaining vs parent trace)?
*   Will plugin agents require version pinning or capability negotiation?

---

### **8. Milestones (Proposed)**

| Milestone | Deliverable                                                  | Date      |
| --------- | ------------------------------------------------------------ | --------- |
| M1        | MVP line editor with visual line numbers + hard wrap         | [Insert] |
| M2        | Agent rewrite trigger and basic merge UI                     | [Insert] |
| M3        | Copy/export functionality                                    | [Insert] |
| M4        | Multi-agent queue and audit logging                          | [Insert] |
| M5        | Plugin-based agent system + local/remote model compatibility | [Insert] |

---

### **9. Appendix**

*   Tag Schema Reference
*   Line Merge Examples
*   Prompt Format Examples
*   Line ID Generation and Traceability Rules
*   Agent Plugin Protocol Sketch
