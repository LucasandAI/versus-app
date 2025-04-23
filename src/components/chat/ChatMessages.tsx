
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import MessageItem from './message/MessageItem';

interface ChatMessagesProps {
  messages: ChatMessage[] | any[];
  clubMembers: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  isSupport?: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onSelectUser?: (userId: string, userName: string, userAvatar?: string) => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  messages, 
  clubMembers, 
  isSupport = false,
  onDeleteMessage,
  onSelectUser
}) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('/placeholder.svg');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get the current user ID directly from Supabase session
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.user?.id) {
        setCurrentUserId(data.session.user.id);
        
        // Fetch user avatar if available
        const { data: userData } = await supabase
          .from('users')
          .select('avatar')
          .eq('id', data.session.user.id)
          .single();
          
        if (userData?.avatar) {
          setCurrentUserAvatar(userData.avatar);
        }
      }
    };
    
    getCurrentUser();
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Enhanced isCurrentUser check that uses the session user ID directly
  const isCurrentUser = (senderId: string) => {
    if (!currentUserId || !senderId) return false;
    
    // Convert both IDs to string for consistent comparison
    const userIdStr = String(currentUserId);
    const senderIdStr = String(senderId);
    
    console.log(`[ChatMessages] Comparing message sender ID: ${senderIdStr} with current user ID: ${userIdStr}`);
    return senderIdStr === userIdStr;
  };
  
  const getMemberName = (senderId: string) => {
    if (isCurrentUser(senderId)) return 'You';
    const member = clubMembers.find(m => String(m.id) === String(senderId));
    return member ? member.name : 'Unknown Member';
  };

  // Function to normalize messages from different sources
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
        isSupport: message.isSupport || false
      };
    }
    
    // If it's from Supabase club_chat_messages table
    if (message.message !== undefined && message.sender_id !== undefined) {
      console.log('[ChatMessages] Normalizing message from Supabase:', {
        id: message.id,
        sender_id: message.sender_id,
        message: message.message
      });
      
      return {
        id: message.id,
        text: message.message,
        sender: {
          id: message.sender_id,
          name: getMemberName(message.sender_id),
          avatar: isCurrentUser(message.sender_id) ? currentUserAvatar : (
            clubMembers.find(m => String(m.id) === String(message.sender_id))?.avatar || '/placeholder.svg'
          )
        },
        timestamp: message.timestamp || message.created_at || new Date().toISOString(),
        isSupport: false
      };
    }
    
    // If it's already in the expected format
    if (message.text !== undefined && message.sender !== undefined) {
      // Ensure sender id is consistently a string for comparisons
      return {
        ...message,
        sender: {
          ...message.sender,
          id: String(message.sender.id)
        }
      };
    }
    
    // Fallback to prevent errors
    console.error("[ChatMessages] Unknown message format:", message);
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

  if (!Array.isArray(messages)) {
    console.error("[ChatMessages] Messages is not an array:", messages);
    return (
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          No messages yet. Start the conversation!
        </div>
      </div>
    );
  }

  console.log("[ChatMessages] Rendering messages:", messages.length);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          No messages yet. Start the conversation!
        </div>
      ) : (
        messages.map((message: any) => {
          const normalizedMessage = normalizeMessage(message);
          const isUserMessage = isCurrentUser(normalizedMessage.sender.id);
          
          console.log("[ChatMessages] Message after normalization:", {
            id: normalizedMessage.id,
            text: normalizedMessage.text,
            senderId: normalizedMessage.sender.id,
            isUserMessage,
            currentUserId
          });
          
          return (
            <MessageItem
              key={normalizedMessage.id}
              message={normalizedMessage}
              isUserMessage={isUserMessage}
              isSupport={isSupport}
              onDeleteMessage={onDeleteMessage}
              onSelectUser={onSelectUser}
              formatTime={formatTime}
              currentUserAvatar={currentUserAvatar}
            />
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
