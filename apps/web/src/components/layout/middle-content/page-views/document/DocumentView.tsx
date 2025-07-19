"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { RichlineEditor, initializeWasm, type LinesInput, RichlineEditorRef } from '@pagespace/richline-editor';
import '@pagespace/richline-editor/src/RichlineEditor.css';
import { TreePage } from '@/hooks/usePageTree';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from 'use-debounce';
import RichlineMentionAdapter from '@/components/mentions/RichlineMentionAdapter';
import { mentionSystem } from '@/lib/mention-system';
import { useSuggestionStore } from '@/hooks/useSuggestion';

interface DocumentViewProps {
  page: TreePage;
}

// Helper function to extract lines from page content
function getInitialLines(content: unknown): LinesInput {
  if (!content) return [''];
  
  // Handle Richline format (string array)
  if (Array.isArray(content)) {
    return content;
  }
  
  // Handle plain string
  if (typeof content === 'string') {
    return content.split('\n');
  }
  
  // Handle object content
  if (typeof content === 'object' && content !== null) {
    // Check for Richline wrapper format
    if ('lines' in content) {
      return (content as { lines: LinesInput }).lines;
    }
  }
  
  return [''];
}

export default function DocumentView({ page }: DocumentViewProps) {
  const [wasmInitialized, setWasmInitialized] = useState(false);
  const [wasmError, setWasmError] = useState<string | null>(null);
  const [lines, setLines] = useState<LinesInput>(() => getInitialLines(page.content));
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const editorRef = useRef<RichlineEditorRef>(null);

  const mentionAdapter = useMemo(() => {
    return new RichlineMentionAdapter(editorRef as React.RefObject<RichlineEditorRef>);
  }, []);

  const [debouncedLines] = useDebounce(lines, 1000);

  // Initialize WASM on component mount
  useEffect(() => {
    const initWasm = async () => {
      try {
        await initializeWasm();
        setWasmInitialized(true);
      } catch (error) {
        console.error('Failed to initialize WASM:', error);
        setWasmError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    initWasm();
  }, []);

  // Save content to server
  const saveContent = useCallback(async (newLines: LinesInput) => {
    if (page) {
      try {
        await fetch(`/api/pages/${page.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newLines }),
        });
      } catch (error) {
        console.error('Failed to save page content:', error);
      }
    }
  }, [page]);

  // Auto-save debounced changes
  useEffect(() => {
    if (debouncedLines && page && JSON.stringify(debouncedLines) !== JSON.stringify(getInitialLines(page.content))) {
      saveContent(debouncedLines);
    }
  }, [debouncedLines, page, saveContent]);

  // Update local state when page content changes
  useEffect(() => {
    const pageLines = getInitialLines(page.content);
    if (JSON.stringify(pageLines) !== JSON.stringify(lines)) {
      setLines(pageLines);
    }
  }, [page.content, lines]);

  // Handle content changes
  const handleChange = useCallback((newLines: LinesInput) => {
    setLines(newLines);
  }, []);

  const handleMention = useCallback((_lineIndex: number, element: HTMLElement) => {
    const selection = window.getSelection();
    if (selection && mentionAdapter) {
      const cursorPos = selection.getRangeAt(0).startOffset;
      const rect = mentionSystem.getCursorRect(element, cursorPos);
      const query = mentionSystem.findQuery(element.textContent || '', cursorPos);
      
      if (query !== null) {
        useSuggestionStore.getState().open(
          null,
          { top: rect.bottom, left: rect.left },
          query,
          (suggestion) => mentionAdapter.insert(suggestion),
        );
        mentionSystem.search(query);
      }
    }
  }, [mentionAdapter]);

  // Show loading state while WASM initializes
  if (!wasmInitialized) {
    if (wasmError) {
      return (
        <div className="p-4">
          <div className="text-red-600 mb-2">Failed to initialize editor</div>
          <div className="text-sm text-gray-600">{wasmError}</div>
          <div className="text-sm text-gray-500 mt-2">
            Please refresh the page to try again.
          </div>
        </div>
      );
    }
    
    return (
      <div className="p-4">
        <div className="mb-2">Loading editor...</div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-2 border-b bg-background">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Zoom:</span>
            <button 
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
            >
              -
            </button>
            <span className="text-sm min-w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
            <button 
              onClick={() => setZoomLevel(Math.min(2.0, zoomLevel + 0.1))}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
            >
              +
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">
              <input
                type="checkbox"
                checked={showLineNumbers}
                onChange={(e) => setShowLineNumbers(e.target.checked)}
                className="mr-1"
              />
              Line Numbers
            </label>
          </div>
        </div>
      </div>
      <div className="flex-1 flex justify-center items-start p-4 overflow-auto">
        <RichlineEditor
          ref={editorRef}
          lines={lines}
          onChange={handleChange}
          onMention={handleMention}
          maxCharsPerLine={80}
          zoomLevel={zoomLevel}
          showLineNumbers={showLineNumbers}
          placeholder="Start writing your document..."
        />
      </div>
    </div>
  );
}