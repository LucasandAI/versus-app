
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Type for new message payload
interface MessagePayload {
  new?: {
    id?: string;
    club_id?: string;
    sender_id?: string;
    message?: string;
    timestamp?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// Type for delete message payload
interface DeletePayload {
  old?: {
    id?: string;
    club_id?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export const handleNewMessagePayload = async (
  payload: RealtimePostgresChangesPayload<{
    [key: string]: any;
  }>,
  userClubs: Club[],
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>,
  currentUser: any,
  selectedClubRef: string | null
) => {
  // Make sure we have a valid payload with club_id
  if (!payload.new || !payload.new.club_id) {
    console.log('[subscriptionHandlers] Invalid payload, missing club_id:', payload);
    return;
  }
  
  const typedPayload = payload as unknown as MessagePayload;
  console.log('[subscriptionHandlers] Received message payload:', typedPayload);
  
  // Get the club ID from the message
  const messageClubId = typedPayload.new.club_id;
  
  // Check if this message belongs to one of the user's clubs
  const isRelevantClub = userClubs.some(club => club.id === messageClubId);
  if (!isRelevantClub) {
    console.log(`[subscriptionHandlers] Message for club ${messageClubId} not relevant to user`);
    return;
  }
  
  console.log(`[subscriptionHandlers] 🔥 New message received for club ${messageClubId}:`, typedPayload.new?.id);
  
  // Directly update state with message data, but also fetch sender details
  // This ensures optimistic UI update while fetching complete data
  setClubMessages(prev => {
    const clubMsgs = prev[messageClubId] || [];
    
    // Check if message already exists to prevent duplicates
    const messageExists = clubMsgs.some(msg => msg.id === typedPayload.new?.id);
    if (messageExists) return prev;

    // Create a temporary message object with the data we have
    const tempMessage = {
      ...typedPayload.new,
      isUserMessage: typedPayload.new?.sender_id === currentUser?.id
    };
    
    // Sort messages by timestamp
    const updatedMessages = [...clubMsgs, tempMessage].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Create and dispatch a global event with the new message details
    window.dispatchEvent(new CustomEvent('clubMessageReceived', { 
      detail: { clubId: messageClubId, message: tempMessage } 
    }));
    
    return {
      ...prev,
      [messageClubId]: updatedMessages
    };
  });
  
  // In parallel, fetch complete sender details
  if (typedPayload.new?.sender_id) {
    try {
      const { data: senderData } = await supabase
        .from('users')
        .select('id, name, avatar')
        .eq('id', typedPayload.new.sender_id)
        .single();

      if (senderData) {
        // Once we have sender data, update the message with complete info
        setClubMessages(prev => {
          const clubMsgs = prev[messageClubId] || [];
          
          const updatedMessages = clubMsgs.map(msg => 
            msg.id === typedPayload.new?.id 
              ? { ...msg, sender: senderData }
              : msg
          );
          
          return {
            ...prev,
            [messageClubId]: updatedMessages
          };
        });
      }
    } catch (error) {
      console.error('[subscriptionHandlers] Error fetching sender details:', error);
    }
  }
  
  // If the message is from another user and NOT the currently viewed club,
  // we need to update the unread count for this club
  if (typedPayload.new.sender_id !== currentUser?.id && 
      (!selectedClubRef || selectedClubRef !== messageClubId)) {
    window.dispatchEvent(new CustomEvent('clubMessageReceived', { 
      detail: { clubId: messageClubId } 
    }));
  }
};

export const handleMessageDeletion = (
  payload: RealtimePostgresChangesPayload<{
    [key: string]: any;
  }>,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
) => {
  const typedPayload = payload as unknown as DeletePayload;
  
  console.log('[subscriptionHandlers] Message deletion event received:', typedPayload);
  
  if (typedPayload.old && typedPayload.old.id && typedPayload.old.club_id) {
    const deletedMessageId = typedPayload.old.id;
    const clubId = typedPayload.old.club_id;
    
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
    
    // Dispatch an event for the message deletion
    window.dispatchEvent(new CustomEvent('clubMessageDeleted', { 
      detail: { clubId, messageId: deletedMessageId } 
    }));
  }
};

// Fetch user details for a message sender
export const fetchSenderDetails = async (message: any) => {
  if (!message?.sender_id) return message;
  
  try {
    const { data: senderData } = await supabase
      .from('users')
      .select('id, name, avatar')
      .eq('id', message.sender_id)
      .single();
      
    if (senderData) {
      return {
        ...message,
        sender: senderData
      };
    }
    
    return message;
  } catch (error) {
    console.error('[subscriptionHandlers] Error fetching sender details:', error);
    return message;
  }
};
