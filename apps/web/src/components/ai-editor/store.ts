import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  EditorState,
  HistorySnapshot,
  Line,
  LinePosition,
  DocumentTemplate,
} from './types';
import { v4 as uuidv4 } from 'uuid';
import { extractMarkdownFromSelection } from '@/lib/markdown-reconstruction';
import { updateLineWithMarkdown, createLineFromMarkdown } from '@/lib/markdown-conversion';

// Helper function to create a snapshot of the current state
const createSnapshot = (state: EditorState): HistorySnapshot => ({
  lines: structuredClone(state.lines),
  cursor: { ...state.cursor },
  selection: state.selection ? { ...state.selection } : null,
  viewState: { ...state.viewState },
  document: { ...state.document },
  searchState: { ...state.searchState },
});

// Helper function to restore state from a snapshot
const restoreFromSnapshot = (state: EditorState, snapshot: HistorySnapshot) => {
  state.lines = snapshot.lines;
  state.cursor = snapshot.cursor;
  state.selection = snapshot.selection;
  state.viewState = snapshot.viewState;
  state.document = snapshot.document;
  state.searchState = snapshot.searchState;
};

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

interface EditorActions {
  // Document editing actions
  setLines: (lines: Line[]) => void;
  insertLine: (lineIndex: number, text: string, createdBy: Line['createdBy']) => void;
  updateLine: (lineIndex: number, newText: string) => void;
  updateLineWithMarkdown: (lineIndex: number, markdownText: string) => void;
  deleteLine: (lineIndex: number) => void;
  splitLine: (lineIndex: number, charIndex: number) => void;
  copySelection: () => void;
  mergeLine: (lineIndex: number) => void;
  handleAutoWrap: (lineIndex: number, currentText: string) => void;
  
  // Cursor and selection actions
  setCursor: (lineIndex: number, charIndex: number) => void;
  setSelection: (start: LinePosition, end: LinePosition) => void;
  clearSelection: () => void;
  setTyping: (isTyping: boolean) => void;
  
  
  // View state actions
  setZoomLevel: (zoom: number) => void;
  setTemplate: (template: DocumentTemplate) => void;
  togglePageBreaks: () => void;
  toggleMargins: () => void;

  
  // Undo/Redo actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const HISTORY_LIMIT = 50; // Maximum number of undo states to keep

type StoreState = EditorState & EditorActions;

export const useEditorStore = create<StoreState>()(
  immer((set, get) => {
    const skipHistory = false;

    // Helper function to save state to history before making changes
    const saveToHistory = () => {
      if (skipHistory) return;
      
      const currentState = get();
      const snapshot = createSnapshot(currentState);
      
      set((state) => {
        state.past.push(snapshot);
        // Limit history size to prevent memory issues
        if (state.past.length > HISTORY_LIMIT) {
          state.past.shift();
        }
        state.future = []; // Clear future when new action is performed
      });
    };

    return {
      // Initial state
      lines: [
        {
          id: uuidv4(),
          markdownText: 'This is the first line of your AI-Native document.',
          displayText: 'This is the first line of your AI-Native document.',
          text: 'This is the first line of your AI-Native document.', // Legacy support
          pageNumber: 1,
          lineOnPage: 1,
          createdAt: new Date(),
          createdBy: 'human',
        },
      ],
      cursor: { lineIndex: 0, charIndex: 0 },
      selection: null,
      viewState: {
        zoomLevel: 1.0,
        template: DEFAULT_TEMPLATE,
        showPageBreaks: true,
        showMargins: false,
      },
      document: DEFAULT_TEMPLATE,
      searchState: {
        query: '',
        results: [],
        currentIndex: -1,
        isActive: false,
      },
      past: [],
      future: [],
      isTyping: false,

      // Document editing actions (with history)
      setLines: (lines) => {
        saveToHistory();
        set((state) => {
          state.lines = lines;
        });
      },

      insertLine: (lineIndex, text, createdBy) => {
        saveToHistory();
        set((state) => {
          const newLine = createLineFromMarkdown(text, uuidv4());
          newLine.pageNumber = 0;
          newLine.lineOnPage = 0;
          newLine.createdBy = createdBy;
          state.lines.splice(lineIndex, 0, newLine);
          state.cursor = { lineIndex, charIndex: text.length };
        });
      },

      updateLine: (lineIndex, newText) => {
        saveToHistory();
        set((state) => {
          if (state.lines[lineIndex]) {
            // Update with markdown treating newText as markdown
            const updatedLine = updateLineWithMarkdown(state.lines[lineIndex], newText);
            state.lines[lineIndex] = updatedLine;
            state.lines[lineIndex].createdBy = 'human';
          }
        });
      },

      updateLineWithMarkdown: (lineIndex, markdownText) => {
        saveToHistory();
        set((state) => {
          if (state.lines[lineIndex]) {
            const updatedLine = updateLineWithMarkdown(state.lines[lineIndex], markdownText);
            state.lines[lineIndex] = updatedLine;
            state.lines[lineIndex].createdBy = 'human';
          }
        });
      },

      deleteLine: (lineIndex) => {
        saveToHistory();
        set((state) => {
          if (state.lines[lineIndex]) {
            state.lines.splice(lineIndex, 1);
            if (state.cursor.lineIndex >= state.lines.length) {
              state.cursor.lineIndex = Math.max(0, state.lines.length - 1);
              state.cursor.charIndex = state.lines[state.cursor.lineIndex]?.text.length || 0;
            }
          }
        });
      },

      splitLine: (lineIndex, charIndex) => {
        saveToHistory();
        set((state) => {
          const originalLine = state.lines[lineIndex];
          if (!originalLine) return;


          const textBeforeCursor = originalLine.markdownText.substring(0, charIndex);
          const textAfterCursor = originalLine.markdownText.substring(charIndex);

          // Update the original line with text before cursor
          const updatedOriginalLine = updateLineWithMarkdown(originalLine, textBeforeCursor);
          state.lines[lineIndex] = updatedOriginalLine;
          state.lines[lineIndex].createdBy = 'human';

          // Create new line with text after cursor
          const newLine = createLineFromMarkdown(textAfterCursor, uuidv4());
          newLine.parentId = originalLine.id;
          newLine.pageNumber = 0;
          newLine.lineOnPage = 0;
          newLine.createdBy = 'human';

          state.lines.splice(lineIndex + 1, 0, newLine);
          state.cursor = { lineIndex: lineIndex + 1, charIndex: 0 };
        });
      },

      copySelection: () => {
        const { lines, selection } = get();
        if (!selection) return;

        const { start, end } = selection;
        const startLine = Math.min(start.lineIndex, end.lineIndex);
        const endLine = Math.max(start.lineIndex, end.lineIndex);
        const startChar = start.lineIndex < end.lineIndex || (start.lineIndex === end.lineIndex && start.charIndex < end.charIndex) 
          ? start.charIndex 
          : end.charIndex;
        const endChar = start.lineIndex < end.lineIndex || (start.lineIndex === end.lineIndex && start.charIndex < end.charIndex)
          ? end.charIndex 
          : start.charIndex;

        // Extract markdown-formatted text from selection
        const markdownText = extractMarkdownFromSelection(lines, startLine, startChar, endLine, endChar);

        navigator.clipboard.writeText(markdownText);
      },

      mergeLine: (lineIndex) => {
        if (lineIndex === 0) return;
        saveToHistory();
        set((state) => {
          const currentLine = state.lines[lineIndex];
          const prevLine = state.lines[lineIndex - 1];
          const newMarkdownText = prevLine.markdownText + currentLine.markdownText;

          // Update the previous line with merged content
          const updatedPrevLine = updateLineWithMarkdown(prevLine, newMarkdownText);
          state.lines[lineIndex - 1] = updatedPrevLine;
          state.lines[lineIndex - 1].parentId = currentLine.id;

          state.lines.splice(lineIndex, 1);
          state.cursor = { lineIndex: lineIndex - 1, charIndex: prevLine.markdownText.length };
        });
      },


      handleAutoWrap: (lineIndex, currentText) => {
        saveToHistory();
        set((state) => {
          const line = state.lines[lineIndex];
          const template = state.document;
          if (!line || !template) return;
      
          const words = currentText.split(' ');
          let processedLine = '';
          let needsWrap = false;
          let wrapAtWordIndex = -1;
      
          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const prospectiveLine = processedLine ? `${processedLine} ${word}` : word;
      
            if (prospectiveLine.length > template.charsPerLine) {
              if (processedLine) {
                // The current line has content, so we wrap
                needsWrap = true;
                wrapAtWordIndex = i;
                break;
              } else {
                // The word itself is longer than the line limit, keep it on current line
                processedLine = word;
                wrapAtWordIndex = i + 1;
                needsWrap = true;
                break;
              }
            }
            processedLine = prospectiveLine;
          }
      
          if (needsWrap) {
            const textToKeep = processedLine;
            const remainingWords = words.slice(wrapAtWordIndex);
            const textToMove = remainingWords.join(' ');
      
            // Update current line with text that fits
            const updatedLine = updateLineWithMarkdown(line, textToKeep);
            state.lines[lineIndex] = updatedLine;
            state.lines[lineIndex].createdBy = 'human';
      
            // Handle wrapped content
            if (textToMove.trim()) {
              if (state.lines[lineIndex + 1]) {
                // If there's a next line, prepend the wrapped text
                const nextLine = state.lines[lineIndex + 1];
                const mergedText = textToMove + ' ' + nextLine.markdownText;
                state.lines[lineIndex + 1] = updateLineWithMarkdown(nextLine, mergedText);
              } else {
                // Create a new line with the wrapped content
                const newLine = createLineFromMarkdown(textToMove, uuidv4());
                newLine.parentId = line.id;
                newLine.pageNumber = 0;
                newLine.lineOnPage = 0;
                newLine.createdBy = 'human';
                state.lines.splice(lineIndex + 1, 0, newLine);
              }
              // Position cursor at the beginning of the wrapped text
              state.cursor = { lineIndex: lineIndex + 1, charIndex: 0 };
            } else {
              // No text to wrap, keep cursor at end of current line
              state.cursor = { lineIndex, charIndex: textToKeep.length };
            }
          } else {
            // No wrap needed, just update the line
            state.lines[lineIndex] = updateLineWithMarkdown(line, currentText);
            state.lines[lineIndex].createdBy = 'human';
          }
        });
      },

      // Cursor and selection actions (without history - these are transient)
      setCursor: (lineIndex, charIndex) =>
        set((state) => {
          state.cursor = { lineIndex, charIndex };
          state.selection = null;
        }, false), // Do not record cursor/selection changes in history

      setSelection: (start, end) =>
        set((state) => {
          state.selection = { start, end };
        }, false), // Do not record selection changes in history

      clearSelection: () =>
        set((state) => {
          state.selection = null;
        }, false), // Do not record clear selection in history

      setTyping: (isTyping) =>
        set((state) => {
          state.isTyping = isTyping;
        }, false),


      // View state actions (without history - these are user preferences)
      setZoomLevel: (zoom) =>
        set((state) => {
          state.viewState.zoomLevel = zoom;
        }, false), // Do not record zoom changes in history

      setTemplate: (template) =>
        set((state) => {
          state.viewState.template = template;
          state.document = template;
        }, false), // Also update the main document template

      togglePageBreaks: () =>
        set((state) => {
          state.viewState.showPageBreaks = !state.viewState.showPageBreaks;
        }, false), // Do not record toggle in history

      toggleMargins: () =>
        set((state) => {
          state.viewState.showMargins = !state.viewState.showMargins;
        }, false), // Do not record toggle in history


      // Undo/Redo actions
      undo: () => {
        const { past } = get();
        if (past.length === 0) return;

        const previousSnapshot = past[past.length - 1];
        const currentSnapshot = createSnapshot(get());

        set((state) => {
          state.future.push(currentSnapshot);
          state.past.pop();
          restoreFromSnapshot(state, previousSnapshot);
        });
      },

      redo: () => {
        const { future } = get();
        if (future.length === 0) return;

        const nextSnapshot = future[future.length - 1];
        const currentSnapshot = createSnapshot(get());

        set((state) => {
          state.past.push(currentSnapshot);
          state.future.pop();
          restoreFromSnapshot(state, nextSnapshot);
        });
      },

      canUndo: () => get().past.length > 0,
      canRedo: () => get().future.length > 0,
    } satisfies StoreState;
  })
);