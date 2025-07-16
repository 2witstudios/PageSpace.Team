# AI-Native Rich Text Editor - Implementation Guide

## Overview

This document provides a comprehensive guide to understanding and working with PageSpace's AI-native rich text editor implementation. The editor is built on a line-addressable, markdown-based dual interface architecture that enables seamless AI-human collaboration while providing a professional rich text editing experience.

## Architecture Summary

### Core Concepts

**Dual Interface Design**: The editor maintains two representations of content:
- **AI Interface**: Markdown text (`"Hello **world** @user:123"`)
- **Human Interface**: Rich formatted display (`Hello world @John Doe`)

**Line-Based Model**: Documents are flat arrays of lines, each with:
- Unique UUID addressing
- Configurable character limits (default 80 chars)
- Page-aware positioning
- Creation metadata (human/AI authorship)

## File Structure

```
apps/web/src/components/ai-editor/
├── EditorCanvas.tsx           # Main container with virtual scrolling
├── MarkdownLineEditor.tsx     # Individual line editing component
├── store.ts                   # Zustand state management
├── types.ts                   # TypeScript definitions
├── RewriteToolbar.tsx         # AI rewrite controls
├── MergePreview.tsx           # AI suggestion preview
└── RewriteQueue.tsx           # AI operation queue management

apps/web/src/lib/
├── markdown-parser.ts         # Markdown ↔ marks conversion
├── markdown-conversion.ts     # Line creation/updating utilities
├── ai-utils.ts               # AI response validation
├── markdown-reconstruction.ts # Selection → markdown export
└── ai-markdown-utils.ts      # AI content processing
```

## Core Data Structures

### Line Structure
```typescript
type Line = {
  id: string;                    // UUID for stable addressing
  parentId?: string;             // Lineage tracking for splits/merges
  markdownText: string;          // AI interface: "Hello **world**"
  displayText: string;           // Human display: "Hello world"
  text: string;                  // Legacy support (will be removed)
  pageNumber: number;            // Document layout tracking
  lineOnPage: number;
  createdAt: Date;
  createdBy: 'human' | 'ai' | string;
  marks?: Mark[];                // Formatting metadata
  metadata?: Record<string, any>; // Extensible properties
}
```

### Mark System
```typescript
type Mark = {
  type: MarkType;                // 'bold' | 'italic' | 'mention'
  start: number;                 // Position in displayText
  end: number;
  value?: string;                // For mentions: stable ID
  displayName?: string;          // Resolved display name
  metadata?: {
    mentionType?: 'user' | 'page';
    mentionId?: string;
    isStableId?: boolean;
  };
}
```

### AI Rewrite System
```typescript
type AIRewrite = {
  id: string;
  startLine: number;             // Line range for replacement
  endLine: number;
  originalText: string;          // Content being replaced
  prompt: string;                // User's rewrite instruction
  suggestedText?: string;        // AI's proposed replacement
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'applied' | 'rejected' | 'stale';
  timestamp: Date;
  error?: string;
}
```

## State Management

### Zustand Store (store.ts)

The editor uses Zustand with Immer middleware for efficient immutable updates:

```typescript
interface EditorState {
  lines: Line[];                 // Document content
  cursor: { lineIndex: number; charIndex: number };
  selection: { start: LinePosition; end: LinePosition } | null;
  aiQueue: AIRewrite[];          // Pending AI operations
  viewState: ViewState;          // Zoom, template, display options
  document: DocumentTemplate;    // Layout configuration
  searchState: SearchState;      // Find/replace state
  past: HistorySnapshot[];       // Undo history
  future: HistorySnapshot[];     // Redo history
}
```

### History Management

- **Selective Tracking**: Only document changes create history snapshots
- **Memory Limits**: Maximum 50 undo states to prevent memory leaks
- **Transient State**: Cursor/selection changes don't trigger history saves
- **Deep Cloning**: Uses `structuredClone` for snapshot isolation

## Markdown Processing

### Parsing Pipeline (markdown-parser.ts)

```typescript
// Regex patterns for markdown elements
const BOLD_REGEX = /\*\*(.*?)\*\*/g;
const ITALIC_REGEX = /_(.*?)_/g;
const MENTION_REGEX = /@(?:user:([^:\s]+)|(\w+))|\[\[(?:page:([^:\]]+)|([^\]]+))\]\]/g;

// Converts markdown text to formatting marks
export const parseMarkdown = (text: string): Mark[]
```

### Mention System

**Dual Format Support**:
- Legacy: `@username`, `[[Page Title]]`
- Stable ID: `@user:123`, `[[page:456]]`

**Resolution Process**:
1. Parse mention syntax from markdown
2. Resolve stable IDs to display names via mention service
3. Render with resolved names in rich text display
4. Maintain stable IDs in markdown storage

## AI Integration

### Request Flow

1. **User Selection**: Select line range and provide rewrite prompt
2. **Queue Management**: Add to FIFO queue with validation
3. **API Call**: POST to `/api/ai/editor/rewrite` with context
4. **Response Parsing**: Validate XML format and content
5. **Preview**: Show before/after comparison to user
6. **Application**: Replace lines on user acceptance

### XML Response Format

```xml
<replace start_line="5" end_line="8">
<original>
Original text content here
</original>
<replacement>
AI-generated replacement text
</replacement>
</replace>
```

### Error Handling

```typescript
enum AIErrorType {
  INVALID_RANGE = 'invalid_range',
  MALFORMED_XML = 'malformed_xml', 
  CONTENT_TOO_LONG = 'content_too_long',
  CONTENT_MISMATCH = 'content_mismatch',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit'
}
```

### Conflict Resolution

**Human-Always-Wins Strategy**:
- Human edits immediately invalidate conflicting AI operations
- Stale AI suggestions are removed from queue
- Clear user feedback on superseded operations

## Performance Architecture

### Virtual Scrolling

```typescript
// EditorCanvas.tsx implementation
import { VariableSizeList } from 'react-window';

<VariableSizeList
  height={height}
  width={width}
  itemCount={lines.length}
  itemSize={getItemSize}
  overscanCount={10}        // Smooth scrolling buffer
>
  {LineRenderer}
</VariableSizeList>
```

### Optimization Patterns

- **Memoized Callbacks**: All event handlers wrapped in `useCallback`
- **Efficient Updates**: Immer provides structural sharing for unchanged data
- **Bounded History**: Prevents memory leaks with history limits
- **Selective Re-rendering**: Cursor/selection changes don't trigger full updates

## Document Templates

### Template System

```typescript
interface DocumentTemplate {
  name: string;
  pageWidth: number;           // in inches
  pageHeight: number;          // in inches
  margins: { top: number; right: number; bottom: number; left: number };
  fontFamily: string;
  fontSize: number;            // in points
  lineHeight: number;
  charsPerLine: number;        // calculated constraint
  linesPerPage: number;        // calculated layout
}
```

### Default Template (US Legal)

```typescript
const DEFAULT_TEMPLATE: DocumentTemplate = {
  name: 'US Legal',
  pageWidth: 8.5,
  pageHeight: 11,
  margins: { top: 1, right: 1, bottom: 1, left: 1.5 },
  fontFamily: 'Times New Roman',
  fontSize: 12,
  lineHeight: 1.5,
  charsPerLine: 80,
  linesPerPage: 54,
};
```

## API Endpoints

### AI Rewrite API

**Endpoint**: `POST /api/ai/editor/rewrite`

**Request**:
```json
{
  "originalText": "Content to be rewritten",
  "prompt": "User's instruction for AI",
  "startLine": 5,
  "endLine": 8
}
```

**Response**:
```json
{
  "suggestedText": "<replace start_line=\"5\" end_line=\"8\">...</replace>"
}
```

### Audit API

**Endpoint**: `POST /api/ai/editor/audit`

**Purpose**: Log AI rewrite decisions for compliance and analysis

## Development Guidelines

### Adding New Features

1. **State Changes**: Use Zustand actions with Immer for immutable updates
2. **History Tracking**: Call `saveToHistory()` before document modifications
3. **Performance**: Wrap callbacks in `useCallback` and expensive calculations in `useMemo`
4. **Type Safety**: Extend interfaces in `types.ts` for new data structures

### Testing Patterns

1. **Unit Tests**: Test markdown parsing, conversion utilities, AI validation
2. **Integration Tests**: Test AI rewrite flows, conflict resolution, merge operations
3. **Performance Tests**: Benchmark large document handling, virtual scrolling
4. **E2E Tests**: Full user workflows with mock AI responses

### Common Patterns

**Line Updates**:
```typescript
// Always use the dedicated action
updateLineWithMarkdown(lineIndex, newMarkdownText);

// This handles:
// - Markdown parsing
// - Mark generation  
// - Display text conversion
// - History tracking
// - AI conflict invalidation
```

**AI Operations**:
```typescript
// Enqueue AI rewrite
enqueueAIRewrite({
  startLine: 5,
  endLine: 8,
  originalText: "...",
  prompt: "Improve clarity"
});

// Queue processes automatically via useEffect
```

## Troubleshooting

### Common Issues

1. **Virtual Scrolling Performance**: Check `getItemSize` calculation and dependency arrays
2. **Markdown Parsing Errors**: Verify regex patterns and mark position calculations
3. **AI Response Validation**: Check XML format and content matching
4. **Memory Leaks**: Monitor history snapshot size and cleanup patterns

### Debug Tools

1. **State Inspector**: Use browser Redux DevTools with Zustand middleware
2. **Performance Profiler**: React DevTools Profiler for render analysis
3. **Network Monitoring**: Check AI API response times and error rates
4. **Console Logging**: Built-in error logging for AI operations

## Future Enhancements

### Planned Improvements

1. **Real AI Integration**: Replace mock service with Ollama/OpenAI
2. **Plugin Architecture**: Extensible AI agent system
3. **Advanced Templates**: Support for multiple document formats
4. **Real-time Collaboration**: Multi-user editing capabilities

### Performance Optimizations

1. **Markdown Caching**: Memoize parsing results
2. **Web Workers**: Offload heavy processing
3. **Progressive Loading**: Lazy load large documents
4. **Bundle Optimization**: Code splitting for editor components

This implementation provides a solid foundation for AI-native document editing with room for future enhancements while maintaining excellent performance and user experience.