
import { useEffect, useRef } from 'react';
import { Club } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { createClubChannel, cleanupChannels } from './utils/subscriptionUtils';
import { processNewMessage } from './utils/messageHandlerUtils';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

export const useClubMessageSubscriptions = (
  userClubs: Club[],
  isOpen: boolean,
  activeSubscriptionsRef: React.MutableRefObject<Record<string, boolean>>,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
) => {
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const { currentUser, isSessionReady } = useApp();
  
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
            console.log('[useClubMessageSubscriptions] Message deletion event received:', payload);
            
            if (payload.old && payload.old.id && payload.old.club_id) {
              const deletedMessageId = payload.old.id;
              const clubId = payload.old.club_id;
              
              setClubMessages(prev => {
                if (!prev[clubId]) return prev;
                
                const updatedClubMessages = prev[clubId].filter(msg => {
                  const msgId = typeof msg.id === 'string' ? msg.id : 
                              (msg.id ? String(msg.id) : null);
                  const deleteId = typeof deletedMessageId === 'string' ? deletedMessageId : 
                                  String(deletedMessageId);
                  
                  return msgId !== deleteId;
                });
                
                return {
                  ...prev,
                  [clubId]: updatedClubMessages
                };
              });
            }
          })
      .subscribe();
      
    channelsRef.current.push(deletionChannel);
    
    // Create individual channels for each club (for INSERT events)
    userClubs.forEach(club => {
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

      channelsRef.current.push(channel);
    });
    
    return () => {
      console.log('[useClubMessageSubscriptions] Cleaning up channels due to effect cleanup');
      cleanupChannels(channelsRef.current);
      channelsRef.current = [];
      activeSubscriptionsRef.current = {};
    };
  }, [userClubs, isOpen, setClubMessages, currentUser?.id, isSessionReady]);
};
