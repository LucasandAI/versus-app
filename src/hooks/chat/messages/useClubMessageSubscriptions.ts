
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';
import { handleNewMessagePayload, handleMessageDeletion } from './utils/subscriptionHandlers';
import { useApp } from '@/context/AppContext';

export const useClubMessageSubscriptions = (
  userClubs: Club[],
  isOpen: boolean,
  activeSubscriptionsRef: React.MutableRefObject<Record<string, boolean>>,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
) => {
  const { currentUser } = useApp();
  const selectedClubRef = useRef<string | null>(null);
  const clubsRef = useRef<Club[]>(userClubs);
  
  // Keep clubs reference updated
  useEffect(() => {
    clubsRef.current = userClubs;
  }, [userClubs]);
  
  // Handle selected club changes from events
  useEffect(() => {
    const handleClubSelect = (event: CustomEvent) => {
      console.log('[useClubMessageSubscriptions] Club selected:', event.detail.clubId);
      selectedClubRef.current = event.detail.clubId;
      
      // When a club is selected, dispatch an event to mark it as active
      window.dispatchEvent(new CustomEvent('activeConversationChanged', { 
        detail: { 
          type: 'club',
          id: event.detail.clubId 
        } 
      }));
    };

    const handleActiveConversationChanged = (event: CustomEvent) => {
      // Only update if this is a club conversation
      if (event.detail.type === 'club') {
        console.log('[useClubMessageSubscriptions] Active club conversation changed:', event.detail.id);
        selectedClubRef.current = event.detail.id;
      } else if (event.detail.type === null && event.detail.id === null) {
        // Clear selected club if no active conversation
        selectedClubRef.current = null;
      }
    };
    
    window.addEventListener('clubSelected', handleClubSelect as EventListener);
    window.addEventListener('activeConversationChanged', handleActiveConversationChanged as EventListener);
    
    return () => {
      window.removeEventListener('clubSelected', handleClubSelect as EventListener);
      window.removeEventListener('activeConversationChanged', handleActiveConversationChanged as EventListener);
    };
  }, []);
  
  // Set up real-time subscription for all clubs
  useEffect(() => {
    // Don't subscribe if not open or no clubs
    if (!isOpen || userClubs.length === 0 || !currentUser?.id) {
      console.log('[useClubMessageSubscriptions] Not setting up subscriptions, conditions not met:', {
        isOpen,
        clubsCount: userClubs.length,
        hasCurrentUser: !!currentUser?.id
      });
      return;
    }
    
    console.log('[useClubMessageSubscriptions] Setting up subscription for clubs:', userClubs.length);
    
    // Create a channel for all clubs with a unique ID (includes timestamp to ensure uniqueness on hot reloads)
    const clubIds = userClubs.map(club => club.id).join(',');
    const timestamp = Date.now();
    const channelId = `clubs-${timestamp}-${clubIds.substring(0, 20)}`; // Truncate to keep channelId reasonable
    
    // Set up a single channel for all inserts
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'club_chat_messages',
          filter: userClubs.length > 0 ? `club_id=in.(${userClubs.map(c => `'${c.id}'`).join(',')})` : undefined
        }, 
        (payload) => {
          console.log('[useClubMessageSubscriptions] New message detected:', payload.new?.id);
          handleNewMessagePayload(
            payload, 
            clubsRef.current, 
            setClubMessages, 
            currentUser, 
            selectedClubRef.current
          );
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
          console.log('[useClubMessageSubscriptions] Message deletion detected:', payload.old?.id);
          handleMessageDeletion(payload, setClubMessages);
        }
      )
      .subscribe((status) => {
        console.log(`[useClubMessageSubscriptions] Subscription status for ${channelId}: ${status}`);
      });
    
    // Mark all clubs as subscribed
    const updatedSubs = { ...activeSubscriptionsRef.current };
    userClubs.forEach(club => {
      updatedSubs[club.id] = true;
    });
    activeSubscriptionsRef.current = updatedSubs;
    
    // Cleanup
    return () => {
      console.log('[useClubMessageSubscriptions] Cleaning up channel:', channelId);
      supabase.removeChannel(channel);
      
      // Mark all clubs as unsubscribed
      const updatedSubs = { ...activeSubscriptionsRef.current };
      userClubs.forEach(club => {
        delete updatedSubs[club.id];
      });
      activeSubscriptionsRef.current = updatedSubs;
    };
  }, [isOpen, userClubs, currentUser?.id, setClubMessages]);
};
