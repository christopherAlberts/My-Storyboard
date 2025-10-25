import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db, MapData, MapElement, Character, Location } from '../../database/schema';
import { 
  Save, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  Edit, 
  Home, 
  Building, 
  MapPin, 
  User, 
  StickyNote, 
  Square,
  Grid,
  Eye,
  EyeOff,
  Settings,
  FileText,
  FolderOpen
} from 'lucide-react';

const MapBuilder: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentMap, setCurrentMap] = useState<MapData | null>(null);
  const [elements, setElements] = useState<MapElement[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedElement, setSelectedElement] = useState<MapElement | null>(null);
  const [selectedTool, setSelectedTool] = useState<'select' | 'building' | 'road' | 'landmark' | 'character' | 'note' | 'area'>('select');
  const [showGrid, setShowGrid] = useState(true);
  const [showElementPalette, setShowElementPalette] = useState(true);
  const [showMapList, setShowMapList] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapList, setMapList] = useState<MapData[]>([]);
  const [editingElement, setEditingElement] = useState<MapElement | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [charactersData, locationsData, mapsData] = await Promise.all([
        db.characters.toArray(),
        db.locations.toArray(),
        db.maps.toArray(),
      ]);
      setCharacters(charactersData);
      setLocations(locationsData);
      setMapList(mapsData);
      
      // Load the first map if available
      if (mapsData.length > 0) {
        await loadMap(mapsData[0].id!);
      } else {
        // Create a default map
        await createNewMap();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const createNewMap = async () => {
    const newMap: Omit<MapData, 'id' | 'createdAt' | 'updatedAt'> = {
      title: 'New Map',
      description: '',
      width: 1200,
      height: 800,
      backgroundColor: '#f0f8ff',
      gridSize: 20,
      showGrid: true,
      elements: [],
    };
    
    const id = await db.maps.add(newMap);
    const createdMap = await db.maps.get(id);
    if (createdMap) {
      setCurrentMap(createdMap);
      setElements([]);
      await loadMapList();
    }
  };

  const loadMap = async (mapId: number) => {
    try {
      const map = await db.maps.get(mapId);
      if (map) {
        setCurrentMap(map);
        setElements(map.elements || []);
        setShowGrid(map.showGrid);
      }
    } catch (error) {
      console.error('Error loading map:', error);
    }
  };

  const loadMapList = async () => {
    try {
      const maps = await db.maps.toArray();
      setMapList(maps);
    } catch (error) {
      console.error('Error loading map list:', error);
    }
  };

  const saveMap = async () => {
    if (!currentMap) return;
    
    try {
      const updatedMap = {
        ...currentMap,
        elements,
        showGrid,
      };
      
      await db.maps.update(currentMap.id!, updatedMap);
      setCurrentMap(updatedMap);
      await loadMapList();
    } catch (error) {
      console.error('Error saving map:', error);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentMap) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (selectedTool === 'select') {
      // Find clicked element
      const clickedElement = elements.find(element => 
        x >= element.x && x <= element.x + element.width &&
        y >= element.y && y <= element.y + element.height
      );
      setSelectedElement(clickedElement || null);
    } else {
      // Add new element
      addElement(x, y);
    }
  };

  const addElement = async (x: number, y: number) => {
    if (!currentMap) return;
    
    const newElement: Omit<MapElement, 'id' | 'createdAt' | 'updatedAt'> = {
      type: selectedTool,
      name: `${selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)} ${elements.length + 1}`,
      description: '',
      x: Math.round(x / currentMap.gridSize) * currentMap.gridSize,
      y: Math.round(y / currentMap.gridSize) * currentMap.gridSize,
      width: selectedTool === 'road' ? 100 : 80,
      height: selectedTool === 'road' ? 20 : 60,
      color: getElementColor(selectedTool),
      notes: '',
    };
    
    const id = await db.mapElements.add(newElement);
    const createdElement = await db.mapElements.get(id);
    if (createdElement) {
      setElements(prev => [...prev, createdElement]);
    }
  };

  const getElementColor = (type: MapElement['type']) => {
    switch (type) {
      case 'building': return '#8B4513';
      case 'road': return '#696969';
      case 'landmark': return '#FFD700';
      case 'character': return '#4CAF50';
      case 'note': return '#FFC107';
      case 'area': return '#E1F5FE';
      default: return '#666666';
    }
  };

  const getElementIcon = (type: MapElement['type']) => {
    switch (type) {
      case 'building': return <Building className="w-4 h-4" />;
      case 'road': return <Square className="w-4 h-4" />;
      case 'landmark': return <MapPin className="w-4 h-4" />;
      case 'character': return <User className="w-4 h-4" />;
      case 'note': return <StickyNote className="w-4 h-4" />;
      case 'area': return <Square className="w-4 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  const deleteElement = async (elementId: number) => {
    try {
      await db.mapElements.delete(elementId);
      setElements(prev => prev.filter(el => el.id !== elementId));
      setSelectedElement(null);
    } catch (error) {
      console.error('Error deleting element:', error);
    }
  };

  const updateElement = async (elementId: number, updates: Partial<MapElement>) => {
    try {
      await db.mapElements.update(elementId, updates);
      setElements(prev => prev.map(el => el.id === elementId ? { ...el, ...updates } : el));
      setSelectedElement(prev => prev?.id === elementId ? { ...prev, ...updates } : prev);
    } catch (error) {
      console.error('Error updating element:', error);
    }
  };

  const exportMap = () => {
    if (!currentMap) return;
    
    const mapData = {
      ...currentMap,
      elements,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(mapData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentMap.title.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importMap = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const mapData = JSON.parse(event.target?.result as string);
        
        // Create new map from imported data
        const newMap: Omit<MapData, 'id' | 'createdAt' | 'updatedAt'> = {
          title: mapData.title + ' (Imported)',
          description: mapData.description || '',
          width: mapData.width || 1200,
          height: mapData.height || 800,
          backgroundColor: mapData.backgroundColor || '#f0f8ff',
          gridSize: mapData.gridSize || 20,
          showGrid: mapData.showGrid !== false,
          elements: mapData.elements || [],
        };
        
        const id = await db.maps.add(newMap);
        const createdMap = await db.maps.get(id);
        if (createdMap) {
          setCurrentMap(createdMap);
          setElements(createdMap.elements || []);
          await loadMapList();
        }
      } catch (error) {
        console.error('Error importing map:', error);
        alert('Error importing map. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !currentMap) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = currentMap.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      for (let x = 0; x <= canvas.width; x += currentMap.gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += currentMap.gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }
    
    // Draw elements
    elements.forEach(element => {
      ctx.fillStyle = element.color;
      ctx.fillRect(element.x, element.y, element.width, element.height);
      
      // Draw border
      ctx.strokeStyle = selectedElement?.id === element.id ? '#007bff' : '#333';
      ctx.lineWidth = selectedElement?.id === element.id ? 3 : 1;
      ctx.strokeRect(element.x, element.y, element.width, element.height);
      
      // Draw text
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        element.name,
        element.x + element.width / 2,
        element.y + element.height / 2 + 4
      );
    });
  };

  useEffect(() => {
    renderCanvas();
  }, [elements, selectedElement, showGrid, currentMap]);

  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Map Builder
          </h2>
          {currentMap && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentMap.title}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMapList(true)}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Maps</span>
          </button>
          <button
            onClick={createNewMap}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
          <button
            onClick={saveMap}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Element Palette */}
        {showElementPalette && (
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { tool: 'select', icon: <Square className="w-4 h-4" />, label: 'Select' },
                  { tool: 'building', icon: <Building className="w-4 h-4" />, label: 'Building' },
                  { tool: 'road', icon: <Square className="w-4 h-4" />, label: 'Road' },
                  { tool: 'landmark', icon: <MapPin className="w-4 h-4" />, label: 'Landmark' },
                  { tool: 'character', icon: <User className="w-4 h-4" />, label: 'Character' },
                  { tool: 'note', icon: <StickyNote className="w-4 h-4" />, label: 'Note' },
                ].map(({ tool, icon, label }) => (
                  <button
                    key={tool}
                    onClick={() => setSelectedTool(tool as any)}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedTool === tool
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      {icon}
                      <span className="text-xs">{label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Map Settings */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Show Grid</span>
                </label>
              </div>
            </div>
            
            {/* Elements List */}
            <div className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Elements</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {elements.map((element) => (
                  <div
                    key={element.id}
                    onClick={() => setSelectedElement(element)}
                    className={`p-2 rounded border cursor-pointer transition-colors ${
                      selectedElement?.id === element.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div style={{ color: element.color }}>
                        {getElementIcon(element.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {element.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {element.type}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteElement(element.id!);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas Toolbar */}
          <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowElementPalette(!showElementPalette)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={exportMap}
                className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <label className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={importMap}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          
          {/* Canvas */}
          <div className="flex-1 relative overflow-auto bg-gray-200 dark:bg-gray-700">
            <canvas
              ref={canvasRef}
              width={currentMap?.width || 1200}
              height={currentMap?.height || 800}
              onClick={handleCanvasClick}
              className="cursor-crosshair border border-gray-300 dark:border-gray-600"
              style={{ margin: '20px' }}
            />
          </div>
        </div>
      </div>
      
      {/* Element Properties Panel */}
      {selectedElement && (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">Element Properties</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={selectedElement.name}
                onChange={(e) => updateElement(selectedElement.id!, { name: e.target.value })}
                className="form-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={selectedElement.description}
                onChange={(e) => updateElement(selectedElement.id!, { description: e.target.value })}
                className="form-input"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={selectedElement.notes}
                onChange={(e) => updateElement(selectedElement.id!, { notes: e.target.value })}
                className="form-input"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <input
                type="color"
                value={selectedElement.color}
                onChange={(e) => updateElement(selectedElement.id!, { color: e.target.value })}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Map List Modal */}
      {showMapList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-3/4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Maps</h2>
              <button
                onClick={() => setShowMapList(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            
            <div className="p-4 overflow-auto">
              <div className="space-y-3">
                {mapList.map((map) => (
                  <div
                    key={map.id}
                    onClick={() => {
                      loadMap(map.id!);
                      setShowMapList(false);
                    }}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white">{map.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{map.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {map.width} × {map.height} • {map.elements?.length || 0} elements
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapBuilder;
