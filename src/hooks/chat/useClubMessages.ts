import { useState, useEffect, useRef } from 'react';
import { Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useClubMessageSubscriptions } from '@/hooks/chat/messages/useClubMessageSubscriptions';
import { useMessageNormalization } from '@/components/chat/message/useMessageNormalization';

export const useClubMessages = (userClubs: Club[], isOpen: boolean) => {
  const [clubMessages, setClubMessages] = useState<Record<string, any[]>>({});
  const { currentUser } = useApp();
  const activeSubscriptionsRef = useRef<Record<string, boolean>>({});
  
  // Get the message normalization function
  const { normalizeMessage } = useMessageNormalization(
    currentUser?.id || null,
    (senderId) => {
      // This is a fallback that should rarely be used since we're fetching sender info
      const club = userClubs.find(c => c.members?.some(m => m.id === senderId));
      return club?.members?.find(m => m.id === senderId)?.name || 'Unknown User';
    }
  );
  
  // Fetch initial messages when drawer opens
  useEffect(() => {
    if (!isOpen || !currentUser?.id || !userClubs.length) return;
    
    const fetchInitialMessages = async () => {
      try {
        // Get last 50 messages for each club
        const clubIds = userClubs.map(club => club.id);
        
        const { data, error } = await supabase
          .from('club_chat_messages')
          .select(`
            id, 
            message, 
            sender_id, 
            club_id, 
            timestamp,
            sender:sender_id (
              id, 
              name, 
              avatar
            )
          `)
          .in('club_id', clubIds)
          .order('timestamp', { ascending: false })
          .limit(50);
          
        if (error) throw error;
        
        if (data) {
          const messagesMap: Record<string, any[]> = {};
          
          // Group messages by club_id and normalize messages
          data.forEach(message => {
            if (!messagesMap[message.club_id]) {
              messagesMap[message.club_id] = [];
            }
            
            // Use the same normalization logic as the rest of the app
            const normalizedMessage = normalizeMessage(message);
            
            console.log('[useClubMessages] Normalized message:', {
              messageId: message.id,
              senderId: message.sender_id,
              currentUserId: currentUser.id,
              isUserMessage: normalizedMessage.isUserMessage
            });
            
            messagesMap[message.club_id].push(normalizedMessage);
          });
          
          // Sort messages by timestamp (oldest first) for each club
          Object.keys(messagesMap).forEach(clubId => {
            messagesMap[clubId] = messagesMap[clubId].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          });
          
          console.log('[useClubMessages] Initial messages fetched:', {
            clubIds: Object.keys(messagesMap),
            messageCounts: Object.fromEntries(
              Object.entries(messagesMap).map(([clubId, messages]) => [
                clubId,
                messages.length
              ])
            )
          });
          
          setClubMessages(messagesMap);
        }
      } catch (error) {
        console.error('[useClubMessages] Error fetching initial messages:', error);
      }
    };
    
    fetchInitialMessages();
  }, [isOpen, currentUser?.id, userClubs, normalizeMessage]);
  
  // Set up real-time subscription for messages
  useClubMessageSubscriptions(userClubs, isOpen, activeSubscriptionsRef, setClubMessages);
  
  return {
    clubMessages,
    setClubMessages
  };
};
