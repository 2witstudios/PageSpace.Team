"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { RichlineEditor, initializeWasm, type LinesInput } from '@pagespace/richline-editor';
import '@pagespace/richline-editor/src/RichlineEditor.css';
import { TreePage } from '@/hooks/usePageTree';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from 'use-debounce';

interface NoteViewProps {
  page: TreePage;
}

// Helper function to extract lines from page content
function getInitialLines(content: unknown): LinesInput {
  if (!content) return [''];
  
  if (Array.isArray(content)) {
    return content;
  }
  
  if (typeof content === 'string') {
    return content.split('\n');
  }
  
  // Handle object content - try to extract lines
  if (typeof content === 'object' && content !== null && 'lines' in content) {
    return (content as { lines: LinesInput }).lines;
  }
  
  return [''];
}

export default function NoteView({ page }: NoteViewProps) {
  const [wasmInitialized, setWasmInitialized] = useState(false);
  const [wasmError, setWasmError] = useState<string | null>(null);
  const [lines, setLines] = useState<LinesInput>(() => getInitialLines(page.content));

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
      <div className="flex-1 p-4">
        <RichlineEditor
          lines={lines}
          onChange={handleChange}
          maxCharsPerLine={80}
          placeholder="Start writing your note..."
          className="min-h-96"
        />
      </div>
    </div>
  );
}