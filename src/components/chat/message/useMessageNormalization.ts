
import { ChatMessage } from '@/types/chat';

export const useMessageNormalization = (currentUserId: string | null, getMemberName: (senderId: string) => string) => {
  const normalizeMessage = (message: any): ChatMessage => {
    console.log('[useMessageNormalization] Normalizing message:', message);
    
    // If it's already in the expected format with a complete sender object
    // This is the most important case to handle for direct messages
    if (message.text !== undefined && message.sender !== undefined) {
      console.log('[useMessageNormalization] Message already in expected format with sender:', message.sender);
      
      // Make sure we don't lose any sender information
      return {
        id: message.id,
        text: message.text,
        sender: {
          id: String(message.sender.id),
          // Preserve existing name and avatar if they exist
          name: message.sender.name || getMemberName(message.sender.id),
          avatar: message.sender.avatar || '/placeholder.svg'
        },
        timestamp: message.timestamp,
        isSupport: Boolean(message.isSupport),
        optimistic: Boolean(message.optimistic)
      };
    }
    
    // Handle messages with sender object from join query
    if (message.sender && typeof message.sender === 'object') {
      console.log('[useMessageNormalization] Message has sender object from join:', message.sender);
      return {
        id: message.id,
        text: message.message || message.text,
        sender: {
          id: message.sender.id,
          name: message.sender.name || getMemberName(message.sender.id),
          avatar: message.sender.avatar || '/placeholder.svg'
        },
        timestamp: message.timestamp || message.created_at || new Date().toISOString(),
        isSupport: Boolean(message.isSupport)
      };
    }
    
    // If it's from Supabase club_chat_messages table
    if (message.message !== undefined && message.sender_id !== undefined) {
      console.log('[useMessageNormalization] Message from club_chat_messages table:', message.sender_id);
      return {
        id: message.id,
        text: message.message,
        sender: {
          id: message.sender_id,
          name: getMemberName(message.sender_id),
          avatar: message.sender?.avatar || '/placeholder.svg'
        },
        timestamp: message.timestamp || message.created_at || new Date().toISOString(),
        isSupport: false
      };
    }
    
    // Fallback with enhanced logging - should rarely happen for DM messages
    console.warn('[useMessageNormalization] Using fallback normalization for message:', message);
    return {
      id: message.id || `unknown-${Date.now()}`,
      text: message.message || message.text || "Unknown message",
      sender: {
        id: String(message.sender_id || message.sender?.id || "unknown"),
        // Try to use existing name first if available
        name: message.sender?.name || getMemberName(message.sender_id || message.sender?.id || "unknown"),
        // Try to use existing avatar first if available
        avatar: message.sender?.avatar || '/placeholder.svg'
      },
      timestamp: message.timestamp || message.created_at || new Date().toISOString(),
      isSupport: false
    };
  };

  return { normalizeMessage };
};
