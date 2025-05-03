
import { ChatMessage } from '@/types/chat';

export const useMessageNormalization = (currentUserId: string | null, getMemberName: (senderId: string) => string) => {
  const normalizeMessage = (message: any): ChatMessage => {
    console.log('[useMessageNormalization] Normalizing message:', message);
    
    // If the message already has complete sender information, use it without modification
    if (message.text !== undefined && message.sender?.name) {
      console.log('[useMessageNormalization] Using existing complete sender info:', message.sender);
      
      // Return the message exactly as is, preserving all sender information
      return {
        id: message.id,
        text: message.text,
        sender: {
          id: String(message.sender.id),
          name: message.sender.name, // Preserve the name exactly as provided
          avatar: message.sender.avatar // Preserve the avatar exactly as provided
        },
        timestamp: message.timestamp,
        isSupport: Boolean(message.isSupport),
        optimistic: Boolean(message.optimistic)
      };
    }
    
    // Handle messages with sender object but incomplete information from join query
    if (message.sender && typeof message.sender === 'object') {
      console.log('[useMessageNormalization] Message has sender object but may need enhancement:', message.sender);
      
      // Preserve existing name/avatar if they exist, only fall back if truly missing
      const senderName = message.sender.name || getMemberName(message.sender.id);
      const senderAvatar = message.sender.avatar || undefined;
      
      console.log(`[useMessageNormalization] Using name="${senderName}", avatar="${senderAvatar || 'undefined'}"`);
      
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
    
    // If it's from Supabase club_chat_messages table without sender object
    if (message.message !== undefined && message.sender_id !== undefined) {
      console.log('[useMessageNormalization] Message from database table without sender object:', message.sender_id);
      return {
        id: message.id,
        text: message.message,
        sender: {
          id: message.sender_id,
          name: getMemberName(message.sender_id),
          avatar: undefined
        },
        timestamp: message.timestamp || message.created_at || new Date().toISOString(),
        isSupport: false
      };
    }
    
    // Last resort fallback with enhanced logging - should rarely happen
    console.warn('[useMessageNormalization] Using fallback normalization for message:', message);
    return {
      id: message.id || `unknown-${Date.now()}`,
      text: message.message || message.text || "Unknown message",
      sender: {
        id: String(message.sender_id || message.sender?.id || "unknown"),
        name: message.sender?.name || getMemberName(message.sender_id || message.sender?.id || "unknown"),
        avatar: message.sender?.avatar || undefined
      },
      timestamp: message.timestamp || message.created_at || new Date().toISOString(),
      isSupport: false
    };
  };

  return { normalizeMessage };
};
