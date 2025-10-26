export interface WindowState {
  id: string;
  type: 'document' | 'storyboard' | 'database' | 'mapbuilder' | 'settings';
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isSnapped?: boolean;
  snapZone?: SnapZone;
  isFullscreen?: boolean;
  previousState?: { position: { x: number; y: number }; size: { width: number; height: number } };
}

export type SnapZone = 
  | 'left-half' 
  | 'right-half' 
  | 'top-half' 
  | 'bottom-half'
  | 'top-left-quarter' 
  | 'top-right-quarter' 
  | 'bottom-left-quarter' 
  | 'bottom-right-quarter'
  | 'full-screen';

export interface SnapPreview {
  position: { x: number; y: number };
  size: { width: number; height: number };
  zone: SnapZone;
  visible: boolean;
}

export interface WindowSnapConfig {
  snapThreshold: number; // Distance from edge to trigger snap
  animationDuration: number; // Duration of snap animation
  ghostOpacity: number; // Opacity of ghost preview
  enableSnapping: boolean; // Master toggle for snapping
}

export interface AppState {
  windows: WindowState[];
  activeWindowId: string | null;
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
}

export interface StoryboardCanvas {
  zoom: number;
  panX: number;
  panY: number;
  selectedElements: string[];
  isDrawing: boolean;
  drawingMode: 'pen' | 'highlighter' | 'eraser' | 'select';
  brushSize: number;
  brushColor: string;
}

export interface DocumentState {
  id?: number;
  content: string;
  title: string;
  isDirty: boolean;
  lastSaved: Date | null;
}

export interface DatabaseViewState {
  activeTable: 'characters' | 'locations' | 'plotPoints' | 'chapters';
  selectedItem: number | null;
  searchQuery: string;
  filterType: string | null;
}

export interface StoryboardElement {
  id?: number;
  type: 'character' | 'location' | 'plot_point' | 'note' | 'drawing';
  elementId?: number;
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
  connections: number[];
  chapterId?: number;
  createdAt: Date;
  updatedAt: Date;
}
