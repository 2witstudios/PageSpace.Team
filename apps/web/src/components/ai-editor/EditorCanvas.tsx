import React, { useCallback, useRef, useMemo } from 'react';
import { VariableSizeList } from 'react-window';
import { useEditorStore } from './store';
import useMobile from '@/hooks/use-mobile';
import LineEditor from './LineEditor';
import { LinePosition } from './types';

interface EditorCanvasProps {
  height: number;
  width: number;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({ height, width }) => {
  const isMobile = useMobile();
  const {
    lines,
    cursor,
    selection,
    viewState,
    updateLine,
    splitLine,
    setCursor,
    setSelection,
    mergeLine,
  } = useEditorStore();
  const listRef = useRef<VariableSizeList>(null);


  // This function would calculate dynamic line heights based on content, marks, etc.
  // For now, we'll return a fixed height.
  const getItemSize = useCallback(() => {
    const baseFontSize = isMobile ? 10 : viewState.template.fontSize;
    const baseLineHeight = isMobile ? 1.4 : viewState.template.lineHeight;
    return baseFontSize * baseLineHeight * 1.5;
  }, [isMobile, viewState.template]);

  const handleLineChange = useCallback((lineIndex: number, newText: string) => {
    updateLine(lineIndex, newText);
  }, [updateLine]);

  const handleCursorChange = useCallback((lineIndex: number, charIndex: number) => {
    setCursor(lineIndex, charIndex);
  }, [setCursor]);

  const handleSelectionChange = useCallback((start: LinePosition, end: LinePosition) => {
    setSelection(start, end);
  }, [setSelection]);

  const LineRenderer = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const line = lines[index];
      if (!line) return null;

      const isCurrentLine = cursor.lineIndex === index;
      const isSelectionStart = selection?.start.lineIndex === index;
      const isSelectionEnd = selection?.end.lineIndex === index;

      return (
        <div style={style} className="relative">
          <LineEditor
            key={line.id}
            line={line}
            lineIndex={index}
            pageNumber={line.pageNumber}
            lineOnPage={line.lineOnPage}
            isCurrentLine={isCurrentLine}
            isSelectionStart={isSelectionStart}
            isSelectionEnd={isSelectionEnd}
            onLineChange={handleLineChange}
            onCursorChange={handleCursorChange}
            onSelectionChange={handleSelectionChange}
            onSplitLine={splitLine}
            onMergeLine={mergeLine}
          />
        </div>
      );
    },
    [lines, cursor, selection, handleLineChange, handleCursorChange, handleSelectionChange, splitLine, mergeLine]
  );

  const editorStyle = useMemo(() => ({
    fontFamily: viewState.template.fontFamily,
    fontSize: isMobile ? '14px' : `${viewState.template.fontSize}pt`,
    lineHeight: isMobile ? 1.4 : viewState.template.lineHeight,
    transform: `scale(${viewState.zoomLevel})`,
    transformOrigin: 'top left',
    width: isMobile ? '100%' : `${width / viewState.zoomLevel}px`,
    margin: isMobile ? '0' : 'auto',
  }), [isMobile, viewState, width]);

  return (
    <div
      className="editor-canvas relative flex-1 overflow-hidden"
      style={editorStyle}
      tabIndex={0} // Make the container focusable for keyboard events
    >
      <VariableSizeList
        ref={listRef}
        height={height}
        width={width}
        itemCount={lines.length}
        itemSize={getItemSize}
        overscanCount={10} // Render more items than visible for smoother scrolling
      >
        {LineRenderer}
      </VariableSizeList>
    </div>
  );
};

export default EditorCanvas;