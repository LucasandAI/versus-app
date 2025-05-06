
import { ChatMessage } from '@/types/chat';

export const useMessageNormalization = (currentUserId: string | null, getMemberName: (senderId: string) => string) => {
  const normalizeMessage = (message: any): ChatMessage => {
    // Handle messages with sender object from join query
    if (message.sender && typeof message.sender === 'object') {
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
    
    // If it's already in the expected format
    if (message.text !== undefined && message.sender !== undefined) {
      return {
        ...message,
        sender: {
          ...message.sender,
          id: String(message.sender.id)
        },
        isSupport: Boolean(message.isSupport)
      };
    }
    
    // Fallback
    return {
      id: message.id || `unknown-${Date.now()}`,
      text: message.message || message.text || "Unknown message",
      sender: {
        id: String(message.sender_id || message.sender?.id || "unknown"),
        name: getMemberName(message.sender_id || message.sender?.id || "unknown"),
        avatar: message.sender?.avatar || '/placeholder.svg'
      },
      timestamp: message.timestamp || message.created_at || new Date().toISOString(),
      isSupport: false
    };
  };

  return { normalizeMessage };
};
