
import React from 'react';
import { ChatMessage } from '@/types/chat';
import UserAvatar from '@/components/shared/UserAvatar';
import MessageContent from './MessageContent';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface MessageItemProps {
  message: ChatMessage;
  isUserMessage: boolean;
  isSupport: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onSelectUser?: (userId: string, userName: string, userAvatar?: string) => void;
  formatTime: (isoString: string) => string;
  currentUserAvatar: string;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isUserMessage,
  isSupport,
  onDeleteMessage,
  onSelectUser,
  formatTime,
  currentUserAvatar,
}) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Get the current user ID directly from Supabase session
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
      }
    };
    
    getCurrentUser();
  }, []);
  
  // Determine if the current user can delete this message
  // Convert both IDs to string for consistent comparison
  const canDelete = currentUserId && String(currentUserId) === String(message.sender.id);
  
  // Enhanced logging for debugging
  console.log('MessageItem:', {
    messageId: message.id,
    senderId: message.sender.id, 
    currentUserId,
    isUserMessage,
    canDelete
  });

  return (
    <div className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} group`}>
      {!isUserMessage && (
        <UserAvatar 
          name={message.sender.name} 
          image={message.sender.avatar} 
          size="sm" 
          className={`mr-2 flex-shrink-0 ${!isSupport ? 'cursor-pointer' : ''}`}
          onClick={!isSupport && onSelectUser ? () => onSelectUser(message.sender.id, message.sender.name, message.sender.avatar) : undefined}
        />
      )}
      
      <div className={`max-w-[70%] ${isUserMessage ? 'order-2' : 'order-1'}`}>
        {/* Show sender name for non-user messages */}
        {!isUserMessage && (
          <button 
            className={`text-xs text-gray-500 mb-1 ${!isSupport ? 'cursor-pointer hover:text-primary' : ''} text-left`}
            onClick={!isSupport && onSelectUser ? () => onSelectUser(message.sender.id, message.sender.name, message.sender.avatar) : undefined}
          >
            {message.sender.name}
            {message.isSupport && <span className="ml-1 text-blue-500">(Support)</span>}
          </button>
        )}
        
        <MessageContent 
          message={message}
          isUserMessage={isUserMessage}
          isSupport={isSupport}
          onDeleteMessage={canDelete && onDeleteMessage ? () => {
            console.log('Delete button clicked for message:', message.id);
            console.log('By user:', currentUserId);
            console.log('Message sender:', message.sender.id);
            onDeleteMessage(message.id);
          } : undefined}
        />
        
        <p className="text-xs text-gray-500 mt-1">{formatTime(message.timestamp)}</p>
      </div>
      
      {isUserMessage && (
        <UserAvatar 
          name={message.sender.name || "You"}
          image={currentUserAvatar} 
          size="sm" 
          className="ml-2 flex-shrink-0"
        />
      )}
    </div>
  );
};

export default MessageItem;
