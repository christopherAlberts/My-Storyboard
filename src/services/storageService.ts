// JSON-based storage service replacing IndexedDB
// Stores all data in a single JSON structure

export interface Character {
  id?: string;
  name: string;
  description: string;
  age?: number;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  appearance: string;
  personality: string;
  background: string;
  relationships: string;
  color?: string;
  notes: string;
  commonPhrases: string[];
  characterArc: string;
  motivation: string;
  fears: string;
  goals: string;
  skills: string[];
  occupation: string;
  socialStatus: string;
  chapterNotes: string;
  chapterEvents: string;
  familyRelations: string;
  romanticRelations: string;
  friendships: string;
  enemies: string;
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id?: string;
  name: string;
  description: string;
  type: 'indoor' | 'outdoor' | 'urban' | 'rural' | 'fantasy' | 'sci-fi';
  atmosphere: string;
  significance: string;
  coordinates?: { x: number; y: number };
  notes: string;
  climate: string;
  population: string;
  landmarks: string[];
  history: string;
  culture: string;
  economy: string;
  politics: string;
  dangers: string;
  resources: string;
  connectedLocations: string[];
  frequentCharacters: string[];
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PlotPoint {
  id?: string;
  title: string;
  description: string;
  type: 'inciting_incident' | 'rising_action' | 'climax' | 'falling_action' | 'resolution' | 'plot_twist' | 'character_development' | 'world_building';
  importance: 'low' | 'medium' | 'high' | 'critical';
  chapterId?: string;
  characterIds: string[];
  locationIds: string[];
  order: number;
  coordinates?: { x: number; y: number };
  notes: string;
  consequences: string;
  prerequisites: string;
  emotionalImpact: string;
  foreshadowing: string;
  themes: string[];
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id?: string;
  title: string;
  description: string;
  order: number;
  startDate?: string;
  endDate?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  plotPointIds: string[];
  notes: string;
  wordCount: number;
  povCharacter: string;
  mainLocation: string;
  themes: string[];
  mood: string;
  pacing: 'slow' | 'medium' | 'fast';
  conflict: string;
  resolution: string;
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface StoryboardElement {
  id?: string;
  type: 'character' | 'location' | 'plot_point' | 'note' | 'drawing';
  elementId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style: {
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
    fontFamily?: string;
    borderColor?: string;
    borderWidth?: number;
  };
  connections: string[];
  chapterId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id?: string;
  title: string;
  content: string;
  type: 'story' | 'outline' | 'notes' | 'research';
  chapterId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MapElement {
  id?: string;
  type: string;
  name: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  icon?: string;
  notes: string;
  characterId?: string;
  locationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MapData {
  id?: string;
  title: string;
  description: string;
  width: number;
  height: number;
  backgroundColor: string;
  gridSize: number;
  showGrid: boolean;
  elements: MapElement[];
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  theme: 'light' | 'dark';
  characterRecognitionEnabled: boolean;
  characterNameCapitalization: 'uppercase' | 'lowercase' | 'leave-as-is';
  tooltipFields: Record<string, boolean>;
}

export interface ProjectData {
  version: string;
  projectName: string;
  lastModified: string;
  characters: Character[];
  locations: Location[];
  plotPoints: PlotPoint[];
  chapters: Chapter[];
  storyboardElements: StoryboardElement[];
  documents: Document[];
  mapElements: MapElement[];
  maps: MapData[];
  settings: Settings;
}

class StorageService {
  private static instance: StorageService;
  private data: ProjectData | null = null;
  private listeners: Array<() => void> = [];
  private saveDebounceTimer: NodeJS.Timeout | null = null;
  private isSaving: boolean = false;

  private constructor() {
    this.loadData();
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadData(): void {
    try {
      const json = localStorage.getItem('storyboard-project-data');
      if (json) {
        this.data = JSON.parse(json);
      } else {
        this.data = this.getDefaultData();
        this.saveData();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.data = this.getDefaultData();
      this.saveData();
    }
  }

  private getDefaultData(): ProjectData {
    const now = new Date().toISOString();
    return {
      version: '1.0',
      projectName: 'My Storyboard Project',
      lastModified: now,
      characters: [],
      locations: [],
      plotPoints: [],
      chapters: [],
      storyboardElements: [],
      documents: [],
      mapElements: [],
      maps: [],
      settings: {
        theme: 'dark',
        characterRecognitionEnabled: true,
        characterNameCapitalization: 'uppercase',
        tooltipFields: {
          description: true,
          role: true,
          occupation: true,
          age: false,
          appearance: false,
          personality: false,
          background: false,
          notes: false,
          characterArc: false,
          motivation: false,
          fears: false,
          goals: false,
        },
      },
    };
  }

  private async saveData(): Promise<void> {
    if (!this.data) return;
    
    this.data.lastModified = new Date().toISOString();
    
    try {
      // Save to localStorage as backup
      localStorage.setItem('storyboard-project-data', JSON.stringify(this.data, null, 2));
      
      // Debounce auto-save to Google Drive to prevent multiple concurrent saves
      if (this.saveDebounceTimer) {
        clearTimeout(this.saveDebounceTimer);
      }
      
      this.saveDebounceTimer = setTimeout(async () => {
        if (!this.isSaving) {
          this.isSaving = true;
          try {
            await this.autoSaveToGoogleDrive();
          } finally {
            this.isSaving = false;
          }
        }
      }, 500); // Wait 500ms before saving to batch multiple rapid changes
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  private async autoSaveToGoogleDrive(): Promise<void> {
    try {
      const folderId = localStorage.getItem('current_project_folder_id');
      const isAuthenticated = localStorage.getItem('google_authenticated') === 'true';
      
      console.log('Auto-save check:', { folderId, isAuthenticated });
      
      if (folderId && isAuthenticated && folderId !== 'placeholder') {
        const { googleDriveService } = await import('./googleDriveService');
        
        // Ensure Google Drive is initialized
        console.log('🔧 Initializing Google Drive service...');
        await googleDriveService.initialize();
        console.log('✅ Google Drive initialized');
        
        console.log('Saving project data to Google Drive:', {
          folderId,
          projectName: this.data?.projectName,
          documentCount: this.data?.documents.length
        });
        
        // Save project metadata (without documents)
        console.log('💾 Saving project metadata...');
        await googleDriveService.saveProjectToFolder(folderId, this.data);
        console.log('✅ Project metadata saved');
        
        // Save each document as a separate file
        console.log(`📄 Saving ${this.data?.documents.length || 0} documents...`);
        const documentsToSave = [...(this.data?.documents || [])]; // Create a copy to avoid modification during iteration
        
        for (let i = 0; i < documentsToSave.length; i++) {
          const doc = documentsToSave[i];
          try {
            console.log(`  Saving document ${i + 1}/${documentsToSave.length}: "${doc.title}" (ID: ${doc.id})`);
            await googleDriveService.saveDocumentToFolder(folderId, doc);
            console.log(`  ✅ Saved: "${doc.title}"`);
          } catch (docError) {
            console.error(`  ❌ Failed to save document "${doc.title}" (ID: ${doc.id}):`, docError);
            // Continue with other documents even if one fails
          }
        }
        
        console.log('✅ Successfully auto-saved to Google Drive');
      } else {
        console.log('⚠️ Auto-save skipped:', { 
          hasFolderId: !!folderId, 
          isAuthenticated,
          folderIdValue: folderId 
        });
      }
    } catch (error) {
      console.error('❌ Auto-save to Google Drive failed:', error);
      console.error('Error details:', error);
      // Don't throw - this is a background sync that shouldn't block the UI
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Listeners for real-time updates
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Export data as JSON string
  exportData(): string {
    return JSON.stringify(this.data, null, 2);
  }

  // Import data from JSON string
  importData(json: string): void {
    try {
      const data = JSON.parse(json);
      this.data = data;
      this.saveData();
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  // Reset data to defaults
  resetData(): void {
    this.data = this.getDefaultData();
    this.saveData();
  }

  // Get all data
  getData(): ProjectData {
    if (!this.data) {
      this.loadData();
    }
    return this.data!;
  }

  // Get file info for project files view
  getFileInfo(): Array<{
    type: string;
    name: string;
    count: number;
    lastModified: string;
    size: number;
  }> {
    const data = this.getData();
    const now = new Date();

    return [
      {
        type: 'Database',
        name: 'project-data.json',
        count: data.characters.length + data.locations.length + data.plotPoints.length + data.chapters.length,
        lastModified: data.lastModified,
        size: JSON.stringify(data).length,
      },
      {
        type: 'Document',
        name: `${data.documents.length} documents`,
        count: data.documents.length,
        lastModified: data.lastModified,
        size: data.documents.reduce((acc, doc) => acc + doc.content.length, 0),
      },
    ];
  }

  // CHARACTERS
  async getCharacters(): Promise<Character[]> {
    return this.getData().characters;
  }

  async getCharacter(id: string): Promise<Character | undefined> {
    return this.getData().characters.find(c => c.id === id);
  }

  async addCharacter(character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const newCharacter: Character = {
      ...character,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    this.getData().characters.push(newCharacter);
    await this.saveData();
    return newCharacter.id!;
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<void> {
    const char = this.getData().characters.find(c => c.id === id);
    if (char) {
      Object.assign(char, updates, { updatedAt: new Date().toISOString() });
      await this.saveData();
    }
  }

  async deleteCharacter(id: string): Promise<void> {
    this.getData().characters = this.getData().characters.filter(c => c.id !== id);
    await this.saveData();
  }

  // LOCATIONS
  async getLocations(): Promise<Location[]> {
    return this.getData().locations;
  }

  async getLocation(id: string): Promise<Location | undefined> {
    return this.getData().locations.find(l => l.id === id);
  }

  async addLocation(location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const newLocation: Location = {
      ...location,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    this.getData().locations.push(newLocation);
    await this.saveData();
    return newLocation.id!;
  }

  async updateLocation(id: string, updates: Partial<Location>): Promise<void> {
    const loc = this.getData().locations.find(l => l.id === id);
    if (loc) {
      Object.assign(loc, updates, { updatedAt: new Date().toISOString() });
      await this.saveData();
    }
  }

  async deleteLocation(id: string): Promise<void> {
    this.getData().locations = this.getData().locations.filter(l => l.id !== id);
    await this.saveData();
  }

  // PLOT POINTS
  async getPlotPoints(): Promise<PlotPoint[]> {
    return this.getData().plotPoints;
  }

  async getPlotPoint(id: string): Promise<PlotPoint | undefined> {
    return this.getData().plotPoints.find(p => p.id === id);
  }

  async addPlotPoint(plotPoint: Omit<PlotPoint, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const newPlotPoint: PlotPoint = {
      ...plotPoint,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    this.getData().plotPoints.push(newPlotPoint);
    await this.saveData();
    return newPlotPoint.id!;
  }

  async updatePlotPoint(id: string, updates: Partial<PlotPoint>): Promise<void> {
    const pp = this.getData().plotPoints.find(p => p.id === id);
    if (pp) {
      Object.assign(pp, updates, { updatedAt: new Date().toISOString() });
      await this.saveData();
    }
  }

  async deletePlotPoint(id: string): Promise<void> {
    this.getData().plotPoints = this.getData().plotPoints.filter(p => p.id !== id);
    await this.saveData();
  }

  // CHAPTERS
  async getChapters(): Promise<Chapter[]> {
    return this.getData().chapters;
  }

  async getChapter(id: string): Promise<Chapter | undefined> {
    return this.getData().chapters.find(c => c.id === id);
  }

  async addChapter(chapter: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const newChapter: Chapter = {
      ...chapter,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    this.getData().chapters.push(newChapter);
    await this.saveData();
    return newChapter.id!;
  }

  async updateChapter(id: string, updates: Partial<Chapter>): Promise<void> {
    const ch = this.getData().chapters.find(c => c.id === id);
    if (ch) {
      Object.assign(ch, updates, { updatedAt: new Date().toISOString() });
      await this.saveData();
    }
  }

  async deleteChapter(id: string): Promise<void> {
    this.getData().chapters = this.getData().chapters.filter(c => c.id !== id);
    await this.saveData();
  }

  // DOCUMENTS
  async getDocuments(): Promise<Document[]> {
    return this.getData().documents;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.getData().documents.find(d => d.id === id);
  }

  async addDocument(document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const newDocument: Document = {
      ...document,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    console.log('📄 Adding new document:', { title: document.title });
    this.getData().documents.push(newDocument);
    await this.saveData();
    // saveData already calls autoSaveToGoogleDrive, so we don't need to call it again
    
    return newDocument.id!;
  }

  // Note: autoSyncToGoogleDrive is now just an alias for backward compatibility
  // This method redirects to autoSaveToGoogleDrive
  private async autoSyncToGoogleDrive() {
    await this.autoSaveToGoogleDrive();
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<void> {
    const doc = this.getData().documents.find(d => d.id === id);
    if (doc) {
      console.log('📝 Updating document:', { id, title: updates.title });
      Object.assign(doc, updates, { updatedAt: new Date().toISOString() });
      await this.saveData();
      // saveData already calls autoSaveToGoogleDrive, so we don't need to call it again
    }
  }

  async deleteDocument(id: string): Promise<void> {
    console.log('🗑️ Deleting document:', { id });
    this.getData().documents = this.getData().documents.filter(d => d.id !== id);
    await this.saveData();
    
    // Also delete the document file from Google Drive
    try {
      const folderId = localStorage.getItem('current_project_folder_id');
      const isAuthenticated = localStorage.getItem('google_authenticated') === 'true';
      
      if (folderId && isAuthenticated && folderId !== 'placeholder') {
        const { googleDriveService } = await import('./googleDriveService');
        await googleDriveService.deleteDocumentFromFolder(folderId, id);
        console.log('✅ Deleted document from Google Drive');
      }
    } catch (error) {
      console.error('❌ Failed to delete document from Google Drive:', error);
    }
  }

  // MAPS
  async getMaps(): Promise<MapData[]> {
    return this.getData().maps;
  }

  async getMap(id: string): Promise<MapData | undefined> {
    return this.getData().maps.find(m => m.id === id);
  }

  async addMap(map: Omit<MapData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const newMap: MapData = {
      ...map,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    this.getData().maps.push(newMap);
    await this.saveData();
    return newMap.id!;
  }

  async updateMap(id: string, updates: Partial<MapData>): Promise<void> {
    const map = this.getData().maps.find(m => m.id === id);
    if (map) {
      Object.assign(map, updates, { updatedAt: new Date().toISOString() });
      await this.saveData();
    }
  }

  async deleteMap(id: string): Promise<void> {
    this.getData().maps = this.getData().maps.filter(m => m.id !== id);
    await this.saveData();
  }

  // MAP ELEMENTS
  async getMapElements(): Promise<MapElement[]> {
    return this.getData().mapElements;
  }

  // STORYBOARD ELEMENTS
  async getStoryboardElements(): Promise<StoryboardElement[]> {
    return this.getData().storyboardElements;
  }

  // SETTINGS
  getSettings(): Settings {
    return this.getData().settings;
  }

  async updateSettings(settings: Partial<Settings>): Promise<void> {
    Object.assign(this.getData().settings, settings);
    await this.saveData();
  }
}

export const storageService = StorageService.getInstance();
