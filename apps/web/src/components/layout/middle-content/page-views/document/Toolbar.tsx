"use client";

import { Editor } from '@tiptap/react';
import {
  Bold,
  Strikethrough,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

type Props = {
  editor: Editor | null;
};

const Toolbar = ({ editor }: Props) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="px-4 py-2 flex justify-center items-center bg-card border-b border-border w-full">
      <div className="flex gap-1 items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'bg-primary text-primary-foreground p-2 rounded-lg' : 'p-2 hover:bg-accent hover:text-accent-foreground rounded-lg'}
              >
                <Bold className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bold</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'bg-primary text-primary-foreground p-2 rounded-lg' : 'p-2 hover:bg-accent hover:text-accent-foreground rounded-lg'}
              >
                <Italic className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Italic</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={editor.isActive('strike') ? 'bg-primary text-primary-foreground p-2 rounded-lg' : 'p-2 hover:bg-accent hover:text-accent-foreground rounded-lg'}
              >
                <Strikethrough className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Strikethrough</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Separator orientation="vertical" className="h-6 mx-2" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? 'bg-primary text-primary-foreground p-2 rounded-lg' : 'p-2 hover:bg-accent hover:text-accent-foreground rounded-lg'}
              >
                <Heading1 className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Heading 1</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground p-2 rounded-lg' : 'p-2 hover:bg-accent hover:text-accent-foreground rounded-lg'}
              >
                <Heading2 className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Heading 2</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? 'bg-primary text-primary-foreground p-2 rounded-lg' : 'p-2 hover:bg-accent hover:text-accent-foreground rounded-lg'}
              >
                <Heading3 className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Heading 3</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Separator orientation="vertical" className="h-6 mx-2" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'bg-primary text-primary-foreground p-2 rounded-lg' : 'p-2 hover:bg-accent hover:text-accent-foreground rounded-lg'}
              >
                <List className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bullet List</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'bg-primary text-primary-foreground p-2 rounded-lg' : 'p-2 hover:bg-accent hover:text-accent-foreground rounded-lg'}
              >
                <ListOrdered className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Numbered List</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default Toolbar;