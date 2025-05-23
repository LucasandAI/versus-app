
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getBadgeCount, 
  setBadgeCount, 
  incrementBadgeCount, 
  decrementBadgeCount,
  resetBadgeCount,
  initializeBadgeCountFromDatabase,
  requestBadgeRefresh
} from '@/utils/chat/simpleBadgeManager';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for managing chat badge count with both local state for UI
 * and localStorage persistence for data survival across page reloads
 */
export const useChatBadge = (userId?: string) => {
  // Local state for immediate UI updates
  const [badgeCount, setBadgeCountState] = useState<number>(getBadgeCount());
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Fetch initial unread counts from database when the component mounts
  useEffect(() => {
    if (!userId) return;
    
    const fetchUnreadCountsFromDatabase = async () => {
      try {
        console.log('[useChatBadge] Fetching initial unread counts from database');
        
        // Use Promise.all to fetch both DM and club unread counts in parallel
        const [dmCountResult, clubCountResult] = await Promise.all([
          supabase.rpc('get_unread_dm_count', { user_id: userId }),
          supabase.rpc('get_unread_club_messages_count', { user_id: userId })
        ]);
        
        // Handle any errors
        if (dmCountResult.error) throw dmCountResult.error;
        if (clubCountResult.error) throw clubCountResult.error;
        
        // Calculate total unread count
        const totalCount = (dmCountResult.data || 0) + (clubCountResult.data || 0);
        console.log(`[useChatBadge] Initial unread count from DB: ${totalCount}`);
        
        // Initialize badge count with database value
        initializeBadgeCountFromDatabase(totalCount);
        setBadgeCountState(totalCount);
      } catch (error) {
        console.error('[useChatBadge] Error fetching initial unread counts:', error);
      }
    };
    
    fetchUnreadCountsFromDatabase();
  }, [userId]);
  
  // Handle badge refresh requests
  useEffect(() => {
    const handleBadgeRefreshRequest = (event: CustomEvent) => {
      const immediate = event.detail?.immediate === true;
      
      // Clear any existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      
      // Schedule refresh
      const refreshBadge = async () => {
        if (!userId) return;
        
        try {
          // Re-fetch from database
          const [dmCountResult, clubCountResult] = await Promise.all([
            supabase.rpc('get_unread_dm_count', { user_id: userId }),
            supabase.rpc('get_unread_club_messages_count', { user_id: userId })
          ]);
          
          if (dmCountResult.error) throw dmCountResult.error;
          if (clubCountResult.error) throw clubCountResult.error;
          
          const totalCount = (dmCountResult.data || 0) + (clubCountResult.data || 0);
          console.log(`[useChatBadge] Refreshed badge count from DB: ${totalCount}`);
          
          // Update badge count
          setBadgeCount(totalCount);
          setBadgeCountState(totalCount);
        } catch (error) {
          console.error('[useChatBadge] Error refreshing badge count:', error);
        }
      };
      
      // If immediate, refresh now, otherwise use short delay
      if (immediate) {
        refreshBadge();
      } else {
        refreshTimeoutRef.current = setTimeout(refreshBadge, 300);
      }
    };
    
    window.addEventListener('badge-refresh-required', handleBadgeRefreshRequest as EventListener);
    
    return () => {
      window.removeEventListener('badge-refresh-required', handleBadgeRefreshRequest as EventListener);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [userId]);
  
  // Synchronize with localStorage on mount and when badge count changes
  useEffect(() => {
    // Update local state when storage changes (from other components)
    const handleBadgeCountChange = (event: CustomEvent) => {
      const newCount = event.detail?.count;
      if (typeof newCount === 'number' && newCount !== badgeCount) {
        console.log(`[useChatBadge] Badge count updated to ${newCount} from event`);
        setBadgeCountState(newCount);
      }
    };
    
    // Listen for badge count changes
    window.addEventListener(
      'badge-count-changed',
      handleBadgeCountChange as EventListener
    );
    
    // Listen for new message events
    const handleNewMessage = () => {
      console.log('[useChatBadge] New message received');
      setBadgeCountState(getBadgeCount());
    };
    
    window.addEventListener(
      'unread-message-received',
      handleNewMessage
    );
    
    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener(
        'badge-count-changed',
        handleBadgeCountChange as EventListener
      );
      window.removeEventListener(
        'unread-message-received',
        handleNewMessage
      );
    };
  }, [badgeCount]);
  
  // Callbacks for manipulating badge count with both local state and localStorage updates
  const increment = useCallback((amount: number = 1) => {
    const newCount = incrementBadgeCount(amount);
    setBadgeCountState(newCount);
    return newCount;
  }, []);
  
  const decrement = useCallback((amount: number = 1) => {
    const newCount = decrementBadgeCount(amount);
    setBadgeCountState(newCount);
    return newCount;
  }, []);
  
  const reset = useCallback(() => {
    resetBadgeCount();
    setBadgeCountState(0);
  }, []);
  
  const setCount = useCallback((count: number) => {
    setBadgeCount(count);
    setBadgeCountState(count);
  }, []);
  
  return {
    badgeCount,
    increment,
    decrement,
    reset,
    setCount,
    refreshBadge: () => requestBadgeRefresh(true)
  };
};
