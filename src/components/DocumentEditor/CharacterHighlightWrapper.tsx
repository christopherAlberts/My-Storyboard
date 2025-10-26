import React, { useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import { useAppStore } from '../../store/useAppStore';
import { db, Character } from '../../database/schema';
import CharacterHighlighting from './CharacterHighlighting';

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
  const { openWindow } = useAppStore();
  const quillRef = useRef<ReactQuill | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [tooltipState, setTooltipState] = useState<{
    character: Character;
    position: { x: number; y: number };
  } | null>(null);

  useEffect(() => {
    const loadCharacters = async () => {
      const chars = await db.characters.toArray();
      setCharacters(chars);
    };
    loadCharacters();
  }, []);

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

  return (
    <div>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={content}
        onChange={onChange}
        modules={modules}
        formats={formats}
      />
      <CharacterHighlighting quillRef={quillRef} />
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

