import Dexie, { Table } from 'dexie';

export interface Character {
  id?: number;
  name: string;
  description: string;
  age?: number;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  appearance: string;
  personality: string;
  background: string;
  relationships: string; // JSON string of relationship IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id?: number;
  name: string;
  description: string;
  type: 'indoor' | 'outdoor' | 'urban' | 'rural' | 'fantasy' | 'sci-fi';
  atmosphere: string;
  significance: string;
  coordinates?: { x: number; y: number }; // For storyboard positioning
  createdAt: Date;
  updatedAt: Date;
}

export interface PlotPoint {
  id?: number;
  title: string;
  description: string;
  type: 'inciting_incident' | 'rising_action' | 'climax' | 'falling_action' | 'resolution' | 'plot_twist' | 'character_development' | 'world_building';
  importance: 'low' | 'medium' | 'high' | 'critical';
  chapterId?: number;
  characterIds: number[]; // Array of character IDs involved
  locationIds: number[]; // Array of location IDs involved
  order: number; // Order within chapter
  coordinates?: { x: number; y: number }; // For storyboard positioning
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id?: number;
  title: string;
  description: string;
  order: number;
  startDate?: Date;
  endDate?: Date;
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  plotPointIds: number[]; // Array of plot point IDs in this chapter
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryboardElement {
  id?: number;
  type: 'character' | 'location' | 'plot_point' | 'note' | 'drawing';
  elementId?: number; // Reference to character, location, or plot point
  x: number;
  y: number;
  width: number;
  height: number;
  content: string; // For notes and drawings
  style: {
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
    fontFamily?: string;
    borderColor?: string;
    borderWidth?: number;
  };
  connections: number[]; // Array of connected element IDs
  chapterId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id?: number;
  title: string;
  content: string; // Rich text content
  type: 'story' | 'outline' | 'notes' | 'research';
  chapterId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class StoryboardDatabase extends Dexie {
  characters!: Table<Character>;
  locations!: Table<Location>;
  plotPoints!: Table<PlotPoint>;
  chapters!: Table<Chapter>;
  storyboardElements!: Table<StoryboardElement>;
  documents!: Table<Document>;

  constructor() {
    super('StoryboardDatabase');
    
    this.version(1).stores({
      characters: '++id, name, role, createdAt, updatedAt',
      locations: '++id, name, type, createdAt, updatedAt',
      plotPoints: '++id, title, type, importance, chapterId, order, createdAt, updatedAt',
      chapters: '++id, title, order, status, createdAt, updatedAt',
      storyboardElements: '++id, type, elementId, chapterId, x, y, createdAt, updatedAt',
      documents: '++id, title, type, chapterId, createdAt, updatedAt'
    });

    // Add hooks for automatic timestamps
    this.characters.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.characters.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
    });

    this.locations.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.locations.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
    });

    this.plotPoints.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.plotPoints.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
    });

    this.chapters.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.chapters.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
    });

    this.storyboardElements.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.storyboardElements.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
    });

    this.documents.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.documents.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
    });
  }
}

export const db = new StoryboardDatabase();
