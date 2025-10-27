import { Mark, mergeAttributes } from '@tiptap/core';

export const LocationHighlightExtension = Mark.create({
  name: 'locationHighlight',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-location-id]',
        getAttrs: (node) => {
          const element = node as HTMLElement;
          const locationId = element.getAttribute('data-location-id');
          const locationName = element.getAttribute('data-location-name');
          const style = element.getAttribute('style');
          const colorMatch = style?.match(/color:\s*([^;]+)/);
          const color = colorMatch ? colorMatch[1].trim() : '';
          
          return locationId ? { locationId, locationName, color } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, mark }) {
    if (!mark?.attrs?.locationId) {
      return false;
    }

    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-location-id': mark.attrs.locationId,
        'data-location-name': mark.attrs.locationName || '',
        'style': `color: ${mark.attrs.color || '#000'}; text-decoration: underline; cursor: pointer;`,
        class: 'location-highlight',
      }),
      0,
    ];
  },

  addAttributes() {
    return {
      locationId: {
        default: null,
        parseHTML: element => element.getAttribute('data-location-id'),
        renderHTML: attributes => {
          if (!attributes.locationId) {
            return {};
          }
          return {
            'data-location-id': attributes.locationId,
          };
        },
      },
      locationName: {
        default: null,
        parseHTML: element => element.getAttribute('data-location-name'),
        renderHTML: attributes => {
          if (!attributes.locationName) {
            return {};
          }
          return {
            'data-location-name': attributes.locationName,
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

export default LocationHighlightExtension;

