import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AppState, WindowState, StoryboardCanvas, DocumentState, DatabaseViewState } from '../types';

interface AppStore extends AppState {
  // Window management
  openWindow: (type: WindowState['type'], title: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  setActiveWindow: (id: string) => void;
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
  bringToFront: (id: string) => void;
  
  // Theme
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Storyboard canvas
  storyboardCanvas: StoryboardCanvas;
  updateStoryboardCanvas: (updates: Partial<StoryboardCanvas>) => void;
  
  // Document state
  documentState: DocumentState;
  updateDocumentState: (updates: Partial<DocumentState>) => void;
  
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

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      windows: [],
      activeWindowId: null,
      theme: 'light',
      sidebarOpen: true,
      storyboardCanvas: initialStoryboardCanvas,
      documentState: initialDocumentState,
      databaseViewState: initialDatabaseViewState,

      // Window management
      openWindow: (type, title) => {
        const newWindow: WindowState = {
          ...initialWindowState,
          id: generateWindowId(),
          type,
          title,
          isOpen: true,
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

      // Theme
      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
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
