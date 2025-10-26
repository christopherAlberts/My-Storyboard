import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db, Character } from '../../database/schema';

interface CharacterHighlightingProps {
  quillRef: React.RefObject<any>;
}

const CharacterHighlighting: React.FC<CharacterHighlightingProps> = ({ quillRef }) => {
  const { characterRecognitionEnabled, characterNameCapitalization } = useAppStore();
  const [characters, setCharacters] = React.useState<Character[]>([]);
  const isTypingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const highlightedNodesRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const loadCharacters = async () => {
      const chars = await db.characters.toArray();
      setCharacters(chars);
    };
    loadCharacters();
  }, []);

  useEffect(() => {
    if (!characterRecognitionEnabled || !quillRef.current || characters.length === 0) {
      return;
    }

    const quill = quillRef.current.getEditor();
    if (!quill) return;

    // Helper function to apply capitalization (inside useEffect to get latest value)
    const applyCapitalization = (text: string) => {
      switch (characterNameCapitalization) {
        case 'uppercase':
          return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
        case 'lowercase':
          return text.toLowerCase();
        case 'leave-as-is':
          return text;
        default:
          return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      }
    };

    // Create a CSS style for highlighted characters
    const styleId = 'character-recognition-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .ql-editor .character-name-hl {
          cursor: pointer !important;
          text-decoration: underline !important;
          border-radius: 2px;
        }
        .ql-editor .character-name-hl:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
      `;
      document.head.appendChild(style);
    }

    const removeHighlighting = () => {
      highlightedNodesRef.current.forEach(node => {
        if (node.parentNode) {
          node.parentNode.replaceChild(
            document.createTextNode(node.textContent || ''),
            node
          );
        }
      });
      highlightedNodesRef.current = [];
    };

    const attachEventListeners = (editorElement: HTMLElement) => {
      // Find all character highlights and attach event listeners
      const highlightedSpans = editorElement.querySelectorAll('.character-name-hl');
      
      highlightedSpans.forEach((span) => {
        const characterId = parseInt(span.getAttribute('data-character-id') || '0');
        const character = characters.find(c => c.id === characterId);
        
        if (!character) return;
        
        // Remove old listeners if any
        const newSpan = span.cloneNode(true);
        span.parentNode?.replaceChild(newSpan, span);
        
        // Attach mouse enter
        newSpan.addEventListener('mouseenter', (e: Event) => {
          const mouseEvent = e as MouseEvent;
          (window as any).showCharacterTooltip?.(mouseEvent, characterId);
        });
        
        // Attach mouse leave
        newSpan.addEventListener('mouseleave', () => {
          (window as any).hideCharacterTooltip?.();
        });
        
        // Attach click
        newSpan.addEventListener('click', (e: Event) => {
          const mouseEvent = e as MouseEvent;
          mouseEvent.preventDefault();
          mouseEvent.stopPropagation();
          (window as any).openCharacterDatabase?.(mouseEvent, characterId);
        });
      });
    };

    const applyHighlighting = () => {
      try {
        const editor = quill.root;
        if (!editor || isTypingRef.current) return;

        // Get the plain text content
        const plainText = quill.getText();
        if (!plainText) return;

        // Remove any existing highlights
        removeHighlighting();

        // Create a working copy to process
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = quill.root.innerHTML;

        // Process each character
        characters.forEach(character => {
          if (!character.color || !character.name) return;

          // Find all text nodes in the working copy
          const walker = document.createTreeWalker(
            tempDiv,
            NodeFilter.SHOW_TEXT
          );

          const textNodes: Text[] = [];
          let node;
          while ((node = walker.nextNode())) {
            if (node instanceof Text) {
              textNodes.push(node);
            }
          }

          // Process each text node
          textNodes.forEach(textNode => {
            const text = textNode.textContent || '';
            if (!text) return;

            // Skip if already highlighted
            if (textNode.parentElement?.classList.contains('character-name-hl')) {
              return;
            }

            // Check if this character name exists in the text
            const regex = new RegExp(`\\b${character.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            if (!regex.test(text)) return;

            // Split the text and wrap matches
            const parts = text.split(regex);
            if (parts.length <= 1) return;

            // Create document fragment
            const fragment = document.createDocumentFragment();
            
            // Add the parts and matches
            for (let i = 0; i < parts.length; i++) {
              // Add text part
              if (parts[i]) {
                fragment.appendChild(document.createTextNode(parts[i]));
              }
              
              // Add character name span between parts (except last)
              if (i < parts.length - 1) {
                const span = document.createElement('span');
                span.className = 'character-name-hl';
                span.style.color = character.color;
                span.dataset.characterId = character.id?.toString() || '';
                span.dataset.characterName = character.name;
                // Apply capitalization based on setting
                span.textContent = applyCapitalization(character.name);
                fragment.appendChild(span);
              }
            }

            // Replace the text node with the fragment
            textNode.parentNode?.replaceChild(fragment, textNode);
          });
        });

        // Update the editor with the highlighted content
        const selection = quill.getSelection();
        const newHTML = tempDiv.innerHTML;
        
        if (newHTML !== editor.innerHTML) {
          // Update the content
          editor.innerHTML = newHTML;
          
          // Attach event listeners to the new spans in the editor
          attachEventListeners(editor);
          
          // Restore selection if it exists
          if (selection) {
            setTimeout(() => quill.setSelection(selection.index || 0, selection.length || 0), 10);
          }
        }
      } catch (err) {
        console.error('Error applying highlighting:', err);
      }
    };

    const handleTextChange = () => {
      isTypingRef.current = true;
      removeHighlighting();

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        applyHighlighting();
      }, 1500); // Wait 1.5 seconds after user stops typing
    };

    quill.on('text-change', handleTextChange);

    // Initial highlighting
    const initialTimeout = setTimeout(() => {
      if (!isTypingRef.current) {
        applyHighlighting();
      }
    }, 2000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      clearTimeout(initialTimeout);
      quill.off('text-change', handleTextChange);
      removeHighlighting();
      isTypingRef.current = false;
    };
  }, [characterRecognitionEnabled, characterNameCapitalization, characters, quillRef]);

  return null;
};

export default CharacterHighlighting;

