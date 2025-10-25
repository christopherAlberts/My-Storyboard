import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('App Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      windows: [],
      activeWindowId: null,
      theme: 'light',
      sidebarOpen: true,
      storyboardCanvas: {
        zoom: 1,
        panX: 0,
        panY: 0,
        selectedElements: [],
        isDrawing: false,
        drawingMode: 'pen',
        brushSize: 2,
        brushColor: '#000000',
      },
      documentState: {
        content: '',
        title: 'Untitled Document',
        isDirty: false,
        lastSaved: null,
      },
      databaseViewState: {
        activeTable: 'characters',
        selectedItem: null,
        searchQuery: '',
        filterType: null,
      },
    });
  });

  it('should open a new window', () => {
    const { openWindow } = useAppStore.getState();
    
    openWindow('document', 'Test Document');
    
    const state = useAppStore.getState();
    expect(state.windows).toHaveLength(1);
    expect(state.windows[0].type).toBe('document');
    expect(state.windows[0].title).toBe('Test Document');
    expect(state.windows[0].isOpen).toBe(true);
  });

  it('should close a window', () => {
    const { openWindow, closeWindow } = useAppStore.getState();
    
    openWindow('document', 'Test Document');
    const windowId = useAppStore.getState().windows[0].id;
    
    closeWindow(windowId);
    
    const state = useAppStore.getState();
    expect(state.windows).toHaveLength(0);
  });

  it('should toggle theme', () => {
    const { toggleTheme } = useAppStore.getState();
    
    expect(useAppStore.getState().theme).toBe('light');
    
    toggleTheme();
    expect(useAppStore.getState().theme).toBe('dark');
    
    toggleTheme();
    expect(useAppStore.getState().theme).toBe('light');
  });

  it('should update window position', () => {
    const { openWindow, updateWindowPosition } = useAppStore.getState();
    
    openWindow('document', 'Test Document');
    const windowId = useAppStore.getState().windows[0].id;
    
    updateWindowPosition(windowId, { x: 100, y: 200 });
    
    const window = useAppStore.getState().windows[0];
    expect(window.position).toEqual({ x: 100, y: 200 });
  });

  it('should update window size', () => {
    const { openWindow, updateWindowSize } = useAppStore.getState();
    
    openWindow('document', 'Test Document');
    const windowId = useAppStore.getState().windows[0].id;
    
    updateWindowSize(windowId, { width: 800, height: 600 });
    
    const window = useAppStore.getState().windows[0];
    expect(window.size).toEqual({ width: 800, height: 600 });
  });

  it('should minimize and restore window', () => {
    const { openWindow, minimizeWindow, restoreWindow } = useAppStore.getState();
    
    openWindow('document', 'Test Document');
    const windowId = useAppStore.getState().windows[0].id;
    
    minimizeWindow(windowId);
    expect(useAppStore.getState().windows[0].isMinimized).toBe(true);
    
    restoreWindow(windowId);
    expect(useAppStore.getState().windows[0].isMinimized).toBe(false);
  });
});
