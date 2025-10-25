import React, { useRef, useEffect, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { StoryboardElement, StoryboardCanvas as CanvasState } from '../../types';
import { Character, Location, PlotPoint } from '../../database/schema';
import { Link, Unlink, ZoomIn, ZoomOut, Maximize2, Grid } from 'lucide-react';

interface StoryboardCanvasProps {
  elements: StoryboardElement[];
  characters: Character[];
  locations: Location[];
  plotPoints: PlotPoint[];
  canvas: CanvasState;
  onUpdateCanvas: (updates: Partial<CanvasState>) => void;
  onUpdateElement: (id: number, updates: Partial<StoryboardElement>) => void;
  onDeleteElement: (id: number) => void;
  onConnectElements: (fromId: number, toId: number) => void;
  onAddElement: (type: StoryboardElement['type'], elementId?: number, content?: string) => void;
}

const StoryboardCanvas: React.FC<StoryboardCanvasProps> = ({
  elements,
  characters,
  locations,
  plotPoints,
  canvas,
  onUpdateCanvas,
  onUpdateElement,
  onDeleteElement,
  onConnectElements,
  onAddElement,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const gridSize = 20;
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectionStart, setConnectionStart] = useState<number | null>(null);
  const [isDraggingFromPalette, setIsDraggingFromPalette] = useState(false);
  const [dragData, setDragData] = useState<{type: StoryboardElement['type'], elementId?: number} | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
      });

      // Set initial zoom
      fabricCanvasRef.current.setZoom(canvas.zoom);

      // Event handlers
      setupCanvasEvents();
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  // Setup canvas events
  const setupCanvasEvents = () => {
    if (!fabricCanvasRef.current) return;

    // Handle zoom with mouse wheel
    fabricCanvasRef.current.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      const zoom = fabricCanvasRef.current!.getZoom();
      const newZoom = Math.max(0.1, Math.min(3, zoom - delta / 200));
      
      // Zoom towards mouse position
      const point = new fabric.Point(opt.pointer!.x, opt.pointer!.y);
      fabricCanvasRef.current!.zoomToPoint(point, newZoom);
      
      onUpdateCanvas({ zoom: newZoom });
      opt.e.preventDefault();
    });

    // Handle panning with middle mouse or space + drag
    fabricCanvasRef.current.on('mouse:down', (opt) => {
      if (opt.e.button === 1 || opt.e.spaceKey) {
        setIsDragging(true);
        setLastMousePos({ x: opt.e.clientX, y: opt.e.clientY });
        fabricCanvasRef.current!.setCursor('grabbing');
      }
    });

    fabricCanvasRef.current.on('mouse:move', (opt) => {
      if (isDragging && fabricCanvasRef.current) {
        const vpt = fabricCanvasRef.current.viewportTransform;
        if (vpt) {
          const dx = opt.e.clientX - lastMousePos.x;
          const dy = opt.e.clientY - lastMousePos.y;
          vpt[4] += dx;
          vpt[5] += dy;
          fabricCanvasRef.current.requestRenderAll();
        }
        setLastMousePos({ x: opt.e.clientX, y: opt.e.clientY });
      }

      // Update connection preview during link mode
      if (connectionMode && connectionStart !== null && fabricCanvasRef.current) {
        fabricCanvasRef.current.renderAll();
      }
    });

    fabricCanvasRef.current.on('mouse:up', () => {
      setIsDragging(false);
      fabricCanvasRef.current!.setCursor('default');
    });

    // Handle element selection for connection mode
    fabricCanvasRef.current.on('mouse:down', (opt) => {
      if (connectionMode && !connectionStart) {
        const obj = opt.target;
        if (obj && obj.data) {
          setConnectionStart(obj.data.id);
        }
      } else if (connectionMode && connectionStart) {
        const obj = opt.target;
        if (obj && obj.data && obj.data.id !== connectionStart) {
          onConnectElements(connectionStart, obj.data.id);
          setConnectionStart(null);
          setConnectionMode(false);
          fabricCanvasRef.current!.renderAll();
        }
      }
    });

    // Handle canvas click for dropping elements
    fabricCanvasRef.current.on('mouse:down', (opt) => {
      if (isDraggingFromPalette && dragData) {
        const pointer = fabricCanvasRef.current!.getPointer(opt.e, false);
        
        // Create new element
        onAddElement(dragData.type, dragData.elementId);
        
        // Reset drag state
        setIsDraggingFromPalette(false);
        setDragData(null);
      }
    });

    // Handle element position updates
    fabricCanvasRef.current.on('object:modified', (e) => {
      const obj = e.target;
      if (obj && obj.data) {
        const coords = obj.getCoords();
        onUpdateElement(obj.data.id, {
          x: obj.left || 0,
          y: obj.top || 0,
          width: (coords[1].x - coords[0].x) / fabricCanvasRef.current!.getZoom(),
          height: (coords[3].y - coords[0].y) / fabricCanvasRef.current!.getZoom(),
        });
      }
    });

    // Delete element on Delete key
    fabricCanvasRef.current.on('key:down', (opt) => {
      if (opt.key === 'Delete' || opt.key === 'Backspace') {
        const activeObjects = fabricCanvasRef.current!.getActiveObjects();
        activeObjects.forEach(obj => {
          if (obj.data) {
            onDeleteElement(obj.data.id);
            fabricCanvasRef.current!.remove(obj);
          }
        });
      }
    });
  };

  // Update canvas zoom/pan
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setZoom(canvas.zoom);
      const vpt = fabricCanvasRef.current.viewportTransform;
      if (vpt) {
        vpt[4] = canvas.panX;
        vpt[5] = canvas.panY;
        fabricCanvasRef.current.requestRenderAll();
      }
    }
  }, [canvas.zoom, canvas.panX, canvas.panY]);

  // Render elements
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    // Clear existing objects
    const objects = fabricCanvasRef.current.getObjects();
    objects.forEach(obj => {
      if (!obj.locked) {
        fabricCanvasRef.current!.remove(obj);
      }
    });

    // Draw grid
    drawGrid();

    // Render elements
    elements.forEach(element => {
      const obj = createFabricElement(element);
      if (obj) {
        fabricCanvasRef.current!.add(obj);
      }
    });

    // Draw connections
    renderConnections();

    fabricCanvasRef.current.renderAll();
  }, [elements]);

  // Draw grid background
  const drawGrid = () => {
    if (!fabricCanvasRef.current) return;

    const width = fabricCanvasRef.current.width;
    const height = fabricCanvasRef.current.height;
    const gridGroup = new fabric.Group([], {
      selectable: false,
      evented: false,
      lockMovementX: true,
      lockMovementY: true,
      hoverCursor: 'default',
    });

    // Draw vertical lines
    for (let i = 0; i < width; i += gridSize) {
      const line = new fabric.Line([i, 0, i, height], {
        stroke: '#e5e7eb',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      gridGroup.addWithUpdate(line);
    }

    // Draw horizontal lines
    for (let i = 0; i < height; i += gridSize) {
      const line = new fabric.Line([0, i, width, i], {
        stroke: '#e5e7eb',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      gridGroup.addWithUpdate(line);
    }

    fabricCanvasRef.current.add(gridGroup);
  };

  // Create fabric element from storyboard element
  const createFabricElement = (element: StoryboardElement): fabric.Object | null => {
    const getElementData = () => {
      switch (element.type) {
        case 'character':
          const char = characters.find(c => c.id === element.elementId);
          return { title: char?.name || 'Character', icon: '👤', color: '#3b82f6' };
        case 'location':
          const loc = locations.find(l => l.id === element.elementId);
          return { title: loc?.name || 'Location', icon: '📍', color: '#8b5cf6' };
        case 'plot_point':
          const plot = plotPoints.find(p => p.id === element.elementId);
          return { title: plot?.title || 'Plot Point', icon: '🎯', color: '#f59e0b' };
        case 'note':
          return { title: element.content || 'Note', icon: '📝', color: '#10b981' };
        default:
          return { title: 'Element', icon: '📦', color: '#6b7280' };
      }
    };

    const data = getElementData();

    // Create a card-like element
    const rect = new fabric.Rect({
      width: element.width,
      height: element.height,
      rx: 8,
      ry: 8,
      fill: '#ffffff',
      stroke: data.color,
      strokeWidth: 2,
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.1)',
        blur: 10,
        offsetX: 0,
        offsetY: 2,
      }),
    });

    // Add icon
    const icon = new fabric.Text(data.icon, {
      fontSize: 32,
      left: 10,
      top: 10,
      originX: 'left',
      originY: 'top',
    });

    // Add title
    const title = new fabric.Textbox(data.title, {
      fontSize: 14,
      fontWeight: 'bold',
      left: 50,
      top: 10,
      width: element.width - 60,
      fill: '#1f2937',
      splitByGrapheme: true,
    });

    const group = new fabric.Group([rect, icon, title], {
      left: element.x,
      top: element.y,
      data: { id: element.id, type: element.type },
    });

    return group;
  };

  // Render connections between elements
  const renderConnections = () => {
    if (!fabricCanvasRef.current) return;

    elements.forEach(element => {
      element.connections.forEach(connectionId => {
        const connectedElement = elements.find(el => el.id === connectionId);
        if (connectedElement) {
          const fromCenter = {
            x: element.x + element.width / 2,
            y: element.y + element.height / 2,
          };
          const toCenter = {
            x: connectedElement.x + connectedElement.width / 2,
            y: connectedElement.y + connectedElement.height / 2,
          };

          // Draw arrow line
          const angle = Math.atan2(toCenter.y - fromCenter.y, toCenter.x - fromCenter.x);
          const arrowLength = 15;
          const arrowWidth = 8;

          // Line
          const line = new fabric.Line([fromCenter.x, fromCenter.y, toCenter.x, toCenter.y], {
            stroke: '#6b7280',
            strokeWidth: 2,
            selectable: false,
            evented: false,
            strokeDashArray: [5, 5],
          });

          // Arrowhead
          const arrowhead = new fabric.Polygon([
            { x: toCenter.x, y: toCenter.y },
            { x: toCenter.x - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle), y: toCenter.y - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle) },
            { x: toCenter.x - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle), y: toCenter.y - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle) },
          ], {
            fill: '#6b7280',
            stroke: '#6b7280',
            selectable: false,
            evented: false,
          });

          fabricCanvasRef.current!.add(line);
          fabricCanvasRef.current!.add(arrowhead);
        }
      });
    });
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(3, canvas.zoom * 1.2);
    onUpdateCanvas({ zoom: newZoom });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.1, canvas.zoom * 0.8);
    onUpdateCanvas({ zoom: newZoom });
  };

  const handleResetView = () => {
    onUpdateCanvas({ zoom: 1, panX: 0, panY: 0 });
  };

  const toggleConnectionMode = () => {
    setConnectionMode(!connectionMode);
    setConnectionStart(null);
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.defaultCursor = !connectionMode ? 'crosshair' : 'default';
      fabricCanvasRef.current.renderAll();
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50">
      <canvas
        ref={canvasRef}
        className="cursor-default"
      />
      
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <div className="text-xs text-center text-gray-600 min-w-[40px]">
          {Math.round(canvas.zoom * 100)}%
        </div>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Reset View"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Connection Mode Button */}
      <div className="absolute top-4 left-4 flex gap-2">
        <button
          onClick={toggleConnectionMode}
          className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors ${
            connectionMode
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title={connectionMode ? 'Exit Connection Mode (Click first element, then second)' : 'Connect Elements'}
        >
          {connectionMode ? <Unlink className="w-5 h-5" /> : <Link className="w-5 h-5" />}
          <span className="text-sm font-medium">
            {connectionMode ? 'Linking...' : 'Link'}
          </span>
        </button>
      </div>

      {/* Info Panel */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Grid className="w-4 h-4" />
          <span>Pan: Space + Drag • Zoom: Scroll Wheel</span>
        </div>
      </div>
    </div>
  );
};

export default StoryboardCanvas;
