
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { handleNewClubMessage, handleMessageDeletion } from './subscriptionHandlers';

/**
 * Sets up all message subscriptions for club chats
 */
export const setupMessageSubscriptions = (
  userClubs: Club[],
  currentUserId: string | undefined,
  selectedClubRef: React.MutableRefObject<string | null>,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>,
  fetchSenderDetails: (senderId: string) => Promise<any>
): RealtimeChannel[] => {
  const channels: RealtimeChannel[] = [];
  
  // Set up subscription for message deletions
  const deletionChannel = supabase.channel('club-message-deletions');
  deletionChannel
    .on('postgres_changes', 
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'club_chat_messages'
        },
        (payload) => {
          console.log('[setupSubscriptions] Message deletion event received:', payload);
          handleMessageDeletion(payload, setClubMessages);
        })
    .subscribe();
    
  channels.push(deletionChannel);
  
  // Add a global debug subscription to confirm INSERT events
  const debugGlobalChannel = supabase
    .channel('debug_all_club_messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'club_chat_messages'
    }, (payload) => {
      console.log('[GLOBAL DEBUG] New message inserted:', payload);
    })
    .subscribe();
  
  channels.push(debugGlobalChannel);
  
  // Create a single channel for all club messages
  const clubMessagesChannel = supabase.channel('all_club_messages');
  
  // Subscribe to all club chat messages without filter
  clubMessagesChannel
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'club_chat_messages'
    }, (payload) => {
      console.log('[setupSubscriptions] Received message:', payload);
      
      if (!payload.new || !payload.new.club_id) return;
      
      // Check if this message belongs to one of the user's clubs
      const isRelevantClub = userClubs.some(club => club.id === payload.new.club_id);
      if (!isRelevantClub) return;
      
      handleNewClubMessage(
        payload,
        currentUserId,
        selectedClubRef,
        setClubMessages,
        fetchSenderDetails
      );
    })
    .subscribe((status) => {
      console.log('[setupSubscriptions] All club messages channel status:', status);
    });

  channels.push(clubMessagesChannel);
  
  return channels;
};
