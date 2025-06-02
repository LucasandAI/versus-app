
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
 * Hook for managing chat badge count with conversation-specific tracking
 */
export const useChatBadge = (userId?: string) => {
  // Local state for immediate UI updates
  const [badgeCount, setBadgeCountState] = useState<number>(getBadgeCount());
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Fetch initial unread counts from database when the component mounts
  useEffect(() => {
    if (!userId) return;
    
    const fetchConversationSpecificCounts = async () => {
      try {
        console.log('[useChatBadge] Fetching conversation-specific unread counts from database');
        
        const conversationCounts: Record<string, number> = {};
        
        // Get user's DM conversations and their unread counts
        const { data: conversations } = await supabase
          .from('direct_conversations')
          .select('id')
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
        
        if (conversations) {
          for (const conv of conversations) {
            const { data: unreadMessages } = await supabase
              .from('direct_messages')
              .select('id')
              .eq('conversation_id', conv.id)
              .contains('unread_by', [userId]);
            
            if (unreadMessages && unreadMessages.length > 0) {
              conversationCounts[conv.id] = unreadMessages.length;
            }
          }
        }
        
        // Get user's clubs and their unread counts
        const { data: userClubs } = await supabase
          .from('club_members')
          .select('club_id')
          .eq('user_id', userId);
        
        if (userClubs) {
          for (const membership of userClubs) {
            const { data: unreadMessages } = await supabase
              .from('club_chat_messages')
              .select('id')
              .eq('club_id', membership.club_id)
              .contains('unread_by', [userId]);
            
            if (unreadMessages && unreadMessages.length > 0) {
              conversationCounts[membership.club_id] = unreadMessages.length;
            }
          }
        }
        
        // Initialize the conversation-specific badge system
        initializeConversationBadges(conversationCounts);
        
        // Update local state with the total count
        const totalCount = Object.values(conversationCounts).reduce((sum, count) => sum + count, 0);
        setBadgeCountState(totalCount);
        
        console.log(`[useChatBadge] Initialized with conversation counts:`, conversationCounts, `Total: ${totalCount}`);
      } catch (error) {
        console.error('[useChatBadge] Error fetching conversation-specific unread counts:', error);
      }
    };
    
    fetchConversationSpecificCounts();
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
          const [dmCountResult, clubCountResult] = await Promise.all([
            supabase.rpc('get_unread_dm_count', { user_id: userId }),
            supabase.rpc('get_unread_club_messages_count', { user_id: userId })
          ]);
          
          if (dmCountResult.error) throw dmCountResult.error;
          if (clubCountResult.error) throw clubCountResult.error;
          
          const totalCount = (dmCountResult.data || 0) + (clubCountResult.data || 0);
          console.log(`[useChatBadge] Refreshed badge count from DB: ${totalCount}`);
          
          setBadgeCount(totalCount);
          setBadgeCountState(totalCount);
        } catch (error) {
          console.error('[useChatBadge] Error refreshing badge count:', error);
        }
      };
      
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
    
    // Listen for new message events and increment conversation-specific badges
    const handleNewMessage = (event: CustomEvent) => {
      const { conversationId, conversationType } = event.detail || {};
      console.log('[useChatBadge] New message received:', { conversationId, conversationType });
      
      if (conversationId && conversationType) {
        // Increment the specific conversation's badge count
        incrementConversationBadgeCount(conversationId);
      } else {
        // Fallback to updating total badge count
        setBadgeCountState(getBadgeCount());
      }
    };
    
    // Add event listeners
    window.addEventListener('badge-count-changed', handleBadgeCountChange as EventListener);
    window.addEventListener('conversation-badge-changed', handleConversationBadgeChange as EventListener);
    window.addEventListener('unread-message-received', handleNewMessage as EventListener);
    
    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('badge-count-changed', handleBadgeCountChange as EventListener);
      window.removeEventListener('conversation-badge-changed', handleConversationBadgeChange as EventListener);
      window.removeEventListener('unread-message-received', handleNewMessage as EventListener);
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
