
import { useState, useEffect, useCallback } from 'react';
import { 
  getBadgeCount, 
  setBadgeCount, 
  incrementBadgeCount, 
  decrementBadgeCount, 
  clearBadgeCount 
} from '@/utils/chat/simpleBadgeManager';

/**
 * A hook for managing the chat badge count
 * Provides functions to update the badge count and listens for events
 */
export const useChatBadge = () => {
  const [badgeCount, setBadgeCountState] = useState<number>(() => getBadgeCount());
  
  // Sync with localStorage on mount
  useEffect(() => {
    setBadgeCountState(getBadgeCount());
    
    // Listen for external badge count changes
    const handleBadgeCountChange = (event: CustomEvent) => {
      setBadgeCountState(event.detail?.count || 0);
    };
    
    // Subscribe to badge count changed events
    window.addEventListener('badge-count-changed', 
      handleBadgeCountChange as EventListener);
      
    return () => {
      window.removeEventListener('badge-count-changed', 
        handleBadgeCountChange as EventListener);
    };
  }, []);
  
  // Update badge count (and localStorage)
  const updateBadgeCount = useCallback((count: number) => {
    setBadgeCount(count);
    setBadgeCountState(count);
  }, []);
  
  // Increment badge count
  const increment = useCallback((amount = 1) => {
    const newCount = incrementBadgeCount(amount);
    setBadgeCountState(newCount);
    return newCount;
  }, []);
  
  // Decrement badge count
  const decrement = useCallback((amount = 1) => {
    const newCount = decrementBadgeCount(amount);
    setBadgeCountState(newCount);
    return newCount;
  }, []);
  
  // Reset badge count to zero
  const clearCount = useCallback(() => {
    clearBadgeCount();
    setBadgeCountState(0);
  }, []);
  
  return {
    badgeCount,
    updateBadgeCount,
    increment,
    decrement,
    clearCount
  };
};
