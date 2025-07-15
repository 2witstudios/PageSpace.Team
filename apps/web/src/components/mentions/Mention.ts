import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import MentionComponent from './MentionComponent';

export const Mention = Node.create({
  name: 'mention',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-id'),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }
          return {
            'data-id': attributes.id,
          };
        },
      },
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-label'),
        renderHTML: (attributes) => {
          if (!attributes.label) {
            return {};
          }
          return {
            'data-label': attributes.label,
          };
        },
      },
      type: {
        default: 'page',
        parseHTML: (element) => element.getAttribute('data-type') || 'page',
        renderHTML: (attributes) => {
          return {
            'data-type': attributes.type || 'page',
          };
        },
      },
      data: {
        default: {},
        parseHTML: (element) => {
          const dataAttr = element.getAttribute('data-mention-data');
          try {
            return dataAttr ? JSON.parse(dataAttr) : {};
          } catch {
            return {};
          }
        },
        renderHTML: (attributes) => {
          if (!attributes.data || Object.keys(attributes.data).length === 0) {
            return {};
          }
          return {
            'data-mention-data': JSON.stringify(attributes.data),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MentionComponent);
  },
});