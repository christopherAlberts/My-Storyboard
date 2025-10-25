import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db, Character, Location, PlotPoint, Chapter } from '../../database/schema';
import CharacterTable from './CharacterTable';
import LocationTable from './LocationTable';
import PlotPointTable from './PlotPointTable';
import ChapterTable from './ChapterTable';
import { Database, Users, MapPin, Target, BookOpen } from 'lucide-react';

const DatabaseView: React.FC = () => {
  const { databaseViewState, updateDatabaseViewState } = useAppStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [plotPoints, setPlotPoints] = useState<PlotPoint[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [charactersData, locationsData, plotPointsData, chaptersData] = await Promise.all([
        db.characters.toArray(),
        db.locations.toArray(),
        db.plotPoints.toArray(),
        db.chapters.toArray(),
      ]);

      setCharacters(charactersData);
      setLocations(locationsData);
      setPlotPoints(plotPointsData);
      setChapters(chaptersData);
    } catch (error) {
      console.error('Error loading database data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (type: 'character' | 'location' | 'plot_point' | 'chapter') => {
    try {
      switch (type) {
        case 'character':
          const newCharacter: Omit<Character, 'id' | 'createdAt' | 'updatedAt'> = {
            name: 'New Character',
            description: '',
            role: 'supporting',
            appearance: '',
            personality: '',
            background: '',
            relationships: '[]',
            notes: '',
            commonPhrases: [],
            characterArc: '',
            motivation: '',
            fears: '',
            goals: '',
            skills: [],
            occupation: '',
            socialStatus: '',
            chapterNotes: '',
            chapterEvents: '',
            familyRelations: '',
            romanticRelations: '',
            friendships: '',
            enemies: '',
            customFields: {},
          };
          await db.characters.add(newCharacter);
          break;

        case 'location':
          const newLocation: Omit<Location, 'id' | 'createdAt' | 'updatedAt'> = {
            name: 'New Location',
            description: '',
            type: 'indoor',
            atmosphere: '',
            significance: '',
            notes: '',
            climate: '',
            population: '',
            landmarks: [],
            history: '',
            culture: '',
            economy: '',
            politics: '',
            dangers: '',
            resources: '',
            connectedLocations: [],
            frequentCharacters: [],
            customFields: {},
          };
          await db.locations.add(newLocation);
          break;

        case 'plot_point':
          const newPlotPoint: Omit<PlotPoint, 'id' | 'createdAt' | 'updatedAt'> = {
            title: 'New Plot Point',
            description: '',
            type: 'character_development',
            importance: 'medium',
            characterIds: [],
            locationIds: [],
            order: 1,
            notes: '',
            consequences: '',
            prerequisites: '',
            emotionalImpact: '',
            foreshadowing: '',
            themes: [],
            customFields: {},
          };
          await db.plotPoints.add(newPlotPoint);
          break;

        case 'chapter':
          const newChapter: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'> = {
            title: 'New Chapter',
            description: '',
            order: chapters.length + 1,
            status: 'draft',
            plotPointIds: [],
            notes: '',
            wordCount: 0,
            povCharacter: 0,
            mainLocation: 0,
            themes: [],
            mood: '',
            pacing: 'medium',
            conflict: '',
            resolution: '',
            customFields: {},
          };
          await db.chapters.add(newChapter);
          break;
      }

      await loadData();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleUpdateItem = async (type: string, id: number, updates: any) => {
    try {
      switch (type) {
        case 'character':
          await db.characters.update(id, updates);
          break;
        case 'location':
          await db.locations.update(id, updates);
          break;
        case 'plot_point':
          await db.plotPoints.update(id, updates);
          break;
        case 'chapter':
          await db.chapters.update(id, updates);
          break;
      }

      await loadData();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteItem = async (type: string, id: number) => {
    try {
      switch (type) {
        case 'character':
          await db.characters.delete(id);
          break;
        case 'location':
          await db.locations.delete(id);
          break;
        case 'plot_point':
          await db.plotPoints.delete(id);
          break;
        case 'chapter':
          await db.chapters.delete(id);
          break;
      }

      await loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const tabs = [
    { id: 'characters', label: 'Characters', icon: Users, count: characters.length },
    { id: 'locations', label: 'Locations', icon: MapPin, count: locations.length },
    { id: 'plotPoints', label: 'Plot Points', icon: Target, count: plotPoints.length },
    { id: 'chapters', label: 'Chapters', icon: BookOpen, count: chapters.length },
  ] as const;

  const renderTable = () => {
    switch (databaseViewState.activeTable) {
      case 'characters':
        return (
          <CharacterTable
            characters={characters}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            onAdd={() => handleAddItem('character')}
          />
        );
      case 'locations':
        return (
          <LocationTable
            locations={locations}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            onAdd={() => handleAddItem('location')}
          />
        );
      case 'plotPoints':
        return (
          <PlotPointTable
            plotPoints={plotPoints}
            characters={characters}
            locations={locations}
            chapters={chapters}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            onAdd={() => handleAddItem('plot_point')}
          />
        );
      case 'chapters':
        return (
          <ChapterTable
            chapters={chapters}
            plotPoints={plotPoints}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            onAdd={() => handleAddItem('chapter')}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">Loading database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Database
          </h2>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {characters.length + locations.length + plotPoints.length + chapters.length} total items
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => updateDatabaseViewState({ activeTable: tab.id as any })}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                databaseViewState.activeTable === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-hidden">
        {renderTable()}
      </div>
    </div>
  );
};

export default DatabaseView;
