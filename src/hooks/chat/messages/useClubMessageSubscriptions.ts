
import { useEffect, useRef } from 'react';
import { Club } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { createClubChannel, cleanupChannels } from './utils/subscriptionUtils';
import { processNewMessage } from './utils/messageHandlerUtils';

export const useClubMessageSubscriptions = (
  userClubs: Club[],
  isOpen: boolean,
  activeSubscriptionsRef: React.MutableRefObject<Record<string, boolean>>,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
) => {
  const channelsRef = useRef<RealtimeChannel[]>([]);
  
  useEffect(() => {
    if (!isOpen || !userClubs.length) {
      // Clean up all channels when drawer closes
      if (channelsRef.current.length > 0) {
        console.log('[useClubMessageSubscriptions] Cleaning up channels due to drawer close');
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
    
    channelsRef.current = userClubs.map(club => {
      const clubId = club.id;
      activeSubscriptionsRef.current[clubId] = true;
      
      // Create unique channel for this club
      const channel = createClubChannel(club);
      
      // Subscribe to the channel
      channel.subscribe((status) => {
        console.log(`[useClubMessageSubscriptions] Channel status for club ${clubId}:`, status);
      });

      // Add specific message handler for this club
      channel.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'club_chat_messages',
        filter: `club_id=eq.${clubId}`
      }, (payload) => {
        console.log(`[useClubMessageSubscriptions] New message for club ${clubId}:`, payload.new?.id);
        processNewMessage(payload, setClubMessages);
      });

      return channel;
    });
    
    return () => {
      console.log('[useClubMessageSubscriptions] Cleaning up channels due to effect cleanup');
      cleanupChannels(channelsRef.current);
      channelsRef.current = [];
      activeSubscriptionsRef.current = {};
    };
  }, [userClubs, isOpen, setClubMessages]);
};
