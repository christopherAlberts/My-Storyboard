import React from 'react';
import { Character } from '../../services/storageService';
import { useAppStore } from '../../store/useAppStore';

interface CharacterTooltipProps {
  character: Character;
  position: { x: number; y: number };
  onClose: () => void;
}

const CharacterTooltip: React.FC<CharacterTooltipProps> = ({ character, position, onClose }) => {
  const { tooltipFields, theme } = useAppStore();
  
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

  const isDark = theme === 'dark';

  return (
    <div
      className="fixed p-4 rounded-lg shadow-2xl z-50 max-w-sm pointer-events-none border-2"
      style={{
        left: `${position.x + 10}px`,
        top: `${position.y - 10}px`,
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#ffffff' : '#111827',
        borderColor: isDark ? '#4b5563' : '#e5e7eb',
        boxShadow: isDark 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' 
          : '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.15)'
      }}
    >
      <div className="font-semibold text-sm mb-2 pb-2 border-b"
           style={{ borderColor: isDark ? '#4b5563' : '#e5e7eb' }}>
        {character.name}
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {visibleFields.map((field, index) => (
          <div key={index} className="text-xs">
            <span style={{ color: isDark ? '#9ca3af' : '#6b7280', fontWeight: 500 }}>{field.label}:</span>{' '}
            <span style={{ color: isDark ? '#e5e7eb' : '#374151' }}>{field.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterTooltip;

