export type LinePosition = {
  lineIndex: number;
  charIndex: number;
};

export enum MarkType {
  Bold = 'bold',
  Italic = 'italic',
  Mention = 'mention',
}

export type Mark = {
  type: MarkType;
  start: number;
  end: number;
  value?: string; // For mentions, this stores the stable ID or legacy name
  displayName?: string; // Resolved display name for mentions
  metadata?: {
    mentionType?: 'user' | 'page';
    mentionId?: string;
    isStableId?: boolean;
    [key: string]: string | number | boolean | undefined;
  };
};

export type Line = {
  id: string; // stable unique ID (UUID)
  parentId?: string; // Previous line ID if this is a modification
  markdownText: string; // AI interface: "Hello **world** @user:123"
  displayText: string; // Human display: "Hello world @John Doe"
  text: string; // Legacy support - will be removed
  pageNumber: number;
  lineOnPage: number;
  createdAt: Date;
  createdBy: 'human' | 'ai' | string; // agent ID
  marks?: Mark[];
  metadata?: Record<string, string | number | boolean | Date | undefined>;
};

export type Document = Line[];

export interface DocumentTemplate {
  name: string;
  pageWidth: number; // in inches
  pageHeight: number; // in inches
  margins: { top: number; right: number; bottom: number; left: number };
  fontFamily: string;
  fontSize: number; // in points
  lineHeight: number;
  charsPerLine: number; // calculated from above
  linesPerPage: number; // calculated from above
}

export interface ViewState {
  zoomLevel: number; // 0.5, 0.75, 1.0, 1.25, 1.5, 2.0
  template: DocumentTemplate;
  showPageBreaks: boolean;
  showMargins: boolean;
}

export interface AIRewrite {
  id: string;
  startLine: number;
  endLine: number;
  originalText: string;
  prompt: string;
  suggestedText?: string; // Optional until AI provides it
  reason?: string;
  status:
    | 'pending' // Waiting to be processed
    | 'processing' // Actively being processed by the AI
    | 'completed' // AI returned a suggestion, ready for preview
    | 'failed' // An error occurred
    | 'applied' // User accepted the suggestion
    | 'rejected' // User rejected the suggestion
    | 'stale'; // The original content was changed, invalidating the rewrite
  timestamp: Date;
  error?: string; // To store error messages on failure
}

// Snapshot type for undo/redo history to avoid circular reference
export interface HistorySnapshot {
  lines: Line[];
  cursor: { lineIndex: number; charIndex: number };
  selection: { start: LinePosition; end: LinePosition } | null;
  viewState: ViewState;
  document: DocumentTemplate;
  searchState: SearchState;
}

export interface SearchState {
  query: string;
  results: LinePosition[];
  currentIndex: number;
  isActive: boolean;
}

export interface EditorState {
  lines: Line[];
  cursor: { lineIndex: number; charIndex: number };
  selection: { start: LinePosition; end: LinePosition } | null;
  viewState: ViewState;
  document: DocumentTemplate;
  searchState: SearchState;
  // Undo/Redo history using snapshots
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  isTyping: boolean;
}