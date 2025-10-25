import React, { useState } from 'react';
import { Character, Location, PlotPoint } from '../../database/schema';
import { Plus, User, MapPin, Target, StickyNote, GripVertical } from 'lucide-react';

interface ElementPaletteProps {
  characters: Character[];
  locations: Location[];
  plotPoints: PlotPoint[];
  onAddElement: (type: 'character' | 'location' | 'plot_point' | 'note', elementId?: number, content?: string, x?: number, y?: number) => void;
}

const ElementPalette: React.FC<ElementPaletteProps> = ({
  characters,
  locations,
  plotPoints,
  onAddElement,
}) => {
  const [activeTab, setActiveTab] = useState<'characters' | 'locations' | 'plotPoints' | 'notes'>('characters');
  const [draggedItem, setDraggedItem] = useState<{type: 'character' | 'location' | 'plot_point' | 'note', id?: number} | null>(null);

  const handleDragStart = (type: 'character' | 'location' | 'plot_point' | 'note', id?: number) => {
    setDraggedItem({ type, id });
    
    // Set up drag data for canvas
    const dragData = { type, elementId: id };
    const event = new CustomEvent('storyboard-drag-start', { detail: dragData });
    window.dispatchEvent(event);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    
    // Clear drag data
    const event = new CustomEvent('storyboard-drag-end');
    window.dispatchEvent(event);
  };

  const renderCharacters = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900 dark:text-white">Characters</h3>
        <button
          onClick={() => onAddElement('character')}
          className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-1">
        {characters.map((character) => (
          <div
            key={character.id}
            className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
            onClick={() => onAddElement('character', character.id)}
            draggable
            onDragStart={() => handleDragStart('character', character.id)}
            onDragEnd={handleDragEnd}
          >
            <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{character.name}</span>
            <span className="text-xs text-gray-400">Drag to canvas</span>
          </div>
        ))}
        {characters.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No characters yet. Create one in the database view.
          </div>
        )}
      </div>
    </div>
  );

  const renderLocations = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900 dark:text-white">Locations</h3>
        <button
          onClick={() => onAddElement('location')}
          className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-1">
        {locations.map((location) => (
          <div
            key={location.id}
            className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
            onClick={() => onAddElement('location', location.id)}
            draggable
            onDragStart={() => handleDragStart('location', location.id)}
            onDragEnd={handleDragEnd}
          >
            <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{location.name}</span>
            <span className="text-xs text-gray-400">Drag to canvas</span>
          </div>
        ))}
        {locations.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No locations yet. Create one in the database view.
          </div>
        )}
      </div>
    </div>
  );

  const renderPlotPoints = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900 dark:text-white">Plot Points</h3>
        <button
          onClick={() => onAddElement('plot_point')}
          className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-1">
        {plotPoints.map((plotPoint) => (
          <div
            key={plotPoint.id}
            className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
            onClick={() => onAddElement('plot_point', plotPoint.id)}
            draggable
            onDragStart={() => handleDragStart('plot_point', plotPoint.id)}
            onDragEnd={handleDragEnd}
          >
            <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            <Target className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{plotPoint.title}</span>
            <span className="text-xs text-gray-400">Drag to canvas</span>
          </div>
        ))}
        {plotPoints.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No plot points yet. Create one in the database view.
          </div>
        )}
      </div>
    </div>
  );

  const renderNotes = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900 dark:text-white">Notes</h3>
        <button
          onClick={() => onAddElement('note', undefined, 'New Note')}
          className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
        Click the + button to add a note to the canvas.
      </div>
    </div>
  );

  const tabs = [
    { id: 'characters', label: 'Characters', icon: User },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'plotPoints', label: 'Plot Points', icon: Target },
    { id: 'notes', label: 'Notes', icon: StickyNote },
  ] as const;

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-1 p-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'characters' && renderCharacters()}
        {activeTab === 'locations' && renderLocations()}
        {activeTab === 'plotPoints' && renderPlotPoints()}
        {activeTab === 'notes' && renderNotes()}
      </div>
    </div>
  );
};

export default ElementPalette;
