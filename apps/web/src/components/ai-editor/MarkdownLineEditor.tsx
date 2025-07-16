import React, { useRef, useCallback } from 'react';
import { Line, LinePosition } from './types';
import { useEditorStore } from './store';
import { cn } from '@/lib/utils';
import { markdownToRichText } from '@/lib/markdown-conversion';

interface MarkdownLineEditorProps {
  line: Line;
  lineIndex: number;
  isCurrentLine: boolean;
  isSelectionStart: boolean;
  isSelectionEnd: boolean;
  onLineChange: (lineIndex: number, newMarkdownText: string) => void;
  onCursorChange: (lineIndex: number, charIndex: number) => void;
  onSelectionChange: (start: LinePosition, end: LinePosition) => void;
  onSplitLine: (lineIndex: number, charIndex: number) => void;
  onMergeLine: (lineIndex: number) => void;
}

const MarkdownLineEditor: React.FC<MarkdownLineEditorProps> = ({
  line,
  lineIndex,
  isCurrentLine,
  onLineChange,
  onSplitLine,
  onMergeLine,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const { viewState, handleAutoWrap, setTyping } = useEditorStore();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const debouncedUpdate = useCallback((lineIndex: number, newText: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    setTyping(true);
    debounceTimeout.current = setTimeout(() => {
      onLineChange(lineIndex, newText);
      handleAutoWrap(lineIndex, newText);
      setTyping(false);
    }, 500);
  }, [onLineChange, handleAutoWrap, setTyping]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.innerText;
    debouncedUpdate(lineIndex, newText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const selection = window.getSelection();
      const charIndex = selection ? selection.focusOffset : 0;
      onSplitLine(lineIndex, charIndex);
    } else if (e.key === 'Backspace') {
      const selection = window.getSelection();
      if (selection && selection.focusOffset === 0) {
        e.preventDefault();
        onMergeLine(lineIndex);
      }
    }
  };

  const renderRichContent = () => {
    const { displayText, marks } = markdownToRichText(line.markdownText);
    
    if (!marks || marks.length === 0) {
      return <span>{displayText}</span>;
    }
    
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    
    marks.forEach((mark, index) => {
      if (mark.start > lastIndex) {
        elements.push(<span key={`text-${index}`}>{displayText.substring(lastIndex, mark.start)}</span>);
      }
      const content = displayText.substring(mark.start, mark.end);
      switch (mark.type) {
        case 'bold':
          elements.push(<strong key={`mark-${index}`} className="font-bold">{content}</strong>);
          break;
        case 'italic':
          elements.push(<em key={`mark-${index}`} className="italic">{content}</em>);
          break;
        case 'mention':
          elements.push(
            <span
              key={`mark-${index}`}
              className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                "transition-all duration-200 cursor-pointer",
                mark.metadata?.mentionType === 'user'
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/30"
              )}
              title={`${mark.metadata?.mentionType}: ${mark.metadata?.mentionId}`}
            >
              {content}
            </span>
          );
          break;
        default:
          elements.push(<span key={`mark-${index}`}>{content}</span>);
      }
      lastIndex = mark.end;
    });
    
    if (lastIndex < displayText.length) {
      elements.push(<span key="text-end">{displayText.substring(lastIndex)}</span>);
    }
    
    return <>{elements}</>;
  };

  const lineOnPage = (lineIndex % viewState.template.linesPerPage) + 1;

  return (
    <div
      className={cn(
        'flex items-center group py-0.5 px-2 transition-colors',
        isCurrentLine ? 'bg-gray-100 dark:bg-gray-800' : '',
        'hover:bg-gray-50 dark:hover:bg-gray-850'
      )}
    >
      <div className="text-xs text-gray-400 dark:text-gray-600 mr-4 w-8 text-right select-none">
        {lineOnPage}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="flex-1 outline-none font-mono text-sm cursor-text"
      >
        {renderRichContent()}
      </div>
    </div>
  );
};

export default MarkdownLineEditor;