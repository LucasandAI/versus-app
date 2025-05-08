
import { useEffect, useRef, useCallback } from 'react';
import { Club } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { cleanupChannels } from './utils/subscriptionUtils';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { handleNewMessagePayload, handleMessageDeletion } from './utils/subscriptionHandlers';

export const useClubMessageSubscriptions = (
  userClubs: Club[],
  isOpen: boolean,
  activeSubscriptionsRef: React.MutableRefObject<Record<string, boolean>>,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
) => {
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const { currentUser, isSessionReady } = useApp();
  const { markClubMessagesAsRead } = useUnreadMessages();
  
  const selectedClubRef = useRef<string | null>(null);
  const initializedRef = useRef(false);
  
  // Reset subscriptions when the list of user clubs changes
  const setupSubscriptions = useCallback(() => {
    // Skip if not authenticated, session not ready, drawer not open, or no clubs
    if (!isSessionReady || !currentUser?.id || !isOpen || !userClubs.length) {
      // Clean up all channels
      if (channelsRef.current.length > 0) {
        console.log('[useClubMessageSubscriptions] Cleaning up channels - not ready or drawer closed');
        cleanupChannels(channelsRef.current);
        channelsRef.current = [];
        activeSubscriptionsRef.current = {};
      }
      initializedRef.current = false;
      return;
    }
    
    // Skip if already initialized with the same number of clubs
    if (initializedRef.current && 
        Object.keys(activeSubscriptionsRef.current).length === userClubs.length) {
      return;
    }
    
    console.log('[useClubMessageSubscriptions] Setting up subscriptions for clubs:', userClubs.length);
    
    // Clean up previous channels before creating new ones
    if (channelsRef.current.length > 0) {
      console.log('[useClubMessageSubscriptions] Cleaning up previous channels');
      cleanupChannels(channelsRef.current);
      channelsRef.current = [];
    }
    
    activeSubscriptionsRef.current = {};
    
    // Set up subscription for message deletions
    const deletionChannel = supabase.channel('club-message-deletions');
    deletionChannel
      .on('postgres_changes', 
          { 
            event: 'DELETE', 
            schema: 'public', 
            table: 'club_chat_messages',
            filter: userClubs.length > 0 ? 
              `club_id=in.(${userClubs.map(club => `'${club.id}'`).join(',')})` : 
              undefined
          },
          (payload) => {
            handleMessageDeletion(payload, setClubMessages);
          })
      .subscribe();
      
    channelsRef.current.push(deletionChannel);
    
    // Create a single channel for all club messages
    const clubMessagesChannel = supabase.channel('all_club_messages');
    
    // Subscribe to all club chat messages without filter
    clubMessagesChannel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'club_chat_messages'
      }, async (payload) => {
        // Check if this message belongs to one of the user's clubs
        const clubId = payload.new?.club_id;
        if (!clubId || !userClubs.some(club => club.id === clubId)) {
          return;
        }

        await handleNewMessagePayload(
          payload, 
          userClubs, 
          setClubMessages, 
          currentUser, 
          selectedClubRef.current
        );
      })
      .subscribe((status) => {
        console.log('[useClubMessageSubscriptions] All club messages channel status:', status);
      });

    channelsRef.current.push(clubMessagesChannel);
    
    // Set active subscriptions for each club
    userClubs.forEach(club => {
      activeSubscriptionsRef.current[club.id] = true;
    });
    
    initializedRef.current = true;
  }, [userClubs, isOpen, setClubMessages, currentUser, isSessionReady, activeSubscriptionsRef]);
  
  // Set up subscriptions when dependencies change
  useEffect(() => {
    setupSubscriptions();
    
    return () => {
      console.log('[useClubMessageSubscriptions] Cleaning up channels due to effect cleanup');
      cleanupChannels(channelsRef.current);
      channelsRef.current = [];
      activeSubscriptionsRef.current = {};
      initializedRef.current = false;
    };
  }, [userClubs, isOpen, setClubMessages, currentUser?.id, isSessionReady, setupSubscriptions]);

  // Listen for club selection changes to track the currently viewed club
  useEffect(() => {
    const handleClubSelected = (e: CustomEvent) => {
      const clubId = e.detail?.clubId;
      if (clubId) {
        selectedClubRef.current = clubId;
        
        // Mark club messages as read when selected
        if (currentUser?.id) {
          markClubMessagesAsRead(clubId);
        }
      }
    };

    const handleClubDeselected = () => {
      selectedClubRef.current = null;
    };

    window.addEventListener('clubSelected', handleClubSelected as EventListener);
    window.addEventListener('clubDeselected', handleClubDeselected);

    return () => {
      window.removeEventListener('clubSelected', handleClubSelected as EventListener);
      window.removeEventListener('clubDeselected', handleClubDeselected);
    };
  }, [currentUser?.id, markClubMessagesAsRead]);
};
