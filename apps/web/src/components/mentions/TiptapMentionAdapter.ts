import { Editor } from '@tiptap/core';
import { mentionSystem } from '@/lib/mention-system';
import { MentionSuggestion, MentionType } from '@/types/mentions';
import { mentionSuggestionPluginKey } from './MentionSuggestionPlugin';

class TiptapMentionAdapter {
  private editor: Editor;
  private allowedTypes?: MentionType[];

  constructor(editor: Editor, allowedTypes?: MentionType[]) {
    this.editor = editor;
    this.allowedTypes = allowedTypes;
  }

  public onKeyDown(event: KeyboardEvent) {
    console.log('TiptapMentionAdapter.onKeyDown', event.key);
    if (event.key === '@') {
      const { selection } = this.editor.state;
      const element = this.editor.view.domAtPos(selection.from).node as HTMLElement;
      mentionSystem.trigger(element, selection.from, this.allowedTypes);
    }
  }

  public insert(suggestion: MentionSuggestion) {
    const { range } = mentionSuggestionPluginKey.getState(this.editor.state);
    if (!range) return;

    this.editor
      .chain()
      .focus()
      .insertContentAt(range, [
        {
          type: 'mention',
          attrs: {
            id: suggestion.id,
            label: suggestion.label,
            type: suggestion.type,
            data: suggestion.data,
          },
        },
        {
          type: 'text',
          text: ' ',
        },
      ])
      .run();
  }
}

export default TiptapMentionAdapter;