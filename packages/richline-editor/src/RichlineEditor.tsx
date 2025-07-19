import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState, memo, useMemo, useCallback } from 'react';
import { RichlineCore } from './rust-bridge';
import { LinesInput, normalizeLines, linesToStrings, isLineArray } from './types';
import './RichlineEditor.css';

export interface RichlineEditorProps {
  lines: LinesInput;
  onChange: (lines: LinesInput) => void;
  maxCharsPerLine?: number; // default: 80
  zoomLevel?: number; // default: 1.0
  showLineNumbers?: boolean; // default: false
  onLineHighlight?: (lineIndex: number) => void;
  onMention?: (lineIndex: number, element: HTMLElement) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export interface RichlineEditorRef {
  replaceText: (lineIndex: number, start: number, end: number, text: string) => void;
  replaceLines: (startIndex: number, endIndex: number, newLines: LinesInput) => void;
  highlightLines: (indices: number[]) => void;
  scrollToLine: (index: number) => void;
  focus: () => void;
  blur: () => void;
}

// Memoized Line component to prevent re-renders and cursor jumps
const LineComponent = memo(({
  line,
  index,
  disabled,
  onLineChange,
  onKeyDown,
  setRef,
}: {
  line: string;
  index: number;
  disabled: boolean;
  onLineChange: (index: number, newText: string, cursorPosition?: number) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, index: number) => void;
  setRef: (el: HTMLDivElement | null) => void;
}) => {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lineRef.current && lineRef.current.innerText !== line) {
      lineRef.current.innerText = line;
    }
  }, [line]);

  useEffect(() => {
    setRef(lineRef.current);
  }, [setRef]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    const cursorPosition = selection ? selection.getRangeAt(0).startOffset : 0;
    onLineChange(index, e.currentTarget.innerText, cursorPosition);
  };

  return (
    <div
      ref={lineRef}
      contentEditable={!disabled}
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={(e) => onKeyDown(e, index)}
      className="richline-line"
    />
  );
});

LineComponent.displayName = 'Line';

const RichlineEditor = forwardRef<RichlineEditorRef, RichlineEditorProps>(
  (
    {
      lines,
      onChange,
      maxCharsPerLine = 80,
      zoomLevel = 1.0,
      showLineNumbers = false,
      className = '',
      disabled = false,
      placeholder: _placeholder = '',
      onMention,
    },
    ref
  ) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [nextFocus, setNextFocus] = useState<{ index: number; position: number } | null>(null);
    
    const core = useMemo(() => new RichlineCore(lines), []); // Create once with initial lines
    const [currentLines, setCurrentLines] = useState(lines);
    const wasInputStringArray = useMemo(() => !isLineArray(lines), [lines]);

    // Helper to call onChange with the same format as input
    const callOnChange = useCallback((newLines: LinesInput) => {
      if (wasInputStringArray) {
        onChange(linesToStrings(newLines));
      } else {
        onChange(newLines);
      }
    }, [onChange, wasInputStringArray]);

    useEffect(() => {
      if (nextFocus !== null && lineRefs.current[nextFocus.index]) {
        const lineEl = lineRefs.current[nextFocus.index];
        lineEl?.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        if (lineEl && sel) {
          const textNode = lineEl.firstChild || lineEl;
          const length = textNode.textContent?.length || 0;
          range.setStart(textNode, Math.min(nextFocus.position, length));
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
      setNextFocus(null); // Reset after focus
    }, [nextFocus]);

    useImperativeHandle(ref, () => ({
      replaceText: (lineIndex, start, end, text) => {
        const line = normalizeLines(currentLines)[lineIndex];
        if (line) {
          const newText = line.text.substring(0, start) + text + line.text.substring(end);
          core.replaceLines(lineIndex, lineIndex + 1, [newText]);
          const updatedLines = core.getLines();
          setCurrentLines(updatedLines);
          callOnChange(updatedLines);
          setNextFocus({ index: lineIndex, position: start + text.length });
        }
      },
      replaceLines: (startIndex, endIndex, newLines) => {
        core.replaceLines(startIndex, endIndex, newLines);
        const updatedLines = core.getLines();
        setCurrentLines(updatedLines);
        callOnChange(updatedLines);
      },
      highlightLines: (_indices) => {
        // TODO: Implement highlighting logic
      },
      scrollToLine: (index) => {
        lineRefs.current[index]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      },
      focus: () => {
        editorRef.current?.focus();
      },
      blur: () => {
        editorRef.current?.blur();
      },
    }));

    const handleLineChange = useCallback((index: number, newText: string, cursorPosition?: number) => {
      console.log('wrapText input:', { 
        newText: JSON.stringify(newText), 
        length: newText.length, 
        maxCharsPerLine,
        index,
        cursorPosition 
      });
      
      const wrappedLines = RichlineCore.wrapText(newText, maxCharsPerLine);
      
      console.log('wrapText output:', { 
        wrappedLines: wrappedLines.map(l => JSON.stringify(l)), 
        count: wrappedLines.length 
      });
      
      core.replaceLines(index, index + 1, linesToStrings(wrappedLines));
      
      // Construct updated lines without calling core.getLines() to avoid recursive use
      const currentStrings = linesToStrings(currentLines);
      const wrappedStrings = linesToStrings(wrappedLines);
      const newCurrentLines = [...currentStrings];
      newCurrentLines.splice(index, 1, ...wrappedStrings);
      
      setCurrentLines(newCurrentLines);
      callOnChange(newCurrentLines);

      if (wrappedLines.length > 1 && cursorPosition !== undefined) {
        // Calculate cursor position at end of wrapped text on new line
        const newLineText = wrappedStrings[1] || '';
        setNextFocus({ index: index + 1, position: newLineText.length });
      }
    }, [core, maxCharsPerLine, callOnChange, currentLines]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
      const selection = window.getSelection();
      const cursorPosition = selection ? selection.getRangeAt(0).startOffset : 0;

      if (e.key === 'Enter') {
        e.preventDefault();
        const currentLineText = (e.target as HTMLElement).innerText;
        const textBeforeCursor = currentLineText.substring(0, cursorPosition);
        const textAfterCursor = currentLineText.substring(cursorPosition);
        
        core.replaceLines(index, index + 1, [textBeforeCursor, textAfterCursor]);
        
        // Construct updated lines without calling core.getLines()
        const currentStrings = linesToStrings(currentLines);
        const newCurrentLines = [...currentStrings];
        newCurrentLines.splice(index, 1, textBeforeCursor, textAfterCursor);
        
        setCurrentLines(newCurrentLines);
        callOnChange(newCurrentLines);
        setNextFocus({ index: index + 1, position: 0 });

      } else if (e.key === 'Backspace' && cursorPosition === 0 && index > 0) {
        e.preventDefault();
        const normalizedLines = normalizeLines(currentLines);
        const prevLine = normalizedLines[index - 1];
        const currentLine = normalizedLines[index];
        const joinedText = prevLine.text + currentLine.text;
        
        core.replaceLines(index - 1, index + 1, [joinedText]);
        
        // Construct updated lines without calling core.getLines()
        const currentStrings = linesToStrings(currentLines);
        const newCurrentLines = [...currentStrings];
        newCurrentLines.splice(index - 1, 2, joinedText);
        
        setCurrentLines(newCurrentLines);
        callOnChange(newCurrentLines);
        setNextFocus({ index: index - 1, position: prevLine.text.length });

      } else if (e.key === 'ArrowUp' && index > 0) {
        e.preventDefault();
        lineRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowDown' && index < normalizeLines(currentLines).length - 1) {
        e.preventDefault();
        lineRefs.current[index + 1]?.focus();
      } else if (e.key === '@') {
        if (onMention) {
          onMention(index, e.currentTarget as HTMLElement);
        }
      }
    }, [core, callOnChange, currentLines, onMention]);

    const normalizedLines = normalizeLines(currentLines);

    return (
      <div
        ref={editorRef}
        className={`richline-editor ${showLineNumbers ? 'with-line-numbers' : ''} ${className}`}
        style={{ 
          fontSize: `${12 * zoomLevel}pt`,
          lineHeight: 1.5,
          padding: `${1 * zoomLevel}in`,
          width: `${8.5 * zoomLevel}in`,
          minHeight: `${11 * zoomLevel}in`,
          borderWidth: `${Math.max(1, zoomLevel)}px`,
          boxShadow: `0 0 ${10 * zoomLevel}px rgba(0, 0, 0, 0.1)`,
          maxWidth: `min(${8.5 * zoomLevel}in, calc(100vw - 2rem))`,
          display: showLineNumbers ? 'flex' : 'block'
        }}
      >
        {showLineNumbers && (
          <div 
            className="richline-line-numbers"
            style={{ 
              fontSize: `${12 * zoomLevel}pt`,
              width: `${3 * zoomLevel}em`,
              paddingRight: `${0.5 * zoomLevel}em`,
              marginRight: `${1 * zoomLevel}em`
            }}
          >
            {normalizedLines.map((_, index) => (
              <div key={index} className="line-number">
                {index + 1}
              </div>
            ))}
          </div>
        )}
        <div 
          className={showLineNumbers ? "richline-content" : ""}
          style={showLineNumbers ? { paddingRight: `${1 * zoomLevel}in` } : {}}
        >
          {normalizedLines.map((line, index) => (
            <LineComponent
              key={line.id || index}
              index={index}
              line={line.text}
              disabled={disabled}
              onLineChange={handleLineChange}
              onKeyDown={handleKeyDown}
              setRef={(el) => (lineRefs.current[index] = el)}
            />
          ))}
        </div>
      </div>
    );
  }
);

RichlineEditor.displayName = 'RichlineEditor';

export default RichlineEditor;