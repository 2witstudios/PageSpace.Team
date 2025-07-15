"use client";

import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Mention } from '@/components/mentions/Mention';
import { useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TiptapRendererProps {
  content: string | JSONContent;
  context?: 'message';
}

export default function TiptapRenderer({ content, context }: TiptapRendererProps) {
  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      Mention,
    ],
  });

  const parsedContent = useMemo(() => {
    if (typeof content === 'string') {
      try {
        return JSON.parse(content);
      } catch {
        return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: content }] }] };
      }
    }
    return content;
  }, [content]);

  useEffect(() => {
    if (editor && parsedContent) {
      editor.commands.setContent(parsedContent);
    }
  }, [editor, parsedContent]);

  return (
    <EditorContent
      editor={editor}
      className={cn(
        "max-w-none [&_.ProseMirror]:p-0 [&_.ProseMirror]:outline-none",
        context === 'message' 
          ? "message-content inline" 
          : "inline-block [&_.ProseMirror_>*]:m-0"
      )}
    />
  );
}