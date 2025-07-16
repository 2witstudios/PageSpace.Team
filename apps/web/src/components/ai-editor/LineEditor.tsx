import React, { useRef, useEffect, useCallback } from 'react';
import { Line, LinePosition } from './types';
import { useEditorStore } from './store';
import { cn } from '@/lib/utils';
interface LineEditorProps {
  line: Line;
  lineIndex: number;
  pageNumber: number;
  lineOnPage: number;
  isCurrentLine: boolean;
  isSelectionStart: boolean;
  isSelectionEnd: boolean;
  onLineChange: (lineIndex: number, newText: string) => void;
  onCursorChange: (lineIndex: number, charIndex: number) => void;
  onSelectionChange: (start: LinePosition, end: LinePosition) => void;
  onSplitLine: (lineIndex: number, charIndex: number) => void; // New prop for split line
  onMergeLine: (lineIndex: number) => void;
}

const LineEditor: React.FC<LineEditorProps> = ({
  line,
  lineIndex,
  lineOnPage,
  isCurrentLine,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isSelectionStart,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isSelectionEnd,
  onLineChange,
  onCursorChange,
  onSelectionChange,
  onSplitLine,
  onMergeLine,
}) => {
  const inputRef = useRef<HTMLDivElement>(null);
  const { cursor, viewState, handleAutoWrap } = useEditorStore();
  const charsPerLine = viewState.template.charsPerLine;
  
  // Track the previous state to detect meaningful changes
  const prevIsCurrentLine = useRef(isCurrentLine);
  const lastSetCursorPosition = useRef(cursor.charIndex);
  const isInternalCursorUpdate = useRef(false);
  
  useEffect(() => {
    const justBecameCurrent = isCurrentLine && !prevIsCurrentLine.current;
    const cursorPositionChanged = cursor.charIndex !== lastSetCursorPosition.current;
    const shouldUpdateCursor = justBecameCurrent || (isCurrentLine && cursorPositionChanged && !isInternalCursorUpdate.current);
    
    prevIsCurrentLine.current = isCurrentLine;
    lastSetCursorPosition.current = cursor.charIndex;
    isInternalCursorUpdate.current = false; // Reset the flag
    
    if (shouldUpdateCursor && inputRef.current) {
      const element = inputRef.current;
      
      // Focus the element if it's the current line
      if (isCurrentLine && document.activeElement !== element) {
        element.focus();
      }
      
      // Set cursor position
      if (isCurrentLine) {
        setTimeout(() => {
          const sel = window.getSelection();
          if (sel && element === document.activeElement) {
            const range = document.createRange();
            const textNode = element.firstChild;
            
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
              const maxIndex = textNode.textContent?.length || 0;
              const charIndex = Math.min(Math.max(0, cursor.charIndex), maxIndex);
              
              try {
                range.setStart(textNode, charIndex);
                range.setEnd(textNode, charIndex);
                sel.removeAllRanges();
                sel.addRange(range);
              } catch {
                // Fallback: place cursor at end
                range.setStart(textNode, maxIndex);
                range.setEnd(textNode, maxIndex);
                sel.removeAllRanges();
                sel.addRange(range);
              }
            } else {
              // Empty line
              try {
                range.setStart(element, 0);
                range.setEnd(element, 0);
                sel.removeAllRanges();
                sel.addRange(range);
              } catch {
                // If that fails, element is already focused
              }
            }
          }
        }, 10);
      }
    }
  }, [isCurrentLine, cursor.charIndex]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent || '';
    
    // Get current cursor position
    const sel = window.getSelection();
    let cursorPosition = 0;
    if (sel && sel.rangeCount > 0) {
      cursorPosition = sel.getRangeAt(0).startOffset;
    }
    
    // Handle auto-wrap during typing (instant wrapping)
    if (newText.length > charsPerLine) {
      handleAutoWrap(lineIndex, newText);
      return; // handleAutoWrap will handle the cursor positioning
    }
    
    // Update the line text
    onLineChange(lineIndex, newText);
    
    // Mark this as an internal cursor update to prevent useEffect from interfering
    isInternalCursorUpdate.current = true;
    
    // Update cursor position in global state
    const finalCursorPos = Math.min(cursorPosition, newText.length);
    onCursorChange(lineIndex, finalCursorPos);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const sel = window.getSelection();
      if (sel && sel.focusNode) {
        // const currentLineText = inputRef.current?.textContent || '';
        const charIndex = sel.focusOffset;
        onSplitLine(lineIndex, charIndex);
      }
    } else if (e.key === 'Backspace') {
      const sel = window.getSelection();
      if (sel && sel.focusNode && sel.focusOffset === 0) {
        e.preventDefault();
        onMergeLine(lineIndex);
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // Allow default arrow key behavior, but update cursor position
      setTimeout(() => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const cursorPosition = sel.getRangeAt(0).startOffset;
          isInternalCursorUpdate.current = true;
          onCursorChange(lineIndex, cursorPosition);
        }
      }, 0);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      // Prevent default and let parent handle line navigation
      e.preventDefault();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const currentCharIndex = sel.getRangeAt(0).startOffset;
        // TODO: Pass current char position to parent for inter-line navigation
        // For now, just update current cursor position
        isInternalCursorUpdate.current = true;
        onCursorChange(lineIndex, currentCharIndex);
      }
    }
    // More complex key handling (e.g., arrow keys for cursor movement across lines)
    // will be managed by EditorCanvas or a higher-level component.
  };

  const handleBlur = () => {
    const sel = window.getSelection();
    if (sel && sel.focusNode) {
      const newCharIndex = sel.focusOffset;
      onCursorChange(lineIndex, newCharIndex);
    }
  };

  const handleClick = () => {
    // Update cursor position when user clicks in the line
    setTimeout(() => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const cursorPosition = sel.getRangeAt(0).startOffset;
        isInternalCursorUpdate.current = true;
        onCursorChange(lineIndex, cursorPosition);
      }
    }, 0);
  };

  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const startNode = range.startContainer;
      const endNode = range.endContainer;

      // Determine if the selection is within this line editor
      const isStartInThisLine = inputRef.current?.contains(startNode) || false;
      const isEndInThisLine = inputRef.current?.contains(endNode) || false;

      if (isStartInThisLine || isEndInThisLine) {
        const startCharIndex = range.startOffset;
        const endCharIndex = range.endOffset;

        // For simplicity, assuming selection is within a single line for now.
        // Multi-line selection will require more complex logic in EditorCanvas.
        if (startNode === endNode && isStartInThisLine) {
          onSelectionChange(
            { lineIndex, charIndex: startCharIndex },
            { lineIndex, charIndex: endCharIndex }
          );
        }
      }
    }
  }, [lineIndex, onSelectionChange]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);


  const renderContent = () => {
    return line.text || '';
  };


  return (
    <>
      <div
        className={cn(
          'flex items-center group py-0.5 px-2',
          isCurrentLine ? 'bg-gray-100 dark:bg-gray-800' : '',
          'hover:bg-gray-50 dark:hover:bg-gray-850'
        )}
      >
        <div className="text-xs text-gray-400 dark:text-gray-600 mr-4 w-8 text-right select-none">
          {lineOnPage + 1}
        </div>
        <div
          ref={inputRef}
          contentEditable
          suppressContentEditableWarning
          className="flex-1 outline-none font-mono text-sm overflow-hidden" // Allow visual wrapping
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onClick={handleClick}
          data-line-index={lineIndex}
        >
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default LineEditor;