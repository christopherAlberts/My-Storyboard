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
  const isInitializedRef = useRef(false);

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

    // Wait for editor to be fully mounted
    if (!quill.root) return;

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

        // Safety check - don't process if editor is not properly initialized
        if (!editor.parentNode) return;

        // Additional safety - check if editor is focused (user is typing)
        if (document.activeElement === editor) return;

        // Don't process on initial load - give editor time to stabilize
        if (!isInitializedRef.current) {
          isInitializedRef.current = true;
          return;
        }

        // Get the plain text content
        const plainText = quill.getText();
        if (!plainText || plainText.trim() === '') return;

        // Remove any existing highlights
        removeHighlighting();

        // Create a working copy to process
        const tempDiv = document.createElement('div');
        const originalHTML = quill.root.innerHTML;
        tempDiv.innerHTML = originalHTML;

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
        const oldHTML = originalHTML;
        
        // Only update if content actually changed
        if (newHTML !== oldHTML && isInitializedRef.current) {
          try {
            // Safely check if editor is still mounted
            if (!editor.parentNode || editor !== quill.root) {
              console.warn('Editor DOM changed, skipping highlight update');
              return;
            }

            // Update the content safely
            editor.innerHTML = newHTML;
            
            // Restore selection if it exists - but be very careful
            if (selection && selection.index !== null) {
              // Use setImmediate or setTimeout to restore after ReactQuill processes
              setTimeout(() => {
                try {
                  const length = selection.length || 0;
                  quill.setSelection(Math.max(0, selection.index || 0), length);
                } catch (e) {
                  console.warn('Could not restore selection:', e);
                }
              }, 50);
            }
          } catch (error) {
            console.error('Error updating editor content:', error);
            // Restore original content on error
            try {
              if (editor.parentNode && editor === quill.root) {
                editor.innerHTML = originalHTML;
              }
            } catch (restoreError) {
              console.error('Could not restore original content:', restoreError);
            }
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
        // Only apply if editor is not focused
        if (document.activeElement !== editor) {
          isTypingRef.current = false;
          applyHighlighting();
        } else {
          isTypingRef.current = false;
        }
      }, 3000); // Wait 3 seconds after user stops typing
    };

    const handleEditorBlur = () => {
      // Apply highlighting when editor loses focus
      setTimeout(() => {
        if (!isTypingRef.current && isInitializedRef.current) {
          applyHighlighting();
        }
      }, 500);
    };

    quill.on('text-change', handleTextChange);
    editor.addEventListener('blur', handleEditorBlur);

    // Initial highlighting - with longer delay for stability
    const initialTimeout = setTimeout(() => {
      isInitializedRef.current = true;
      if (!isTypingRef.current) {
        applyHighlighting();
      }
    }, 3000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      clearTimeout(initialTimeout);
      quill.off('text-change', handleTextChange);
      editor.removeEventListener('blur', handleEditorBlur);
      
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

