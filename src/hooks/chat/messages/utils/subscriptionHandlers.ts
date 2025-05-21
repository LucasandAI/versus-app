
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

// Cache for sender data to avoid duplicate fetches
const senderCache = new Map<string, {
  id: string;
  name: string;
  avatar?: string;
}>();

// Set to track processed message IDs to prevent duplicates
const processedMessageIds = new Set<string>();
// Expire processed message IDs after some time to avoid memory growth
const MESSAGE_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Function to cleanup old message IDs periodically
const cleanupOldMessages = () => {
  const now = Date.now();
  const expiredIds: string[] = [];
  
  processedMessageIds.forEach((value, key) => {
    const [id, timestamp] = key.split('|');
    if (now - Number(timestamp) > MESSAGE_CACHE_EXPIRY) {
      expiredIds.push(key);
    }
  });
  
  expiredIds.forEach(id => processedMessageIds.delete(id));
};

// Set up periodic cleanup
setInterval(cleanupOldMessages, 60 * 1000); // Clean up every minute

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
  if (!hasClubId(payload)) {
    console.log('[subscriptionHandlers] Invalid payload or missing club_id:', payload);
    return;
  }
  
  const typedPayload = payload as unknown as MessagePayload;
  const messageId = typedPayload.new.id;
  
  // Check for duplicate messages using combined key of id and timestamp
  const messageKey = `${messageId}|${Date.now()}`;
  if (processedMessageIds.has(messageId)) {
    console.log(`[subscriptionHandlers] Skipping duplicate message: ${messageId}`);
    return;
  }
  
  // Add to processed set immediately
  processedMessageIds.add(messageId);
  
  console.log('[subscriptionHandlers] Received message payload:', messageId);
  
  // Get the club ID from the message
  const messageClubId = typedPayload.new.club_id;
  
  // Check if this message belongs to one of the user's clubs
  const isRelevantClub = userClubs.some(club => club.id === messageClubId);
  if (!isRelevantClub) {
    console.log(`[subscriptionHandlers] Message for club ${messageClubId} not relevant to user`);
    return;
  }
  
  console.log(`[subscriptionHandlers] 🔥 New message received for club ${messageClubId}:`, messageId);
  
  // Check if this is from the current user
  const isCurrentUser = typedPayload.new.sender_id === currentUser?.id;
  
  // Get sender info from cache first, or use the provided sender_name, or a placeholder
  let senderName = "Loading...";
  let senderAvatar: string | undefined = undefined;
  
  if (isCurrentUser) {
    senderName = "You";
    senderAvatar = currentUser?.avatar;
  } else if (typedPayload.new.sender_name) {
    senderName = typedPayload.new.sender_name;
  } else if (senderCache.has(typedPayload.new.sender_id)) {
    const cachedSender = senderCache.get(typedPayload.new.sender_id);
    senderName = cachedSender?.name || "Unknown";
    senderAvatar = cachedSender?.avatar;
  }
  
  // Create a temporary message object with sender info using cached data or placeholders
  const tempMessage = {
    ...typedPayload.new,
    isUserMessage: isCurrentUser,
    sender: {
      id: typedPayload.new.sender_id,
      name: senderName,
      avatar: senderAvatar
    }
  };
  
  // Immediately update with the temporary message (instant UI feedback)
  setClubMessages(prev => {
    const clubMsgs = prev[messageClubId] || [];
    
    // Check if message already exists to prevent duplicates
    const messageExists = clubMsgs.some(msg => msg.id === typedPayload.new.id);
    if (messageExists) return prev;

    // Add the message and sort by timestamp
    const updatedMessages = [...clubMsgs, tempMessage].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Dispatch event to notify of new message
    window.dispatchEvent(new CustomEvent('clubMessageReceived', { 
      detail: { 
        clubId: messageClubId, 
        message: tempMessage,
        senderId: typedPayload.new.sender_id,
        isActiveClub: selectedClubRef === messageClubId
      } 
    }));
    
    return {
      ...prev,
      [messageClubId]: updatedMessages
    };
  });
  
  // In parallel, fetch complete sender details if needed (not for current user and not cached)
  if (!isCurrentUser && !typedPayload.new.sender_name && !senderCache.has(typedPayload.new.sender_id)) {
    try {
      const { data: senderData } = await supabase
        .from('users')
        .select('id, name, avatar')
        .eq('id', typedPayload.new.sender_id)
        .single();

      if (senderData) {
        // Cache the sender data for future use
        senderCache.set(typedPayload.new.sender_id, senderData);
        
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
  
  // Check cache first
  if (senderCache.has(message.sender_id)) {
    const cachedSender = senderCache.get(message.sender_id);
    return {
      ...message,
      sender: cachedSender
    };
  }
  
  try {
    const { data: senderData } = await supabase
      .from('users')
      .select('id, name, avatar')
      .eq('id', message.sender_id)
      .single();
      
    if (senderData) {
      // Cache the data for future use
      senderCache.set(message.sender_id, senderData);
      
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

// Clear sender cache - useful when testing or if user data might have changed
export const clearSenderCache = () => {
  senderCache.clear();
  processedMessageIds.clear();
};
