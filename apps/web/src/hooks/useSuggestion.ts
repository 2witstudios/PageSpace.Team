import { create } from 'zustand';
import { Editor } from '@tiptap/core';
import { MentionSuggestion, MentionType } from '@/types/mentions';

interface SuggestionState {
  isOpen: boolean;
  editor: Editor | null;
  position: { top: number; left: number; width?: number } | null;
  query: string;
  items: MentionSuggestion[];
  command: ((suggestion: MentionSuggestion) => void) | null;
  allowedTypes: MentionType[];
  
  open: (
    editor: Editor | null,
    position: { top: number; left: number; width?: number },
    query: string,
    command: (suggestion: MentionSuggestion) => void,
    allowedTypes?: MentionType[]
  ) => void;
  close: () => void;
  setItems: (items: MentionSuggestion[]) => void;
  setAllowedTypes: (types: MentionType[]) => void;
}

export const useSuggestionStore = create<SuggestionState>((set) => ({
  isOpen: false,
  editor: null,
  position: null,
  query: '',
  items: [],
  command: null,
  allowedTypes: ['page', 'user', 'ai-page', 'ai-assistant', 'channel'],

  open: (editor, position, query, command, allowedTypes = ['page', 'user', 'ai-page', 'ai-assistant', 'channel']) => 
    set({ isOpen: true, editor, position, query, command, allowedTypes }),
  close: () => set({ 
    isOpen: false, 
    editor: null, 
    position: null, 
    query: '', 
    items: [], 
    command: null, 
    allowedTypes: ['page', 'user', 'ai-page', 'ai-assistant', 'channel'] 
  }),
  setItems: (items) => set({ items }),
  setAllowedTypes: (types) => set({ allowedTypes: types }),
}));