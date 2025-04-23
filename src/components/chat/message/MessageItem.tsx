
import React, { useEffect, useState } from 'react';
import { ChatMessage } from '@/types/chat';
import UserAvatar from '@/components/shared/UserAvatar';
import MessageContent from './MessageContent';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

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
  const { currentUser } = useApp();
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  
  // Get session user ID on component mount
  useEffect(() => {
    const getSessionId = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setSessionUserId(data.session.user.id);
      }
    };
    
    getSessionId();
  }, []);
  
  // Determine if the current user can delete this message 
  // (if they are the sender by either currentUser.id or sessionUserId)
  const canDelete = 
    (currentUser && currentUser.id === message.sender.id) || 
    (sessionUserId && sessionUserId === message.sender.id);
  
  // Enhanced logging for debugging
  console.log('MessageItem:', {
    messageId: message.id,
    senderId: message.sender.id, 
    currentUserId: currentUser?.id,
    sessionUserId: sessionUserId,
    canDelete: canDelete
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
            console.log('By user:', currentUser?.id);
            console.log('Session user:', sessionUserId);
            console.log('Message sender:', message.sender.id);
            onDeleteMessage(message.id);
          } : undefined}
        />
        
        <p className="text-xs text-gray-500 mt-1">{formatTime(message.timestamp)}</p>
      </div>
      
      {isUserMessage && (
        <UserAvatar 
          name={message.sender.name}
          image={currentUserAvatar} 
          size="sm" 
          className="ml-2 flex-shrink-0"
        />
      )}
    </div>
  );
};

export default MessageItem;
