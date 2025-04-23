import React from 'react';
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
  
  const canDelete = message.sender.id === currentUser?.id;
  
  console.log('MessageItem - Permissions:', {
    messageId: message.id,
    senderId: message.sender.id,
    currentUserId: currentUser?.id,
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
