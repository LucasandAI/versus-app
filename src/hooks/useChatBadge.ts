
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getBadgeCount, 
  setBadgeCount, 
  getConversationBadgeCount,
  setConversationBadgeCount,
  incrementConversationBadgeCount,
  resetConversationBadgeCount,
  initializeConversationBadges,
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
        
        // Fetch individual conversation unread counts
        const [dmCountResult, clubCountResult, directMessagesResult, clubMembersResult] = await Promise.all([
          supabase.rpc('get_unread_dm_count', { user_id: userId }),
          supabase.rpc('get_unread_club_messages_count', { user_id: userId }),
          // Get unread direct messages grouped by conversation
          supabase
            .from('direct_messages')
            .select('conversation_id')
            .contains('unread_by', [userId]),
          // Get user's clubs for club conversation tracking
          supabase
            .from('club_members')
            .select('club_id')
            .eq('user_id', userId)
        ]);
        
        // Handle any errors
        if (dmCountResult.error) throw dmCountResult.error;
        if (clubCountResult.error) throw clubCountResult.error;
        if (directMessagesResult.error) throw directMessagesResult.error;
        if (clubMembersResult.error) throw clubMembersResult.error;
        
        // Build conversation-specific counts
        const conversationCounts: Record<string, number> = {};
        
        // Count unread messages per DM conversation
        const dmConversations = directMessagesResult.data || [];
        const dmConversationCounts: Record<string, number> = {};
        dmConversations.forEach(msg => {
          if (msg.conversation_id) {
            dmConversationCounts[msg.conversation_id] = (dmConversationCounts[msg.conversation_id] || 0) + 1;
          }
        });
        Object.assign(conversationCounts, dmConversationCounts);
        
        // For clubs, we need to get unread counts per club
        const userClubs = clubMembersResult.data || [];
        if (userClubs.length > 0) {
          const clubIds = userClubs.map(member => member.club_id);
          
          const { data: clubMessages } = await supabase
            .from('club_chat_messages')
            .select('club_id')
            .in('club_id', clubIds)
            .contains('unread_by', [userId]);
          
          const clubConversationCounts: Record<string, number> = {};
          (clubMessages || []).forEach(msg => {
            if (msg.club_id) {
              clubConversationCounts[msg.club_id] = (clubConversationCounts[msg.club_id] || 0) + 1;
            }
          });
          Object.assign(conversationCounts, clubConversationCounts);
        }
        
        // Initialize the conversation-specific badge system
        initializeConversationBadges(conversationCounts);
        
        // Update local state with the total count
        const totalCount = Object.values(conversationCounts).reduce((sum, count) => sum + count, 0);
        setBadgeCountState(totalCount);
        
        console.log(`[useChatBadge] Initialized with conversation counts:`, conversationCounts, `Total: ${totalCount}`);
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
          // Re-fetch from database and rebuild conversation counts
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
  
  // Listen for badge count changes
  useEffect(() => {
    // Update local state when storage changes (from other components)
    const handleBadgeCountChange = (event: CustomEvent) => {
      const newCount = event.detail?.count;
      if (typeof newCount === 'number') {
        console.log(`[useChatBadge] Badge count updated to ${newCount} from event`);
        setBadgeCountState(newCount);
      }
    };
    
    // Listen for conversation-specific badge changes
    const handleConversationBadgeChange = (event: CustomEvent) => {
      const { totalCount } = event.detail;
      if (typeof totalCount === 'number') {
        console.log(`[useChatBadge] Total badge count updated to ${totalCount} from conversation event`);
        setBadgeCountState(totalCount);
      }
    };
    
    // Listen for new message events
    const handleNewMessage = () => {
      console.log('[useChatBadge] New message received, updating badge count');
      setBadgeCountState(getBadgeCount());
    };
    
    // Add event listeners
    window.addEventListener('badge-count-changed', handleBadgeCountChange as EventListener);
    window.addEventListener('conversation-badge-changed', handleConversationBadgeChange as EventListener);
    window.addEventListener('unread-message-received', handleNewMessage);
    
    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('badge-count-changed', handleBadgeCountChange as EventListener);
      window.removeEventListener('conversation-badge-changed', handleConversationBadgeChange as EventListener);
      window.removeEventListener('unread-message-received', handleNewMessage);
    };
  }, []); // No dependencies to prevent stale closures
  
  // Callbacks for manipulating badge count with both local state and localStorage updates
  const increment = useCallback((amount: number = 1) => {
    const newCount = getBadgeCount() + amount;
    setBadgeCount(newCount);
    setBadgeCountState(newCount);
    return newCount;
  }, []);
  
  const decrement = useCallback((amount: number = 1) => {
    const currentCount = getBadgeCount();
    const newCount = Math.max(0, currentCount - amount);
    setBadgeCount(newCount);
    setBadgeCountState(newCount);
    return newCount;
  }, []);
  
  const reset = useCallback(() => {
    setBadgeCount(0);
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
    refreshBadge: () => requestBadgeRefresh(true),
    // Conversation-specific methods
    getConversationBadgeCount,
    setConversationBadgeCount,
    incrementConversationBadgeCount,
    resetConversationBadgeCount
  };
};
