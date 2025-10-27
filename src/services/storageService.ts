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
  color?: string; // Location recognition color
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
  locationRecognitionEnabled: boolean;
  locationNameCapitalization: 'uppercase' | 'lowercase' | 'leave-as-is';
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
  private isInitialized: boolean = false;
  private saveStatusListeners: Array<(status: 'saving' | 'saved' | 'error') => void> = [];
  private lastSaveStatus: 'saving' | 'saved' | 'error' = 'saved';
  private changedDocumentIds: Set<string> = new Set(); // Track which documents changed
  private needsProjectSave: boolean = false; // Track if project metadata needs saving

  private constructor() {
    // Don't auto-load - wait for project to be selected
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

  // Initialize with data from Google Drive
  async initialize(data: ProjectData): Promise<void> {
    this.data = data;
    this.isInitialized = true;
    this.notifyListeners();
  }

  // Check if service is initialized with project data
  isReady(): boolean {
    return this.isInitialized && this.data !== null;
  }

  // Subscribe to save status changes
  onSaveStatusChange(listener: (status: 'saving' | 'saved' | 'error') => void): () => void {
    this.saveStatusListeners.push(listener);
    // Immediately call with current status
    listener(this.lastSaveStatus);
    return () => {
      this.saveStatusListeners = this.saveStatusListeners.filter(l => l !== listener);
    };
  }

  private updateSaveStatus(status: 'saving' | 'saved' | 'error'): void {
    this.lastSaveStatus = status;
    this.saveStatusListeners.forEach(listener => listener(status));
    
    // Also update lastModified when saved
    if (status === 'saved' && this.data) {
      this.data.lastModified = new Date().toISOString();
      this.notifyListeners();
    }
  }

  getSaveStatus(): 'saving' | 'saved' | 'error' {
    return this.lastSaveStatus;
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
        locationRecognitionEnabled: true,
        locationNameCapitalization: 'uppercase',
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
      // Save directly to Google Drive (primary storage)
      const folderId = localStorage.getItem('current_project_folder_id');
      const isAuthenticated = localStorage.getItem('google_authenticated') === 'true';
      
      if (folderId && isAuthenticated && folderId !== 'placeholder') {
        // Debounce saves to prevent multiple concurrent API calls
        if (this.saveDebounceTimer) {
          clearTimeout(this.saveDebounceTimer);
        }
        
        this.saveDebounceTimer = setTimeout(async () => {
          if (!this.isSaving) {
            this.isSaving = true;
            this.updateSaveStatus('saving');
            try {
              await this.saveToGoogleDrive();
              this.updateSaveStatus('saved');
              // Clear changed documents after successful save
              this.changedDocumentIds.clear();
              this.needsProjectSave = false;
            } catch (error) {
              this.updateSaveStatus('error');
            } finally {
              this.isSaving = false;
            }
          }
        }, 100); // Fast auto-save (100ms debounce)
      }
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  private async saveToGoogleDrive(): Promise<void> {
    try {
      const folderId = localStorage.getItem('current_project_folder_id');
      const isAuthenticated = localStorage.getItem('google_authenticated') === 'true';
      
      if (!folderId || !isAuthenticated || folderId === 'placeholder') {
        console.warn('⚠️ Cannot save: No project folder selected or not authenticated');
        return;
      }
      
      const { googleDriveService } = await import('./googleDriveService');
      
      // Ensure Google Drive is initialized
      await googleDriveService.initialize();
      
      // Save project metadata only if needed (when non-document data changed)
      if (this.needsProjectSave) {
        await googleDriveService.saveProjectToFolder(folderId, this.data, true);
      }
      
      // Only save changed documents (not all documents)
      if (this.changedDocumentIds.size > 0) {
        const documentsToSave = this.getData().documents.filter(doc => 
          doc.id && this.changedDocumentIds.has(doc.id)
        );
        
        // Save documents in parallel for speed
        await Promise.all(
          documentsToSave.map(async (doc) => {
            try {
              await googleDriveService.saveDocumentToFolder(folderId, doc);
            } catch (docError) {
              console.error(`❌ Failed to save document "${doc.title}":`, docError);
            }
          })
        );
      }
      
      console.log(`✅ Saved ${this.changedDocumentIds.size} document(s) to Google Drive`);
    } catch (error) {
      console.error('❌ Save to Google Drive failed:', error);
      // Don't throw - this is background save
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
      // Return default data if not initialized (shouldn't happen in normal flow)
      console.warn('⚠️ StorageService not initialized - returning default data');
      return this.getDefaultData();
    }
    return this.data;
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

  // Generate a pastel color that's unique from existing character colors
  private generateUniquePastelColor(existingColors: string[]): string {
    const MAX_ATTEMPTS = 200;
    let attempts = 0;
    
    // Normalize color strings (remove any whitespace, ensure uppercase)
    const normalizeColor = (color: string): string => {
      return color.trim().toUpperCase().replace('#', '');
    };
    
    // Pastel color generator - uses HSL with high lightness and saturation
    const generatePastelColor = (): string => {
      // Use multiple sources of randomness for better variety
      const now = Date.now();
      const random1 = Math.random();
      const random2 = Math.random();
      const random3 = Math.random();
      
      // Mix time-based and random values for better distribution
      const timeRandom = (now % 10000) / 10000;
      
      // Generate HSL values for pastel colors with more variation
      // Hue: 0-360 (full spectrum) - use all hues for variety
      const hue = Math.floor((random1 * 0.7 + timeRandom * 0.3) * 360);
      // Saturation: 25-75% (wider range for more variety)
      const saturation = Math.floor(random2 * 50) + 25; // 25-75%
      // Lightness: 65-90% (lighter pastels)
      const lightness = Math.floor(random3 * 25) + 65; // 65-90%
      
      // Convert HSL to RGB
      const h = hue / 360;
      const s = saturation / 100;
      const l = lightness / 100;
      
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((h * 6) % 2 - 1));
      const m = l - c / 2;
      
      let r = 0, g = 0, b = 0;
      
      const h6 = h * 6;
      if (h6 < 1) {
        r = c; g = x; b = 0;
      } else if (h6 < 2) {
        r = x; g = c; b = 0;
      } else if (h6 < 3) {
        r = 0; g = c; b = x;
      } else if (h6 < 4) {
        r = 0; g = x; b = c;
      } else if (h6 < 5) {
        r = x; g = 0; b = c;
      } else {
        r = c; g = 0; b = x;
      }
      
      r = Math.round((r + m) * 255);
      g = Math.round((g + m) * 255);
      b = Math.round((b + m) * 255);
      
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
    };
    
    // Calculate color distance (Euclidean distance in RGB space)
    const colorDistance = (color1: string, color2: string): number => {
      try {
        const hex1 = normalizeColor(color1);
        const hex2 = normalizeColor(color2);
        
        if (hex1.length !== 6 || hex2.length !== 6) return 0;
        
        const r1 = parseInt(hex1.substring(0, 2), 16);
        const g1 = parseInt(hex1.substring(2, 4), 16);
        const b1 = parseInt(hex1.substring(4, 6), 16);
        
        const r2 = parseInt(hex2.substring(0, 2), 16);
        const g2 = parseInt(hex2.substring(2, 4), 16);
        const b2 = parseInt(hex2.substring(4, 6), 16);
        
        return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
      } catch (e) {
        return 0;
      }
    };
    
    // Normalize existing colors
    const normalizedExisting = existingColors
      .filter(c => c && c.trim())
      .map(c => normalizeColor(c));
    
    // Try to find a unique color
    while (attempts < MAX_ATTEMPTS) {
      const newColor = generatePastelColor();
      const normalizedNew = normalizeColor(newColor);
      
      // Check if color is sufficiently different from existing colors
      const isUnique = normalizedExisting.every(existingColor => {
        if (!existingColor || existingColor.length !== 6) return true;
        
        // First check: exact match
        if (normalizedNew === existingColor) return false;
        
        // Second check: distance threshold (lowered to 30 for better variety)
        const distance = colorDistance(newColor, `#${existingColor}`);
        return distance > 30;
      });
      
      if (isUnique) {
        console.log(`Generated unique pastel color: ${newColor} (attempt ${attempts + 1})`);
        return newColor;
      }
      
      attempts++;
    }
    
    // If we couldn't find a unique color after max attempts, generate one anyway
    // but ensure it's different from the most recent one
    const fallbackColor = generatePastelColor();
    console.log(`Generated fallback pastel color: ${fallbackColor} after ${attempts} attempts`);
    return fallbackColor;
  }

  async addCharacter(character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    
    // Generate unique pastel color if not provided
    let characterColor = character.color;
    if (!characterColor || characterColor === '' || characterColor === '#3B82F6' || characterColor === '#000000') {
      const existingColors = this.getData().characters
        .map(c => c.color)
        .filter((c): c is string => !!c);
      characterColor = this.generateUniquePastelColor(existingColors);
    }
    
    const newCharacter: Character = {
      ...character,
      color: characterColor,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    this.getData().characters.push(newCharacter);
    this.needsProjectSave = true;
    await this.saveData();
    return newCharacter.id!;
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<void> {
    const char = this.getData().characters.find(c => c.id === id);
    if (char) {
      Object.assign(char, updates, { updatedAt: new Date().toISOString() });
      this.needsProjectSave = true;
      await this.saveData();
    }
  }

  async deleteCharacter(id: string): Promise<void> {
    this.getData().characters = this.getData().characters.filter(c => c.id !== id);
    this.needsProjectSave = true;
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
    
    // Generate unique pastel color if not provided
    let locationColor = location.color;
    if (!locationColor || locationColor === '' || locationColor === '#90EE90' || locationColor === '#000000') {
      const existingColors = this.getData().locations
        .map(l => l.color)
        .filter((c): c is string => !!c);
      locationColor = this.generateUniquePastelColor(existingColors);
    }
    
    const newLocation: Location = {
      ...location,
      color: locationColor,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    this.getData().locations.push(newLocation);
    this.needsProjectSave = true;
    await this.saveData();
    return newLocation.id!;
  }

  async updateLocation(id: string, updates: Partial<Location>): Promise<void> {
    const loc = this.getData().locations.find(l => l.id === id);
    if (loc) {
      Object.assign(loc, updates, { updatedAt: new Date().toISOString() });
      this.needsProjectSave = true;
      await this.saveData();
    }
  }

  async deleteLocation(id: string): Promise<void> {
    this.getData().locations = this.getData().locations.filter(l => l.id !== id);
    this.needsProjectSave = true;
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
    this.needsProjectSave = true;
    await this.saveData();
    return newPlotPoint.id!;
  }

  async updatePlotPoint(id: string, updates: Partial<PlotPoint>): Promise<void> {
    const pp = this.getData().plotPoints.find(p => p.id === id);
    if (pp) {
      Object.assign(pp, updates, { updatedAt: new Date().toISOString() });
      this.needsProjectSave = true;
      await this.saveData();
    }
  }

  async deletePlotPoint(id: string): Promise<void> {
    this.getData().plotPoints = this.getData().plotPoints.filter(p => p.id !== id);
    this.needsProjectSave = true;
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
    this.needsProjectSave = true;
    await this.saveData();
    return newChapter.id!;
  }

  async updateChapter(id: string, updates: Partial<Chapter>): Promise<void> {
    const ch = this.getData().chapters.find(c => c.id === id);
    if (ch) {
      Object.assign(ch, updates, { updatedAt: new Date().toISOString() });
      this.needsProjectSave = true;
      await this.saveData();
    }
  }

  async deleteChapter(id: string): Promise<void> {
    this.getData().chapters = this.getData().chapters.filter(c => c.id !== id);
    this.needsProjectSave = true;
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
    // Mark as changed - will be saved by debounced save
    if (newDocument.id) {
      this.changedDocumentIds.add(newDocument.id);
      this.needsProjectSave = true; // New document added, need to update project metadata
    }
    await this.saveData();
    
    return newDocument.id!;
  }


  async updateDocument(id: string, updates: Partial<Document>): Promise<void> {
    const doc = this.getData().documents.find(d => d.id === id);
    if (doc) {
      Object.assign(doc, updates, { updatedAt: new Date().toISOString() });
      // Mark this document as changed - will be saved by debounced save
      if (id) {
        this.changedDocumentIds.add(id);
      }
      await this.saveData();
    } else {
      console.error('❌ Document not found for update:', id);
    }
  }

  async deleteDocument(id: string): Promise<void> {
    console.log('🗑️ Deleting document:', { id });
    this.getData().documents = this.getData().documents.filter(d => d.id !== id);
    this.needsProjectSave = true; // Document deleted, need to update project metadata
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
    this.needsProjectSave = true;
    await this.saveData();
  }
}

export const storageService = StorageService.getInstance();
