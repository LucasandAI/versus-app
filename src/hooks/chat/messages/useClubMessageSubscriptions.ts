
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
  const cleanupRef = useRef<() => void>();

  useEffect(() => {
    if (!isOpen || !userClubs.length) {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      return;
    }
    
    console.log('[useClubMessageSubscriptions] Setting up subscriptions for clubs:', userClubs.length);
    
    activeSubscriptionsRef.current = {};
    
    const channels = userClubs
      .filter(club => !activeSubscriptionsRef.current[club.id])
      .map(club => {
        activeSubscriptionsRef.current[club.id] = true;
        
        const channel = createClubChannel(club);
        channel.subscribe((status) => {
          console.log(`[useClubMessageSubscriptions] Channel status for club ${club.id}:`, status);
        });

        // Add message handler
        channel.on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'club_chat_messages',
          filter: `club_id=eq.${club.id}`
        }, (payload) => processNewMessage(payload, setClubMessages));

        return channel;
      });
    
    cleanupRef.current = () => {
      cleanupChannels(channels);
      activeSubscriptionsRef.current = {};
    };

    return cleanupRef.current;
  }, [userClubs, isOpen, setClubMessages]);
};
