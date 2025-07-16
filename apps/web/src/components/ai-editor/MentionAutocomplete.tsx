import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePopper } from 'react-popper';
import { cn } from '@/lib/utils';
import { useDebounce } from 'use-debounce';
import { mentionService, MentionEntity } from '@/lib/mention-service';
import { createStableMention } from '@/lib/markdown-parser';

interface MentionAutocompleteProps {
  target: HTMLElement | null;
  query: string;
  onSelect: (mention: string) => void;
  documentId?: string;
}

const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
  target,
  query,
  onSelect,
  documentId,
}) => {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(target, popperElement, {
    placement: 'bottom-start',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 5],
        },
      },
    ],
  });
  const [suggestions, setSuggestions] = useState<MentionEntity[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [debouncedQuery] = useDebounce(query, 300);
  const listRef = useRef<HTMLUListElement>(null);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length === 0) {
      setSuggestions([]);
      setSelectedIndex(0);
      return;
    }

    try {
      // Use the tiered search from mention service
      const results = await mentionService.searchMentions(searchQuery, documentId);
      setSuggestions(results);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Failed to fetch mention suggestions:', error);
      setSuggestions([]);
      setSelectedIndex(0);
    }
  }, [documentId]);

  const handleSelect = useCallback((suggestion: MentionEntity) => {
    // Create stable mention format
    const stableMention = createStableMention(suggestion);
    
    // Record usage for caching
    mentionService.recordMentionUsage(suggestion, documentId);
    
    onSelect(stableMention);
    setSuggestions([]);
    setSelectedIndex(0);
  }, [onSelect, documentId]);

  useEffect(() => {
    fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, fetchSuggestions]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!target || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            handleSelect(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          setSuggestions([]);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [target, suggestions, selectedIndex, handleSelect]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedIndex]);

  if (!target || query.length === 0 || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={setPopperElement}
      style={styles.popper}
      {...attributes.popper}
      className="z-50 w-80 max-h-64 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-200"
    >
      <ul ref={listRef} className="space-y-0.5">
        {suggestions.map((suggestion, index) => (
          <li
            key={`${suggestion.type}:${suggestion.id}`}
            className={cn(
              'cursor-pointer rounded-sm px-3 py-2 text-sm outline-none transition-colors',
              'flex items-center justify-between',
              index === selectedIndex
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50 hover:text-accent-foreground'
            )}
            onClick={() => handleSelect(suggestion)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted font-mono">
                {suggestion.type === 'user' ? '@' : '[['}
              </span>
              <span className="font-medium">{suggestion.name}</span>
            </div>
            <span className="text-xs text-muted-foreground capitalize">
              {suggestion.type}
            </span>
          </li>
        ))}
      </ul>
      
      {/* Search feedback */}
      <div className="border-t mt-1 pt-1 px-2 py-1">
        <div className="text-xs text-muted-foreground">
          {suggestions.length} result{suggestions.length !== 1 ? 's' : ''} for &quot;{query}&quot;
        </div>
      </div>
    </div>
  );
};

export default MentionAutocomplete;