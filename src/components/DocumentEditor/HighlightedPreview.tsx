import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db, Character } from '../../database/schema';
import { Eye, Edit } from 'lucide-react';

interface HighlightedPreviewProps {
  content: string;
  onClose: () => void;
}

const HighlightedPreview: React.FC<HighlightedPreviewProps> = ({ content, onClose }) => {
  const { characterRecognitionEnabled, characterNameCapitalization } = useAppStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [tooltipState, setTooltipState] = useState<{
    character: Character;
    position: { x: number; y: number };
  } | null>(null);
  const [highlightedContent, setHighlightedContent] = useState('');

  useEffect(() => {
    const loadCharacters = async () => {
      const chars = await db.characters.toArray();
      setCharacters(chars);
    };
    loadCharacters();
  }, []);

  useEffect(() => {
    // Set up tooltip handlers
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

    return () => {
      delete (window as any).showCharacterTooltip;
      delete (window as any).hideCharacterTooltip;
    };
  }, [characters]);

  // Process content with highlighting
  useEffect(() => {
    if (!characterRecognitionEnabled || !content || characters.length === 0) {
      setHighlightedContent(content);
      return;
    }

    let processed = content;

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

    setHighlightedContent(processed);
  }, [content, characterRecognitionEnabled, characterNameCapitalization, characters]);

  // Attach mouse and click handlers
  useEffect(() => {
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const characterSpan = target.closest('.character-name-hl');
      if (characterSpan && (window as any).showCharacterTooltip) {
        const characterId = parseInt(characterSpan.getAttribute('data-character-id') || '0');
        if (characterId) {
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
      }
    };

    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);
    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Document Preview with Character Highlights
        </h3>
        <button
          onClick={onClose}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          <Edit className="w-4 h-4" />
          <span>Edit Document</span>
        </button>
      </div>
      <div 
        className="flex-1 p-8 overflow-y-auto prose max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: highlightedContent }}
        style={{ fontSize: '16px', lineHeight: '1.6' }}
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
    </>
  );
};

export default HighlightedPreview;

