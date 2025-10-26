import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db, Character } from '../../database/schema';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';
import CharacterTooltip from './CharacterTooltip';

interface CustomEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const CustomEditor: React.FC<CustomEditorProps> = ({ content, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const highlightOverlayRef = useRef<HTMLDivElement>(null);
  const { characterRecognitionEnabled, characterNameCapitalization } = useAppStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [tooltipState, setTooltipState] = useState<{ character: Character; position: { x: number; y: number } } | null>(null);

  // Load characters from database
  useEffect(() => {
    const loadCharacters = async () => {
      const chars = await db.characters.toArray();
      setCharacters(chars);
    };
    loadCharacters();
  }, []);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && content !== undefined) {
      if (!editorRef.current.innerHTML || editorRef.current.innerHTML === '<p><br></p>') {
        editorRef.current.innerHTML = content || '<p><br></p>';
      }
    }
  }, []);

  // Update content when prop changes from outside
  useEffect(() => {
    if (editorRef.current && content !== undefined && editorRef.current.innerHTML !== content) {
      if (!document.activeElement?.contains(editorRef.current)) {
        editorRef.current.innerHTML = content || '<p><br></p>';
      }
    }
  }, [content]);


  const handleContentChange = useDebouncedCallback(() => {
    if (editorRef.current && !isHighlighting) {
      onChange(editorRef.current.innerHTML);
    }
  }, 300);

  const applyHighlighting = () => {
    if (!characterRecognitionEnabled || characters.length === 0 || !editorRef.current || !highlightOverlayRef.current) {
      return;
    }

    setIsHighlighting(true);

    try {
      const editor = editorRef.current;
      const overlay = highlightOverlayRef.current;
      
      // Get the text content
      const text = editor.textContent || '';
      if (!text.trim()) {
        overlay.innerHTML = '';
        setIsHighlighting(false);
        return;
      }

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

      // Clone the editor structure for overlay - this gives us the exact visual layout
      const clonedContent = editor.cloneNode(true) as HTMLElement;
      
      // Make all text transparent in the overlay, we'll only show character highlights
      const allTextNodes = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          node.textContent = node.textContent; // Keep same text, just mark it
        } else {
          for (const child of Array.from(node.childNodes)) {
            allTextNodes(child);
          }
        }
      };
      allTextNodes(clonedContent);
      
      overlay.innerHTML = '';
      overlay.appendChild(clonedContent);

      // Find all text nodes and highlight character names
      const walker = document.createTreeWalker(clonedContent, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
      let node;
      
      while ((node = walker.nextNode())) {
        if (node instanceof Text) {
          textNodes.push(node);
        }
      }

      textNodes.forEach(textNode => {
        const text = textNode.textContent || '';
        if (!text.trim()) return;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        characters.forEach(character => {
          if (!character.color || !character.name) return;

          const regex = new RegExp(`\\b${character.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          const matches = [];
          let match;

          while ((match = regex.exec(text)) !== null) {
            matches.push({
              index: match.index,
              length: match[0].length,
              character
            });
          }

          matches.forEach(({ index, length, character }) => {
            // Add text before match
            if (index > lastIndex) {
              fragment.appendChild(document.createTextNode(text.substring(lastIndex, index)));
            }

            // Add highlighted character name
            // IMPORTANT: Use the ORIGINAL text from the editor to prevent overlap
            const span = document.createElement('span');
            const originalText = text.substring(index, index + length);
            
            span.textContent = originalText; // Keep original text to match editor
            span.style.color = character.color;
            span.style.textDecoration = 'underline';
            span.style.cursor = 'pointer';
            span.style.pointerEvents = 'auto';
            span.setAttribute('data-character-id', character.id?.toString() || '');
            span.setAttribute('data-character-name', character.name);
            span.className = 'character-highlight';
            
            // Add hover effect
            span.addEventListener('mouseenter', () => {
              span.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            });
            span.addEventListener('mouseleave', () => {
              span.style.backgroundColor = '';
            });
            
            fragment.appendChild(span);

            lastIndex = index + length;
          });
        });

        // Add remaining text
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }

        // Replace text node with fragment
        if (fragment.hasChildNodes()) {
          textNode.parentNode?.replaceChild(fragment, textNode);
        }
      });

      // Handle clicks and hovers on character names in overlay
      clonedContent.querySelectorAll('.character-highlight').forEach(span => {
        const characterId = parseInt(span.getAttribute('data-character-id') || '0');
        const character = characters.find(c => c.id === characterId);
        
        if (!character) return;
        
        // Add click handler
        span.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (characterId) {
            const { openWindow, updateDatabaseViewState } = useAppStore.getState();
            openWindow('database', 'Database');
            setTimeout(() => {
              updateDatabaseViewState({ activeTable: 'characters' });
              const customEvent = new CustomEvent('select-character', { 
                detail: { characterId } 
              });
              window.dispatchEvent(customEvent);
            }, 100);
          }
        });
        
        // Add custom tooltip on hover
        span.addEventListener('mouseenter', (e) => {
          const rect = span.getBoundingClientRect();
          setTooltipState({
            character,
            position: { x: rect.left + (rect.width / 2), y: rect.top }
          });
        });
        
        span.addEventListener('mouseleave', () => {
          setTooltipState(null);
        });
      });
    } catch (err) {
      console.error('Error applying highlighting:', err);
    } finally {
      setIsHighlighting(false);
    }
  };

  // Apply highlighting when content changes or recognition is toggled
  useEffect(() => {
    if (characterRecognitionEnabled && characters.length > 0) {
      const timeout = setTimeout(applyHighlighting, 500);
      return () => clearTimeout(timeout);
    } else if (highlightOverlayRef.current) {
      highlightOverlayRef.current.innerHTML = '';
    }
  }, [content, characterRecognitionEnabled, characters.length, characterNameCapitalization]);

  // Debounced highlighting when typing
  const debouncedHighlight = useDebouncedCallback(() => {
    if (characterRecognitionEnabled) {
      applyHighlighting();
    }
  }, 1000);

  const handleInput = () => {
    handleContentChange();
    debouncedHighlight();
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800">
      {/* Editor container with overlay */}
      <div className="flex-1 relative overflow-auto">
        {tooltipState && (
          <CharacterTooltip
            character={tooltipState.character}
            position={tooltipState.position}
            onClose={() => setTooltipState(null)}
          />
        )}
        {/* Main editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleContentChange}
          className="w-full h-full p-4 outline-none text-gray-900 dark:text-white bg-transparent"
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}
        />

        {/* Highlight overlay - sits on top but doesn't block interaction */}
        {characterRecognitionEnabled && (
          <div
            ref={highlightOverlayRef}
            className="absolute inset-0 overflow-hidden p-4"
            style={{
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CustomEditor;

