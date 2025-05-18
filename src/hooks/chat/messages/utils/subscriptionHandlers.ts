
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Type for new message payload
interface MessagePayload {
  new: {
    id: string;
    club_id: string;
    sender_id: string;
    message: string;
    timestamp: string;
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

// Track active clubs globally to avoid dependency issues
const activeClubs = new Set<string>();
const clubActiveSince = new Map<string, number>();

// Set up handlers for active club tracking
export function setupActiveClubTracking() {
  const handleClubActive = (event: CustomEvent) => {
    if (event.detail?.clubId) {
      const timestamp = event.detail.timestamp || Date.now();
      
      console.log('[subscriptionHandlers] Club marked as active:', event.detail.clubId, 'at time:', timestamp);
      
      // Only update if the timestamp is newer than previous activation
      const currentTimestamp = clubActiveSince.get(event.detail.clubId) || 0;
      if (timestamp >= currentTimestamp) {
        activeClubs.add(event.detail.clubId);
        clubActiveSince.set(event.detail.clubId, timestamp);
        console.log('[subscriptionHandlers] Updated active clubs:', [...activeClubs]);
      }
    }
  };
  
  const handleClubInactive = (event: CustomEvent) => {
    if (event.detail?.clubId) {
      const timestamp = event.detail.timestamp || Date.now();
      
      console.log('[subscriptionHandlers] Club marked as inactive:', event.detail.clubId, 'at time:', timestamp);
      
      // Only update if the timestamp is newer than previous activation
      const currentTimestamp = clubActiveSince.get(event.detail.clubId) || 0;
      if (timestamp >= currentTimestamp) {
        activeClubs.delete(event.detail.clubId);
        clubActiveSince.set(event.detail.clubId, timestamp);
        console.log('[subscriptionHandlers] Updated active clubs:', [...activeClubs]);
      }
    }
  };
  
  window.addEventListener('clubActive', handleClubActive as EventListener);
  window.addEventListener('clubInactive', handleClubInactive as EventListener);
  
  return () => {
    window.removeEventListener('clubActive', handleClubActive as EventListener);
    window.removeEventListener('clubInactive', handleClubInactive as EventListener);
  };
}

// Call this function at app initialization
setupActiveClubTracking();

export const handleNewMessagePayload = async (
  payload: RealtimePostgresChangesPayload<{
    [key: string]: any;
  }>,
  userClubs: Club[],
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>,
  currentUser: any,
  selectedClubRef: string | null,
  forceUIUpdate = false
) => {
  // Make sure we have a valid payload with club_id
  if (!hasClubId(payload)) {
    console.log('[subscriptionHandlers] Invalid payload or missing club_id:', payload);
    return;
  }
  
  const typedPayload = payload as unknown as MessagePayload;
  console.log('[subscriptionHandlers] Received message payload:', typedPayload.new.id);
  
  // Get the club ID from the message
  const messageClubId = typedPayload.new.club_id;
  
  // Check if this message belongs to one of the user's clubs
  const isRelevantClub = userClubs.some(club => club.id === messageClubId);
  if (!isRelevantClub) {
    console.log(`[subscriptionHandlers] Message for club ${messageClubId} not relevant to user`);
    return;
  }
  
  // Check if this club is currently being viewed - use both approaches for reliability
  const isClubActive = activeClubs.has(messageClubId) || selectedClubRef === messageClubId;
  
  console.log(`[subscriptionHandlers] 🔥 New message received for club ${messageClubId}:`, {
    messageId: typedPayload.new.id,
    isClubActive,
    selectedClub: selectedClubRef,
    activeClubsSet: [...activeClubs],
    forceUIUpdate
  });
  
  // Create a temporary message object with sender info
  const isCurrentUser = typedPayload.new.sender_id === currentUser?.id;
  const senderName = isCurrentUser ? "You" : (typedPayload.new.sender_name || "Loading...");
  
  const tempMessage = {
    ...typedPayload.new,
    isUserMessage: isCurrentUser,
    sender: {
      id: typedPayload.new.sender_id,
      name: senderName,
      avatar: isCurrentUser ? currentUser?.avatar : undefined
    }
  };
  
  // Always update the UI with new messages
  setClubMessages(prev => {
    const clubMsgs = prev[messageClubId] || [];
    
    // Check if message already exists to prevent duplicates
    const messageExists = clubMsgs.some(msg => msg.id === typedPayload.new.id);
    
    if (messageExists) {
      console.log('[subscriptionHandlers] Message already exists in UI state, skipping:', typedPayload.new.id);
      return prev;
    }

    // Sort messages by timestamp
    const updatedMessages = [...clubMsgs, tempMessage].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    console.log(`[subscriptionHandlers] Adding message to UI for club ${messageClubId}:`, {
      messageId: typedPayload.new.id,
      totalMessages: updatedMessages.length
    });
    
    // Optimistically mark as read if conversation is active
    if (isClubActive) {
      console.log(`[subscriptionHandlers] Conversation ${messageClubId} is active, optimistically marking as read`);
      
      // Immediately dispatch the read event to trigger UI updates
      window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', { 
        detail: { 
          clubId: messageClubId, 
          type: 'club', 
          optimistic: true 
        } 
      }));
    }
    
    // Create and dispatch a global event with the new message details
    // Include a flag indicating whether this should increment unread count
    window.dispatchEvent(new CustomEvent('clubMessageReceived', { 
      detail: {
        clubId: messageClubId,
        message: tempMessage,
        // Only mark as unread if it's from another user and club is not active
        shouldMarkUnread: !isCurrentUser && !isClubActive
      }
    }));
    
    return {
      ...prev,
      [messageClubId]: updatedMessages
    };
  });
  
  // In parallel, fetch complete sender details (only for other users' messages)
  // and only if sender_name is not already provided
  if (!isCurrentUser && !typedPayload.new.sender_name) {
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
            msg.id === typedPayload.new.id 
              ? { 
                  ...msg, 
                  sender: senderData,
                  sender_username: senderData.name
                }
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
};

export const handleMessageDeletion = (
  payload: RealtimePostgresChangesPayload<{
    [key: string]: any;
  }>,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
) => {
  // Type guard to check if payload has the expected structure
  if (!payload.old || typeof payload.old !== 'object' || !('id' in payload.old) || !('club_id' in payload.old)) {
    console.log('[subscriptionHandlers] Invalid deletion payload:', payload);
    return;
  }
  
  const typedPayload = payload as unknown as DeletePayload;
  console.log('[subscriptionHandlers] Message deletion event received:', typedPayload.old.id);
  
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
