"use client";

import React, { useEffect, useRef } from 'react';
import { useSuggestionStore } from '@/hooks/useSuggestion';
import SuggestionList from './SuggestionList';

const SuggestionPopup = () => {
  const { isOpen, position, items, command } = useSuggestionStore();
  const popupRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<{ onKeyDown: (props: { event: KeyboardEvent; }) => boolean; }>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (listRef.current) {
        if (listRef.current.onKeyDown({ event })) {
          event.preventDefault();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown, true);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen]);

  if (!isOpen || !position || !command) {
    return null;
  }

  return (
    <div
      ref={popupRef}
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50"
      style={{ top: position.top, left: position.left, width: position.width, transform: 'translateY(-100%)' }}
    >
      <SuggestionList ref={listRef} items={items} command={command} />
    </div>
  );
};

export default SuggestionPopup;