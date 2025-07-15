"use client";

import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useState } from 'react';
import { Mention } from '@/components/mentions/Mention';
import { MentionSuggestion } from '@/components/mentions/MentionSuggestionPlugin';
import { MentionType } from '@/types/mentions';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import TiptapToolbar from '@/components/rich-text/TiptapToolbar';
import { useSuggestionStore } from '@/hooks/useSuggestion';

interface TiptapChatInputProps {
  onSubmit: (content: JSONContent | string) => void;
  placeholder?: string;
  allowedMentionTypes?: MentionType[];
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  showToolbar?: boolean;
}

const TiptapChatInput = ({
  onSubmit,
  placeholder = "Type your message...",
  allowedMentionTypes = ['page', 'user', 'ai-page', 'ai-assistant', 'channel'], // eslint-disable-line @typescript-eslint/no-unused-vars
  disabled = false,
  className,
  autoFocus = false,
  showToolbar = false,
}: TiptapChatInputProps) => {
  const [isEmpty, setIsEmpty] = useState(true);
  const { isOpen: isSuggestionOpen } = useSuggestionStore();

  // Note: allowedMentionTypes will be used for filtering mention suggestions in future enhancement

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable unnecessary features for chat input
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        listItem: false,
        orderedList: false,
        bulletList: false,
        dropcursor: {
          color: '#555',
          width: 2,
        },
        // Basic formatting like bold, italic, etc. is enabled by default in StarterKit.
      }),
      Mention,
      MentionSuggestion,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setIsEmpty(editor.isEmpty);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none',
          'min-h-[40px] max-h-[120px] overflow-y-auto',
          'px-3 py-2',
          disabled && 'opacity-50 cursor-not-allowed'
        ),
        placeholder,
      },
      handleKeyDown: (view, event) => {
        // Handle Enter key for submission, but only if suggestion popup is not open
        if (event.key === 'Enter' && !event.shiftKey && !isSuggestionOpen) {
          event.preventDefault();
          handleSubmit();
          return true;
        }
        return false;
      },
    },
    editable: !disabled,
    autofocus: autoFocus,
  });

  const handleSubmit = useCallback(() => {
    if (!editor || isEmpty || disabled) return;

    const currentContent = editor.getJSON();
    onSubmit(currentContent);
    
    // Clear the editor after submission
    editor.commands.clearContent();
    setIsEmpty(true);
  }, [editor, isEmpty, disabled, onSubmit]);

  const handleButtonSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  // Focus editor when component mounts if autoFocus is true
  useEffect(() => {
    if (editor && autoFocus) {
      editor.commands.focus();
    }
  }, [editor, autoFocus]);

  if (!editor) {
    return (
      <div className={cn(
        "flex items-center border rounded-lg",
        "bg-background",
        className
      )}>
        <div className="flex-1 px-3 py-2 text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative flex flex-col border rounded-lg",
      "bg-background focus-within:ring-2 focus-within:ring-ring",
      disabled && "opacity-50",
      className
    )} data-suggestion-anchor>
      {showToolbar && <TiptapToolbar editor={editor} />}
      <div className="flex items-end gap-2">
        <div className="flex-1 min-w-0">
          <EditorContent
            editor={editor}
            className="prose-sm"
          />
        </div>
        
        <Button
          type="submit"
          size="sm"
          onClick={handleButtonSubmit}
          disabled={disabled || isEmpty}
          className="m-1 h-8 w-8 p-0"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  );
};

export default TiptapChatInput;