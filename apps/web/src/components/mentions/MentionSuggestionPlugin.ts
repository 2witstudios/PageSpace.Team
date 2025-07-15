import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { mentionSystem } from '@/lib/mention-system';
import { useSuggestionStore } from '@/hooks/useSuggestion';
import TiptapMentionAdapter from './TiptapMentionAdapter';

export const mentionSuggestionPluginKey = new PluginKey('mention-suggestion');

export const MentionSuggestion = Extension.create({
  name: 'mentionSuggestion',

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: mentionSuggestionPluginKey,

        view() {
          return {
            update: (view: EditorView, prevState) => {
              const prev = mentionSuggestionPluginKey.getState(prevState);
              const next = mentionSuggestionPluginKey.getState(view.state);

              if (!prev?.active && next?.active) {
                const adapter = new TiptapMentionAdapter(editor);
                const anchor = view.dom.closest('[data-suggestion-anchor]') as HTMLElement;
                if (anchor) {
                  const rect = anchor.getBoundingClientRect();
                  useSuggestionStore.getState().open(
                    editor,
                    { top: rect.top, left: rect.left, width: rect.width },
                    next.query ?? '',
                    (suggestion) => {
                      adapter.insert(suggestion);
                    }
                  );
                }
                if (next.query !== null) {
                  mentionSystem.search(next.query);
                }
              } else if (prev?.active && next?.active && prev.query !== next.query) {
                if (next.query !== null) {
                  mentionSystem.search(next.query);
                }
              } else if (prev?.active && !next?.active) {
                useSuggestionStore.getState().close();
              }
            },
          };
        },

        state: {
          init() {
            return {
              active: false,
              range: { from: 0, to: 0 },
              query: null as string | null,
            };
          },
          apply(tr, prev) {
            const { selection } = tr;
            const next = { ...prev };

            const { $from } = selection;
            const text = $from.doc.textBetween($from.start(), $from.pos);
            const match = /@([^\s@]*)?$/.exec(text);

            if (match) {
              const [fullMatch, query] = match;
              const from = $from.start() + match.index;
              const to = from + fullMatch.length;

              next.active = true;
              next.range = { from, to };
              next.query = query;
            } else {
              next.active = false;
            }

            if (!tr.docChanged && !tr.selectionSet) {
                if(prev.active === next.active) return prev;
            }

            return next;
          },
        },
      }),
    ];
  },
});