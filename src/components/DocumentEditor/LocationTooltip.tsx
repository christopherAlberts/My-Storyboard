import React from 'react';
import { Location } from '../../services/storageService';
import { useAppStore } from '../../store/useAppStore';

interface LocationTooltipProps {
  location: Location;
  position: { x: number; y: number };
  onClose: () => void;
}

const LocationTooltip: React.FC<LocationTooltipProps> = ({ location, position, onClose }) => {
  const { tooltipFields, theme } = useAppStore();
  
  const visibleFields = [
    { key: 'description', value: location.description, label: 'Description' },
    { key: 'type', value: location.type, label: 'Type' },
    { key: 'atmosphere', value: location.atmosphere, label: 'Atmosphere' },
    { key: 'significance', value: location.significance, label: 'Significance' },
    { key: 'climate', value: location.climate, label: 'Climate' },
    { key: 'population', value: location.population, label: 'Population' },
    { key: 'history', value: location.history, label: 'History' },
    { key: 'culture', value: location.culture, label: 'Culture' },
    { key: 'notes', value: location.notes, label: 'Notes' },
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
        {location.name}
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

export default LocationTooltip;

