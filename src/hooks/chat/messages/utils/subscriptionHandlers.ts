
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { isConversationActive, hasBeenViewedSince } from '@/utils/chat/activeConversationTracker';
import { getReadTimestamp } from '@/utils/chat/readStatusStorage';

// Type for new message payload
interface MessagePayload {
  new: {
    id: string;
    club_id: string;
    sender_id: string;
    message: string;
    timestamp: string;
    created_at?: string;
    sender_name?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// Type for delete message payload
interface DeletePayload {
  old: {
    id: string;
    club_id: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// Type guard to check if payload contains club_id
function hasClubId(payload: any): payload is { new: { club_id: string } } {
  return payload && 
         payload.new && 
         typeof payload.new === 'object' && 
         'club_id' in payload.new &&
         typeof payload.new.club_id === 'string';
}

export const handleNewMessagePayload = async (
  payload: RealtimePostgresChangesPayload<{
    [key: string]: any;
  }>,
  userClubs: Club[],
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>,
  currentUser: any,
  selectedClubId: string | null
) => {
  // Make sure we have a valid payload with club_id
  if (!hasClubId(payload)) {
    console.log('[subscriptionHandlers] Invalid payload or missing club_id', payload);
    return;
  }

  const messagePayload = payload as unknown as MessagePayload;
  const clubId = messagePayload.new.club_id;
  const messageId = messagePayload.new.id;
  const senderId = messagePayload.new.sender_id;
  const isCurrentUserMessage = senderId === currentUser?.id;
  const messageTime = new Date(messagePayload.new.created_at || messagePayload.new.timestamp).getTime();
  
  // Validate all required fields
  if (!clubId || !messageId || !senderId) {
    console.error('[subscriptionHandlers] Missing required fields in message payload:', 
      { clubId, messageId, senderId });
    return;
  }
  
  console.log('[subscriptionHandlers] Processing new message:', {
    messageId,
    clubId,
    senderId,
    isCurrentUserMessage,
    selectedClubId,
    isSelected: selectedClubId === clubId
  });

  try {
    // Fetch sender details if needed
    let senderDetails = messagePayload.new.sender || null;
    
    if (!senderDetails && senderId) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, avatar')
          .eq('id', senderId)
          .maybeSingle(); // Use maybeSingle instead of single to avoid errors
        
        if (userError) {
          console.error('[subscriptionHandlers] Error fetching sender details:', userError);
        } else if (userData) {
          senderDetails = userData;
        }
      } catch (error) {
        console.error('[subscriptionHandlers] Error retrieving sender details:', error);
      }
    }
    
    // Create normalized message object
    const normalizedMessage = {
      ...messagePayload.new,
      sender: senderDetails || {
        id: senderId,
        name: 'Unknown User',
        avatar: null
      },
      isUserMessage: isCurrentUserMessage
    };

    // Update club messages - ensure message isn't duplicated
    setClubMessages((prevMessages) => {
      // Check if we already have this message
      const existingMessages = prevMessages[clubId] || [];
      const messageExists = existingMessages.some(msg => msg.id === messageId);
      
      if (messageExists) {
        console.log(`[subscriptionHandlers] Message ${messageId} already exists, skipping`);
        return prevMessages;
      }
      
      console.log(`[subscriptionHandlers] Adding message ${messageId} to club ${clubId}`);
      
      // Add the new message to the correct club
      return {
        ...prevMessages,
        [clubId]: [...existingMessages, normalizedMessage]
      };
    });

    // Check if the conversation is active (user is currently viewing it)
    const isActive = isConversationActive('club', clubId);
    
    // Check if this conversation has been read since this message was sent
    const readTimestamp = getReadTimestamp('club', clubId);
    const hasBeenRead = readTimestamp > messageTime;
    
    // Determine if this could be the first message in a conversation
    const isFirstMessage = !prevMessages || !prevMessages[clubId] || prevMessages[clubId].length === 0;
    
    // Always dispatch an event to notify about the new message
    // This is critical for the first message case
    window.dispatchEvent(new CustomEvent('club-message-received', { 
      detail: { 
        clubId, 
        message: normalizedMessage,
        isUserMessage: isCurrentUserMessage,
        isFirstMessage, // Flag to indicate this might be the first message
        messageTime
      } 
    }));
    
    // If the message is not from the current user and the conversation is not active,
    // trigger a badge update
    if (!isCurrentUserMessage && !isActive && !hasBeenRead) {
      console.log('[subscriptionHandlers] Dispatching unread event for club message:', clubId);
      
      // Dispatch event to update unread messages
      window.dispatchEvent(new CustomEvent('unread-club-message', { 
        detail: { 
          clubId,
          messageTimestamp: messageTime 
        } 
      }));
      
      // Special handling for potentially first message - ensure badge is updated
      if (isFirstMessage) {
        // Force a badge refresh with immediate flag
        window.dispatchEvent(new CustomEvent('badge-refresh-required', {
          detail: { 
            immediate: true, 
            forceTotalRecalculation: true 
          }
        }));
        
        // Force an unread message update to ensure the first message is caught
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated', {
          detail: { forceTotalRecalculation: true }
        }));
      } else {
        // Regular badge refresh for non-first messages
        window.dispatchEvent(new CustomEvent('badge-refresh-required', {
          detail: { forceTotalRecalculation: false }
        }));
      }
    }
  } catch (error) {
    console.error('[subscriptionHandlers] Error processing message:', error);
  }
};

export const handleMessageDeletion = (
  payload: RealtimePostgresChangesPayload<{
    [key: string]: any;
  }>,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
) => {
  try {
    const deletePayload = payload as unknown as DeletePayload;
    if (!deletePayload.old || !deletePayload.old.id || !deletePayload.old.club_id) {
      console.error('[subscriptionHandlers] Invalid delete payload:', payload);
      return;
    }
    
    const messageId = deletePayload.old.id;
    const clubId = deletePayload.old.club_id;
    
    console.log(`[subscriptionHandlers] Deleting message ${messageId} from club ${clubId}`);
    
    // Remove the message from the club's message list
    setClubMessages((prevMessages) => {
      const clubMessages = prevMessages[clubId];
      
      if (!clubMessages) return prevMessages;
      
      return {
        ...prevMessages,
        [clubId]: clubMessages.filter(msg => msg.id !== messageId)
      };
    });
  } catch (error) {
    console.error('[subscriptionHandlers] Error handling message deletion:', error);
  }
};

// Helper to manage prevMessages outside the handler
let prevMessages: Record<string, any[]> = {};

// Update the reference to prevMessages
export const setPrevMessages = (messages: Record<string, any[]>) => {
  prevMessages = messages;
};
