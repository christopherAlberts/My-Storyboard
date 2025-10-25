import React, { useRef, useEffect, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { StoryboardElement, StoryboardCanvas as CanvasState } from '../../types';
import { Character, Location, PlotPoint } from '../../database/schema';
import { Link, Unlink, ZoomIn, ZoomOut, Maximize2, Grid, Pen, Type, Eraser, Palette, MousePointer } from 'lucide-react';

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
  onAddElement: (type: StoryboardElement['type'], elementId?: number, content?: string, x?: number, y?: number) => void;
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
  const [dragPreview, setDragPreview] = useState<{x: number, y: number, visible: boolean}>({x: 0, y: 0, visible: false});
  const [drawingMode, setDrawingMode] = useState<'select' | 'pen' | 'highlighter' | 'eraser' | 'text'>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#000000');

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

  // Listen for drag events from palette
  useEffect(() => {
    const handleDragStart = (event: CustomEvent) => {
      const dragData = event.detail;
      setIsDraggingFromPalette(true);
      setDragData(dragData);
    };

    const handleDragEnd = () => {
      setIsDraggingFromPalette(false);
      setDragData(null);
      setDragPreview({ x: 0, y: 0, visible: false });
    };

    window.addEventListener('storyboard-drag-start', handleDragStart as EventListener);
    window.addEventListener('storyboard-drag-end', handleDragEnd);

    return () => {
      window.removeEventListener('storyboard-drag-start', handleDragStart as EventListener);
      window.removeEventListener('storyboard-drag-end', handleDragEnd);
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

      // Update drag preview
      if (isDraggingFromPalette && dragData) {
        const pointer = fabricCanvasRef.current!.getPointer(opt.e, false);
        setDragPreview({ x: pointer.x, y: pointer.y, visible: true });
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
        
        // Create new element at pointer position
        onAddElement(dragData.type, dragData.elementId, undefined, pointer.x, pointer.y);
        
        // Reset drag state
        setIsDraggingFromPalette(false);
        setDragData(null);
        setDragPreview({ x: 0, y: 0, visible: false });
      }
    });

    // Handle drawing
    fabricCanvasRef.current.on('mouse:down', (opt) => {
      if (drawingMode === 'pen' && !opt.target) {
        setIsDrawing(true);
        const pointer = fabricCanvasRef.current!.getPointer(opt.e, false);
        
        // Create a new path for drawing
        const path = new fabric.Path(`M ${pointer.x} ${pointer.y}`, {
          stroke: brushColor,
          strokeWidth: brushSize,
          fill: '',
          selectable: false,
          evented: false,
        });
        
        fabricCanvasRef.current!.add(path);
        fabricCanvasRef.current!.setActiveObject(path);
      }
    });

    fabricCanvasRef.current.on('mouse:move', (opt) => {
      if (isDrawing && drawingMode === 'pen') {
        const pointer = fabricCanvasRef.current!.getPointer(opt.e, false);
        const activeObject = fabricCanvasRef.current!.getActiveObject();
        
        if (activeObject && activeObject.type === 'path') {
          const path = activeObject as fabric.Path;
          const pathData = path.path;
          if (pathData && pathData.length > 0) {
            const lastCommand = pathData[pathData.length - 1];
            if (lastCommand[0] === 'M') {
              pathData.push(['L', pointer.x, pointer.y]);
            } else {
              pathData.push(['L', pointer.x, pointer.y]);
            }
            path.set({ path: pathData });
            fabricCanvasRef.current!.renderAll();
          }
        }
      }
    });

    fabricCanvasRef.current.on('mouse:up', () => {
      if (isDrawing && drawingMode === 'pen') {
        setIsDrawing(false);
        const activeObject = fabricCanvasRef.current!.getActiveObject();
        
        if (activeObject && activeObject.type === 'path') {
          // Save the drawing to database
          const path = activeObject as fabric.Path;
          const pathData = JSON.stringify(path.path);
          
          onAddElement('drawing', undefined, pathData, path.left || 0, path.top || 0);
        }
      }
    });

    // Handle text tool
    fabricCanvasRef.current.on('mouse:down', (opt) => {
      if (drawingMode === 'text' && !opt.target) {
        const pointer = fabricCanvasRef.current!.getPointer(opt.e, false);
        
        // Create a text element
        const text = new fabric.IText('Click to edit', {
          left: pointer.x,
          top: pointer.y,
          fontSize: 16,
          fill: brushColor,
          fontFamily: 'Inter, sans-serif',
        });
        
        fabricCanvasRef.current!.add(text);
        fabricCanvasRef.current!.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        
        // Save text to database when editing is done
        text.on('editing:exited', () => {
          onAddElement('note', undefined, text.text || '', text.left || 0, text.top || 0);
        });
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

  // Draw enhanced grid background
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

    // Draw major grid lines (every 100px)
    for (let i = 0; i < width; i += 100) {
      const line = new fabric.Line([i, 0, i, height], {
        stroke: '#d1d5db',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      gridGroup.addWithUpdate(line);
    }

    for (let i = 0; i < height; i += 100) {
      const line = new fabric.Line([0, i, width, i], {
        stroke: '#d1d5db',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      gridGroup.addWithUpdate(line);
    }

    // Draw minor grid lines (every 20px)
    for (let i = 0; i < width; i += gridSize) {
      if (i % 100 !== 0) {
        const line = new fabric.Line([i, 0, i, height], {
          stroke: '#f3f4f6',
          strokeWidth: 0.5,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        gridGroup.addWithUpdate(line);
      }
    }

    for (let i = 0; i < height; i += gridSize) {
      if (i % 100 !== 0) {
        const line = new fabric.Line([0, i, width, i], {
          stroke: '#f3f4f6',
          strokeWidth: 0.5,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        gridGroup.addWithUpdate(line);
      }
    }

    fabricCanvasRef.current.add(gridGroup);
  };

  // Create fabric element from storyboard element
  const createFabricElement = (element: StoryboardElement): fabric.Object | null => {
    if (element.type === 'drawing') {
      // Handle drawing elements
      try {
        const path = new fabric.Path(element.content, {
          left: element.x,
          top: element.y,
          stroke: element.style.color || '#000000',
          strokeWidth: element.style.borderWidth || 2,
          fill: '',
          data: { id: element.id, type: element.type },
        });
        return path;
      } catch (error) {
        console.error('Error creating drawing element:', error);
        return null;
      }
    }

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

    // Create a card-like element with enhanced styling
    const rect = new fabric.Rect({
      width: element.width,
      height: element.height,
      rx: 12,
      ry: 12,
      fill: element.style.backgroundColor || '#ffffff',
      stroke: data.color,
      strokeWidth: 3,
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.15)',
        blur: 15,
        offsetX: 0,
        offsetY: 4,
      }),
    });

    // Add icon with better styling
    const icon = new fabric.Text(data.icon, {
      fontSize: 28,
      left: 12,
      top: 12,
      originX: 'left',
      originY: 'top',
    });

    // Add title with better typography
    const title = new fabric.Textbox(data.title, {
      fontSize: element.style.fontSize || 14,
      fontWeight: 'bold',
      left: 50,
      top: 12,
      width: element.width - 60,
      height: element.height - 24,
      fill: element.style.color || '#1f2937',
      fontFamily: element.style.fontFamily || 'Inter, sans-serif',
      splitByGrapheme: true,
      textAlign: 'left',
    });

    const group = new fabric.Group([rect, icon, title], {
      left: element.x,
      top: element.y,
      data: { id: element.id, type: element.type },
      cornerStyle: 'circle',
      cornerColor: data.color,
      cornerSize: 8,
      transparentCorners: false,
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

          // Calculate distance for curved line
          const distance = Math.sqrt(Math.pow(toCenter.x - fromCenter.x, 2) + Math.pow(toCenter.y - fromCenter.y, 2));
          const controlOffset = Math.min(distance * 0.3, 100);

          // Create curved path
          const path = `M ${fromCenter.x} ${fromCenter.y} Q ${(fromCenter.x + toCenter.x) / 2} ${(fromCenter.y + toCenter.y) / 2 - controlOffset} ${toCenter.x} ${toCenter.y}`;

          // Draw curved line with gradient effect
          const line = new fabric.Path(path, {
            stroke: '#3b82f6',
            strokeWidth: 3,
            fill: '',
            selectable: false,
            evented: false,
            strokeDashArray: [8, 4],
            shadow: new fabric.Shadow({
              color: 'rgba(59, 130, 246, 0.3)',
              blur: 8,
              offsetX: 0,
              offsetY: 0,
            }),
          });

          // Draw arrowhead
          const angle = Math.atan2(toCenter.y - fromCenter.y, toCenter.x - fromCenter.x);
          const arrowLength = 20;
          const arrowWidth = 10;

          const arrowhead = new fabric.Polygon([
            { x: toCenter.x, y: toCenter.y },
            { x: toCenter.x - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle), y: toCenter.y - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle) },
            { x: toCenter.x - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle), y: toCenter.y - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle) },
          ], {
            fill: '#3b82f6',
            stroke: '#3b82f6',
            strokeWidth: 2,
            selectable: false,
            evented: false,
            shadow: new fabric.Shadow({
              color: 'rgba(59, 130, 246, 0.3)',
              blur: 6,
              offsetX: 0,
              offsetY: 0,
            }),
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

  // Update cursor based on drawing mode
  useEffect(() => {
    if (fabricCanvasRef.current) {
      switch (drawingMode) {
        case 'pen':
          fabricCanvasRef.current.defaultCursor = 'crosshair';
          break;
        case 'text':
          fabricCanvasRef.current.defaultCursor = 'text';
          break;
        case 'eraser':
          fabricCanvasRef.current.defaultCursor = 'grab';
          break;
        default:
          fabricCanvasRef.current.defaultCursor = 'default';
      }
    }
  }, [drawingMode]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50">
      <canvas
        ref={canvasRef}
        className="cursor-default"
      />
      
      {/* Enhanced Toolbar */}
      <div className="absolute top-4 left-4 flex gap-2 bg-white rounded-lg shadow-lg p-2">
        {/* Drawing Tools */}
        <div className="flex gap-1 border-r border-gray-200 pr-2 mr-2">
          <button
            onClick={() => setDrawingMode('select')}
            className={`p-2 rounded transition-colors ${
              drawingMode === 'select' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
            title="Select Tool"
          >
            <MousePointer className="w-5 h-5" />
          </button>
          <button
            onClick={() => setDrawingMode('pen')}
            className={`p-2 rounded transition-colors ${
              drawingMode === 'pen' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
            title="Pen Tool"
          >
            <Pen className="w-5 h-5" />
          </button>
          <button
            onClick={() => setDrawingMode('text')}
            className={`p-2 rounded transition-colors ${
              drawingMode === 'text' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
            title="Text Tool"
          >
            <Type className="w-5 h-5" />
          </button>
          <button
            onClick={() => setDrawingMode('eraser')}
            className={`p-2 rounded transition-colors ${
              drawingMode === 'eraser' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
            title="Eraser Tool"
          >
            <Eraser className="w-5 h-5" />
          </button>
        </div>

        {/* Connection Tool */}
        <button
          onClick={toggleConnectionMode}
          className={`px-3 py-2 rounded transition-colors ${
            connectionMode
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-100'
          }`}
          title={connectionMode ? 'Exit Connection Mode' : 'Connect Elements'}
        >
          {connectionMode ? <Unlink className="w-5 h-5" /> : <Link className="w-5 h-5" />}
        </button>

        {/* Brush Settings */}
        {drawingMode === 'pen' && (
          <div className="flex items-center gap-2 border-l border-gray-200 pl-2 ml-2">
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-16"
            />
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300"
            />
          </div>
        )}
      </div>
      
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

      {/* Drag Preview */}
      {dragPreview.visible && dragData && (
        <div
          className="absolute pointer-events-none z-50 bg-blue-100 border-2 border-blue-300 rounded-lg p-2 shadow-lg"
          style={{
            left: dragPreview.x - 50,
            top: dragPreview.y - 25,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="text-sm font-medium text-blue-700">
            {dragData.type === 'character' && '👤 Character'}
            {dragData.type === 'location' && '📍 Location'}
            {dragData.type === 'plot_point' && '🎯 Plot Point'}
            {dragData.type === 'note' && '📝 Note'}
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Grid className="w-4 h-4" />
          <span>Pan: Space + Drag • Zoom: Scroll Wheel • Draw: Select tool and drag</span>
        </div>
      </div>
    </div>
  );
};

export default StoryboardCanvas;
