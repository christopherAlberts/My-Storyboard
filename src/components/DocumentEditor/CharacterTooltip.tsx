import React from 'react';
import { Character } from '../../database/schema';
import { useAppStore } from '../../store/useAppStore';

interface CharacterTooltipProps {
  character: Character;
  position: { x: number; y: number };
  onClose: () => void;
}

const CharacterTooltip: React.FC<CharacterTooltipProps> = ({ character, position, onClose }) => {
  const { tooltipFields } = useAppStore();
  
  const visibleFields = [
    { key: 'description', value: character.description, label: 'Description' },
    { key: 'role', value: character.role, label: 'Role' },
    { key: 'occupation', value: character.occupation, label: 'Occupation' },
    { key: 'age', value: character.age, label: 'Age' },
    { key: 'appearance', value: character.appearance, label: 'Appearance' },
    { key: 'personality', value: character.personality, label: 'Personality' },
    { key: 'background', value: character.background, label: 'Background' },
    { key: 'characterArc', value: character.characterArc, label: 'Character Arc' },
    { key: 'motivation', value: character.motivation, label: 'Motivation' },
    { key: 'goals', value: character.goals, label: 'Goals' },
    { key: 'fears', value: character.fears, label: 'Fears' },
    { key: 'notes', value: character.notes, label: 'Notes' },
  ].filter(field => tooltipFields[field.key] && field.value);

  if (visibleFields.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bg-gray-900 dark:bg-gray-800 text-white p-4 rounded-lg shadow-xl z-50 max-w-sm pointer-events-none"
      style={{
        left: `${position.x + 10}px`,
        top: `${position.y - 10}px`,
      }}
    >
      <div className="font-semibold text-sm mb-2 pb-2 border-b border-gray-700">
        {character.name}
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {visibleFields.map((field, index) => (
          <div key={index} className="text-xs">
            <span className="text-gray-400">{field.label}:</span>{' '}
            <span className="text-gray-200">{field.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterTooltip;

