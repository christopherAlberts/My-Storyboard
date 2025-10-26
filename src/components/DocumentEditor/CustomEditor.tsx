import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db, Character } from '../../database/schema';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';
import CharacterTooltip from './CharacterTooltip';
import FormattingToolbar from './FormattingToolbar';
import TableOfContents from './TableOfContents';

interface CustomEditorProps {
  content: string;
  onChange: (content: string) => void;
  showTableOfContents?: boolean;
  onToggleTableOfContents?: () => void;
}

const CustomEditor: React.FC<CustomEditorProps> = ({ content, onChange, showTableOfContents: externalShowTable, onToggleTableOfContents }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const { characterRecognitionEnabled, characterNameCapitalization, toggleCharacterRecognition } = useAppStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tooltipState, setTooltipState] = useState<{ character: Character; position: { x: number; y: number } } | null>(null);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [localShowTableOfContents, setLocalShowTableOfContents] = useState(false);

  // Load characters from database and auto-detect changes
  useEffect(() => {
    const loadCharacters = async () => {
      const chars = await db.characters.toArray();
      setCharacters(chars);
    };
    
    loadCharacters();
    
    // Poll for character changes every 2 seconds for auto-detection
    const intervalId = setInterval(() => {
      loadCharacters();
    }, 2000);
    
    return () => {
      clearInterval(intervalId);
    };
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
    if (!editorRef.current || isProcessing || !characterRecognitionEnabled) return;
    
    // Only apply highlighting when editor is NOT focused
    if (document.activeElement === editorRef.current) {
      return;
    }

    setIsProcessing(true);

    try {
      const editor = editorRef.current;
      
      // Save cursor position
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      let cursorOffset = 0;
      
      if (range && range.startContainer.nodeType === Node.TEXT_NODE || range.startContainer === editor) {
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

          // Use word boundary to match ONLY exact character name as a complete word
          // This ensures "tom" matches but "tomy" doesn't
          const escapedName = character.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          
          // Create regex that matches the word with word boundaries, case-insensitive
          const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
          
          // Use a map to avoid duplicate matches
          const matchMap = new Map<number, MatchInfo>();
          let match;
          
          while ((match = regex.exec(text)) !== null) {
            // Only add if we get an exact word boundary match
            const beforeChar = match.index > 0 ? text[match.index - 1] : '';
            const afterChar = text[match.index + match[0].length] || '';
            
            // Check word boundaries: before must be start of text or non-word char, after must be end or non-word char
            const beforeIsBoundary = match.index === 0 || /\W/.test(beforeChar);
            const afterIsBoundary = !afterChar || /\W/.test(afterChar);
            
            if (beforeIsBoundary && afterIsBoundary) {
              matchMap.set(match.index, {
                start: match.index,
                end: match.index + match[0].length,
                character
              });
            }
          }
          
          // Add all valid matches
          matchMap.forEach((matchInfo) => allMatches.push(matchInfo));
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
        
        // Add click handler for character highlights in the document editor only
        newSpan.addEventListener('click', (e) => {
          const target = e.target as HTMLElement;
          // Don't interfere with form inputs or buttons anywhere in the document
          if (!target.closest('input') && !target.closest('button') && !target.closest('textarea') && !target.closest('select')) {
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
          }
        });
        
        // Add hover handler for tooltips
        newSpan.addEventListener('mouseenter', (e) => {
          const target = e.target as HTMLElement;
          // Don't interfere with form elements
          if (!target.closest('input') && !target.closest('textarea') && !target.closest('select')) {
            const rect = newSpan.getBoundingClientRect();
            setTooltipState({
              character,
              position: { x: rect.left + (rect.width / 2), y: rect.top }
            });
          }
        });
        
        newSpan.addEventListener('mouseleave', () => {
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

  // Apply highlighting when recognition is toggled
  useEffect(() => {
    if (characterRecognitionEnabled && editorRef.current) {
      // Apply highlighting immediately when recognition is enabled
      applyHighlighting();
    }
  }, [characterRecognitionEnabled]);

  const handleInput = () => {
    handleContentChange();
    
    // Debounce highlighting: apply it 1 second after user stops typing
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    
    highlightTimeoutRef.current = setTimeout(() => {
      if (characterRecognitionEnabled && document.activeElement !== editorRef.current) {
        applyHighlighting();
      }
    }, 1000);
  };
  
  // Apply highlighting when editor loses focus
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const handleBlur = () => {
      if (characterRecognitionEnabled) {
        // Apply highlighting when editor loses focus
        setTimeout(() => {
          applyHighlighting();
        }, 100);
      }
    };
    
    editor.addEventListener('blur', handleBlur);
    return () => editor.removeEventListener('blur', handleBlur);
  }, [characterRecognitionEnabled]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const handleToggleFormat = (command: string, value?: any) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    // Wait a moment for focus
    setTimeout(() => {
      // Execute the command
      try {
        if (value !== undefined && value !== null) {
          const result = document.execCommand(command, false, value);
          console.log(`Command: ${command}, Value: ${value}, Result: ${result}`);
        } else {
          const result = document.execCommand(command, false, null);
          console.log(`Command: ${command}, Result: ${result}`);
        }
        
        // Trigger content change to save the formatting
        handleContentChange();
      } catch (err) {
        console.error('Error executing command:', err);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          handleToggleFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          handleToggleFormat('italic');
          break;
        case '1':
          e.preventDefault();
          handleToggleFormat('formatBlock', '<h1>');
          break;
        case '2':
          e.preventDefault();
          handleToggleFormat('formatBlock', '<h2>');
          break;
        case '3':
          e.preventDefault();
          handleToggleFormat('formatBlock', '<h3>');
          break;
      }
    }
  };

  const activeTableOfContents = externalShowTable ?? localShowTableOfContents;
  
  // Debug: Log when TOC state changes
  console.log('Table of Contents State:', { 
    isOpen: activeTableOfContents, 
    externalShowTable, 
    localShowTableOfContents 
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800">
      {/* Formatting Toolbar */}
      <FormattingToolbar 
        editorRef={editorRef} 
        onToggleFormat={handleToggleFormat}
        characterRecognitionEnabled={characterRecognitionEnabled}
        onToggleCharacterRecognition={toggleCharacterRecognition}
        onToggleTableOfContents={onToggleTableOfContents || (() => setLocalShowTableOfContents(prev => !prev))}
        showTableOfContents={activeTableOfContents}
      />

      {/* Editor container */}
      <div className="flex-1 relative overflow-auto flex">
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
          onKeyDown={handleKeyDown}
          className="flex-1 p-4 outline-none text-gray-900 dark:text-white bg-transparent"
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}
        />
        
        {/* Table of Contents */}
        <TableOfContents 
          editorRef={editorRef} 
          isOpen={activeTableOfContents} 
          onClose={() => {
            setLocalShowTableOfContents(false);
            onToggleTableOfContents?.();
          }} 
        />
      </div>
    </div>
  );
};

export default CustomEditor;

