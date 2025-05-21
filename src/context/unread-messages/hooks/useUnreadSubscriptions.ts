import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseUnreadSubscriptionsProps {
  currentUserId: string | undefined;
  isSessionReady: boolean;
  markConversationAsUnread: (conversationId: string) => void;
  markClubAsUnread: (clubId: string) => void;
  fetchUnreadCounts: () => Promise<void>;
}

export const useUnreadSubscriptions = ({
  currentUserId,
  isSessionReady,
  markConversationAsUnread,
  markClubAsUnread,
  fetchUnreadCounts
}: UseUnreadSubscriptionsProps) => {
  
  // Use refs to store handler functions to avoid closures with stale data
  const handlersRef = useRef({
    markConversationAsUnread,
    markClubAsUnread,
    fetchUnreadCounts
  });

  // Keep track of active conversation
  const activeConversationRef = useRef<{ type: 'club' | 'dm' | null, id: string | null }>({
    type: null,
    id: null
  });
  
  // Track channel health
  const channelsRef = useRef<{
    dm: ReturnType<typeof supabase.channel> | null,
    club: ReturnType<typeof supabase.channel> | null
  }>({
    dm: null,
    club: null
  });
  
  const channelHealthyRef = useRef<{
    dm: boolean,
    club: boolean
  }>({
    dm: true,
    club: true
  });
  
  const lastEventTimeRef = useRef<{
    dm: number,
    club: number
  }>({
    dm: Date.now(),
    club: Date.now()
  });

  // Update refs when handlers change
  useEffect(() => {
    handlersRef.current = {
      markConversationAsUnread,
      markClubAsUnread,
      fetchUnreadCounts
    };
  }, [markConversationAsUnread, markClubAsUnread, fetchUnreadCounts]);
  
  // Listen for active conversation changes
  useEffect(() => {
    const handleActiveConversationChanged = (event: CustomEvent) => {
      console.log('[useUnreadSubscriptions] Active conversation changed:', event.detail);
      
      // Store previous state to handle transitions
      const previousType = activeConversationRef.current.type;
      const previousId = activeConversationRef.current.id;
      
      // Update current state
      activeConversationRef.current = {
        type: event.detail.type,
        id: event.detail.id
      };
      
      // If we're switching conversations, force a refresh of unread counts
      if (previousId !== event.detail.id || previousType !== event.detail.type) {
        // Small delay to allow other operations to complete
        setTimeout(() => {
          handlersRef.current.fetchUnreadCounts();
        }, 100);
      }
    };
    
    // Listen for active conversation changes
    window.addEventListener('activeConversationChanged', handleActiveConversationChanged as EventListener);
    
    // Listen for special refreshUnreadCounts event
    const handleRefreshUnreadCounts = () => {
      console.log('[useUnreadSubscriptions] Manual refresh of unread counts requested');
      handlersRef.current.fetchUnreadCounts();
    };
    
    window.addEventListener('refreshUnreadCounts', handleRefreshUnreadCounts as EventListener);
    
    // Listen for messages being marked as read
    const handleMessagesMarkedAsRead = (event: CustomEvent) => {
      console.log('[useUnreadSubscriptions] Messages marked as read:', event.detail);
      // Refresh counts to ensure badges are updated
      setTimeout(() => {
        handlersRef.current.fetchUnreadCounts();
      }, 100);
    };
    
    window.addEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead as EventListener);
    
    // Listen for visibility changes to refresh counts when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[useUnreadSubscriptions] Tab became visible, refreshing unread counts');
        // Refresh unread counts
        handlersRef.current.fetchUnreadCounts();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('activeConversationChanged', handleActiveConversationChanged as EventListener);
      window.removeEventListener('refreshUnreadCounts', handleRefreshUnreadCounts as EventListener);
      window.removeEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Reset subscription function for connection recovery
  const resetChannels = (type: 'dm' | 'club' | 'both') => {
    console.log(`[useUnreadSubscriptions] Resetting ${type} channels`);
    
    if (type === 'dm' || type === 'both') {
      if (channelsRef.current.dm) {
        supabase.removeChannel(channelsRef.current.dm);
        channelsRef.current.dm = null;
      }
    }
    
    if (type === 'club' || type === 'both') {
      if (channelsRef.current.club) {
        supabase.removeChannel(channelsRef.current.club);
        channelsRef.current.club = null;
      }
    }
    
    // Refresh unread counts after channel reset
    if (isSessionReady && currentUserId) {
      handlersRef.current.fetchUnreadCounts();
      
      // Setup channels again after a brief delay
      if (type === 'both') {
        setTimeout(() => {
          setupChannels(currentUserId);
        }, 1000);
      }
    }
  };
  
  // Setup realtime channels with improved handling for our local-first approach
  const setupChannels = (userId: string) => {
    console.log('[useUnreadSubscriptions] Setting up realtime subscriptions for user:', userId);
    
    // Tracking for local message deduplication
    const processedMessageIds = {
      dm: new Set<string>(),
      club: new Set<string>()
    };
    
    // Use local micro-batching for unread updates to prevent cascading re-renders
    let pendingUpdates = new Set<string>();
    let pendingClubUpdates = new Set<string>();
    let updateTimeout: NodeJS.Timeout | null = null;
    
    // Batch-process updates with RAF to avoid flickering
    const processUpdates = () => {
      if (pendingUpdates.size > 0) {
        pendingUpdates.forEach(conversationId => {
          // Check if this is the active conversation
          if (
            activeConversationRef.current.type === 'dm' && 
            activeConversationRef.current.id === conversationId
          ) {
            console.log(`[useUnreadSubscriptions] Skipping unread update for active conversation: ${conversationId}`);
          } else {
            console.log(`[useUnreadSubscriptions] Marking conversation as unread: ${conversationId}`);
            handlersRef.current.markConversationAsUnread(conversationId);
          }
        });
        pendingUpdates.clear();
      }
      
      if (pendingClubUpdates.size > 0) {
        pendingClubUpdates.forEach(clubId => {
          // Check if this is the active club
          if (
            activeConversationRef.current.type === 'club' && 
            activeConversationRef.current.id === clubId
          ) {
            console.log(`[useUnreadSubscriptions] Skipping unread update for active club: ${clubId}`);
          } else {
            console.log(`[useUnreadSubscriptions] Marking club as unread: ${clubId}`);
            handlersRef.current.markClubAsUnread(clubId);
          }
        });
        pendingClubUpdates.clear();
      }
      
      // Only dispatch one event regardless of how many updates
      if (pendingUpdates.size > 0 || pendingClubUpdates.size > 0) {
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      }
      
      updateTimeout = null;
    };
    
    // Queue an update with debouncing
    const queueUpdate = () => {
      if (updateTimeout) return;
      updateTimeout = setTimeout(() => {
        requestAnimationFrame(processUpdates);
      }, 100);
    };
    
    // Set up DM channel with improved message deduplication
    const timestamp = Date.now();
    const dmChannel = supabase
      .channel(`global-dm-unread-tracking-${timestamp}`)
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'direct_messages' 
          },
          (payload) => {
            if (!payload.new || !payload.new.id) return;
            
            lastEventTimeRef.current.dm = Date.now();
            channelHealthyRef.current.dm = true;
            
            // Deduplicate messages using Set
            if (processedMessageIds.dm.has(payload.new.id)) {
              console.log(`[useUnreadSubscriptions] Skipping duplicate DM: ${payload.new.id}`);
              return;
            }
            
            // Add to processed set to avoid duplicates
            processedMessageIds.dm.add(payload.new.id);
            
            // Limit the size of the set to avoid memory issues
            if (processedMessageIds.dm.size > 1000) {
              // Remove oldest entries (approximate since Sets don't maintain insertion order)
              const iterator = processedMessageIds.dm.values();
              for (let i = 0; i < 200; i++) {
                iterator.next();
                processedMessageIds.dm.delete(iterator.next().value);
              }
            }
            
            if (payload.new.receiver_id === userId) {
              // Don't mark as unread if this is the active conversation
              if (
                activeConversationRef.current.type === 'dm' && 
                activeConversationRef.current.id === payload.new.conversation_id
              ) {
                console.log(`[useUnreadSubscriptions] Received message for active DM conversation: ${payload.new.conversation_id}`);
                return;
              }
              
              // Queue the update for non-active conversations
              pendingUpdates.add(payload.new.conversation_id);
              queueUpdate();
              
              // Dispatch event for the message
              window.dispatchEvent(new CustomEvent('dmMessageReceived', { 
                detail: { 
                  conversationId: payload.new.conversation_id,
                  messageId: payload.new.id,
                  senderId: payload.new.sender_id,
                  isActiveConversation: activeConversationRef.current.type === 'dm' && 
                                       activeConversationRef.current.id === payload.new.conversation_id
                } 
              }));
            }
          })
      .subscribe((status) => {
        console.log(`[useUnreadSubscriptions] DM channel status: ${status}`);
        if (status === 'SUBSCRIBED') {
          channelHealthyRef.current.dm = true;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          channelHealthyRef.current.dm = false;
          setTimeout(() => resetChannels('dm'), 2000);
        }
      });
    
    // Subscribe to new club messages with improved message deduplication
    const clubChannel = supabase
      .channel(`global-club-unread-tracking-${timestamp}`)
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'club_chat_messages'
          },
          (payload) => {
            if (!payload.new || !payload.new.id) return;
            
            lastEventTimeRef.current.club = Date.now();
            channelHealthyRef.current.club = true;
            
            // Deduplicate messages using Set
            if (processedMessageIds.club.has(payload.new.id)) {
              console.log(`[useUnreadSubscriptions] Skipping duplicate club message: ${payload.new.id}`);
              return;
            }
            
            // Add to processed set to avoid duplicates
            processedMessageIds.club.add(payload.new.id);
            
            // Limit the size of the set to avoid memory issues
            if (processedMessageIds.club.size > 1000) {
              // Remove oldest entries (approximate since Sets don't maintain insertion order)
              const iterator = processedMessageIds.club.values();
              for (let i = 0; i < 200; i++) {
                iterator.next();
                processedMessageIds.club.delete(iterator.next().value);
              }
            }
            
            if (payload.new.sender_id !== userId) {
              // Don't mark as unread if this is the active club
              if (
                activeConversationRef.current.type === 'club' && 
                activeConversationRef.current.id === payload.new.club_id
              ) {
                console.log(`[useUnreadSubscriptions] Received message for active club: ${payload.new.club_id}`);
                return;
              }
              
              // Queue the update for non-active conversations
              pendingClubUpdates.add(payload.new.club_id);
              queueUpdate();
            }
          })
      .subscribe((status) => {
        console.log(`[useUnreadSubscriptions] Club channel status: ${status}`);
        if (status === 'SUBSCRIBED') {
          channelHealthyRef.current.club = true;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          channelHealthyRef.current.club = false;
          setTimeout(() => resetChannels('club'), 2000);
        }
      });
    
    // Store channel references
    channelsRef.current.dm = dmChannel;
    channelsRef.current.club = clubChannel;
  };
  
  // Main effect to set up and manage subscriptions with improved resilience
  useEffect(() => {
    if (!isSessionReady || !currentUserId) return;
    
    // Initial channel setup
    setupChannels(currentUserId);
      
    // Initial fetch of unread counts
    handlersRef.current.fetchUnreadCounts();
      
    // Health check timer with improved handling
    const healthCheckTimer = setInterval(() => {
      const now = Date.now();
      const dmTimeSinceLastEvent = now - lastEventTimeRef.current.dm;
      const clubTimeSinceLastEvent = now - lastEventTimeRef.current.club;
      
      // Check DM channel health
      if (dmTimeSinceLastEvent > 60000 && !channelHealthyRef.current.dm) {
        console.log(`[useUnreadSubscriptions] DM channel health check: No events for ${Math.round(dmTimeSinceLastEvent/1000)}s`);
        resetChannels('dm');
      }
      
      // Check club channel health
      if (clubTimeSinceLastEvent > 60000 && !channelHealthyRef.current.club) {
        console.log(`[useUnreadSubscriptions] Club channel health check: No events for ${Math.round(clubTimeSinceLastEvent/1000)}s`);
        resetChannels('club');
      }
      
      // Periodic refresh of unread counts regardless of channel health
      if (dmTimeSinceLastEvent > 120000 || clubTimeSinceLastEvent > 120000) {
        console.log('[useUnreadSubscriptions] Periodic refresh of unread counts');
        handlersRef.current.fetchUnreadCounts();
      }
    }, 30000);
    
    return () => {
      clearInterval(healthCheckTimer);
      resetChannels('both');
    };
  }, [currentUserId, isSessionReady]);
};
