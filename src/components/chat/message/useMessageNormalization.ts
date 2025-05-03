
import { ChatMessage } from '@/types/chat';

export const useMessageNormalization = (currentUserId: string | null, getMemberName: (senderId: string) => string) => {
  const normalizeMessage = (message: any): ChatMessage => {
    console.log('[useMessageNormalization] Normalizing message:', message);
    
    // Case 1: Message already has complete sender information - highest priority
    if (
      typeof message.sender === 'object' &&
      message.sender !== null &&
      typeof message.sender.id !== 'undefined' &&
      typeof message.sender.name === 'string' &&
      message.sender.name !== ''
    ) {
      console.log('[useMessageNormalization] Using existing complete sender info:', message.sender);
      
      // Return the message exactly as is, preserving all sender information
      return {
        id: message.id,
        text: message.text !== undefined ? message.text : message.message,
        sender: {
          id: String(message.sender.id),
          name: message.sender.name,
          avatar: message.sender.avatar
        },
        timestamp: message.timestamp || message.created_at || new Date().toISOString(),
        isSupport: Boolean(message.isSupport),
        optimistic: Boolean(message.optimistic)
      };
    }
    
    // Case 2: Message has partial sender object
    if (message.sender && typeof message.sender === 'object') {
      // Never use getMemberName for DMs if we already have a sender.id
      // This prevents flickering by avoiding dynamic resolution
      const senderName = 
        (typeof message.sender.name === 'string' && message.sender.name !== '') 
          ? message.sender.name 
          : message.sender.id === currentUserId ? 'You' : 'User';
                        
      const senderAvatar = 
        typeof message.sender.avatar === 'string' && message.sender.avatar !== '' 
          ? message.sender.avatar 
          : undefined;
      
      return {
        id: message.id,
        text: message.message || message.text,
        sender: {
          id: message.sender.id,
          name: senderName,
          avatar: senderAvatar
        },
        timestamp: message.timestamp || message.created_at || new Date().toISOString(),
        isSupport: Boolean(message.isSupport)
      };
    }
    
    // Case 3: Message from database without sender object (needs to be updated in our other hooks)
    if (message.message !== undefined && message.sender_id !== undefined) {
      // For this case, we'll set a placeholder, but our other hooks should
      // pre-populate this with the correct data
      return {
        id: message.id,
        text: message.message,
        sender: {
          id: message.sender_id,
          name: message.sender_id === currentUserId ? 'You' : 'User',
          avatar: undefined
        },
        timestamp: message.timestamp || message.created_at || new Date().toISOString(),
        isSupport: false
      };
    }
    
    // Last resort fallback - should rarely happen
    return {
      id: message.id || `unknown-${Date.now()}`,
      text: message.message || message.text || "Unknown message",
      sender: {
        id: String(message.sender_id || message.sender?.id || "unknown"),
        name: message.sender?.name || (message.sender_id === currentUserId ? 'You' : 'User'),
        avatar: message.sender?.avatar || undefined
      },
      timestamp: message.timestamp || message.created_at || new Date().toISOString(),
      isSupport: false
    };
  };

  return { normalizeMessage };
};
