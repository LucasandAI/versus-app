
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Club } from '@/types';

/**
 * Processes a new message payload and adds it to the state
 */
export const handleNewClubMessage = async (
  payload: RealtimePostgresChangesPayload<{
    [key: string]: any;
  }>,
  currentUserId: string | undefined,
  selectedClubRef: React.MutableRefObject<string | null>,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>,
  fetchSenderDetails: (senderId: string) => Promise<any>
) => {
  if (!payload.new || !payload.new.club_id) return;
  
  const messageClubId = payload.new.club_id;
  
  console.log(`[subscriptionHandlers] 🔥 New message received for club ${messageClubId}:`, payload.new?.id);
  
  if (!payload.new?.sender_id) return;
  
  try {
    const messageWithSender = await fetchSenderDetails(payload.new.sender_id);
    if (!messageWithSender) return;
    
    const clubId = messageWithSender.club_id;
    
    setClubMessages(prev => {
      const clubMsgs = prev[clubId] || [];
      
      // Check if message already exists to prevent duplicates
      const messageExists = clubMsgs.some(msg => msg.id === messageWithSender.id);
      if (messageExists) return prev;
      
      return {
        ...prev,
        [clubId]: [...clubMsgs, messageWithSender].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
      };
    });
    
    // If the message is from another user and NOT the currently viewed club,
    // we need to update the unread count for this club
    if (payload.new.sender_id !== currentUserId && 
        (!selectedClubRef.current || selectedClubRef.current !== messageClubId)) {
      window.dispatchEvent(new CustomEvent('clubMessageReceived', { 
        detail: { clubId: messageClubId } 
      }));
    }
  } catch (error) {
    console.error('[subscriptionHandlers] Error handling new message:', error);
  }
};

/**
 * Handles message deletion events
 */
export const handleMessageDeletion = (
  payload: RealtimePostgresChangesPayload<{
    [key: string]: any;
  }>,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
) => {
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
};

/**
 * Checks if a club message is relevant to the current user's clubs
 */
export const isRelevantClubMessage = (clubId: string, userClubs: Club[]): boolean => {
  return userClubs.some(club => club.id === clubId);
};
