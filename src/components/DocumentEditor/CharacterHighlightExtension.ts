import { Mark, mergeAttributes } from '@tiptap/core';

export const CharacterHighlightExtension = Mark.create({
  name: 'characterHighlight',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-character-id]',
        getAttrs: (node) => {
          const element = node as HTMLElement;
          const characterId = element.getAttribute('data-character-id');
          const characterName = element.getAttribute('data-character-name');
          const style = element.getAttribute('style');
          const colorMatch = style?.match(/color:\s*([^;]+)/);
          const color = colorMatch ? colorMatch[1].trim() : '';
          
          return characterId ? { characterId, characterName, color } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, mark }) {
    if (!mark?.attrs?.characterId) {
      return false;
    }

    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-character-id': mark.attrs.characterId,
        'data-character-name': mark.attrs.characterName || '',
        'style': `color: ${mark.attrs.color || '#000'}; text-decoration: underline; cursor: pointer;`,
        class: 'character-highlight',
      }),
      0,
    ];
  },

  addAttributes() {
    return {
      characterId: {
        default: null,
        parseHTML: element => element.getAttribute('data-character-id'),
        renderHTML: attributes => {
          if (!attributes.characterId) {
            return {};
          }
          return {
            'data-character-id': attributes.characterId,
          };
        },
      },
      characterName: {
        default: null,
        parseHTML: element => element.getAttribute('data-character-name'),
        renderHTML: attributes => {
          if (!attributes.characterName) {
            return {};
          }
          return {
            'data-character-name': attributes.characterName,
          };
        },
      },
      color: {
        default: null,
        parseHTML: element => {
          const style = element.getAttribute('style');
          const colorMatch = style?.match(/color:\s*([^;]+)/);
          return colorMatch ? colorMatch[1].trim() : null;
        },
        renderHTML: attributes => {
          if (!attributes.color) {
            return {};
          }
          return {
            style: `color: ${attributes.color}; text-decoration: underline; cursor: pointer;`,
          };
        },
      },
    };
  },
});

export default CharacterHighlightExtension;

