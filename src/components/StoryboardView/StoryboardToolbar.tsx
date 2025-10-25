import React from 'react';
import { Palette, Clock, Save, Undo, Redo, ZoomIn, ZoomOut, Home } from 'lucide-react';

interface StoryboardToolbarProps {
  onToggleElementPalette: () => void;
  onToggleTimeline: () => void;
  showElementPalette: boolean;
  showTimeline: boolean;
}

const StoryboardToolbar: React.FC<StoryboardToolbarProps> = ({
  onToggleElementPalette,
  onToggleTimeline,
  showElementPalette,
  showTimeline,
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Storyboard
        </h2>
      </div>

      <div className="flex items-center space-x-2">
        {/* Element Palette Toggle */}
        <button
          onClick={onToggleElementPalette}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            showElementPalette
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Elements</span>
        </button>

        {/* Timeline Toggle */}
        <button
          onClick={onToggleTimeline}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            showTimeline
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Timeline</span>
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

        {/* Zoom Controls */}
        <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <Home className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

        {/* Action Buttons */}
        <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <Undo className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <Redo className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <Save className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default StoryboardToolbar;
