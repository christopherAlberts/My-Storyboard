import React, { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db, StoryboardElement, Character, Location, PlotPoint } from '../../database/schema';
import StoryboardCanvas from './StoryboardCanvas';
import StoryboardToolbar from './StoryboardToolbar';
import ElementPalette from './ElementPalette';
import Timeline from './Timeline';

const StoryboardView: React.FC = () => {
  const { storyboardCanvas, updateStoryboardCanvas } = useAppStore();
  const [elements, setElements] = useState<StoryboardElement[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [plotPoints, setPlotPoints] = useState<PlotPoint[]>([]);
  const [showElementPalette, setShowElementPalette] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [elementsData, charactersData, locationsData, plotPointsData] = await Promise.all([
        db.storyboardElements.toArray(),
        db.characters.toArray(),
        db.locations.toArray(),
        db.plotPoints.toArray(),
      ]);

      setElements(elementsData);
      setCharacters(charactersData);
      setLocations(locationsData);
      setPlotPoints(plotPointsData);
    } catch (error) {
      console.error('Error loading storyboard data:', error);
    }
  };

  const addElement = async (type: StoryboardElement['type'], elementId?: number, content?: string) => {
    try {
      const newElement: Omit<StoryboardElement, 'id' | 'createdAt' | 'updatedAt'> = {
        type,
        elementId,
        x: Math.random() * 800 + 100,
        y: Math.random() * 600 + 100,
        width: type === 'note' ? 200 : 150,
        height: type === 'note' ? 100 : 80,
        content: content || '',
        style: {
          color: '#000000',
          backgroundColor: type === 'character' ? '#e3f2fd' : type === 'location' ? '#f3e5f5' : '#fff3e0',
          fontSize: 14,
          fontFamily: 'Inter',
          borderColor: '#cccccc',
          borderWidth: 1,
        },
        connections: [],
      };

      const id = await db.storyboardElements.add(newElement);
      const createdElement = await db.storyboardElements.get(id);
      if (createdElement) {
        setElements(prev => [...prev, createdElement]);
      }
    } catch (error) {
      console.error('Error adding element:', error);
    }
  };

  const updateElement = async (id: number, updates: Partial<StoryboardElement>) => {
    try {
      await db.storyboardElements.update(id, updates);
      setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    } catch (error) {
      console.error('Error updating element:', error);
    }
  };

  const deleteElement = async (id: number) => {
    try {
      await db.storyboardElements.delete(id);
      setElements(prev => prev.filter(el => el.id !== id));
    } catch (error) {
      console.error('Error deleting element:', error);
    }
  };

  const connectElements = async (fromId: number, toId: number) => {
    try {
      const fromElement = elements.find(el => el.id === fromId);
      const toElement = elements.find(el => el.id === toId);
      
      if (fromElement && toElement) {
        const updatedFromConnections = [...fromElement.connections, toId];
        const updatedToConnections = [...toElement.connections, fromId];
        
        await Promise.all([
          updateElement(fromId, { connections: updatedFromConnections }),
          updateElement(toId, { connections: updatedToConnections }),
        ]);
      }
    } catch (error) {
      console.error('Error connecting elements:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Toolbar */}
      <StoryboardToolbar
        onToggleElementPalette={() => setShowElementPalette(!showElementPalette)}
        onToggleTimeline={() => setShowTimeline(!showTimeline)}
        showElementPalette={showElementPalette}
        showTimeline={showTimeline}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex relative">
        {/* Element Palette */}
        {showElementPalette && (
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <ElementPalette
              characters={characters}
              locations={locations}
              plotPoints={plotPoints}
              onAddElement={addElement}
            />
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 relative">
          <StoryboardCanvas
            elements={elements}
            canvas={storyboardCanvas}
            onUpdateCanvas={updateStoryboardCanvas}
            onUpdateElement={updateElement}
            onDeleteElement={deleteElement}
            onConnectElements={connectElements}
          />
        </div>
      </div>

      {/* Timeline */}
      {showTimeline && (
        <div className="h-32 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <Timeline elements={elements} />
        </div>
      )}
    </div>
  );
};

export default StoryboardView;
