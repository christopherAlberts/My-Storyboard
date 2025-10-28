import React, { useEffect, useRef, useState } from 'react';
import TableOfContents from './TableOfContents';
import { useAppStore } from '../../store/useAppStore';
import { storageService, Character, Location } from '../../services/storageService';
import CharacterTooltip from './CharacterTooltip';
import LocationTooltip from './LocationTooltip';

interface PaginatedViewProps {
  content: string;
  onContentChange: (content: string) => void;
  editorRef?: React.RefObject<HTMLDivElement>;
  showTableOfContents?: boolean;
  onToggleTableOfContents?: () => void;
}

const PaginatedView: React.FC<PaginatedViewProps> = ({ 
  content, 
  onContentChange,
  editorRef: externalEditorRef,
  showTableOfContents = false,
  onToggleTableOfContents 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const localEditorRef = useRef<HTMLDivElement>(null);
  const editorRef = externalEditorRef || localEditorRef;
  const [currentPage, setCurrentPage] = useState(1);
  const [renderedPages, setRenderedPages] = useState<number[]>([]);
  
  // Import store values
  const { characterRecognitionEnabled, locationRecognitionEnabled, tooltipFields } = useAppStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tooltipState, setTooltipState] = useState<{ character: Character; position: { x: number; y: number } } | null>(null);
  const [locationTooltipState, setLocationTooltipState] = useState<{ location: Location; position: { x: number; y: number } } | null>(null);
  
  // ==========================================
  // PAGE VIEW SPECIFIC HIGHLIGHTING LOGIC
  // ==========================================
  
  /**
   * Remove all existing highlights from HTML to start fresh
   */
  const removeExistingHighlights = React.useCallback((html: string): string => {
    // Remove character highlights - capture content between tags
    let cleaned = html.replace(/<span[^>]*class="character-name-hl-pageview"[^>]*>([^<]*(?:<(?!\/?span)[^>]*>[^<]*)*?)<\/span>/gi, '$1');
    // Remove location highlights
    cleaned = cleaned.replace(/<span[^>]*class="location-highlight-pageview"[^>]*>([^<]*(?:<(?!\/?span)[^>]*>[^<]*)*?)<\/span>/gi, '$1');
    return cleaned;
  }, []);

  /**
   * Apply character and location highlighting for PAGE VIEW ONLY
   * Uses DOM manipulation to properly handle nested scenarios
   */
  const applyPageViewHighlighting = React.useCallback((html: string): string => {
    // Always remove existing highlights first to start fresh
    let processedHTML = removeExistingHighlights(html);
    
    // Skip if no recognition is enabled
    if (!characterRecognitionEnabled && !locationRecognitionEnabled) {
      return processedHTML;
    }
    
    // Create temporary DOM to work with
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = processedHTML;
    
    // Apply CHARACTER highlighting if enabled
    if (characterRecognitionEnabled && characters.length > 0) {
      const textNodes: Text[] = [];
      const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
      let node;
      
      while ((node = walker.nextNode())) {
        if (node instanceof Text && node.textContent?.trim()) {
          // Only process text nodes that aren't inside highlight spans
          if (!node.parentElement?.closest('[data-character-id], [data-location-id]')) {
            textNodes.push(node);
          }
        }
      }
      
      textNodes.forEach(textNode => {
        const text = textNode.textContent || '';
        if (!text.trim()) return;
        
        characters.forEach(character => {
          if (!character.name || !character.color) return;
          
          const escapedName = character.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
          
          if (regex.test(text)) {
            // Create fragment with highlighted content
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            let match;
            regex.lastIndex = 0;
            
            while ((match = regex.exec(text)) !== null) {
              // Add text before match
              if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
              }
              
              // Add highlighted span
              const span = document.createElement('span');
              span.className = 'character-name-hl-pageview';
              span.style.color = character.color;
              span.style.cursor = 'pointer';
              span.style.textDecoration = 'underline';
              span.setAttribute('data-character-id', character.id || '');
              span.setAttribute('data-character-name', character.name);
              span.textContent = match[0];
              fragment.appendChild(span);
              
              lastIndex = match.index + match[0].length;
            }
            
            // Add remaining text
            if (lastIndex < text.length) {
              fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            }
            
            // Replace text node with fragment
            textNode.parentNode?.replaceChild(fragment, textNode);
          }
        });
      });
      
      processedHTML = tempDiv.innerHTML;
    }
    
    // Recreate temp div with updated HTML for location highlighting
    const tempDiv2 = document.createElement('div');
    tempDiv2.innerHTML = processedHTML;
    
    // Apply LOCATION highlighting if enabled
    if (locationRecognitionEnabled && locations.length > 0) {
      const textNodes: Text[] = [];
      const walker = document.createTreeWalker(tempDiv2, NodeFilter.SHOW_TEXT);
      let node;
      
      while ((node = walker.nextNode())) {
        if (node instanceof Text && node.textContent?.trim()) {
          // Only process text nodes that aren't inside highlight spans
          if (!node.parentElement?.closest('[data-character-id], [data-location-id]')) {
            textNodes.push(node);
          }
        }
      }
      
      textNodes.forEach(textNode => {
        const text = textNode.textContent || '';
        if (!text.trim()) return;
        
        locations.forEach(location => {
          if (!location.name || !location.color) return;
          
          const escapedName = location.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
          
          if (regex.test(text)) {
            // Create fragment with highlighted content
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            let match;
            regex.lastIndex = 0;
            
            while ((match = regex.exec(text)) !== null) {
              // Add text before match
              if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
              }
              
              // Add highlighted span
              const span = document.createElement('span');
              span.className = 'location-highlight-pageview';
              span.style.color = location.color;
              span.style.cursor = 'pointer';
              span.style.textDecoration = 'underline';
              span.setAttribute('data-location-id', location.id || '');
              span.setAttribute('data-location-name', location.name);
              span.textContent = match[0];
              fragment.appendChild(span);
              
              lastIndex = match.index + match[0].length;
            }
            
            // Add remaining text
            if (lastIndex < text.length) {
              fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            }
            
            // Replace text node with fragment
            textNode.parentNode?.replaceChild(fragment, textNode);
          }
        });
      });
      
      processedHTML = tempDiv2.innerHTML;
    }
    
    return processedHTML;
  }, [characterRecognitionEnabled, locationRecognitionEnabled, characters, locations, removeExistingHighlights]);

  // ==========================================
  // PAGE VIEW CONTENT INITIALIZATION
  // ==========================================
  
  /**
   * Initialize and update page view content with highlighting
   * This is specific to PAGE VIEW only and handles content rendering
   */
  useEffect(() => {
    const initializePageViewContent = () => {
      if (!editorRef.current || content === undefined) return;
      
      // Check if element is actually in the document
      const isInDocument = document.body.contains(editorRef.current);
      if (!isInDocument) return;
      
      const cleanContent = content || '<p><br></p>';
      
      // Apply PAGE VIEW specific highlighting
      const highlightedContent = applyPageViewHighlighting(cleanContent);
      const currentContent = editorRef.current.innerHTML;
      
      // Only update if content actually changed
      if (currentContent !== highlightedContent) {
        editorRef.current.innerHTML = highlightedContent;
      }
    };
    
    // Initialize immediately
    initializePageViewContent();
    
    // Also initialize after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(initializePageViewContent, 50);
    
    return () => clearTimeout(timeoutId);
  }, [content, characterRecognitionEnabled, locationRecognitionEnabled, applyPageViewHighlighting]);

  // Load characters and locations
  useEffect(() => {
    const loadCharacters = async () => {
      const chars = await storageService.getCharacters();
      setCharacters(chars);
    };
    loadCharacters();
  }, []);

  useEffect(() => {
    const loadLocations = async () => {
      const locs = await storageService.getLocations();
      setLocations(locs);
    };
    loadLocations();
  }, []);

  // ==========================================
  // PAGE VIEW TOOLTIP EVENT HANDLERS
  // ==========================================
  
  /**
   * Set up event listeners for PAGE VIEW tooltips
   * Uses event delegation on the editor container to handle all highlighted elements
   */
  useEffect(() => {
    if (!editorRef.current) return;
    
    const editor = editorRef.current;
    
    // Handler for mouseover on highlighted elements (characters and locations)
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      // Check if hovering over character highlight
      const characterSpan = target.closest('[data-character-id]');
      if (characterSpan) {
        const characterId = characterSpan.getAttribute('data-character-id');
        if (characterId) {
          const character = characters.find(c => c.id === characterId);
          if (character) {
            const rect = characterSpan.getBoundingClientRect();
            setTooltipState({
              character,
              position: { x: rect.left + rect.width / 2, y: rect.top - 10 }
            });
          }
        }
        return;
      }
      
      // Check if hovering over location highlight
      const locationSpan = target.closest('[data-location-id]');
      if (locationSpan) {
        const locationId = locationSpan.getAttribute('data-location-id');
        if (locationId) {
          const location = locations.find(l => l.id === locationId);
          if (location) {
            const rect = locationSpan.getBoundingClientRect();
            setLocationTooltipState({
              location,
              position: { x: rect.left + rect.width / 2, y: rect.top - 10 }
            });
          }
        }
      }
    };
    
    // Handler for mouseout - hide tooltips
    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      // Hide tooltips when leaving highlighted elements
      const isLeavingHighlight = target.closest('[data-character-id]') || target.closest('[data-location-id]');
      if (!isLeavingHighlight) {
        setTooltipState(null);
        setLocationTooltipState(null);
      }
    };
    
    // Attach event listeners using event delegation
    editor.addEventListener('mouseover', handleMouseOver);
    editor.addEventListener('mouseout', handleMouseOut);
    
    // Cleanup
    return () => {
      editor.removeEventListener('mouseover', handleMouseOver);
      editor.removeEventListener('mouseout', handleMouseOut);
    };
  }, [characterRecognitionEnabled, locationRecognitionEnabled, characters, locations]);

  // Calculate approximate page count based on content height
  const estimatePageCount = () => {
    if (!editorRef.current) return 1;
    
    // Get the actual rendered height
    const editor = editorRef.current;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content || '';
    tempDiv.style.width = '170mm'; // Content width (210mm - 2*20mm padding)
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.fontSize = '12pt';
    tempDiv.style.lineHeight = '1.6';
    tempDiv.style.fontFamily = 'Georgia, "Times New Roman", serif';
    
    // Find parent with overflow or create temporary one
    if (editorRef.current.parentElement) {
      editorRef.current.parentElement.appendChild(tempDiv);
      const height = tempDiv.offsetHeight;
      editorRef.current.parentElement.removeChild(tempDiv);
      
      // A4 page content area is approximately 250mm high (297mm - 2*20mm padding - header)
      const pageHeight = 800; // Approximate pixels per page
      const pages = Math.max(1, Math.ceil(height / pageHeight));
      
      return pages;
    }
    
    // Fallback: estimate by character count
    const text = tempDiv.textContent || '';
    return Math.max(1, Math.ceil(text.length / 2000));
  };

  useEffect(() => {
    const pages = estimatePageCount();
    const pageArray = Array.from({ length: pages }, (_, i) => i + 1);
    setRenderedPages(pageArray);
  }, [content]);

  const totalPages = renderedPages.length > 0 ? renderedPages.length : 1;

  // Navigation
  const goToPage = (pageNum: number) => {
    const page = Math.max(1, Math.min(pageNum, totalPages));
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      
      if (e.key === 'ArrowLeft') {
        goToPreviousPage();
      } else if (e.key === 'ArrowRight') {
        goToNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages]);

  return (
    <div className="flex-1 flex overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
      {/* Page Navigation - Fixed at top */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded transition-colors ${
            currentPage === 1
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
        >
          ← Previous
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (!isNaN(page)) {
                goToPage(page);
              }
            }}
            className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded transition-colors ${
            currentPage === totalPages
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
        >
          Next →
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex pt-12 overflow-hidden">
        {/* Page Content */}
        <div 
          ref={containerRef} 
          className={`overflow-auto flex items-start justify-center p-8 ${showTableOfContents ? 'mr-0' : ''}`}
          style={{ flex: showTableOfContents ? '1 1 auto' : '1 1 100%', minWidth: 0 }}
        >
          {/* Render all pages in a scrolling container */}
          <div className="flex flex-col items-center gap-8">
            {renderedPages.map((pageNum) => (
              <div 
                key={pageNum} 
                className="bg-white dark:bg-gray-800 shadow-2xl" 
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '20mm',
                  position: 'relative',
                  marginBottom: '20px'
                }}
              >
                {/* Page Number */}
                <div className="absolute top-8 right-8 text-xs text-gray-500 dark:text-gray-400">
                  {pageNum}
                </div>

                {/* Page Break Marker (if not first page) */}
                {pageNum > 1 && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    ─── Page Break ───
                  </div>
                )}

                {/* Content - only first page is editable */}
                {pageNum === 1 ? (
                  <div
                    ref={editorRef}
                    contentEditable
                    className="outline-none text-gray-900 dark:text-white"
                    style={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: '12pt',
                      lineHeight: '1.6',
                      minHeight: '200px'
                    }}
                    suppressContentEditableWarning={true}
                    onInput={(e) => {
                      const newContent = e.currentTarget.innerHTML;
                      onContentChange(newContent);
                    }}
                  />
                ) : (
                  <div className="text-gray-900 dark:text-white" style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '12pt',
                    lineHeight: '1.6',
                    minHeight: '200px'
                  }}>
                    <p className="text-gray-400 dark:text-gray-500 italic">
                      Content continues from page {pageNum - 1}...<br />
                      (Switch to Plain View for full editing)
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Table of Contents - Right Side */}
        {showTableOfContents && onToggleTableOfContents && (
          <div className="flex-shrink-0 overflow-hidden">
            <TableOfContents 
              editorRef={editorRef} 
              isOpen={showTableOfContents} 
              onClose={onToggleTableOfContents} 
            />
          </div>
        )}
      </div>
      
      {/* Character Tooltip */}
      {tooltipState && (
        <CharacterTooltip
          character={tooltipState.character}
          position={tooltipState.position}
          tooltipFields={tooltipFields}
          onClose={() => setTooltipState(null)}
        />
      )}
      
      {/* Location Tooltip */}
      {locationTooltipState && (
        <LocationTooltip
          location={locationTooltipState.location}
          position={locationTooltipState.position}
          tooltipFields={tooltipFields}
          onClose={() => setLocationTooltipState(null)}
        />
      )}
    </div>
  );
};

export default PaginatedView;

