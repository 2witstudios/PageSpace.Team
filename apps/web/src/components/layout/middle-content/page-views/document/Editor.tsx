"use client";

import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState, useCallback } from 'react';
import { useDriveStore } from '@/hooks/useDrive';
import { useDebounce } from 'use-debounce';
import Toolbar from './Toolbar';
import { Mention } from '@/components/mentions/Mention';
import { MentionSuggestion } from '@/components/mentions/MentionSuggestionPlugin';
import { TreePage } from '@/hooks/usePageTree';

interface EditorProps {
  page: TreePage;
}

const Editor = ({ page }: EditorProps) => {
  useDriveStore();
  const [content, setContent] = useState<JSONContent | string>((page?.content as JSONContent) || '');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        dropcursor: {
          color: '#555',
          width: 2,
        },
      }),
      Mention,
      MentionSuggestion,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      setContent(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
      transformPastedHTML(html) {
        // You can add more complex sanitization here if needed.
        // This basic version removes script and style tags.
        const clean = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/g, '')
                         .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/g, '');
        return clean;
      },
    },
    editable: !!page,
  });

  const [debouncedContent] = useDebounce(content, 1000);

  const saveContent = useCallback(async (newContent: JSONContent) => {
    if (page) {
      await fetch(`/api/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });
    }
  }, [page]);

  useEffect(() => {
    if (debouncedContent && page && JSON.stringify(debouncedContent) !== JSON.stringify(page.content)) {
      saveContent(debouncedContent as JSONContent);
    }
  }, [debouncedContent, page, saveContent]);

  useEffect(() => {
    if (editor && page?.content && JSON.stringify(page.content) !== JSON.stringify(editor.getJSON())) {
      editor.commands.setContent(page.content as JSONContent, { emitUpdate: false });
    }
  }, [editor, page]);


  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <Toolbar editor={editor} />
      <div className="w-full flex-grow overflow-y-auto pt-8">
        <div className="max-w-4xl mx-auto">
            <EditorContent editor={editor} className="ProseMirror" />
        </div>
      </div>
    </div>
  );
};

export default Editor;