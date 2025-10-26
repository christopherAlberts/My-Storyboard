import React, { useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import { useAppStore } from '../../store/useAppStore';
import { db, Character } from '../../database/schema';

interface CharacterHighlightWrapperProps {
  content: string;
  onChange: (content: string) => void;
  modules: any;
  formats: any;
}

const CharacterHighlightWrapper: React.FC<CharacterHighlightWrapperProps> = ({
  content,
  onChange,
  modules,
  formats
}) => {
  const { openWindow, characterRecognitionEnabled, characterNameCapitalization } = useAppStore();
  const quillRef = useRef<ReactQuill | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [tooltipState, setTooltipState] = useState<{
    character: Character;
    position: { x: number; y: number };
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadCharacters = async () => {
      const chars = await db.characters.toArray();
      setCharacters(chars);
    };
    loadCharacters();
  }, []);

  // Helper to apply capitalization
  const applyCapitalization = (text: string) => {
    switch (characterNameCapitalization) {
      case 'uppercase':
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      case 'lowercase':
        return text.toLowerCase();
      case 'leave-as-is':
        return text;
      default:
        return text;
    }
  };

  // Process content to add character highlighting
  const processContent = (html: string): string => {
    if (!characterRecognitionEnabled || !html || characters.length === 0) {
      return html;
    }

    let processed = html;

    characters.forEach(character => {
      if (!character.color || !character.name) return;

      const escapedName = character.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
      
      processed = processed.replace(regex, (match) => {
        const displayText = characterNameCapitalization === 'leave-as-is' 
          ? match 
          : applyCapitalization(match);
        return `<span class="character-name-hl" style="color: ${character.color}; cursor: pointer; text-decoration: underline;" data-character-id="${character.id}" data-character-name="${character.name}">${displayText}</span>`;
      });
    });

    return processed;
  };

  useEffect(() => {
    // Set up global event handlers for tooltips and database opening
    (window as any).showCharacterTooltip = (event: MouseEvent, characterId: number) => {
      event.stopPropagation();
      const character = characters.find(c => c.id === characterId);
      if (character) {
        setTooltipState({
          character,
          position: { x: event.clientX, y: event.clientY }
        });
      }
    };

    (window as any).hideCharacterTooltip = () => {
      setTooltipState(null);
    };

    (window as any).openCharacterDatabase = (event: MouseEvent, characterId: number) => {
      event.preventDefault();
      event.stopPropagation();
      openWindow('database', 'Database');
      
      setTimeout(() => {
        const { updateDatabaseViewState } = useAppStore.getState();
        updateDatabaseViewState({ activeTable: 'characters' });
        
        const customEvent = new CustomEvent('select-character', { 
          detail: { characterId } 
        });
        window.dispatchEvent(customEvent);
      }, 100);
    };

    return () => {
      delete (window as any).showCharacterTooltip;
      delete (window as any).hideCharacterTooltip;
      delete (window as any).openCharacterDatabase;
    };
  }, [characters, openWindow]);

  // Handle editor focus/blur to apply/remove highlighting
  useEffect(() => {
    if (!quillRef.current) return;

    const editor = quillRef.current.getEditor();
    const editorElement = editor.root;

    const handleFocus = () => {
      setIsEditing(true);
    };

    const handleBlur = () => {
      setIsEditing(false);
      // Apply highlighting when editor loses focus
      if (characterRecognitionEnabled && quillRef.current) {
        const currentHTML = editorElement.innerHTML;
        const processed = processContent(currentHTML);
        if (processed !== currentHTML) {
          setTimeout(() => {
            if (quillRef.current) {
              const currentSelection = editor.getSelection();
              editor.clipboard.dangerouslyPasteHTML(processed);
              // Try to restore selection if it existed
              if (currentSelection) {
                setTimeout(() => {
                  editor.setSelection(currentSelection.index || 0);
                }, 0);
              }
            }
          }, 100);
        }
      }
    };

    editorElement.addEventListener('focus', handleFocus, true);
    editorElement.addEventListener('blur', handleBlur, true);

    return () => {
      editorElement.removeEventListener('focus', handleFocus, true);
      editorElement.removeEventListener('blur', handleBlur, true);
    };
  }, [characterRecognitionEnabled, characters, characterNameCapitalization]);

  // Attach event listeners for hover and click
  useEffect(() => {
    if (!quillRef.current || !characterRecognitionEnabled) return;

    const editor = quillRef.current.getEditor();
    const editorElement = editor.root;

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const characterSpan = target.closest('.character-name-hl');
      if (characterSpan) {
        const characterId = parseInt(characterSpan.getAttribute('data-character-id') || '0');
        if (characterId && (window as any).showCharacterTooltip) {
          (window as any).showCharacterTooltip(e, characterId);
        }
      }
    };

    const handleMouseLeave = () => {
      if ((window as any).hideCharacterTooltip) {
        (window as any).hideCharacterTooltip();
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const characterSpan = target.closest('.character-name-hl');
      if (characterSpan) {
        e.preventDefault();
        e.stopPropagation();
        const characterId = parseInt(characterSpan.getAttribute('data-character-id') || '0');
        if (characterId && (window as any).openCharacterDatabase) {
          (window as any).openCharacterDatabase(e, characterId);
        }
      }
    };

    editorElement.addEventListener('mouseenter', handleMouseEnter, true);
    editorElement.addEventListener('mouseleave', handleMouseLeave, true);
    editorElement.addEventListener('click', handleClick, true);

    return () => {
      editorElement.removeEventListener('mouseenter', handleMouseEnter, true);
      editorElement.removeEventListener('mouseleave', handleMouseLeave, true);
      editorElement.removeEventListener('click', handleClick, true);
    };
  }, [characterRecognitionEnabled, characters]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={content}
        onChange={onChange}
        modules={modules}
        formats={formats}
        className="flex-1"
      />
      {tooltipState && (
        <div
          className="fixed bg-gray-900 dark:bg-gray-800 text-white p-3 rounded-lg shadow-lg z-50 max-w-xs pointer-events-none"
          style={{
            left: `${tooltipState.position.x + 10}px`,
            top: `${tooltipState.position.y - 10}px`,
          }}
        >
          <div className="font-semibold text-sm mb-1">{tooltipState.character.name}</div>
          {tooltipState.character.role && (
            <div className="text-xs text-gray-300 mb-1">
              Role: {tooltipState.character.role}
            </div>
          )}
          {tooltipState.character.description && (
            <div className="text-xs text-gray-400 line-clamp-2">
              {tooltipState.character.description}
            </div>
          )}
          {tooltipState.character.occupation && (
            <div className="text-xs text-gray-300 mt-1">
              {tooltipState.character.occupation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CharacterHighlightWrapper;
