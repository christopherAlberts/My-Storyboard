import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  List as ListIcon, 
  X, 
  Search, 
  ChevronDown, 
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Hash
} from 'lucide-react';

interface Heading {
  id: string;
  text: string;
  level: number;
  element: HTMLElement;
  index: number;
}

interface TableOfContentsProps {
  editorRef: React.RefObject<HTMLDivElement>;
  isOpen: boolean;
  onClose: () => void;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ editorRef, isOpen, onClose }) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const tocRef = useRef<HTMLDivElement>(null);
  const scrollObserverRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate unique IDs for headings
  const generateHeadingId = useCallback((text: string, index: number): string => {
    const sanitized = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return sanitized || `heading-${index}`;
  }, []);

  // Update headings when content changes
  useEffect(() => {
    if (!editorRef.current || !isOpen) return;

    const updateHeadings = () => {
      const headingElements = editorRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const foundHeadings: Heading[] = [];

      headingElements?.forEach((element, index) => {
        if (element instanceof HTMLElement) {
          const text = element.textContent?.trim() || '';
          if (!text) return;

          const id = element.id || generateHeadingId(text, index);
          element.id = id;
          
          foundHeadings.push({
            id,
            text,
            level: parseInt(element.tagName[1]),
            element,
            index
          });
        }
      });

      setHeadings(foundHeadings);
    };

    // Initial update
    updateHeadings();

    // Observe content changes
    const observer = new MutationObserver(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(updateHeadings, 100);
    });

    if (editorRef.current) {
      observer.observe(editorRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['id']
      });
    }

    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [editorRef, isOpen, generateHeadingId]);

  // Get scrollable container
  const getScrollContainer = useCallback(() => {
    if (!editorRef.current) return null;
    let element = editorRef.current.parentElement;
    while (element) {
      const style = window.getComputedStyle(element);
      if (style.overflow === 'auto' || style.overflowY === 'auto' || style.overflow === 'scroll' || style.overflowY === 'scroll') {
        return element;
      }
      element = element.parentElement;
    }
    return window;
  }, []);

  // Track active heading on scroll
  useEffect(() => {
    if (!editorRef.current || !isOpen || headings.length === 0) return;

    // Clear previous observer
    if (scrollObserverRef.current) {
      scrollObserverRef.current.disconnect();
    }

    const scrollContainer = getScrollContainer();
    const headingElements = headings.map(h => h.element);

    // Track scroll progress
    const updateScrollProgress = () => {
      if (scrollContainer instanceof HTMLElement) {
        const scrollTop = scrollContainer.scrollTop;
        const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      } else {
        const scrollTop = window.scrollY;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
    };

    // Use IntersectionObserver to track which heading is in view
    const observerOptions = {
      root: scrollContainer instanceof HTMLElement ? scrollContainer : null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1]
    };

    scrollObserverRef.current = new IntersectionObserver((entries) => {
      // Find the first visible heading (highest on screen)
      const visibleHeadings = entries
        .filter(entry => entry.isIntersecting)
        .map(entry => {
          const id = entry.target.id;
          const heading = headings.find(h => h.id === id);
          return heading ? { heading, intersectionRatio: entry.intersectionRatio } : null;
        })
        .filter((h): h is { heading: Heading; intersectionRatio: number } => h !== null)
        .sort((a, b) => {
          const rectA = a.heading.element.getBoundingClientRect();
          const rectB = b.heading.element.getBoundingClientRect();
          return rectA.top - rectB.top;
        });

      if (visibleHeadings.length > 0) {
        setActiveHeadingId(visibleHeadings[0].heading.id);
        
        // Auto-expand parent sections
        const activeHeading = visibleHeadings[0].heading;
        const parentIds = getParentSectionIds(activeHeading);
        setCollapsedSections(prev => {
          const newSet = new Set(prev);
          parentIds.forEach(id => newSet.delete(id));
          return newSet;
        });
      }

      updateScrollProgress();
    }, observerOptions);

    // Observe all headings
    headingElements.forEach(element => {
      scrollObserverRef.current?.observe(element);
    });

    // Also listen to scroll events for progress
    if (scrollContainer instanceof HTMLElement) {
      scrollContainer.addEventListener('scroll', updateScrollProgress);
    } else {
      window.addEventListener('scroll', updateScrollProgress);
    }
    updateScrollProgress();

    return () => {
      scrollObserverRef.current?.disconnect();
      if (scrollContainer instanceof HTMLElement) {
        scrollContainer.removeEventListener('scroll', updateScrollProgress);
      } else {
        window.removeEventListener('scroll', updateScrollProgress);
      }
    };
  }, [editorRef, isOpen, headings, getScrollContainer]);

  // Get parent section IDs for a heading
  const getParentSectionIds = (heading: Heading): string[] => {
    const parentIds: string[] = [];
    let currentLevel = heading.level;
    
    for (let i = heading.index - 1; i >= 0; i--) {
      const prevHeading = headings[i];
      if (prevHeading.level < currentLevel) {
        parentIds.push(prevHeading.id);
        currentLevel = prevHeading.level;
        if (currentLevel === 1) break;
      }
    }
    
    return parentIds;
  };

  // Scroll to heading
  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const scrollContainer = getScrollContainer();
      const container = scrollContainer instanceof HTMLElement ? scrollContainer : window;
      
      const elementRect = element.getBoundingClientRect();
      const containerRect = scrollContainer instanceof HTMLElement 
        ? scrollContainer.getBoundingClientRect()
        : { top: 0, left: 0 };
      
      const scrollTop = scrollContainer instanceof HTMLElement 
        ? scrollContainer.scrollTop 
        : window.scrollY;
      
      const elementTop = elementRect.top - containerRect.top + scrollTop;
      const offset = 20; // Offset from top
      
      if (scrollContainer instanceof HTMLElement) {
        scrollContainer.scrollTo({
          top: elementTop - offset,
          behavior: 'smooth'
        });
      } else {
        window.scrollTo({
          top: elementTop - offset,
          behavior: 'smooth'
        });
      }
      
      // Set active heading immediately
      setActiveHeadingId(id);
    }
  }, [getScrollContainer]);

  // Handle heading click
  const handleHeadingClick = (heading: Heading) => {
    scrollToHeading(heading.id);
  };

  // Toggle section collapse
  const toggleSection = (headingId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(headingId)) {
        newSet.delete(headingId);
      } else {
        newSet.add(headingId);
      }
      return newSet;
    });
  };

  // Check if a heading should be visible (based on collapsed parents)
  const isHeadingVisible = (heading: Heading): boolean => {
    const parentIds = getParentSectionIds(heading);
    return !parentIds.some(id => collapsedSections.has(id));
  };

  // Get nested structure for rendering
  const getNestedStructure = () => {
    const filtered = headings.filter(h => {
      const matchesSearch = !searchQuery || 
        h.text.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch && isHeadingVisible(h);
    });

    const result: Array<Heading & { children: Heading[] }> = [];
    const stack: Array<Heading & { children: Heading[] }> = [];

    filtered.forEach(heading => {
      const item = { ...heading, children: [] };
      
      // Pop stack until we find the parent
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }
      
      if (stack.length === 0) {
        result.push(item);
      } else {
        stack[stack.length - 1].children.push(item);
      }
      
      stack.push(item);
    });

    return result;
  };

  // Copy heading link
  const copyHeadingLink = async (headingId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${headingId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(headingId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'f') {
          e.preventDefault();
          const searchInput = document.querySelector('.toc-search-input') as HTMLInputElement;
          searchInput?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Scroll to top
  const scrollToTop = () => {
    const scrollContainer = getScrollContainer();
    if (scrollContainer instanceof HTMLElement) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    const scrollContainer = getScrollContainer();
    if (scrollContainer instanceof HTMLElement) {
      scrollContainer.scrollTo({ 
        top: scrollContainer.scrollHeight, 
        behavior: 'smooth' 
      });
    } else {
      window.scrollTo({ 
        top: document.documentElement.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  };

  // Render heading item recursively
  const renderHeadingItem = (heading: Heading & { children: Heading[] }, depth: number = 0): React.ReactNode => {
    const hasChildren = heading.children.length > 0;
    const isCollapsed = collapsedSections.has(heading.id);
    const isActive = activeHeadingId === heading.id;
    const isCopied = copiedId === heading.id;

    return (
      <div key={heading.id} className="select-none">
        <div
          className={`
            group flex items-center gap-2 py-1.5 px-2 rounded-md transition-all cursor-pointer
            ${isActive 
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }
          `}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          {/* Collapse/Expand Icon */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSection(heading.id);
              }}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <div className="w-4.5" />
          )}

          {/* Level Indicator */}
          <Hash className={`w-3.5 h-3.5 opacity-50 ${isActive ? 'opacity-100' : ''}`} />

          {/* Heading Text */}
          <button
            onClick={() => handleHeadingClick(heading)}
            className="flex-1 text-left text-sm truncate"
            title={heading.text}
          >
            {heading.text}
          </button>

          {/* Copy Link Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyHeadingLink(heading.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all"
            title="Copy link to heading"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Render Children */}
        {hasChildren && !isCollapsed && (
          <div>
            {heading.children.map(child => renderHeadingItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Get heading statistics
  const getStats = () => {
    const stats = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    headings.forEach(h => {
      const key = `h${h.level}` as keyof typeof stats;
      stats[key]++;
    });
    return stats;
  };

  const nestedHeadings = getNestedStructure();
  const stats = getStats();
  const totalHeadings = headings.length;
  const visibleHeadings = nestedHeadings.length;

  if (!isOpen) return null;

  return (
    <div 
      ref={tocRef}
      className="h-full w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-10 flex flex-col"
      style={{ maxWidth: '320px', minWidth: '280px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <ListIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Contents</h3>
          {totalHeadings > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({visibleHeadings}/{totalHeadings})
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      {totalHeadings > 3 && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search headings..."
              className="toc-search-input w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Statistics Bar */}
      {totalHeadings > 0 && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-3">
              {stats.h1 > 0 && <span>H1: {stats.h1}</span>}
              {stats.h2 > 0 && <span>H2: {stats.h2}</span>}
              {stats.h3 > 0 && <span>H3: {stats.h3}</span>}
              {stats.h4 > 0 && <span>H4: {stats.h4}</span>}
              {stats.h5 > 0 && <span>H5: {stats.h5}</span>}
              {stats.h6 > 0 && <span>H6: {stats.h6}</span>}
            </div>
            {searchQuery && (
              <span className="text-blue-600 dark:text-blue-400">
                {visibleHeadings} found
              </span>
            )}
          </div>
        </div>
      )}

      {/* Scroll Progress Bar */}
      {totalHeadings > 0 && (
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-2">
        {totalHeadings === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <ListIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
              No headings found
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Use heading buttons in the toolbar to create sections
            </p>
          </div>
        ) : visibleHeadings === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
              No headings match "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <nav className="space-y-0.5">
            {nestedHeadings.map(heading => renderHeadingItem(heading))}
          </nav>
        )}
      </div>

      {/* Footer Actions */}
      {totalHeadings > 0 && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Scroll to top"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Top</span>
          </button>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {activeHeadingId ? (
              headings.find(h => h.id === activeHeadingId)?.text || '—'
            ) : (
              '—'
            )}
          </div>

          <button
            onClick={scrollToBottom}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Scroll to bottom"
          >
            <span>Bottom</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TableOfContents;
