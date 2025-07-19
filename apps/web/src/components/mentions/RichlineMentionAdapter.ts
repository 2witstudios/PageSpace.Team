import { RichlineEditorRef } from '@pagespace/richline-editor';
import { mentionSystem } from '@/lib/mention-system';
import { MentionSuggestion, MentionType } from '@/types/mentions';
import { useSuggestionStore } from '@/hooks/useSuggestion';

class RichlineMentionAdapter {
  private editorRef: React.RefObject<RichlineEditorRef>;
  private allowedTypes?: MentionType[];

  constructor(editorRef: React.RefObject<RichlineEditorRef>, allowedTypes?: MentionType[]) {
    this.editorRef = editorRef;
    this.allowedTypes = allowedTypes;
  }

  public onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === '@') {
      const element = event.currentTarget;
      const selection = window.getSelection();
      if (selection) {
        const cursorPos = selection.getRangeAt(0).startOffset;
        mentionSystem.trigger(element, cursorPos, this.allowedTypes);
      }
    }
  }

  public insert(suggestion: MentionSuggestion) {
    if (this.editorRef.current) {
      const { query } = useSuggestionStore.getState();
      const selection = window.getSelection();
      if (selection) {
        const range = selection.getRangeAt(0);
        const node = range.startContainer;
        const lineEl = node.parentElement;
        if (lineEl && lineEl.parentElement) {
            const lineIndex = Array.from(lineEl.parentElement.children).indexOf(lineEl);
            const start = range.startOffset - (query.length + 1);
            const end = range.startOffset;
            this.editorRef.current.replaceText(lineIndex, start, end, `@[${suggestion.label}](${suggestion.id})`);
        }
      }
    }
  }
}

export default RichlineMentionAdapter;