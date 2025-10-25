import React, { useState, useRef, useEffect } from 'react';
import { WindowState } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { X, Minus, Square } from 'lucide-react';
import DocumentEditor from '../DocumentEditor/DocumentEditor';
import StoryboardView from '../StoryboardView/StoryboardView';
import DatabaseView from '../DatabaseView/DatabaseView';

interface WindowProps {
  window: WindowState;
  isActive: boolean;
  onClick: () => void;
}

const Window: React.FC<WindowProps> = ({ window, isActive, onClick }) => {
  const { closeWindow, minimizeWindow, updateWindowPosition, updateWindowSize } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.window-header')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - window.position.x,
        y: e.clientY - window.position.y,
      });
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: window.size.width,
      height: window.size.height,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateWindowPosition(window.id, {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      } else if (isResizing) {
        const newWidth = Math.max(300, resizeStart.width + (e.clientX - resizeStart.x));
        const newHeight = Math.max(200, resizeStart.height + (e.clientY - resizeStart.y));
        updateWindowSize(window.id, {
          width: newWidth,
          height: newHeight,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, window.id, updateWindowPosition, updateWindowSize]);

  const renderWindowContent = () => {
    switch (window.type) {
      case 'document':
        return <DocumentEditor />;
      case 'storyboard':
        return <StoryboardView />;
      case 'database':
        return <DatabaseView />;
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
      className={`fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-600 flex flex-col ${
        isActive ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{
        left: window.position.x,
        top: window.position.y,
        width: window.size.width,
        height: window.size.height,
        zIndex: window.zIndex,
      }}
      onClick={onClick}
      onMouseDown={handleMouseDown}
    >
      {/* Window Header */}
      <div className="window-header flex items-center justify-between p-3 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-t-lg cursor-move">
        <div className="flex items-center space-x-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {window.title}
          </div>
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

      {/* Resize Handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleResizeMouseDown}
      >
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-sm"></div>
      </div>
    </div>
  );
};

export default Window;
