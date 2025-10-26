import React from 'react';
import { List as ListIcon, X } from 'lucide-react';

interface Heading {
  id: string;
  text: string;
  level: number;
  element: HTMLElement;
}

interface TableOfContentsProps {
  editorRef: React.RefObject<HTMLDivElement>;
  isOpen: boolean;
  onClose: () => void;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ editorRef, isOpen, onClose }) => {
  const [headings, setHeadings] = React.useState<Heading[]>([]);

  React.useEffect(() => {
    if (!editorRef.current) return;

    const updateHeadings = () => {
      const headingElements = editorRef.current?.querySelectorAll('h1, h2, h3');
      const foundHeadings: Heading[] = [];

      headingElements?.forEach((element, index) => {
        if (element instanceof HTMLElement) {
          const id = element.id || `heading-${index}`;
          element.id = id;
          foundHeadings.push({
            id,
            text: element.textContent || '',
            level: parseInt(element.tagName[1]),
            element
          });
        }
      });

      setHeadings(foundHeadings);
    };

    // Update headings when content changes
    const observer = new MutationObserver(updateHeadings);
    if (editorRef.current) {
      observer.observe(editorRef.current, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    updateHeadings();

    return () => observer.disconnect();
  }, [editorRef]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-10">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <ListIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Contents</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-auto p-4">
        {headings.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No headings found. Use the heading buttons to create sections.
          </p>
        ) : (
          <nav className="space-y-1">
            {headings.map((heading) => (
              <button
                key={heading.id}
                onClick={() => scrollToHeading(heading.id)}
                className={`w-full text-left py-2 px-3 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  heading.level === 1
                    ? 'font-bold text-base'
                    : heading.level === 2
                    ? 'font-semibold text-sm pl-6'
                    : 'text-sm pl-12'
                } text-gray-700 dark:text-gray-300`}
              >
                {heading.text}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
};

export default TableOfContents;

