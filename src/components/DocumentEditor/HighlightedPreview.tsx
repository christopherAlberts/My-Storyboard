import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { storageService, Character, Location } from '../../services/storageService';
import { Eye, Home } from 'lucide-react';

interface HighlightedPreviewProps {
  content: string;
}

const HighlightedPreview: React.FC<HighlightedPreviewProps> = ({ content }) => {
  const { characterRecognitionEnabled, characterNameCapitalization, locationRecognitionEnabled, locationNameCapitalization, tooltipFields } = useAppStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tooltipState, setTooltipState] = useState<{
    character: Character;
    position: { x: number; y: number };
  } | null>(null);
  const [locationTooltipState, setLocationTooltipState] = useState<{
    location: Location;
    position: { x: number; y: number };
  } | null>(null);
  const [highlightedContent, setHighlightedContent] = useState('');

  useEffect(() => {
    const loadCharacters = async () => {
      const chars = await storageService.getCharacters();
      setCharacters(chars);
    };
    loadCharacters();
  }, []);

  useEffect(() => {
    const loadLocations = async () => {
      const locs = await storageService.getLocations();
      setLocations(locs);
    };
    loadLocations();
  }, []);

  useEffect(() => {
    // Set up tooltip handlers
    (window as any).showCharacterTooltip = (event: MouseEvent, characterId: string) => {
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
    if ((!characterRecognitionEnabled && !locationRecognitionEnabled) || !content || 
        (characterRecognitionEnabled && characters.length === 0 && locationRecognitionEnabled && locations.length === 0)) {
      setHighlightedContent(content);
      return;
    }

    let processed = content;

    const applyCharacterCapitalization = (text: string) => {
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

    const applyLocationCapitalization = (text: string) => {
      switch (locationNameCapitalization) {
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

    if (characterRecognitionEnabled) {
      characters.forEach(character => {
        if (!character.color || !character.name) return;

        const escapedName = character.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
        
        processed = processed.replace(regex, (match) => {
          const displayText = characterNameCapitalization === 'leave-as-is' 
            ? match 
            : applyCharacterCapitalization(match);
          return `<span class="character-name-hl" style="color: ${character.color}; cursor: pointer; text-decoration: underline;" data-character-id="${character.id}" data-character-name="${character.name}">${displayText}</span>`;
        });
      });
    }

    if (locationRecognitionEnabled) {
      locations.forEach(location => {
        if (!location.color || !location.name) return;

        const escapedName = location.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
        
        processed = processed.replace(regex, (match) => {
          const displayText = locationNameCapitalization === 'leave-as-is' 
            ? match 
            : applyLocationCapitalization(match);
          return `<span class="location-name-hl" style="color: ${location.color}; cursor: pointer; text-decoration: underline;" data-location-id="${location.id}" data-location-name="${location.name}">${displayText}</span>`;
        });
      });
    }

    setHighlightedContent(processed);
  }, [content, characterRecognitionEnabled, locationRecognitionEnabled, characterNameCapitalization, locationNameCapitalization, characters, locations]);

  // Attach mouse and click handlers
  useEffect(() => {
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const characterSpan = target.closest('.character-name-hl');
      if (characterSpan && (window as any).showCharacterTooltip) {
        const characterId = characterSpan.getAttribute('data-character-id') || '';
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
        const characterId = characterSpan.getAttribute('data-character-id') || '';
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

    // Use capture phase but check if it's actually a character highlight before preventing
    const capturePhaseHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const characterSpan = target.closest('.character-name-hl');
      if (characterSpan) {
        handleMouseEnter(e);
      }
    };

    const capturePhaseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const characterSpan = target.closest('.character-name-hl');
      if (characterSpan) {
        handleMouseLeave();
      }
    };

    const capturePhaseClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const characterSpan = target.closest('.character-name-hl');
      if (characterSpan) {
        handleClick(e);
      }
    };

    document.addEventListener('mouseenter', capturePhaseHandler, true);
    document.addEventListener('mouseleave', capturePhaseLeave, true);
    document.addEventListener('click', capturePhaseClick, true);
    return () => {
      document.removeEventListener('mouseenter', capturePhaseHandler, true);
      document.removeEventListener('mouseleave', capturePhaseLeave, true);
      document.removeEventListener('click', capturePhaseClick, true);
    };
  }, []);

  return (
    <>
      <style>{`
        .highlighted-preview-content {
          color: rgb(17, 24, 39);
        }
        .dark .highlighted-preview-content {
          color: rgb(255, 255, 255);
        }
        .highlighted-preview-content p, 
        .highlighted-preview-content div,
        .highlighted-preview-content span:not(.character-name-hl) {
          color: inherit !important;
        }
      `}</style>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          {characterRecognitionEnabled && !locationRecognitionEnabled && (
            <>
              <Eye className="w-5 h-5" />
              Character Recognition Mode
            </>
          )}
          {locationRecognitionEnabled && !characterRecognitionEnabled && (
            <>
              <Home className="w-5 h-5" />
              Location Recognition Mode
            </>
          )}
          {(characterRecognitionEnabled && locationRecognitionEnabled) && (
            <>
              <Eye className="w-5 h-5" />
              Character & Location Recognition Mode
            </>
          )}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {characterRecognitionEnabled && locationRecognitionEnabled 
            ? 'Click character or location names to view details'
            : characterRecognitionEnabled 
            ? 'Click character names to view details'
            : 'Click location names to view details'}
        </p>
      </div>
      <div 
        className="highlighted-preview-content flex-1 p-8 overflow-y-auto prose max-w-none dark:prose-invert"
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
          {tooltipFields.description && tooltipState.character.description && (
            <div className="text-xs text-gray-300 line-clamp-3 mb-1">
              Description: {tooltipState.character.description}
            </div>
          )}
          {tooltipFields.role && tooltipState.character.role && (
            <div className="text-xs text-gray-300 mb-1">
              Role: {tooltipState.character.role}
            </div>
          )}
          {tooltipFields.occupation && tooltipState.character.occupation && (
            <div className="text-xs text-gray-300 mb-1">
              Occupation: {tooltipState.character.occupation}
            </div>
          )}
          {tooltipFields.age && tooltipState.character.age && (
            <div className="text-xs text-gray-300 mb-1">
              Age: {tooltipState.character.age}
            </div>
          )}
          {tooltipFields.appearance && tooltipState.character.appearance && (
            <div className="text-xs text-gray-300 line-clamp-2 mb-1">
              Appearance: {tooltipState.character.appearance}
            </div>
          )}
          {tooltipFields.personality && tooltipState.character.personality && (
            <div className="text-xs text-gray-300 line-clamp-2 mb-1">
              Personality: {tooltipState.character.personality}
            </div>
          )}
          {tooltipFields.background && tooltipState.character.background && (
            <div className="text-xs text-gray-300 line-clamp-2 mb-1">
              Background: {tooltipState.character.background}
            </div>
          )}
          {tooltipFields.characterArc && tooltipState.character.characterArc && (
            <div className="text-xs text-gray-300 line-clamp-2 mb-1">
              Character Arc: {tooltipState.character.characterArc}
            </div>
          )}
          {tooltipFields.motivation && tooltipState.character.motivation && (
            <div className="text-xs text-gray-300 line-clamp-2 mb-1">
              Motivation: {tooltipState.character.motivation}
            </div>
          )}
          {tooltipFields.goals && tooltipState.character.goals && (
            <div className="text-xs text-gray-300 line-clamp-2 mb-1">
              Goals: {tooltipState.character.goals}
            </div>
          )}
          {tooltipFields.fears && tooltipState.character.fears && (
            <div className="text-xs text-gray-300 line-clamp-2 mb-1">
              Fears: {tooltipState.character.fears}
            </div>
          )}
          {tooltipFields.notes && tooltipState.character.notes && (
            <div className="text-xs text-gray-400 line-clamp-2 mt-1">
              Notes: {tooltipState.character.notes}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default HighlightedPreview;

