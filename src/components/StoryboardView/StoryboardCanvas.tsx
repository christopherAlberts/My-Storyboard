import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { StoryboardElement, StoryboardCanvas as CanvasState } from '../../types';
import { Character, Location, PlotPoint } from '../../database/schema';

interface StoryboardCanvasProps {
  elements: StoryboardElement[];
  canvas: CanvasState;
  onUpdateCanvas: (updates: Partial<CanvasState>) => void;
  onUpdateElement: (id: number, updates: Partial<StoryboardElement>) => void;
  onDeleteElement: (id: number) => void;
  onConnectElements: (fromId: number, toId: number) => void;
}

const StoryboardCanvas: React.FC<StoryboardCanvasProps> = ({
  elements,
  canvas,
  onUpdateCanvas,
  onUpdateElement,
  onDeleteElement,
  onConnectElements,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);

  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#f8f9fa',
        selection: true,
      });

      // Set up drawing mode
      fabricCanvasRef.current.isDrawingMode = canvas.drawingMode === 'pen';
      fabricCanvasRef.current.freeDrawingBrush.width = canvas.brushSize;
      fabricCanvasRef.current.freeDrawingBrush.color = canvas.brushColor;

      // Handle selection
      fabricCanvasRef.current.on('selection:created', handleSelection);
      fabricCanvasRef.current.on('selection:updated', handleSelection);
      fabricCanvasRef.current.on('selection:cleared', () => setSelectedElements([]));

      // Handle object modification
      fabricCanvasRef.current.on('object:modified', handleObjectModified);
      fabricCanvasRef.current.on('object:moving', handleObjectMoving);
      fabricCanvasRef.current.on('object:scaling', handleObjectScaling);

      // Handle mouse events for panning
      fabricCanvasRef.current.on('mouse:down', handleMouseDown);
      fabricCanvasRef.current.on('mouse:move', handleMouseMove);
      fabricCanvasRef.current.on('mouse:up', handleMouseUp);
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setZoom(canvas.zoom);
      fabricCanvasRef.current.viewportTransform = [
        canvas.zoom, 0, 0, canvas.zoom, canvas.panX, canvas.panY
      ];
    }
  }, [canvas.zoom, canvas.panX, canvas.panY]);

  useEffect(() => {
    if (fabricCanvasRef.current) {
      // Clear existing objects
      fabricCanvasRef.current.clear();

      // Add elements as fabric objects
      elements.forEach(element => {
        const fabricObject = createFabricObject(element);
        if (fabricObject) {
          fabricCanvasRef.current!.add(fabricObject);
        }
      });

      // Add connections
      elements.forEach(element => {
        element.connections.forEach(connectionId => {
          const connectedElement = elements.find(el => el.id === connectionId);
          if (connectedElement) {
            drawConnection(element, connectedElement);
          }
        });
      });

      fabricCanvasRef.current.renderAll();
    }
  }, [elements]);

  const createFabricObject = (element: StoryboardElement): fabric.Object | null => {
    const { x, y, width, height, style, type, content } = element;

    let fabricObject: fabric.Object;

    switch (type) {
      case 'character':
        fabricObject = new fabric.Rect({
          left: x,
          top: y,
          width,
          height,
          fill: style.backgroundColor || '#e3f2fd',
          stroke: style.borderColor || '#cccccc',
          strokeWidth: style.borderWidth || 1,
          selectable: true,
          data: { id: element.id, type: 'character' },
        });
        break;

      case 'location':
        fabricObject = new fabric.Rect({
          left: x,
          top: y,
          width,
          height,
          fill: style.backgroundColor || '#f3e5f5',
          stroke: style.borderColor || '#cccccc',
          strokeWidth: style.borderWidth || 1,
          selectable: true,
          data: { id: element.id, type: 'location' },
        });
        break;

      case 'plot_point':
        fabricObject = new fabric.Rect({
          left: x,
          top: y,
          width,
          height,
          fill: style.backgroundColor || '#fff3e0',
          stroke: style.borderColor || '#cccccc',
          strokeWidth: style.borderWidth || 1,
          selectable: true,
          data: { id: element.id, type: 'plot_point' },
        });
        break;

      case 'note':
        fabricObject = new fabric.Textbox(content || 'Note', {
          left: x,
          top: y,
          width,
          height,
          fill: style.color || '#000000',
          fontSize: style.fontSize || 14,
          fontFamily: style.fontFamily || 'Inter',
          backgroundColor: style.backgroundColor || '#fff3e0',
          selectable: true,
          data: { id: element.id, type: 'note' },
        });
        break;

      case 'drawing':
        // For drawings, we'll create a simple rectangle placeholder
        // In a real implementation, you'd handle the actual drawing data
        fabricObject = new fabric.Rect({
          left: x,
          top: y,
          width,
          height,
          fill: 'transparent',
          stroke: style.color || '#000000',
          strokeWidth: style.borderWidth || 2,
          selectable: true,
          data: { id: element.id, type: 'drawing' },
        });
        break;

      default:
        return null;
    }

    return fabricObject;
  };

  const drawConnection = (from: StoryboardElement, to: StoryboardElement) => {
    if (!fabricCanvasRef.current) return;

    const line = new fabric.Line([
      from.x + from.width / 2,
      from.y + from.height / 2,
      to.x + to.width / 2,
      to.y + to.height / 2
    ], {
      stroke: '#666666',
      strokeWidth: 2,
      selectable: false,
      evented: false,
    });

    fabricCanvasRef.current.add(line);
  };

  const handleSelection = (e: fabric.IEvent) => {
    const selected = e.selected || [];
    setSelectedElements(selected.map(obj => obj.data?.id).filter(Boolean));
  };

  const handleObjectModified = (e: fabric.IEvent) => {
    const obj = e.target;
    if (obj && obj.data) {
      onUpdateElement(obj.data.id, {
        x: obj.left || 0,
        y: obj.top || 0,
        width: obj.width || 0,
        height: obj.height || 0,
      });
    }
  };

  const handleObjectMoving = (e: fabric.IEvent) => {
    // Real-time position updates during dragging
  };

  const handleObjectScaling = (e: fabric.IEvent) => {
    // Real-time size updates during scaling
  };

  const handleMouseDown = (e: fabric.IEvent) => {
    const event = e.e as MouseEvent;
    if (event.ctrlKey || event.metaKey) {
      // Start panning
      (fabricCanvasRef.current as any).isDragging = true;
      (fabricCanvasRef.current as any).lastPosX = event.clientX;
      (fabricCanvasRef.current as any).lastPosY = event.clientY;
    }
  };

  const handleMouseMove = (e: fabric.IEvent) => {
    const event = e.e as MouseEvent;
    const canvas = fabricCanvasRef.current;
    if ((canvas as any).isDragging) {
      const vpt = canvas!.viewportTransform;
      if (vpt) {
        vpt[4] += event.clientX - (canvas as any).lastPosX;
        vpt[5] += event.clientY - (canvas as any).lastPosY;
        canvas!.requestRenderAll();
        (canvas as any).lastPosX = event.clientX;
        (canvas as any).lastPosY = event.clientY;
      }
    }
  };

  const handleMouseUp = () => {
    const canvas = fabricCanvasRef.current;
    if ((canvas as any).isDragging) {
      (canvas as any).isDragging = false;
      // Update pan position in store
      const vpt = canvas!.viewportTransform;
      if (vpt) {
        onUpdateCanvas({
          panX: vpt[4],
          panY: vpt[5],
        });
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY;
    const zoom = canvas.zoom * (1 - delta / 1000);
    const newZoom = Math.max(0.1, Math.min(3, zoom));
    
    onUpdateCanvas({ zoom: newZoom });
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        className="cursor-crosshair"
      />
      
      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <button
          onClick={() => onUpdateCanvas({ zoom: canvas.zoom * 1.2 })}
          className="p-2 bg-white dark:bg-gray-800 rounded shadow hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          +
        </button>
        <button
          onClick={() => onUpdateCanvas({ zoom: canvas.zoom * 0.8 })}
          className="p-2 bg-white dark:bg-gray-800 rounded shadow hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          -
        </button>
        <button
          onClick={() => onUpdateCanvas({ zoom: 1, panX: 0, panY: 0 })}
          className="p-2 bg-white dark:bg-gray-800 rounded shadow hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          ⌂
        </button>
      </div>

      {/* Drawing Controls */}
      <div className="absolute bottom-4 left-4 flex space-x-2">
        <button
          onClick={() => onUpdateCanvas({ drawingMode: 'pen' })}
          className={`p-2 rounded ${canvas.drawingMode === 'pen' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800'}`}
        >
          ✏️
        </button>
        <button
          onClick={() => onUpdateCanvas({ drawingMode: 'select' })}
          className={`p-2 rounded ${canvas.drawingMode === 'select' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800'}`}
        >
          ↖️
        </button>
        <input
          type="range"
          min="1"
          max="20"
          value={canvas.brushSize}
          onChange={(e) => onUpdateCanvas({ brushSize: parseInt(e.target.value) })}
          className="w-20"
        />
        <input
          type="color"
          value={canvas.brushColor}
          onChange={(e) => onUpdateCanvas({ brushColor: e.target.value })}
          className="w-8 h-8 rounded"
        />
      </div>
    </div>
  );
};

export default StoryboardCanvas;
