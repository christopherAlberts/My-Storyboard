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
  const { characterRecognitionEnabled, characterNameCapitalization } = useAppStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
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

  // Remove highlighting spans from HTML
  const removeHighlights = (html: string): string => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove all .character-highlight spans and preserve their text
    temp.querySelectorAll('.character-highlight').forEach(span => {
      const parent = span.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(span.textContent || ''), span);
      }
    });
    
    return temp.innerHTML;
  };

  // Update content when prop changes from outside
  useEffect(() => {
    if (editorRef.current && content !== undefined && removeHighlights(editorRef.current.innerHTML) !== content) {
      if (!document.activeElement?.contains(editorRef.current)) {
        editorRef.current.innerHTML = content || '<p><br></p>';
        // Reapply highlighting after content change
        setTimeout(() => applyHighlighting(), 100);
      }
    }
  }, [content]);

  const handleContentChange = useDebouncedCallback(() => {
    if (editorRef.current && !isProcessing) {
      // Remove highlighting spans before saving - save clean content
      const cleanContent = removeHighlights(editorRef.current.innerHTML);
      onChange(cleanContent);
    }
  }, 300);

  const applyHighlighting = () => {
    if (!editorRef.current || isProcessing) return;

    setIsProcessing(true);

    try {
      const editor = editorRef.current;
      
      // Save cursor position
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      let cursorOffset = 0;
      
      if (range && range.startContainer === editor) {
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editor);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        cursorOffset = preCaretRange.toString().length;
      }
      
      // Get the plain text content
      const text = editor.textContent || '';
      if (!text.trim()) {
        setIsProcessing(false);
        return;
      }

      // Remove all existing character highlights first
      editor.querySelectorAll('.character-highlight').forEach(span => {
        const parent = span.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(span.textContent || ''), span);
          parent.normalize();
        }
      });

      if (!characterRecognitionEnabled) {
        setIsProcessing(false);
        return;
      }

      if (characters.length === 0) {
        setIsProcessing(false);
        return;
      }
      
      const offsetBeforeHighlight = cursorOffset;

      // Process each text node
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
      const nodesToProcess: Text[] = [];
      let node;
      
      while ((node = walker.nextNode())) {
        if (node instanceof Text) {
          nodesToProcess.push(node);
        }
      }

      // Collect all matches across all characters first
      interface MatchInfo {
        start: number;
        end: number;
        character: Character;
      }

      nodesToProcess.forEach(textNode => {
        const text = textNode.textContent || '';
        if (!text.trim() || textNode.parentElement?.classList.contains('character-highlight')) return;

        // Collect all character matches from this text node
        const allMatches: MatchInfo[] = [];
        
        characters.forEach(character => {
          if (!character.color || !character.name) return;

          // Use word boundary to match only the character name as a whole word
          const escapedName = character.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
          let match;
          
          while ((match = regex.exec(text)) !== null) {
            allMatches.push({
              start: match.index,
              end: match.index + match[0].length,
              character
            });
          }
        });

        // Sort matches by position
        allMatches.sort((a, b) => a.start - b.start);

        // Remove overlapping matches
        const filteredMatches: MatchInfo[] = [];
        for (const match of allMatches) {
          let overlaps = false;
          for (const existing of filteredMatches) {
            if ((match.start >= existing.start && match.start < existing.end) ||
                (match.end > existing.start && match.end <= existing.end) ||
                (match.start <= existing.start && match.end >= existing.end)) {
              overlaps = true;
              break;
            }
          }
          if (!overlaps) {
            filteredMatches.push(match);
          }
        }

        if (filteredMatches.length === 0) return;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        filteredMatches.forEach(({ start, end, character: char }) => {
          // Add text before match (plain text, no styling)
          if (start > lastIndex) {
            const textNode = document.createTextNode(text.substring(lastIndex, start));
            fragment.appendChild(textNode);
          }

          // Add highlighted character name
          const span = document.createElement('span');
          span.className = 'character-highlight';
          // Set inline styles
          span.setAttribute('style', `color: ${char.color}; text-decoration: underline; cursor: pointer;`);
          span.setAttribute('data-character-id', char.id?.toString() || '');
          span.setAttribute('data-character-name', char.name);
          span.textContent = text.substring(start, end);
          
          fragment.appendChild(span);
          lastIndex = end;
        });

        // Add remaining text after last match (plain text, no styling)
        if (lastIndex < text.length) {
          const textNode = document.createTextNode(text.substring(lastIndex));
          fragment.appendChild(textNode);
        }

        // Replace text node with fragment
        if (fragment.hasChildNodes()) {
          try {
            textNode.parentNode?.replaceChild(fragment, textNode);
          } catch (err) {
            console.error('Error replacing text node:', err);
          }
        }
      });

      // Add event listeners to character highlights
      editor.querySelectorAll('.character-highlight').forEach(span => {
        const characterId = parseInt(span.getAttribute('data-character-id') || '0');
        const character = characters.find(c => c.id === characterId);
        
        if (!character) return;

        // Remove existing listeners to avoid duplicates
        const newSpan = span.cloneNode(true) as HTMLElement;
        
        // Add click handler
        newSpan.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const { openWindow, updateDatabaseViewState } = useAppStore.getState();
          openWindow('database', 'Database');
          setTimeout(() => {
            updateDatabaseViewState({ activeTable: 'characters' });
            const customEvent = new CustomEvent('select-character', { 
              detail: { characterId } 
            });
            window.dispatchEvent(customEvent);
          }, 100);
        });
        
        // Add hover handler
        newSpan.addEventListener('mouseenter', (e) => {
          e.stopPropagation();
          const rect = newSpan.getBoundingClientRect();
          setTooltipState({
            character,
            position: { x: rect.left + (rect.width / 2), y: rect.top }
          });
        });
        
        newSpan.addEventListener('mouseleave', (e) => {
          e.stopPropagation();
          setTooltipState(null);
        });

        // Add hover background effect
        newSpan.addEventListener('mouseenter', () => {
          newSpan.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        });
        newSpan.addEventListener('mouseleave', () => {
          newSpan.style.backgroundColor = '';
        });

        // Don't replace if it's the same element
        if (span.parentNode && span !== newSpan) {
          span.parentNode.replaceChild(newSpan, span);
        }
      });

      // Restore cursor position
      if (selection && range) {
        try {
          const textNodes = [];
          const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
          let node;
          while ((node = walker.nextNode())) {
            textNodes.push(node);
          }

          let currentOffset = 0;
          for (const textNode of textNodes) {
            const nodeLength = textNode.textContent?.length || 0;
            if (currentOffset + nodeLength >= offsetBeforeHighlight) {
              const newRange = document.createRange();
              const offsetInNode = offsetBeforeHighlight - currentOffset;
              newRange.setStart(textNode, Math.min(offsetInNode, nodeLength));
              newRange.setEnd(textNode, Math.min(offsetInNode, nodeLength));
              selection.removeAllRanges();
              selection.addRange(newRange);
              break;
            }
            currentOffset += nodeLength;
          }
        } catch (err) {
          console.error('Error restoring cursor:', err);
        }
      }

    } catch (err) {
      console.error('Error applying highlighting:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply highlighting when content changes or recognition is toggled
  useEffect(() => {
    // Don't highlight while user is actively typing
    if (editorRef.current?.contains(document.activeElement)) {
      return;
    }
    const timeout = setTimeout(applyHighlighting, 300);
    return () => clearTimeout(timeout);
  }, [content, characterRecognitionEnabled, characters.length, characterNameCapitalization]);

  // Debounced highlighting when typing
  const debouncedHighlight = useDebouncedCallback(() => {
    // Only apply highlighting if editor is not focused (user stopped typing)
    if (!editorRef.current?.contains(document.activeElement)) {
      applyHighlighting();
    }
  }, 2000);

  const handleInput = () => {
    handleContentChange();
    debouncedHighlight();
  };
  
  // Apply highlighting when editor loses focus
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const handleBlur = () => {
      if (characterRecognitionEnabled) {
        setTimeout(applyHighlighting, 300);
      }
    };
    
    editor.addEventListener('blur', handleBlur);
    return () => editor.removeEventListener('blur', handleBlur);
  }, [characterRecognitionEnabled]);

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
      {/* Editor container */}
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
      </div>
    </div>
  );
};

export default CustomEditor;

