
import React, { useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
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
  const { currentUser } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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

  const isCurrentUser = (senderId: string) => {
    return senderId === currentUser?.id || senderId === 'currentUser';
  };
  
  const getMemberName = (senderId: string) => {
    if (isCurrentUser(senderId)) return 'You';
    const member = clubMembers.find(m => m.id === senderId);
    return member ? member.name : 'Unknown Member';
  };

  // Get current user's avatar
  const currentUserAvatar = currentUser?.avatar || '/placeholder.svg';

  // Function to normalize messages from different sources
  const normalizeMessage = (message: any): ChatMessage => {
    // If it's already in the right format
    if (message.text !== undefined) {
      return message as ChatMessage;
    }
    
    // If it's from Supabase club_chat_messages table
    if (message.message !== undefined) {
      return {
        id: message.id,
        text: message.message,
        sender: {
          id: message.sender_id,
          name: getMemberName(message.sender_id),
          avatar: clubMembers.find(m => m.id === message.sender_id)?.avatar
        },
        timestamp: message.timestamp,
        isSupport: false
      };
    }
    
    // Fallback to prevent errors
    console.error("Unknown message format:", message);
    return {
      id: message.id || `unknown-${Date.now()}`,
      text: message.message || message.text || "Unknown message",
      sender: {
        id: message.sender_id || "unknown",
        name: "Unknown User",
        avatar: '/placeholder.svg'
      },
      timestamp: message.timestamp || new Date().toISOString(),
      isSupport: false
    };
  };

  if (!Array.isArray(messages)) {
    console.error("Messages is not an array:", messages);
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          No messages yet. Start the conversation!
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          No messages yet. Start the conversation!
        </div>
      ) : (
        messages.map((message: any) => {
          const normalizedMessage = normalizeMessage(message);
          const isUserMessage = isCurrentUser(normalizedMessage.sender.id);
          
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

