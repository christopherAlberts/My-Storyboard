import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db, Character } from '../../database/schema';

interface CharacterHighlightingProps {
  quillRef: React.RefObject<any>;
}

const CharacterHighlighting: React.FC<CharacterHighlightingProps> = ({ quillRef }) => {
  const { characterRecognitionEnabled } = useAppStore();
  const [characters, setCharacters] = React.useState<Character[]>([]);
  const processingRef = useRef(false);

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

    // Create a CSS style for highlighted characters
    const styleId = 'character-recognition-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .character-name-hl {
          cursor: pointer !important;
          text-decoration: underline !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Process highlighting in a way that doesn't interfere with ReactQuill
    const processHighlighting = () => {
      if (processingRef.current) return;
      
      try {
        const editor = quill.root;
        if (!editor) return;

        // Use requestAnimationFrame to process after ReactQuill is done
        requestAnimationFrame(() => {
          processingRef.current = true;
          
          // Find all text nodes and check for character names
          const walker = document.createTreeWalker(
            editor,
            NodeFilter.SHOW_TEXT,
            null
          );

          const toProcess: Array<{ node: Text; character: Character }> = [];
          
          let node;
          while ((node = walker.nextNode())) {
            if (node instanceof Text) {
              const text = node.textContent || '';
              if (!text.trim()) continue;

              // Check if this is already wrapped
              const parent = node.parentElement;
              if (parent && parent.classList.contains('character-name-hl')) {
                continue;
              }

              // Find matching characters
              characters.forEach(character => {
                if (!character.color || !character.name) return;
                const regex = new RegExp(`\\b${character.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                if (regex.test(text) && node instanceof Text) {
                  toProcess.push({ node, character });
                }
              });
            }
          }

          // Process matches
          toProcess.forEach(({ node, character }) => {
            if (!node.parentNode) return;
            
            try {
              const span = document.createElement('span');
              span.className = 'character-name-hl';
              span.style.color = character.color;
              span.dataset.characterId = character.id?.toString() || '';
              span.dataset.characterName = character.name;
              
              // Set up event handlers
              span.addEventListener('mouseenter', (e) => {
                (window as any).showCharacterTooltip?.(e, parseInt(character.id?.toString() || '0'));
              });
              span.addEventListener('mouseleave', () => {
                (window as any).hideCharacterTooltip?.();
              });
              span.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                (window as any).openCharacterDatabase?.(e, parseInt(character.id?.toString() || '0'));
              });

              // Replace the text node
              span.textContent = node.textContent;
              node.parentNode.replaceChild(span, node);
            } catch (err) {
              console.error('Error processing character highlight:', err);
            }
          });

          processingRef.current = false;
        });
      } catch (err) {
        console.error('Error in processHighlighting:', err);
        processingRef.current = false;
      }
    };

    // Setup periodic processing with debouncing
    let timeoutId: NodeJS.Timeout;
    const scheduleProcess = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(processHighlighting, 500);
    };

    // Listen to content changes
    const handler = () => scheduleProcess();
    quill.on('text-change', handler);
    
    // Initial process
    setTimeout(processHighlighting, 1000);

    return () => {
      clearTimeout(timeoutId);
      quill.off('text-change', handler);
      processingRef.current = false;
    };
  }, [characterRecognitionEnabled, characters, quillRef]);

  return null; // This component doesn't render anything
};

export default CharacterHighlighting;

