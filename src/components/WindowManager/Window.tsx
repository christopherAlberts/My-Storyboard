import React, { useState, useRef, useEffect } from 'react';
import { WindowState } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { X, Minus, Square } from 'lucide-react';
import DocumentEditor from '../DocumentEditor/DocumentEditor';
import StoryboardView from '../StoryboardView/StoryboardView';
import DatabaseView from '../DatabaseView/DatabaseView';
import MapBuilder from '../MapBuilder/MapBuilder';
import Settings from '../Settings/Settings';
import { detectSnapZone, applyWindowConstraints, DEFAULT_WINDOW_CONSTRAINTS } from './windowSnapUtils';

interface WindowProps {
  window: WindowState;
  isActive: boolean;
  onClick: () => void;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const Window: React.FC<WindowProps> = ({ window, isActive, onClick }) => {
  const { 
    closeWindow, 
    minimizeWindow, 
    updateWindowPosition, 
    updateWindowSize, 
    snapConfig, 
    setSnapPreview, 
    snapWindowToZone,
    unsnapWindow 
  } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });
  const [currentSnapZone, setCurrentSnapZone] = useState<string | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.window-header')) {
      // Prevent text selection during drag
      e.preventDefault();
      document.body.style.userSelect = 'none';
      (document.body.style as any).webkitUserSelect = 'none';
      (document.body.style as any).mozUserSelect = 'none';
      (document.body.style as any).msUserSelect = 'none';
      
      setIsDragging(true);
      setDragStart({
        x: e.clientX - window.position.x,
        y: e.clientY - window.position.y,
      });
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, direction: ResizeDirection) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: window.size.width,
      height: window.size.height,
      left: window.position.x,
      top: window.position.y,
    });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.isSnapped) {
      unsnapWindow(window.id);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        };

        // Apply window constraints
        const constrained = applyWindowConstraints(newPosition, window.size, DEFAULT_WINDOW_CONSTRAINTS);
        
        // Check for snap zones if snapping is enabled
        if (snapConfig.enableSnapping) {
          const snapResult = detectSnapZone(constrained.position, constrained.size, snapConfig.snapThreshold);
          
          if (snapResult.zone && snapResult.distance <= snapConfig.snapThreshold) {
            // Show snap preview
            const preview = {
              position: constrained.position,
              size: constrained.size,
              zone: snapResult.zone,
              visible: true,
            };
            setSnapPreview(preview);
            setCurrentSnapZone(snapResult.zone);
          } else {
            // Hide snap preview
            setSnapPreview({ visible: false });
            setCurrentSnapZone(null);
          }
        }

        updateWindowPosition(window.id, constrained.position);
      } else if (isResizing && resizeDirection) {
        const dx = e.clientX - resizeStart.x;
        const dy = e.clientY - resizeStart.y;
        
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newLeft = resizeStart.left;
        let newTop = resizeStart.top;

        // Handle horizontal resizing
        if (resizeDirection.includes('e')) {
          newWidth = Math.max(300, resizeStart.width + dx);
        } else if (resizeDirection.includes('w')) {
          newWidth = Math.max(300, resizeStart.width - dx);
          newLeft = resizeStart.left + dx;
        }

        // Handle vertical resizing
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(200, resizeStart.height + dy);
        } else if (resizeDirection.includes('n')) {
          newHeight = Math.max(200, resizeStart.height - dy);
          newTop = resizeStart.top + dy;
        }

        // Apply constraints to resized window
        const constrained = applyWindowConstraints(
          { x: newLeft, y: newTop },
          { width: newWidth, height: newHeight },
          DEFAULT_WINDOW_CONSTRAINTS
        );

        // Update size
        if (constrained.size.width !== window.size.width || constrained.size.height !== window.size.height) {
          updateWindowSize(window.id, constrained.size);
        }

        // Update position (for north and west edges)
        if (constrained.position.x !== window.position.x || constrained.position.y !== window.position.y) {
          updateWindowPosition(window.id, constrained.position);
        }
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        // Handle snapping on mouse up
        if (snapConfig.enableSnapping && currentSnapZone) {
          snapWindowToZone(window.id, currentSnapZone as any);
        } else if (window.isSnapped) {
          // If window was snapped but we're not snapping to a new zone, unsnap it
          unsnapWindow(window.id);
        }
        
        // Hide snap preview
        setSnapPreview({ visible: false });
        setCurrentSnapZone(null);
        
        // Restore text selection
        document.body.style.userSelect = '';
        (document.body.style as any).webkitUserSelect = '';
        (document.body.style as any).mozUserSelect = '';
        (document.body.style as any).msUserSelect = '';
      }
      
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeDirection, dragStart, resizeStart, window.id, window.size.width, window.size.height, window.position.x, window.position.y, window.isSnapped, updateWindowPosition, updateWindowSize, snapConfig, setSnapPreview, snapWindowToZone, unsnapWindow, currentSnapZone]);

  // Cleanup effect to restore text selection if component unmounts during drag
  useEffect(() => {
    return () => {
      if (isDragging) {
        document.body.style.userSelect = '';
        (document.body.style as any).webkitUserSelect = '';
        (document.body.style as any).mozUserSelect = '';
        (document.body.style as any).msUserSelect = '';
      }
    };
  }, [isDragging]);

  const renderWindowContent = () => {
    switch (window.type) {
      case 'document':
        return <DocumentEditor />;
      case 'storyboard':
        return <StoryboardView />;
      case 'database':
        return <DatabaseView />;
      case 'mapbuilder':
        return <MapBuilder />;
      case 'settings':
        return <Settings />;
      default:
        return <div>Unknown window type</div>;
    }
  };

  if (window.isMinimized) {
    return (
      <div
        className={`fixed bottom-4 left-4 bg-gray-200 dark:bg-gray-700 rounded-lg shadow-lg p-3 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors ${
          isActive ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={onClick}
        style={{ zIndex: window.zIndex }}
      >
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {window.title}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={windowRef}
      className={`fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-600 flex flex-col transition-all duration-200 ${
        isActive ? 'ring-2 ring-blue-500' : ''
      } ${window.isSnapped ? 'ring-2 ring-green-500 shadow-2xl' : ''}`}
      style={{
        left: window.position.x,
        top: window.position.y,
        width: window.size.width,
        height: window.size.height,
        zIndex: window.zIndex,
        transition: window.isSnapped ? 'all 0.2s ease-out' : 'none',
      }}
      onClick={onClick}
      onMouseDown={handleMouseDown}
    >
      {/* Window Header */}
      <div 
        className="window-header flex items-center justify-between p-3 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-t-lg cursor-move"
        onDoubleClick={handleDoubleClick}
        style={{ 
          userSelect: 'none', 
          WebkitUserSelect: 'none', 
          MozUserSelect: 'none', 
          msUserSelect: 'none' 
        } as React.CSSProperties}
      >
        <div className="flex items-center space-x-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {window.title}
          </div>
          {window.isSnapped && window.snapZone && (
            <div className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
              {window.snapZone.replace('-', ' ')}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(window.id);
            }}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          >
            <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(window.id);
            }}
            className="p-1 hover:bg-red-200 dark:hover:bg-red-600 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-hidden">
        {renderWindowContent()}
      </div>

      {/* Resize Handles - Corners */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
      />
      <div
        className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
        onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
      />
      <div
        className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
        onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
      />
      <div
        className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
        onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
      />
      
      {/* Resize Handles - Edges */}
      <div
        className="absolute top-0 left-4 right-4 h-4 cursor-n-resize"
        onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
      />
      <div
        className="absolute bottom-0 left-4 right-4 h-4 cursor-s-resize"
        onMouseDown={(e) => handleResizeMouseDown(e, 's')}
      />
      <div
        className="absolute left-0 top-4 bottom-4 w-4 cursor-w-resize"
        onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
      />
      <div
        className="absolute right-0 top-4 bottom-4 w-4 cursor-e-resize"
        onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
      />
    </div>
  );
};

export default Window;
