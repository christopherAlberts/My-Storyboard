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

            // Find matches and their positions
            const matches = [];
            let match;
            while ((match = regex.exec(text)) !== null) {
              matches.push({
                index: match.index,
                text: match[0], // The actual text as user typed it
                length: match[0].length
              });
            }

            if (matches.length === 0) return;

            // Create document fragment
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;

            matches.forEach((match, i) => {
              // Add text before match
              if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
              }

              // Add character name span with original text or capitalized
              const span = document.createElement('span');
              span.className = 'character-name-hl';
              span.style.color = character.color;
              span.dataset.characterId = character.id?.toString() || '';
              span.dataset.characterName = character.name;
              
              // For leave-as-is, use the actual text as typed. Otherwise apply capitalization
              const displayText = characterNameCapitalization === 'leave-as-is' 
                ? match.text 
                : applyCapitalization(match.text);
              
              span.textContent = displayText;
              fragment.appendChild(span);

              lastIndex = match.index + match.length;
            });

            // Add remaining text after last match
            if (lastIndex < text.length) {
              fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
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
          
          // Restore selection if it exists
          if (selection) {
            setTimeout(() => quill.setSelection(selection.index || 0, selection.length || 0), 10);
          }
        }
      } catch (err) {
        console.error('Error applying highlighting:', err);
      }
    };

    // Store handlers for cleanup
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const characterSpan = target.closest('.character-name-hl');
      if (characterSpan) {
        const characterId = parseInt(characterSpan.getAttribute('data-character-id') || '0');
        if (characterId) {
          (window as any).showCharacterTooltip?.(e, characterId);
        }
      }
    };

    const handleMouseLeave = () => {
      (window as any).hideCharacterTooltip?.();
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const characterSpan = target.closest('.character-name-hl');
      if (characterSpan) {
        e.preventDefault();
        e.stopPropagation();
        const characterId = parseInt(characterSpan.getAttribute('data-character-id') || '0');
        if (characterId) {
          (window as any).openCharacterDatabase?.(e, characterId);
        }
      }
    };

    // Attach global event listeners using event delegation
    editor.addEventListener('mouseenter', handleMouseEnter, true);
    editor.addEventListener('mouseleave', handleMouseLeave, true);
    editor.addEventListener('click', handleClick, true);

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
      
      // Remove event listeners
      editor.removeEventListener('mouseenter', handleMouseEnter, true);
      editor.removeEventListener('mouseleave', handleMouseLeave, true);
      editor.removeEventListener('click', handleClick, true);
      
      removeHighlighting();
      isTypingRef.current = false;
    };
  }, [characterRecognitionEnabled, characterNameCapitalization, characters, quillRef]);

  return null;
};

export default CharacterHighlighting;

