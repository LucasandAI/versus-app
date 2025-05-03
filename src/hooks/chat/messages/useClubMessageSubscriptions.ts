
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
  
  // Track the currently selected club
  const selectedClubRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Skip if not authenticated, session not ready, drawer not open, or no clubs
    if (!isSessionReady || !currentUser?.id || !isOpen || !userClubs.length) {
      // Clean up all channels
      if (channelsRef.current.length > 0) {
        console.log('[useClubMessageSubscriptions] Cleaning up channels - not ready or drawer closed');
        cleanupChannels(channelsRef.current);
        channelsRef.current = [];
        activeSubscriptionsRef.current = {};
      }
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
    
    // Subscribe to all club chat messages for user's clubs
    clubMessagesChannel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'club_chat_messages',
        filter: userClubs.length > 0 ? 
          `club_id=in.(${userClubs.map(club => `'${club.id}'`).join(',')})` : 
          undefined
      }, (payload) => {
        handleNewMessagePayload(
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
    
    return () => {
      console.log('[useClubMessageSubscriptions] Cleaning up channels due to effect cleanup');
      cleanupChannels(channelsRef.current);
      channelsRef.current = [];
      activeSubscriptionsRef.current = {};
    };
  }, [userClubs, isOpen, setClubMessages, currentUser?.id, isSessionReady]);

  // Listen for club selection changes to track the currently viewed club
  useEffect(() => {
    const handleClubSelected = (e: CustomEvent) => {
      const clubId = e.detail?.clubId;
      if (clubId) {
        console.log(`[useClubMessageSubscriptions] Club selected: ${clubId}`);
        selectedClubRef.current = clubId;
        
        // Mark club messages as read when selected
        if (currentUser?.id) {
          markClubMessagesAsRead(clubId);
        }
      }
    };

    const handleClubDeselected = () => {
      console.log('[useClubMessageSubscriptions] Club deselected');
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
