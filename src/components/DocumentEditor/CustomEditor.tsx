import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { storageService, Character, Location } from '../../services/storageService';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';
import CharacterTooltip from './CharacterTooltip';
import LocationTooltip from './LocationTooltip';
import FormattingToolbar from './FormattingToolbar';
import TableOfContents from './TableOfContents';
import PaginatedView from './PaginatedView';

interface CustomEditorProps {
  content: string;
  onChange: (content: string) => void;
  showTableOfContents?: boolean;
  onToggleTableOfContents?: () => void;
}

const CustomEditor: React.FC<CustomEditorProps> = ({ content, onChange, showTableOfContents: externalShowTable, onToggleTableOfContents }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const { characterRecognitionEnabled, characterNameCapitalization, locationRecognitionEnabled, locationNameCapitalization, toggleCharacterRecognition, toggleLocationRecognition } = useAppStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const isProcessingRef = useRef(false);
  const [tooltipState, setTooltipState] = useState<{ character: Character; position: { x: number; y: number } } | null>(null);
  const [locationTooltipState, setLocationTooltipState] = useState<{ location: Location; position: { x: number; y: number } } | null>(null);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [localShowTableOfContents, setLocalShowTableOfContents] = useState(false);
  const applyHighlightingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [viewMode, setViewMode] = useState<'plain' | 'paginated'>('plain');
  const pendingContentRef = useRef<string | null>(null);
  
  // Use refs to track current state to avoid stale closures in timeouts
  const characterRecognitionEnabledRef = useRef(characterRecognitionEnabled);
  const locationRecognitionEnabledRef = useRef(locationRecognitionEnabled);
  
  // Keep refs in sync with state
  useEffect(() => {
    characterRecognitionEnabledRef.current = characterRecognitionEnabled;
    locationRecognitionEnabledRef.current = locationRecognitionEnabled;
  }, [characterRecognitionEnabled, locationRecognitionEnabled]);

  // Load characters from database and auto-detect changes
  useEffect(() => {
    const loadCharacters = async () => {
      const chars = await storageService.getCharacters();
      console.log('Loaded characters:', chars.length, chars.map(c => ({ name: c.name, color: c.color })));
      setCharacters(chars);
    };
    
    loadCharacters();
    
    // Poll for character changes every 2 seconds for auto-detection
    const intervalId = setInterval(() => {
      loadCharacters();
    }, 2000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Load locations from database and auto-detect changes
  useEffect(() => {
    const loadLocations = async () => {
      const locs = await storageService.getLocations();
      console.log('Loaded locations:', locs.length, locs.map(l => ({ name: l.name, color: l.color })));
      setLocations(locs);
    };
    
    loadLocations();
    
    // Poll for location changes every 2 seconds for auto-detection
    const intervalId = setInterval(() => {
      loadLocations();
    }, 2000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Remove highlighting spans from HTML
  const removeHighlights = (html: string): string => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove all .character-highlight spans and preserve their text
    temp.querySelectorAll('.character-highlight').forEach(span => {
      const parent = span.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(span.textContent || ''), span);
      }
    });
    
    // Remove all .location-highlight spans and preserve their text
    temp.querySelectorAll('.location-highlight').forEach(span => {
      const parent = span.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(span.textContent || ''), span);
      }
    });
    
    return temp.innerHTML;
  };

  // Initialize editor content on mount
  useEffect(() => {
    if (editorRef.current && content !== undefined && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content || '<p><br></p>';
    }
  }, []); // Only run on mount

  const handleContentChange = useDebouncedCallback(() => {
    if (editorRef.current && !isProcessingRef.current) {
      // Remove highlighting spans before saving - save clean content
      const cleanContent = removeHighlights(editorRef.current.innerHTML);
      onChange(cleanContent);
    }
  }, 300);

  // SEPARATE FUNCTION: Apply CHARACTER highlighting only
  const applyCharacterHighlighting = React.useCallback(() => {
    if (!editorRef.current || isProcessingRef.current || !characterRecognitionEnabled) {
      return;
    }

    if (characters.length === 0) {
      return;
    }

    const editor = editorRef.current;
    const text = editor.textContent || '';
    if (!text.trim()) {
      return;
    }

    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      // Save cursor position
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      let cursorOffset = 0;
      
      if (range && range.startContainer.nodeType === Node.TEXT_NODE || range.startContainer === editor) {
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editor);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        cursorOffset = preCaretRange.toString().length;
      }
      
      // Remove all existing CHARACTER highlights only
      editor.querySelectorAll('.character-highlight').forEach(span => {
        const parent = span.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(span.textContent || ''), span);
          parent.normalize();
        }
      });

      if (!characterRecognitionEnabled || characters.length === 0) {
        isProcessingRef.current = false;
        return;
      }
      
      const offsetBeforeHighlight = cursorOffset;

      // Process each text node
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
      const nodesToProcess: Text[] = [];
      let node;
      
      while ((node = walker.nextNode())) {
        if (node instanceof Text) {
          nodesToProcess.push(node);
        }
      }

      interface CharacterMatchInfo {
        start: number;
        end: number;
        character: Character;
      }

      nodesToProcess.forEach(textNode => {
        const text = textNode.textContent || '';
        if (!text.trim() || textNode.parentElement?.classList.contains('character-highlight')) return;

        // Collect ONLY character matches
        const allMatches: CharacterMatchInfo[] = [];
        
        characters.forEach(character => {
          if (!character.name) return;

          const escapedName = character.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
          const matchMap = new Map<number, CharacterMatchInfo>();
          let match;
          
          regex.lastIndex = 0;
          
          while ((match = regex.exec(text)) !== null) {
            const beforeChar = match.index > 0 ? text[match.index - 1] : '';
            const afterChar = text[match.index + match[0].length] || '';
            const beforeIsBoundary = match.index === 0 || /\W/.test(beforeChar);
            const afterIsBoundary = !afterChar || /\W/.test(afterChar);
            
            if (beforeIsBoundary && afterIsBoundary) {
              matchMap.set(match.index, {
                start: match.index,
                end: match.index + match[0].length,
                character
              });
            }
          }
          
          matchMap.forEach((matchInfo) => allMatches.push(matchInfo));
        });

        // Sort matches by position
        allMatches.sort((a, b) => a.start - b.start);

        // Remove overlapping matches
        const filteredMatches: CharacterMatchInfo[] = [];
        for (const match of allMatches) {
          let overlaps = false;
          for (const existing of filteredMatches) {
            if ((match.start >= existing.start && match.start < existing.end) ||
                (match.end > existing.start && match.end <= existing.end) ||
                (match.start <= existing.start && match.end >= existing.end)) {
              overlaps = true;
              break;
            }
          }
          if (!overlaps) {
            filteredMatches.push(match);
          }
        }

        if (filteredMatches.length === 0) return;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        filteredMatches.forEach(({ start, end, character: char }) => {
          if (start > lastIndex) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex, start)));
          }

          const span = document.createElement('span');
          span.className = 'character-highlight';
          const highlightColor = char.color || '#0066cc';
          span.setAttribute('style', `color: ${highlightColor}; text-decoration: underline; cursor: pointer;`);
          span.setAttribute('data-character-id', char.id?.toString() || '');
          span.setAttribute('data-character-name', char.name);
          span.textContent = text.substring(start, end);
          fragment.appendChild(span);
          
          lastIndex = end;
        });

        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }

        if (fragment.hasChildNodes()) {
          try {
            textNode.parentNode?.replaceChild(fragment, textNode);
          } catch (err) {
            console.error('Error replacing text node:', err);
          }
        }
      });

      // Restore cursor position
      if (selection && range) {
        try {
          const textNodes: Text[] = [];
          const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
          let node;
          while ((node = walker.nextNode())) {
            textNodes.push(node);
          }

          let currentOffset = 0;
          for (const textNode of textNodes) {
            const nodeLength = textNode.textContent?.length || 0;
            if (currentOffset + nodeLength >= offsetBeforeHighlight) {
              const newRange = document.createRange();
              const offsetInNode = offsetBeforeHighlight - currentOffset;
              newRange.setStart(textNode, Math.min(offsetInNode, nodeLength));
              newRange.setEnd(textNode, Math.min(offsetInNode, nodeLength));
              selection.removeAllRanges();
              selection.addRange(newRange);
              break;
            }
            currentOffset += nodeLength;
          }
        } catch (err) {
          console.error('Error restoring cursor:', err);
        }
      }

      // Add event listeners to character highlights
      editor.querySelectorAll('.character-highlight').forEach(span => {
        const characterId = span.getAttribute('data-character-id') || '';
        const character = characters.find(c => c.id === characterId);
        
        if (!character) return;

        const newSpan = span.cloneNode(true) as HTMLElement;
        
        newSpan.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const clickedSpan = e.currentTarget as HTMLElement;
          const clickedCharacterId = clickedSpan.getAttribute('data-character-id') || '';
          
          if (!clickedCharacterId) return;
          
          const { openWindow, updateDatabaseViewState } = useAppStore.getState();
          openWindow('database', 'Database');
          updateDatabaseViewState({ activeTable: 'characters', selectedItem: null });
          
          setTimeout(() => {
            const selectEvent = new CustomEvent('select-character', { 
              detail: { characterId: clickedCharacterId } 
            });
            window.dispatchEvent(selectEvent);
            
            setTimeout(() => {
              const scrollEvent = new CustomEvent('scroll-to-character', { 
                detail: { characterId: clickedCharacterId } 
              });
              window.dispatchEvent(scrollEvent);
            }, 300);
          }, 100);
        });
        
        newSpan.addEventListener('mouseenter', (e) => {
          const target = e.target as HTMLElement;
          if (!target.closest('input') && !target.closest('textarea') && !target.closest('select')) {
            const rect = newSpan.getBoundingClientRect();
            setTooltipState({
              character,
              position: { x: rect.left + (rect.width / 2), y: rect.top }
            });
          }
        });
        
        newSpan.addEventListener('mouseleave', () => {
          setTooltipState(null);
        });

        newSpan.addEventListener('mouseenter', () => {
          newSpan.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        });
        
        newSpan.addEventListener('mouseleave', () => {
          newSpan.style.backgroundColor = '';
        });
        
        if (span.parentNode && span !== newSpan) {
          span.parentNode.replaceChild(newSpan, span);
        }
      });

    } catch (err) {
      console.error('Error applying character highlighting:', err);
    } finally {
      isProcessingRef.current = false;
    }
  }, [characterRecognitionEnabled, characters, characterNameCapitalization, setTooltipState]);

  // SEPARATE FUNCTION: Apply LOCATION highlighting only
  const applyLocationHighlighting = React.useCallback(() => {
    if (!editorRef.current || isProcessingRef.current || !locationRecognitionEnabled) {
      return;
    }

    if (locations.length === 0) {
      return;
    }

    const editor = editorRef.current;
    const text = editor.textContent || '';
    if (!text.trim()) {
      return;
    }

    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      // Save cursor position
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      let cursorOffset = 0;
      
      if (range && range.startContainer.nodeType === Node.TEXT_NODE || range.startContainer === editor) {
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editor);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        cursorOffset = preCaretRange.toString().length;
      }

      // Remove all existing LOCATION highlights only
      editor.querySelectorAll('.location-highlight').forEach(span => {
        const parent = span.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(span.textContent || ''), span);
          parent.normalize();
        }
      });

      if (!locationRecognitionEnabled || locations.length === 0) {
        isProcessingRef.current = false;
        return;
      }
      
      const offsetBeforeHighlight = cursorOffset;

      // Process each text node
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
      const nodesToProcess: Text[] = [];
      let node;
      
      while ((node = walker.nextNode())) {
        if (node instanceof Text) {
          nodesToProcess.push(node);
        }
      }

      interface LocationMatchInfo {
        start: number;
        end: number;
        location: Location;
      }

      nodesToProcess.forEach(textNode => {
        const text = textNode.textContent || '';
        if (!text.trim() || textNode.parentElement?.classList.contains('location-highlight')) return;

        // Collect ONLY location matches
        const allMatches: LocationMatchInfo[] = [];
        
        locations.forEach(location => {
          if (!location.name) return;

          const escapedName = location.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
          const matchMap = new Map<number, LocationMatchInfo>();
          let match;
          
          regex.lastIndex = 0;
          
          while ((match = regex.exec(text)) !== null) {
            const beforeChar = match.index > 0 ? text[match.index - 1] : '';
            const afterChar = text[match.index + match[0].length] || '';
            const beforeIsBoundary = match.index === 0 || /\W/.test(beforeChar);
            const afterIsBoundary = !afterChar || /\W/.test(afterChar);
            
            if (beforeIsBoundary && afterIsBoundary) {
              matchMap.set(match.index, {
                start: match.index,
                end: match.index + match[0].length,
                location
              });
            }
          }
          
          matchMap.forEach((matchInfo) => allMatches.push(matchInfo));
        });

        // Sort matches by position
        allMatches.sort((a, b) => a.start - b.start);

        // Remove overlapping matches
        const filteredMatches: LocationMatchInfo[] = [];
        for (const match of allMatches) {
          let overlaps = false;
          for (const existing of filteredMatches) {
            if ((match.start >= existing.start && match.start < existing.end) ||
                (match.end > existing.start && match.end <= existing.end) ||
                (match.start <= existing.start && match.end >= existing.end)) {
              overlaps = true;
              break;
            }
          }
          if (!overlaps) {
            filteredMatches.push(match);
          }
        }

        if (filteredMatches.length === 0) return;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        filteredMatches.forEach(({ start, end, location: loc }) => {
          if (start > lastIndex) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex, start)));
          }

          const span = document.createElement('span');
          span.className = 'location-highlight';
          const highlightColor = loc.color || '#009966';
          span.setAttribute('style', `color: ${highlightColor}; text-decoration: underline; cursor: pointer;`);
          span.setAttribute('data-location-id', loc.id?.toString() || '');
          span.setAttribute('data-location-name', loc.name);
          span.textContent = text.substring(start, end);
          fragment.appendChild(span);
          
          lastIndex = end;
        });

        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }

        if (fragment.hasChildNodes()) {
          try {
            textNode.parentNode?.replaceChild(fragment, textNode);
          } catch (err) {
            console.error('Error replacing text node:', err);
          }
        }
      });

      // Restore cursor position
      if (selection && range) {
        try {
          const textNodes: Text[] = [];
          const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
          let node;
          while ((node = walker.nextNode())) {
            textNodes.push(node);
          }

          let currentOffset = 0;
          for (const textNode of textNodes) {
            const nodeLength = textNode.textContent?.length || 0;
            if (currentOffset + nodeLength >= offsetBeforeHighlight) {
              const newRange = document.createRange();
              const offsetInNode = offsetBeforeHighlight - currentOffset;
              newRange.setStart(textNode, Math.min(offsetInNode, nodeLength));
              newRange.setEnd(textNode, Math.min(offsetInNode, nodeLength));
              selection.removeAllRanges();
              selection.addRange(newRange);
              break;
            }
            currentOffset += nodeLength;
          }
        } catch (err) {
          console.error('Error restoring cursor:', err);
        }
      }

      // Add event listeners to location highlights
      editor.querySelectorAll('.location-highlight').forEach(span => {
        const locationId = span.getAttribute('data-location-id') || '';
        const location = locations.find(l => l.id === locationId);
        
        if (!location) return;

        const newSpan = span.cloneNode(true) as HTMLElement;
        
        newSpan.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const clickedSpan = e.currentTarget as HTMLElement;
          const clickedLocationId = clickedSpan.getAttribute('data-location-id') || '';
          
          if (!clickedLocationId) return;
          
          const { openWindow, updateDatabaseViewState } = useAppStore.getState();
          openWindow('database', 'Database');
          updateDatabaseViewState({ activeTable: 'locations', selectedItem: null });
          
          setTimeout(() => {
            const selectEvent = new CustomEvent('select-location', { 
              detail: { locationId: clickedLocationId } 
            });
            window.dispatchEvent(selectEvent);
            
            setTimeout(() => {
              const scrollEvent = new CustomEvent('scroll-to-location', { 
                detail: { locationId: clickedLocationId } 
              });
              window.dispatchEvent(scrollEvent);
            }, 300);
          }, 100);
        });
        
        newSpan.addEventListener('mouseenter', (e) => {
          const target = e.target as HTMLElement;
          if (!(target.closest('input') || target.closest('textarea') || target.closest('select'))) {
            const rect = newSpan.getBoundingClientRect();
            setLocationTooltipState({
              location,
              position: { x: rect.left + (rect.width / 2), y: rect.top }
            });
          }
        });
        
        newSpan.addEventListener('mouseleave', () => {
          setLocationTooltipState(null);
        });

        newSpan.addEventListener('mouseenter', () => {
          newSpan.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        });
        
        newSpan.addEventListener('mouseleave', () => {
          newSpan.style.backgroundColor = '';
        });
        
        if (span.parentNode && span !== newSpan) {
          span.parentNode.replaceChild(newSpan, span);
        }
      });

    } catch (err) {
      console.error('Error applying location highlighting:', err);
    } finally {
      isProcessingRef.current = false;
    }
  }, [locationRecognitionEnabled, locations, locationNameCapitalization, setLocationTooltipState]);

  // SEPARATE EFFECT: Remove CHARACTER highlights when character recognition is disabled
  // This runs ONLY when characterRecognitionEnabled changes
  useEffect(() => {
    if (!editorRef.current) return;
    
    // If character recognition is DISABLED, remove character highlights IMMEDIATELY
    if (!characterRecognitionEnabled) {
      console.log('CHARACTER RECOGNITION DISABLED - Removing character highlights');
      
      // Cancel any pending highlight application
      if (applyHighlightingTimeoutRef.current) {
        clearTimeout(applyHighlightingTimeoutRef.current);
        applyHighlightingTimeoutRef.current = null;
      }
      
      // Remove all character highlights synchronously
      const characterHighlights = editorRef.current.querySelectorAll('.character-highlight');
      console.log('Found', characterHighlights.length, 'character highlights to remove');
      
      characterHighlights.forEach(span => {
        const parent = span.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(span.textContent || ''), span);
          parent.normalize();
        }
      });
    }
  }, [characterRecognitionEnabled]); // ONLY depend on characterRecognitionEnabled

  // SEPARATE EFFECT: Remove LOCATION highlights when location recognition is disabled
  // This runs ONLY when locationRecognitionEnabled changes
  useEffect(() => {
    if (!editorRef.current) return;
    
    // If location recognition is DISABLED, remove location highlights IMMEDIATELY
    if (!locationRecognitionEnabled) {
      console.log('LOCATION RECOGNITION DISABLED - Removing location highlights');
      
      // Cancel any pending highlight application
      if (applyHighlightingTimeoutRef.current) {
        clearTimeout(applyHighlightingTimeoutRef.current);
        applyHighlightingTimeoutRef.current = null;
      }
      
      // Remove all location highlights synchronously
      const locationHighlights = editorRef.current.querySelectorAll('.location-highlight');
      console.log('Found', locationHighlights.length, 'location highlights to remove');
      
      locationHighlights.forEach(span => {
        const parent = span.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(span.textContent || ''), span);
          parent.normalize();
        }
      });
    }
  }, [locationRecognitionEnabled]); // ONLY depend on locationRecognitionEnabled

  // SEPARATE EFFECT: Apply highlighting when CHARACTER recognition is enabled
  // This runs ONLY when character recognition or related data changes
  useEffect(() => {
    if (!editorRef.current) return;
    
    // Only proceed if character recognition is ENABLED AND we have characters
    if (!characterRecognitionEnabled || characters.length === 0) {
      return;
    }

    // Cancel any pending application
    if (applyHighlightingTimeoutRef.current) {
      clearTimeout(applyHighlightingTimeoutRef.current);
    }

    // Apply highlighting with a delay to ensure editor is ready
    applyHighlightingTimeoutRef.current = setTimeout(() => {
      // Use refs to check CURRENT state
      if (isProcessingRef.current) {
        applyHighlightingTimeoutRef.current = null;
        return;
      }
      if (!characterRecognitionEnabledRef.current) {
        console.log('Skipping character highlighting - disabled');
        applyHighlightingTimeoutRef.current = null;
        return;
      }
      
      console.log('Applying CHARACTER highlighting');
      applyCharacterHighlighting();
      applyHighlightingTimeoutRef.current = null;
    }, 300);
    
    return () => {
      if (applyHighlightingTimeoutRef.current) {
        clearTimeout(applyHighlightingTimeoutRef.current);
        applyHighlightingTimeoutRef.current = null;
      }
    };
  }, [characterRecognitionEnabled, characters, characterNameCapitalization, applyCharacterHighlighting]);

  // SEPARATE EFFECT: Apply highlighting when LOCATION recognition is enabled
  // This runs ONLY when location recognition or related data changes
  useEffect(() => {
    if (!editorRef.current) return;
    
    // Only proceed if location recognition is ENABLED AND we have locations
    if (!locationRecognitionEnabled || locations.length === 0) {
      return;
    }

    // Cancel any pending application
    if (applyHighlightingTimeoutRef.current) {
      clearTimeout(applyHighlightingTimeoutRef.current);
    }

    // Apply highlighting with a delay to ensure editor is ready
    applyHighlightingTimeoutRef.current = setTimeout(() => {
      // Use refs to check CURRENT state
      if (isProcessingRef.current) {
        applyHighlightingTimeoutRef.current = null;
        return;
      }
      if (!locationRecognitionEnabledRef.current) {
        console.log('Skipping location highlighting - disabled');
        applyHighlightingTimeoutRef.current = null;
        return;
      }
      
      console.log('Applying LOCATION highlighting');
      applyLocationHighlighting();
      applyHighlightingTimeoutRef.current = null;
    }, 300);
    
    return () => {
      if (applyHighlightingTimeoutRef.current) {
        clearTimeout(applyHighlightingTimeoutRef.current);
        applyHighlightingTimeoutRef.current = null;
      }
    };
  }, [locationRecognitionEnabled, locations, locationNameCapitalization, applyLocationHighlighting]);

  // Initialize content and update when prop changes from outside
  useEffect(() => {
    if (editorRef.current && content !== undefined) {
      // Check if element is actually in the document (important when switching views)
      const isInDocument = document.body.contains(editorRef.current);
      
      if (isInDocument) {
        const currentContent = removeHighlights(editorRef.current.innerHTML);
        // Use pending content if available (from view switch), otherwise use content prop
        const sourceContent = pendingContentRef.current || content;
        const cleanContent = sourceContent || '<p><br></p>';
        
        // Always update if the content is different
        // This ensures both views always show the same content
        if (currentContent !== cleanContent) {
        // Save cursor position
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        let cursorOffset = 0;
        
        if (range && editorRef.current.contains(range.startContainer)) {
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(editorRef.current);
          preCaretRange.setEnd(range.startContainer, range.startOffset);
          cursorOffset = preCaretRange.toString().length;
        }
        
        editorRef.current.innerHTML = cleanContent;
        
        // Restore cursor if possible
        if (cursorOffset > 0 && selection) {
          setTimeout(() => {
            try {
              const textNodes: Text[] = [];
              const walker = document.createTreeWalker(editorRef.current!, NodeFilter.SHOW_TEXT);
              let node;
              while ((node = walker.nextNode())) {
                textNodes.push(node);
              }
              
              let currentOffset = 0;
              for (const textNode of textNodes) {
                const nodeLength = textNode.textContent?.length || 0;
                if (currentOffset + nodeLength >= cursorOffset) {
                  const newRange = document.createRange();
                  const offsetInNode = cursorOffset - currentOffset;
                  newRange.setStart(textNode, Math.min(offsetInNode, nodeLength));
                  newRange.setEnd(textNode, Math.min(offsetInNode, nodeLength));
                  selection.removeAllRanges();
                  selection.addRange(newRange);
                  break;
                }
                currentOffset += nodeLength;
              }
            } catch (e) {
              // Cursor restoration failed
            }
          }, 0);
        }
        
        // Reapply highlighting after content change - only if recognition is enabled
        setTimeout(() => {
          // Use refs to check CURRENT state
          const charEnabled = characterRecognitionEnabledRef.current;
          const locEnabled = locationRecognitionEnabledRef.current;
          
          const shouldApply = (charEnabled && characters.length > 0) || 
                              (locEnabled && locations.length > 0);
          
          if (shouldApply && !isProcessingRef.current) {
            // Final check before applying - use refs for latest state
            if (charEnabled && characters.length > 0) {
              applyCharacterHighlighting();
            }
            if (locEnabled && locations.length > 0) {
              applyLocationHighlighting();
            }
          }
        }, 100);
        }
      } else {
        // Element not in document yet (view switching), initialize it when it mounts
        const sourceContent = pendingContentRef.current || content;
        const cleanContent = sourceContent || '<p><br></p>';
        // Set up observer or use setTimeout to initialize when element is ready
        const checkAndInit = () => {
          if (editorRef.current && document.body.contains(editorRef.current)) {
            editorRef.current.innerHTML = cleanContent;
          }
        };
        // Try immediately
        checkAndInit();
        // Also try after a short delay
        setTimeout(checkAndInit, 50);
      }
    }
  }, [content, characterRecognitionEnabled, locationRecognitionEnabled, characters, locations, applyCharacterHighlighting, applyLocationHighlighting, viewMode]);

  const handleInput = () => {
    handleContentChange();
    
    // Debounce highlighting: apply it 1 second after user stops typing
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    
    highlightTimeoutRef.current = setTimeout(() => {
      // Use refs to check CURRENT state
      const charEnabled = characterRecognitionEnabledRef.current;
      const locEnabled = locationRecognitionEnabledRef.current;
      
      // Only apply if recognition is explicitly enabled
      const shouldApply = (charEnabled && document.activeElement !== editorRef.current && characters.length > 0) ||
                          (locEnabled && document.activeElement !== editorRef.current && locations.length > 0);
      
      if (shouldApply && !isProcessingRef.current) {
        // Double-check state hasn't changed using refs
        if (charEnabled && characters.length > 0) {
          applyCharacterHighlighting();
        }
        if (locEnabled && locations.length > 0) {
          applyLocationHighlighting();
        }
      }
    }, 1000);
  };
  
  // Apply highlighting when editor loses focus
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const handleBlur = () => {
      // Use refs to check CURRENT state
      const charEnabled = characterRecognitionEnabledRef.current;
      const locEnabled = locationRecognitionEnabledRef.current;
      
      // Only apply if recognition is explicitly enabled
      const shouldApply = (charEnabled && characters.length > 0) ||
                          (locEnabled && locations.length > 0);
      
      if (shouldApply && !isProcessingRef.current) {
        // Double-check state hasn't changed using refs
        setTimeout(() => {
          // Final check before applying - use refs again for latest state
          if (characterRecognitionEnabledRef.current && characters.length > 0) {
            applyCharacterHighlighting();
          }
          if (locationRecognitionEnabledRef.current && locations.length > 0) {
            applyLocationHighlighting();
          }
        }, 100);
      }
    };
    
    editor.addEventListener('blur', handleBlur);
    return () => editor.removeEventListener('blur', handleBlur);
  }, [characterRecognitionEnabled, locationRecognitionEnabled, characters, locations, applyCharacterHighlighting, applyLocationHighlighting]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const handleToggleFormat = (command: string, value?: any) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    // Wait a moment for focus
    setTimeout(() => {
      // Execute the command
      try {
        if (value !== undefined && value !== null) {
          const result = document.execCommand(command, false, value);
          console.log(`Command: ${command}, Value: ${value}, Result: ${result}`);
        } else {
          const result = document.execCommand(command, false, null);
          console.log(`Command: ${command}, Result: ${result}`);
        }
        
        // Trigger content change to save the formatting
        handleContentChange();
      } catch (err) {
        console.error('Error executing command:', err);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          handleToggleFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          handleToggleFormat('italic');
          break;
        case '1':
          e.preventDefault();
          handleToggleFormat('formatBlock', '<h1>');
          break;
        case '2':
          e.preventDefault();
          handleToggleFormat('formatBlock', '<h2>');
          break;
        case '3':
          e.preventDefault();
          handleToggleFormat('formatBlock', '<h3>');
          break;
      }
    }
  };

  const handleInsertPageBreak = () => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const pageBreak = document.createElement('div');
    pageBreak.className = 'page-break';
    pageBreak.style.cssText = 'page-break-after: always; border-top: 1px dashed #ccc; margin: 20px 0; padding-top: 10px; color: #999; font-size: 11px; text-align: center;';
    pageBreak.innerHTML = '<hr style="border: 0; border-top: 2px dashed #ccc; margin: 10px 0;" />';
    
    range.insertNode(pageBreak);
    
    // Place cursor after the page break
    const newRange = document.createRange();
    newRange.setStartAfter(pageBreak);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    
    // Trigger content change
    handleContentChange();
  };

  const activeTableOfContents = externalShowTable ?? localShowTableOfContents;
  
  // Debug: Log when TOC state changes
  console.log('Table of Contents State:', { 
    isOpen: activeTableOfContents, 
    externalShowTable, 
    localShowTableOfContents 
  });

  // Toggle view mode function
  const toggleViewMode = () => {
    // Before switching views, capture and sync current editor content
    if (editorRef.current) {
      const currentContent = removeHighlights(editorRef.current.innerHTML);
      // Store content in ref so it can be used immediately in the new view
      if (currentContent.trim() && currentContent !== '<p><br></p>') {
        pendingContentRef.current = currentContent;
        // Sync content immediately
        onChange(currentContent);
      }
    }
    // Switch view immediately - the new view will use pendingContentRef if content prop hasn't updated yet
    setViewMode(prev => prev === 'plain' ? 'paginated' : 'plain');
    // Clear pending content after a delay
    setTimeout(() => {
      pendingContentRef.current = null;
    }, 100);
  };

  // If in paginated mode, render the paginated view
  if (viewMode === 'paginated') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800">
        {/* Formatting Toolbar */}
        <FormattingToolbar 
          editorRef={editorRef} 
          onToggleFormat={handleToggleFormat}
          characterRecognitionEnabled={characterRecognitionEnabled}
          onToggleCharacterRecognition={toggleCharacterRecognition}
          locationRecognitionEnabled={locationRecognitionEnabled}
          onToggleLocationRecognition={toggleLocationRecognition}
          onToggleTableOfContents={onToggleTableOfContents || (() => setLocalShowTableOfContents(prev => !prev))}
          showTableOfContents={activeTableOfContents}
          viewMode={viewMode}
          onToggleViewMode={toggleViewMode}
          onInsertPageBreak={handleInsertPageBreak}
        />
        
        <PaginatedView 
          content={pendingContentRef.current || content} 
          onContentChange={onChange}
          editorRef={editorRef}
          showTableOfContents={activeTableOfContents}
          onToggleTableOfContents={onToggleTableOfContents || (() => setLocalShowTableOfContents(prev => !prev))}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800">
      {/* Formatting Toolbar */}
      <FormattingToolbar 
        editorRef={editorRef} 
        onToggleFormat={handleToggleFormat}
        characterRecognitionEnabled={characterRecognitionEnabled}
        onToggleCharacterRecognition={toggleCharacterRecognition}
        locationRecognitionEnabled={locationRecognitionEnabled}
        onToggleLocationRecognition={toggleLocationRecognition}
        onToggleTableOfContents={onToggleTableOfContents || (() => setLocalShowTableOfContents(prev => !prev))}
        showTableOfContents={activeTableOfContents}
        viewMode={viewMode}
        onToggleViewMode={toggleViewMode}
        onInsertPageBreak={handleInsertPageBreak}
      />

      {/* Editor container */}
      <div className="flex-1 relative overflow-hidden flex">
        {tooltipState && (
          <CharacterTooltip
            character={tooltipState.character}
            position={tooltipState.position}
            onClose={() => setTooltipState(null)}
          />
        )}
        {locationTooltipState && (
          <LocationTooltip
            location={locationTooltipState.location}
            position={locationTooltipState.position}
            onClose={() => setLocationTooltipState(null)}
          />
        )}
        {/* Main editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleContentChange}
          onKeyDown={handleKeyDown}
          className="flex-1 p-4 outline-none text-gray-900 dark:text-white bg-transparent overflow-auto"
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            minWidth: 0
          }}
        />
        
        {/* Table of Contents */}
        {activeTableOfContents && (
          <div className="flex-shrink-0 overflow-hidden">
            <TableOfContents 
              editorRef={editorRef} 
              isOpen={activeTableOfContents} 
              onClose={() => {
                setLocalShowTableOfContents(false);
                onToggleTableOfContents?.();
              }} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomEditor;

