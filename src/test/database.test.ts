import { describe, it, expect, beforeEach } from 'vitest';
import { db, Character, Location, PlotPoint, Chapter } from '../database/schema';

describe('Database Schema', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    await db.characters.clear();
    await db.locations.clear();
    await db.plotPoints.clear();
    await db.chapters.clear();
    await db.storyboardElements.clear();
    await db.documents.clear();
  });

  describe('Characters', () => {
    it('should create a character with all required fields', async () => {
      const character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'John Doe',
        description: 'A brave protagonist',
        age: 25,
        role: 'protagonist',
        appearance: 'Tall and muscular',
        personality: 'Brave and determined',
        background: 'Former soldier',
        relationships: '[]'
      };

      const id = await db.characters.add(character);
      const createdCharacter = await db.characters.get(id);

      expect(createdCharacter).toBeDefined();
      expect(createdCharacter?.name).toBe('John Doe');
      expect(createdCharacter?.role).toBe('protagonist');
      expect(createdCharacter?.createdAt).toBeInstanceOf(Date);
      expect(createdCharacter?.updatedAt).toBeInstanceOf(Date);
    });

    it('should update character timestamps on modification', async () => {
      const character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Jane Doe',
        description: 'A mysterious character',
        role: 'antagonist',
        appearance: 'Dark and mysterious',
        personality: 'Cunning and secretive',
        background: 'Unknown origins',
        relationships: '[]'
      };

      const id = await db.characters.add(character);
      const originalCharacter = await db.characters.get(id);
      const originalUpdatedAt = originalCharacter?.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await db.characters.update(id, { name: 'Jane Smith' });
      const updatedCharacter = await db.characters.get(id);

      expect(updatedCharacter?.name).toBe('Jane Smith');
      expect(updatedCharacter?.updatedAt).not.toEqual(originalUpdatedAt);
    });
  });

  describe('Locations', () => {
    it('should create a location with coordinates', async () => {
      const location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Mystic Forest',
        description: 'A magical forest filled with ancient trees',
        type: 'fantasy',
        atmosphere: 'Mysterious and enchanting',
        significance: 'Where the hero finds the magical sword',
        coordinates: { x: 100, y: 200 }
      };

      const id = await db.locations.add(location);
      const createdLocation = await db.locations.get(id);

      expect(createdLocation).toBeDefined();
      expect(createdLocation?.name).toBe('Mystic Forest');
      expect(createdLocation?.coordinates).toEqual({ x: 100, y: 200 });
    });
  });

  describe('Plot Points', () => {
    it('should create a plot point with character and location references', async () => {
      const plotPoint: Omit<PlotPoint, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'The Discovery',
        description: 'Hero discovers the ancient artifact',
        type: 'inciting_incident',
        importance: 'high',
        characterIds: [1, 2],
        locationIds: [1],
        order: 1,
        coordinates: { x: 150, y: 250 }
      };

      const id = await db.plotPoints.add(plotPoint);
      const createdPlotPoint = await db.plotPoints.get(id);

      expect(createdPlotPoint).toBeDefined();
      expect(createdPlotPoint?.title).toBe('The Discovery');
      expect(createdPlotPoint?.characterIds).toEqual([1, 2]);
      expect(createdPlotPoint?.locationIds).toEqual([1]);
    });
  });

  describe('Chapters', () => {
    it('should create a chapter with plot points', async () => {
      const chapter: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'The Beginning',
        description: 'The story begins here',
        order: 1,
        status: 'draft',
        plotPointIds: [1, 2, 3]
      };

      const id = await db.chapters.add(chapter);
      const createdChapter = await db.chapters.get(id);

      expect(createdChapter).toBeDefined();
      expect(createdChapter?.title).toBe('The Beginning');
      expect(createdChapter?.plotPointIds).toEqual([1, 2, 3]);
    });
  });
});
