import React, { useState } from 'react';
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Link, Eye, FileText, Type, Home } from 'lucide-react';

interface FormattingToolbarProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onToggleFormat: (command: string, value?: any) => void;
  characterRecognitionEnabled?: boolean;
  onToggleCharacterRecognition?: () => void;
  locationRecognitionEnabled?: boolean;
  onToggleLocationRecognition?: () => void;
  onToggleTableOfContents?: () => void;
  showTableOfContents?: boolean;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({ 
  editorRef, 
  onToggleFormat,
  characterRecognitionEnabled = false,
  onToggleCharacterRecognition,
  locationRecognitionEnabled = false,
  onToggleLocationRecognition,
  onToggleTableOfContents,
  showTableOfContents = false
}) => {
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);

  // Close font size menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFontSizeMenu && !event.target) {
        setShowFontSizeMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showFontSizeMenu]);

  const isActive = (command: string, value?: any) => {
    if (!editorRef.current) return false;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    
    return document.queryCommandState(command);
  };

  return (
    <div className="flex items-center space-x-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      {/* Font Size */}
      <div className="relative">
        <button
          onClick={() => setShowFontSizeMenu(!showFontSizeMenu)}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          title="Font Size"
        >
          <Type className="w-4 h-4" />
        </button>
        {showFontSizeMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-10 min-w-[120px]">
            <button
              onClick={() => {
                onToggleFormat('fontSize', '1');
                setShowFontSizeMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs"
            >
              Small
            </button>
            <button
              onClick={() => {
                onToggleFormat('fontSize', '3');
                setShowFontSizeMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
            >
              Normal
            </button>
            <button
              onClick={() => {
                onToggleFormat('fontSize', '5');
                setShowFontSizeMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-lg"
            >
              Large
            </button>
            <button
              onClick={() => {
                onToggleFormat('fontSize', '7');
                setShowFontSizeMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xl"
            >
              Extra Large
            </button>
          </div>
        )}
      </div>
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
      {/* Text Formatting */}
      <button
        onClick={() => onToggleFormat('bold')}
        className={`p-2 rounded transition-colors ${
          isActive('bold')
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>

      <button
        onClick={() => onToggleFormat('italic')}
        className={`p-2 rounded transition-colors ${
          isActive('italic')
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>

      {/* Heading Buttons */}
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      <button
        onClick={() => onToggleFormat('formatBlock', '<h1>')}
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>

      <button
        onClick={() => onToggleFormat('formatBlock', '<h2>')}
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>

      <button
        onClick={() => onToggleFormat('formatBlock', '<h3>')}
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </button>

      {/* Lists */}
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      <button
        onClick={() => onToggleFormat('insertUnorderedList')}
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>

      <button
        onClick={() => onToggleFormat('insertOrderedList')}
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      {/* Link */}
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      <button
        onClick={() => onToggleFormat('createLink')}
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
        title="Insert Link"
      >
        <Link className="w-4 h-4" />
      </button>

      {/* Character Recognition */}
      {onToggleCharacterRecognition && (
        <>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <button
            onClick={onToggleCharacterRecognition}
            className={`p-2 rounded transition-colors ${
              characterRecognitionEnabled
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title={characterRecognitionEnabled ? 'Disable character highlights' : 'Enable character highlights'}
          >
            <Eye className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Location Recognition */}
      {onToggleLocationRecognition && (
        <button
            onClick={onToggleLocationRecognition}
            className={`p-2 rounded transition-colors ${
              locationRecognitionEnabled
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title={locationRecognitionEnabled ? 'Disable location highlights' : 'Enable location highlights'}
          >
            <Home className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Table of Contents */}
      {onToggleTableOfContents && (
        <>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <button
            onClick={onToggleTableOfContents}
            className={`p-2 rounded transition-colors ${
              showTableOfContents
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title="Table of Contents"
          >
            <FileText className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};

export default FormattingToolbar;

