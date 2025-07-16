import { useEffect, useRef, useState, useCallback } from 'react';

interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onTap?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
  onLongPress?: (x: number, y: number) => void;
  threshold?: number; // Minimum distance for swipe
  longPressDelay?: number; // Time for long press in ms
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export const useTouchGestures = (options: TouchGestureOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onTap,
    onDoubleTap,
    onLongPress,
    threshold = 50,
    longPressDelay = 500,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const touchStart = useRef<TouchPoint | null>(null);
  const touchEnd = useRef<TouchPoint | null>(null);
  const lastTap = useRef<TouchPoint | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const initialDistance = useRef<number>(0);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Calculate distance between two touch points
  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const touchPoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };

    touchStart.current = touchPoint;
    touchEnd.current = null;
    setIsLongPressing(false);

    // Handle pinch gestures (two fingers)
    if (e.touches.length === 2 && onPinch) {
      initialDistance.current = getDistance(e.touches[0], e.touches[1]);
    }

    // Start long press timer
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        setIsLongPressing(true);
        onLongPress(touchPoint.x, touchPoint.y);
      }, longPressDelay);
    }
  }, [onLongPress, longPressDelay, onPinch]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Cancel long press on move
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Handle pinch gestures
    if (e.touches.length === 2 && onPinch && initialDistance.current > 0) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistance.current;
      onPinch(scale);
    }
  }, [onPinch]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return;

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Don't process if it was a long press
    if (isLongPressing) {
      setIsLongPressing(false);
      return;
    }

    const touch = e.changedTouches[0];
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = touchEnd.current.timestamp - touchStart.current.timestamp;

    // Reset pinch distance
    initialDistance.current = 0;

    // Check for swipe gestures
    if (distance > threshold && duration < 300) {
      const angle = Math.atan2(deltaY, deltaX);
      const degrees = (angle * 180) / Math.PI;

      // Determine swipe direction
      if (degrees >= -45 && degrees <= 45) {
        onSwipeRight?.();
      } else if (degrees >= 135 || degrees <= -135) {
        onSwipeLeft?.();
      } else if (degrees >= 45 && degrees <= 135) {
        onSwipeDown?.();
      } else if (degrees >= -135 && degrees <= -45) {
        onSwipeUp?.();
      }
    } else if (distance < 10 && duration < 300) {
      // Check for tap or double tap
      const currentTap = touchEnd.current;
      
      if (lastTap.current && 
          currentTap.timestamp - lastTap.current.timestamp < 300 &&
          Math.abs(currentTap.x - lastTap.current.x) < 20 &&
          Math.abs(currentTap.y - lastTap.current.y) < 20) {
        // Double tap
        onDoubleTap?.(currentTap.x, currentTap.y);
        lastTap.current = null;
      } else {
        // Single tap
        onTap?.(currentTap.x, currentTap.y);
        lastTap.current = currentTap;
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, threshold, isLongPressing]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Add passive listeners for better performance
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      // Clean up timer
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { ref, isLongPressing };
};

export default useTouchGestures;