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
  
  // Additional character information
  notes: string; // General notes about the character
  commonPhrases: string[]; // Array of common phrases/sayings
  characterArc: string; // Character development arc description
  motivation: string; // What drives the character
  fears: string; // Character's fears and weaknesses
  goals: string; // Character's goals and objectives
  skills: string[]; // Array of skills/abilities
  occupation: string; // Character's job/profession
  socialStatus: string; // Social standing/class
  
  // Chapter-specific information
  chapterNotes: string; // Notes about what happens to character in chapters
  chapterEvents: string; // Specific events involving this character
  
  // Relationships (enhanced)
  familyRelations: string; // Family relationships
  romanticRelations: string; // Romantic relationships
  friendships: string; // Friendship relationships
  enemies: string; // Enemy relationships
  
  // Custom fields
  customFields: Record<string, any>; // Dynamic custom fields
  
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
  
  // Additional location information
  notes: string; // General notes about the location
  climate: string; // Weather/climate conditions
  population: string; // Population density/type
  landmarks: string[]; // Array of notable landmarks
  history: string; // Historical significance
  culture: string; // Cultural aspects
  economy: string; // Economic characteristics
  politics: string; // Political situation
  dangers: string; // Potential dangers or hazards
  resources: string; // Available resources
  
  // Relationships
  connectedLocations: number[]; // Array of connected location IDs
  frequentCharacters: number[]; // Array of character IDs who frequent this location
  
  // Custom fields
  customFields: Record<string, any>; // Dynamic custom fields
  
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
  
  // Additional plot point information
  notes: string; // Additional notes about this plot point
  consequences: string; // What happens as a result of this plot point
  prerequisites: string; // What needs to happen before this plot point
  emotionalImpact: string; // Emotional impact on characters/readers
  foreshadowing: string; // How this foreshadows future events
  themes: string[]; // Array of themes this plot point explores
  
  // Custom fields
  customFields: Record<string, any>; // Dynamic custom fields
  
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
  
  // Additional chapter information
  notes: string; // General notes about the chapter
  wordCount: number; // Target or actual word count
  povCharacter: number; // ID of the point-of-view character
  mainLocation: number; // ID of the primary location
  themes: string[]; // Array of themes explored in this chapter
  mood: string; // Overall mood/tone of the chapter
  pacing: 'slow' | 'medium' | 'fast'; // Pacing of the chapter
  conflict: string; // Main conflict in this chapter
  resolution: string; // How conflicts are resolved
  
  // Custom fields
  customFields: Record<string, any>; // Dynamic custom fields
  
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

export interface MapElement {
  id?: number;
  type: 'building' | 'road' | 'landmark' | 'character' | 'note' | 'area' | 'church' | 'school' | 'hospital' | 'store' | 'factory' | 'castle' | 'tree' | 'mountain' | 'water' | 'car' | 'ship' | 'plane' | 'train' | 'magic' | 'shield' | 'sword' | 'crown' | 'gem' | 'heart' | 'star' | 'circle' | 'triangle' | 'hexagon';
  name: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  icon?: string;
  notes: string;
  characterId?: number; // Reference to character if type is 'character'
  locationId?: number; // Reference to location if applicable
  createdAt: Date;
  updatedAt: Date;
}

export interface MapData {
  id?: number;
  title: string;
  description: string;
  width: number;
  height: number;
  backgroundColor: string;
  gridSize: number;
  showGrid: boolean;
  elements: MapElement[];
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
  mapElements!: Table<MapElement>;
  maps!: Table<MapData>;

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

    // Version 2 with enhanced fields
    this.version(2).stores({
      characters: '++id, name, role, occupation, socialStatus, createdAt, updatedAt',
      locations: '++id, name, type, climate, population, createdAt, updatedAt',
      plotPoints: '++id, title, type, importance, chapterId, order, createdAt, updatedAt',
      chapters: '++id, title, order, status, wordCount, povCharacter, mainLocation, createdAt, updatedAt',
      storyboardElements: '++id, type, elementId, chapterId, x, y, createdAt, updatedAt',
      documents: '++id, title, type, chapterId, createdAt, updatedAt'
    }).upgrade(trans => {
      // Migration from version 1 to 2
      return trans.characters.toCollection().modify(character => {
        // Add default values for new fields
        character.notes = character.notes || '';
        character.commonPhrases = character.commonPhrases || [];
        character.characterArc = character.characterArc || '';
        character.motivation = character.motivation || '';
        character.fears = character.fears || '';
        character.goals = character.goals || '';
        character.skills = character.skills || [];
        character.occupation = character.occupation || '';
        character.socialStatus = character.socialStatus || '';
        character.chapterNotes = character.chapterNotes || '';
        character.chapterEvents = character.chapterEvents || '';
        character.familyRelations = character.familyRelations || '';
        character.romanticRelations = character.romanticRelations || '';
        character.friendships = character.friendships || '';
        character.enemies = character.enemies || '';
      });
    });

    // Version 3 with map functionality
    this.version(3).stores({
      characters: '++id, name, role, occupation, socialStatus, createdAt, updatedAt',
      locations: '++id, name, type, climate, population, createdAt, updatedAt',
      plotPoints: '++id, title, type, importance, chapterId, order, createdAt, updatedAt',
      chapters: '++id, title, order, status, wordCount, povCharacter, mainLocation, createdAt, updatedAt',
      storyboardElements: '++id, type, elementId, chapterId, x, y, createdAt, updatedAt',
      documents: '++id, title, type, chapterId, createdAt, updatedAt',
      mapElements: '++id, type, name, x, y, characterId, locationId, createdAt, updatedAt',
      maps: '++id, title, width, height, createdAt, updatedAt'
    }).upgrade(trans => {
      // Migration from version 2 to 3
      return Promise.resolve();
    });

    // Version 4 with custom fields
    this.version(4).stores({
      characters: '++id, name, role, occupation, socialStatus, createdAt, updatedAt',
      locations: '++id, name, type, climate, population, createdAt, updatedAt',
      plotPoints: '++id, title, type, importance, chapterId, order, createdAt, updatedAt',
      chapters: '++id, title, order, status, wordCount, povCharacter, mainLocation, createdAt, updatedAt',
      storyboardElements: '++id, type, elementId, chapterId, x, y, createdAt, updatedAt',
      documents: '++id, title, type, chapterId, createdAt, updatedAt',
      mapElements: '++id, type, name, x, y, characterId, locationId, createdAt, updatedAt',
      maps: '++id, title, width, height, createdAt, updatedAt'
    }).upgrade(trans => {
      // Migration from version 3 to 4 - add customFields to all entities
      return Promise.all([
        trans.characters.toCollection().modify(character => {
          character.customFields = character.customFields || {};
        }),
        trans.locations.toCollection().modify(location => {
          location.customFields = location.customFields || {};
        }),
        trans.plotPoints.toCollection().modify(plotPoint => {
          plotPoint.customFields = plotPoint.customFields || {};
        }),
        trans.chapters.toCollection().modify(chapter => {
          chapter.customFields = chapter.customFields || {};
        })
      ]);
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

    this.mapElements.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.mapElements.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
    });

    this.maps.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.maps.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
    });
  }
}

export const db = new StoryboardDatabase();
