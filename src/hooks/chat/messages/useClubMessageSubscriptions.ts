import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';
import { handleNewMessagePayload, handleMessageDeletion } from './utils/subscriptionHandlers';
import { useApp } from '@/context/AppContext';
import { useCoalescedReadStatus } from './useCoalescedReadStatus';

export const useClubMessageSubscriptions = (
  userClubs: Club[],
  isOpen: boolean,
  activeSubscriptionsRef: React.MutableRefObject<Record<string, boolean>>,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
) => {
  const { currentUser } = useApp();
  const selectedClubRef = useRef<string | null>(null);
  const clubsRef = useRef<Club[]>(userClubs);
  const { markClubAsRead } = useCoalescedReadStatus();
  const subscriptionId = useRef<string>(`clubs:${Date.now()}`);
  const subscriptionHealthy = useRef<boolean>(true);
  const lastEventTime = useRef<number>(Date.now());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const activeClubRef = useRef<string | null>(null);
  const lastMessageIdRef = useRef<Record<string, string>>({});
  
  // Keep clubs reference updated
  useEffect(() => {
    clubsRef.current = userClubs;
  }, [userClubs]);
  
  // Handle active conversation changes with improved tracking
  useEffect(() => {
    const handleActiveConversationChanged = (event: CustomEvent) => {
      // Only update if this is a club conversation
      if (event.detail.type === 'club') {
        console.log('[useClubMessageSubscriptions] Active club conversation changed:', event.detail.id);
        selectedClubRef.current = event.detail.id;
        activeClubRef.current = event.detail.id;
        
        // Mark as read immediately when the conversation becomes active
        if (event.detail.id) {
          markClubAsRead(event.detail.id);
          
          // Immediate refresh to update badges
          window.dispatchEvent(new CustomEvent('refreshUnreadCounts'));
        }
      } else if (event.detail.type === null && event.detail.id === null) {
        // Clear selected club if no active conversation
        selectedClubRef.current = null;
        activeClubRef.current = null;
      }
    };
    
    window.addEventListener('activeConversationChanged', handleActiveConversationChanged as EventListener);
    
    return () => {
      window.removeEventListener('activeConversationChanged', handleActiveConversationChanged as EventListener);
    };
  }, [markClubAsRead]);
  
  // Also listen for visibility changes to refresh read status
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeClubRef.current) {
        // Re-mark as read when tab becomes visible if we have an active club
        markClubAsRead(activeClubRef.current);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [markClubAsRead]);
  
  // Clean up function for subscription
  const cleanupSubscription = () => {
    if (channelRef.current) {
      console.log(`[useClubMessageSubscriptions] Cleaning up channel: ${subscriptionId.current}`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      
      // Mark all clubs as unsubscribed
      const updatedSubs = { ...activeSubscriptionsRef.current };
      clubsRef.current.forEach(club => {
        delete updatedSubs[club.id];
      });
      activeSubscriptionsRef.current = updatedSubs;
    }
  };
  
  // Reset subscription to fix stale connections
  const resetSubscription = () => {
    if (subscriptionHealthy.current === false) {
      console.log(`[useClubMessageSubscriptions] Resetting stale subscription: ${subscriptionId.current}`);
      cleanupSubscription();
      
      // Generate a new subscription ID
      subscriptionId.current = `clubs:${Date.now()}`;
      
      // Wait a moment before recreating to avoid thrashing
      setTimeout(() => {
        setupSubscription();
      }, 1000);
    }
  };
  
  // Setup the subscription with improved real-time handling
  const setupSubscription = () => {
    // Don't subscribe if not open or no clubs
    if (!isOpen || !userClubs.length || !currentUser?.id) {
      console.log('[useClubMessageSubscriptions] Not setting up subscriptions, conditions not met:', {
        isOpen,
        clubsCount: userClubs.length,
        hasCurrentUser: !!currentUser?.id
      });
      return;
    }
    
    console.log('[useClubMessageSubscriptions] Setting up subscription for clubs:', userClubs.length);
    
    // Set up a single channel for all inserts
    try {
      const channel = supabase
        .channel(subscriptionId.current)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'club_chat_messages',
            filter: userClubs.length > 0 ? `club_id=in.(${userClubs.map(c => `'${c.id}'`).join(',')})` : undefined
          }, 
          (payload) => {
            lastEventTime.current = Date.now();
            subscriptionHealthy.current = true;
            
            // Check if this is a duplicate message by ID
            if (lastMessageIdRef.current[payload.new.club_id] === payload.new.id) {
              console.log('[useClubMessageSubscriptions] Skipping duplicate message:', payload.new.id);
              return;
            }
            
            // Store this message ID to prevent duplicates
            lastMessageIdRef.current[payload.new.club_id] = payload.new.id;
            
            console.log('[useClubMessageSubscriptions] New club message detected:', payload.new?.id);
            
            const isActiveClub = activeClubRef.current === payload.new.club_id;
            const isFromCurrentUser = String(payload.new.sender_id) === String(currentUser.id);
            
            // If this is a new message for the active club and not from the current user,
            // mark it as read immediately and update UI
            if (isActiveClub) {
              console.log('[useClubMessageSubscriptions] Message is for active club:', isActiveClub);
              if (!isFromCurrentUser) {
                console.log('[useClubMessageSubscriptions] Auto-marking new message as read (active club)');
                markClubAsRead(payload.new.club_id);
              }
              
              // In active club case, we should never show a notification badge
              // Force a refresh of unread counts
              window.dispatchEvent(new CustomEvent('refreshUnreadCounts'));
            }
            
            // Process the message
            handleNewMessagePayload(
              payload, 
              clubsRef.current, 
              setClubMessages, 
              currentUser, 
              selectedClubRef.current
            );
            
            // Dispatch an event to notify components that a new club message was received
            // With additional flag to indicate if it was for the active conversation
            window.dispatchEvent(new CustomEvent('clubMessageReceived', {
              detail: {
                clubId: payload.new.club_id,
                messageId: payload.new.id,
                senderId: payload.new.sender_id,
                isActiveClub: isActiveClub
              }
            }));
          }
        )
        .on('postgres_changes', 
          { 
            event: 'DELETE', 
            schema: 'public', 
            table: 'club_chat_messages',
            filter: userClubs.length > 0 ? `club_id=in.(${userClubs.map(c => `'${c.id}'`).join(',')})` : undefined
          }, 
          (payload) => {
            lastEventTime.current = Date.now();
            console.log('[useClubMessageSubscriptions] Message deletion detected:', payload.old?.id);
            handleMessageDeletion(payload, setClubMessages);
          }
        )
        .subscribe((status) => {
          console.log(`[useClubMessageSubscriptions] Subscription status for ${subscriptionId.current}: ${status}`);
          if (status === 'SUBSCRIBED') {
            subscriptionHealthy.current = true;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            subscriptionHealthy.current = false;
            // Attempt to recover
            setTimeout(() => resetSubscription(), 2000);
          }
        });
      
      channelRef.current = channel;
      
      // Mark all clubs as subscribed
      const updatedSubs = { ...activeSubscriptionsRef.current };
      userClubs.forEach(club => {
        updatedSubs[club.id] = true;
      });
      activeSubscriptionsRef.current = updatedSubs;
      
    } catch (error) {
      console.error('[useClubMessageSubscriptions] Error setting up subscription:', error);
      subscriptionHealthy.current = false;
      
      // Try to recover
      setTimeout(() => resetSubscription(), 3000);
    }
  };
  
  // Set up real-time subscription for all clubs
  useEffect(() => {
    // Clean up any existing subscription
    cleanupSubscription();
    
    // Generate a new subscription ID
    subscriptionId.current = `clubs:${Date.now()}`;
    
    // Setup the new subscription
    setupSubscription();
    
    // Cleanup on unmount
    return () => {
      cleanupSubscription();
    };
  }, [isOpen, currentUser?.id]);
  
  // Health check timer for subscription
  useEffect(() => {
    // Only run health checks for active drawer
    if (!isOpen) return;
    
    const healthCheck = setInterval(() => {
      // If no event received in 30 seconds, check health
      const timeSinceLastEvent = Date.now() - lastEventTime.current;
      if (timeSinceLastEvent > 30000) {
        console.log(`[useClubMessageSubscriptions] Health check: No events for ${Math.round(timeSinceLastEvent/1000)}s`);
        
        // If subscription is not healthy, try to reset
        if (!subscriptionHealthy.current) {
          resetSubscription();
        }
      }
    }, 15000);
    
    return () => clearInterval(healthCheck);
  }, [isOpen]);
};
