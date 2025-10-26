import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AppState, WindowState, StoryboardCanvas, DocumentState, DatabaseViewState, SnapZone, SnapPreview, WindowSnapConfig } from '../types';
import { db, Document } from '../database/schema';

interface AppStore extends AppState {
  // Settings
  characterRecognitionEnabled: boolean;
  setCharacterRecognitionEnabled: (enabled: boolean) => void;
  characterNameCapitalization: 'uppercase' | 'lowercase' | 'leave-as-is';
  setCharacterNameCapitalization: (mode: 'uppercase' | 'lowercase' | 'leave-as-is') => void;
  tooltipFields: {
    showDescription: boolean;
    showRole: boolean;
    showOccupation: boolean;
  };
  setTooltipFields: (fields: Partial<{ showDescription: boolean; showRole: boolean; showOccupation: boolean }>) => void;
  
  // Window management
  openWindow: (type: WindowState['type'], title: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  setActiveWindow: (id: string) => void;
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
  bringToFront: (id: string) => void;
  toggleFullscreen: (id: string) => void;
  
  // Window snapping
  snapConfig: WindowSnapConfig;
  snapPreview: SnapPreview;
  updateSnapConfig: (config: Partial<WindowSnapConfig>) => void;
  setSnapPreview: (preview: Partial<SnapPreview>) => void;
  snapWindowToZone: (windowId: string, zone: SnapZone) => void;
  unsnapWindow: (windowId: string) => void;
  
  // Theme
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Storyboard canvas
  storyboardCanvas: StoryboardCanvas;
  updateStoryboardCanvas: (updates: Partial<StoryboardCanvas>) => void;
  
  // Document state
  documentState: DocumentState;
  updateDocumentState: (updates: Partial<DocumentState>) => void;
  loadDocument: (id: number) => Promise<void>;
  createNewDocument: () => void;
  
  // Database view state
  databaseViewState: DatabaseViewState;
  updateDatabaseViewState: (updates: Partial<DatabaseViewState>) => void;
}

const generateWindowId = () => `window_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const initialWindowState: WindowState = {
  id: '',
  type: 'document',
  title: '',
  isOpen: false,
  isMinimized: false,
  position: { x: 100, y: 100 },
  size: { width: 800, height: 600 },
  zIndex: 1,
};

const initialStoryboardCanvas: StoryboardCanvas = {
  zoom: 1,
  panX: 0,
  panY: 0,
  selectedElements: [],
  isDrawing: false,
  drawingMode: 'pen',
  brushSize: 2,
  brushColor: '#000000',
};

const initialDocumentState: DocumentState = {
  content: '',
  title: 'Untitled Document',
  isDirty: false,
  lastSaved: null,
};

const initialDatabaseViewState: DatabaseViewState = {
  activeTable: 'characters',
  selectedItem: null,
  searchQuery: '',
  filterType: null,
};

const initialSnapConfig: WindowSnapConfig = {
  snapThreshold: 50, // 50px threshold for snapping
  animationDuration: 200, // 200ms animation
  ghostOpacity: 0.3, // 30% opacity for ghost
  enableSnapping: true, // Enable snapping by default
};

const initialSnapPreview: SnapPreview = {
  position: { x: 0, y: 0 },
  size: { width: 0, height: 0 },
  zone: 'left-half',
  visible: false,
};

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      windows: [],
      activeWindowId: null,
      theme: 'dark',
      sidebarOpen: true,
      storyboardCanvas: initialStoryboardCanvas,
      documentState: initialDocumentState,
      databaseViewState: initialDatabaseViewState,
      snapConfig: initialSnapConfig,
      snapPreview: initialSnapPreview,
      characterRecognitionEnabled: true,
      characterNameCapitalization: 'uppercase',
      tooltipFields: {
        showDescription: true,
        showRole: true,
        showOccupation: false,
      },

      // Settings
      setCharacterRecognitionEnabled: (enabled) => {
        set({ characterRecognitionEnabled: enabled });
      },
      setCharacterNameCapitalization: (mode) => {
        set({ characterNameCapitalization: mode });
      },
      setTooltipFields: (fields) => {
        set((state) => ({
          tooltipFields: { ...state.tooltipFields, ...fields }
        }));
      },

      // Window management
      openWindow: (type, title) => {
        // Calculate centered position
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
        const centeredX = (viewportWidth - initialWindowState.size.width) / 2;
        const centeredY = (viewportHeight - initialWindowState.size.height) / 2;

        const newWindow: WindowState = {
          ...initialWindowState,
          id: generateWindowId(),
          type,
          title,
          isOpen: true,
          position: { x: centeredX, y: centeredY },
          zIndex: Math.max(...get().windows.map(w => w.zIndex), 0) + 1,
        };
        
        set((state) => ({
          windows: [...state.windows, newWindow],
          activeWindowId: newWindow.id,
        }));
      },

      closeWindow: (id) => {
        set((state) => {
          const newWindows = state.windows.filter(w => w.id !== id);
          const newActiveWindowId = state.activeWindowId === id 
            ? (newWindows.length > 0 ? newWindows[newWindows.length - 1].id : null)
            : state.activeWindowId;
          
          return {
            windows: newWindows,
            activeWindowId: newActiveWindowId,
          };
        });
      },

      minimizeWindow: (id) => {
        set((state) => ({
          windows: state.windows.map(w => 
            w.id === id ? { ...w, isMinimized: true } : w
          ),
        }));
      },

      restoreWindow: (id) => {
        set((state) => ({
          windows: state.windows.map(w => 
            w.id === id ? { ...w, isMinimized: false } : w
          ),
          activeWindowId: id,
        }));
      },

      setActiveWindow: (id) => {
        set((state) => ({
          activeWindowId: id,
          windows: state.windows.map(w => 
            w.id === id ? { ...w, zIndex: Math.max(...state.windows.map(w => w.zIndex)) + 1 } : w
          ),
        }));
      },

      updateWindowPosition: (id, position) => {
        set((state) => ({
          windows: state.windows.map(w => 
            w.id === id ? { ...w, position } : w
          ),
        }));
      },

      updateWindowSize: (id, size) => {
        set((state) => ({
          windows: state.windows.map(w => 
            w.id === id ? { ...w, size } : w
          ),
        }));
      },

      bringToFront: (id) => {
        set((state) => ({
          windows: state.windows.map(w => 
            w.id === id ? { ...w, zIndex: Math.max(...state.windows.map(w => w.zIndex)) + 1 } : w
          ),
          activeWindowId: id,
        }));
      },

      toggleFullscreen: (id) => {
        set((state) => {
          const win = state.windows.find(w => w.id === id);
          if (!win) return state;

          if (win.isFullscreen) {
            // Restore previous state
            if (win.previousState) {
              return {
                windows: state.windows.map(w => 
                  w.id === id 
                    ? { 
                        ...w, 
                        isFullscreen: false, 
                        position: win.previousState!.position,
                        size: win.previousState!.size,
                        previousState: undefined
                      } 
                    : w
                ),
              };
            }
          } else {
            // Save current state and fullscreen
            // Use browser window dimensions
            const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
            const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
            
            return {
              windows: state.windows.map(w => 
                w.id === id 
                  ? { 
                      ...w, 
                      isFullscreen: true,
                      previousState: {
                        position: { x: w.position.x, y: w.position.y },
                        size: { width: w.size.width, height: w.size.height }
                      },
                      position: { x: 0, y: 0 },
                      size: { width: viewportWidth, height: viewportHeight }
                    } 
                  : w
              ),
            };
          }
          return state;
        });
      },

      // Window snapping
      updateSnapConfig: (config) => {
        set((state) => ({
          snapConfig: { ...state.snapConfig, ...config },
        }));
      },

      setSnapPreview: (preview) => {
        set((state) => ({
          snapPreview: { ...state.snapPreview, ...preview },
        }));
      },

      snapWindowToZone: (windowId, zone) => {
        const { snapConfig } = get();
        if (!snapConfig.enableSnapping) return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let position = { x: 0, y: 0 };
        let size = { width: viewportWidth, height: viewportHeight };

        switch (zone) {
          case 'left-half':
            size = { width: viewportWidth / 2, height: viewportHeight };
            position = { x: 0, y: 0 };
            break;
          case 'right-half':
            size = { width: viewportWidth / 2, height: viewportHeight };
            position = { x: viewportWidth / 2, y: 0 };
            break;
          case 'top-half':
            size = { width: viewportWidth, height: viewportHeight / 2 };
            position = { x: 0, y: 0 };
            break;
          case 'bottom-half':
            size = { width: viewportWidth, height: viewportHeight / 2 };
            position = { x: 0, y: viewportHeight / 2 };
            break;
          case 'top-left-quarter':
            size = { width: viewportWidth / 2, height: viewportHeight / 2 };
            position = { x: 0, y: 0 };
            break;
          case 'top-right-quarter':
            size = { width: viewportWidth / 2, height: viewportHeight / 2 };
            position = { x: viewportWidth / 2, y: 0 };
            break;
          case 'bottom-left-quarter':
            size = { width: viewportWidth / 2, height: viewportHeight / 2 };
            position = { x: 0, y: viewportHeight / 2 };
            break;
          case 'bottom-right-quarter':
            size = { width: viewportWidth / 2, height: viewportHeight / 2 };
            position = { x: viewportWidth / 2, y: viewportHeight / 2 };
            break;
          case 'full-screen':
            size = { width: viewportWidth, height: viewportHeight };
            position = { x: 0, y: 0 };
            break;
        }

        set((state) => ({
          windows: state.windows.map(w => 
            w.id === windowId 
              ? { 
                  ...w, 
                  position, 
                  size, 
                  isSnapped: true, 
                  snapZone: zone 
                } 
              : w
          ),
        }));
      },

      unsnapWindow: (windowId) => {
        set((state) => ({
          windows: state.windows.map(w => 
            w.id === windowId 
              ? { 
                  ...w, 
                  isSnapped: false, 
                  snapZone: undefined 
                } 
              : w
          ),
        }));
      },

      // Theme
      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : state.theme === 'dark' ? 'system' : 'light',
        }));
      },

      setTheme: (theme) => {
        set({ theme });
      },

      // Sidebar
      toggleSidebar: () => {
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      // Storyboard canvas
      updateStoryboardCanvas: (updates) => {
        set((state) => ({
          storyboardCanvas: { ...state.storyboardCanvas, ...updates },
        }));
      },

      // Document state
      updateDocumentState: (updates) => {
        set((state) => ({
          documentState: { ...state.documentState, ...updates },
        }));
      },

      loadDocument: async (id) => {
        try {
          const document = await db.documents.get(id);
          if (document) {
            set((state) => ({
              documentState: {
                id: document.id,
                content: document.content,
                title: document.title,
                isDirty: false,
                lastSaved: document.updatedAt,
              },
            }));
          }
        } catch (error) {
          console.error('Error loading document:', error);
        }
      },

      createNewDocument: () => {
        set((state) => ({
          documentState: {
            id: undefined,
            content: '',
            title: 'Untitled Document',
            isDirty: false,
            lastSaved: null,
          },
        }));
      },

      // Database view state
      updateDatabaseViewState: (updates) => {
        set((state) => ({
          databaseViewState: { ...state.databaseViewState, ...updates },
        }));
      },
    }),
    {
      name: 'storyboard-app-store',
    }
  )
);
