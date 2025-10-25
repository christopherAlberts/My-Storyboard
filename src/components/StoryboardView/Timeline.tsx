import React from 'react';
import { StoryboardElement } from '../../types';
import { Clock, Calendar } from 'lucide-react';

interface TimelineProps {
  elements: StoryboardElement[];
}

const Timeline: React.FC<TimelineProps> = ({ elements }) => {
  // Group elements by chapter or creation date
  const groupedElements = elements.reduce((groups, element) => {
    const key = element.chapterId || 'uncategorized';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(element);
    return groups;
  }, {} as Record<string | number, StoryboardElement[]>);

  const getElementIcon = (type: StoryboardElement['type']) => {
    switch (type) {
      case 'character':
        return '👤';
      case 'location':
        return '📍';
      case 'plot_point':
        return '🎯';
      case 'note':
        return '📝';
      case 'drawing':
        return '🎨';
      default:
        return '📄';
    }
  };

  const getElementColor = (type: StoryboardElement['type']) => {
    switch (type) {
      case 'character':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'location':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
      case 'plot_point':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
      case 'note':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'drawing':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Timeline Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <h3 className="font-medium text-gray-900 dark:text-white">Timeline</h3>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{elements.length} elements</span>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.keys(groupedElements).length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No elements on the timeline yet.</p>
            <p className="text-sm">Add elements to the storyboard to see them here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedElements).map(([chapterKey, chapterElements]) => (
              <div key={chapterKey} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">
                    {chapterKey === 'uncategorized' ? 'Uncategorized' : `Chapter ${chapterKey}`}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({chapterElements.length} elements)
                  </span>
                </div>
                
                <div className="space-y-1">
                  {chapterElements
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((element) => (
                      <div
                        key={element.id}
                        className={`flex items-center space-x-3 p-2 rounded-lg ${getElementColor(element.type)}`}
                      >
                        <span className="text-lg">{getElementIcon(element.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {element.type === 'note' ? element.content : `Element ${element.id}`}
                          </div>
                          <div className="text-xs opacity-75">
                            {element.type} • {new Date(element.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-xs opacity-75">
                          {element.connections.length > 0 && (
                            <span className="bg-white dark:bg-gray-600 px-2 py-1 rounded">
                              {element.connections.length} connections
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
