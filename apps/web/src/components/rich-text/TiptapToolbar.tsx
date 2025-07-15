"use client";

import { Editor } from '@tiptap/react';
import { Bold, Italic, Strikethrough, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TiptapToolbarProps {
  editor: Editor | null;
}

export default function TiptapToolbar({ editor }: TiptapToolbarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 p-1 border-b">
      <Button
        size="sm"
        variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant={editor.isActive('code') ? 'secondary' : 'ghost'}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="h-4 w-4" />
      </Button>
    </div>
  );
}