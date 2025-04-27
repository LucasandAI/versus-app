
import React from 'react';
import { ChatMessage } from '@/types/chat';
import UserAvatar from '@/components/shared/UserAvatar';
import MessageContent from './MessageContent';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useNavigation } from '@/hooks/useNavigation';

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
  formatTime,
  currentUserAvatar,
  onSelectUser
}) => {
  const [canDelete, setCanDelete] = useState(false);
  const { navigateToUserProfile } = useNavigation();
  
  useEffect(() => {
    const checkDeletePermission = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      
      const currentUserId = sessionData.session.user.id;
      const messageSenderId = message.sender?.id;
      
      if (currentUserId && messageSenderId) {
        setCanDelete(String(currentUserId) === String(messageSenderId));
      }
    };
    
    checkDeletePermission();
  }, [message.sender?.id]);
  
  const handleDeleteClick = () => {
    if (canDelete && onDeleteMessage && message.id) {
      console.log('[MessageItem] Delete button clicked for message:', message.id);
      onDeleteMessage(message.id);
    }
  };

  const handleProfileClick = () => {
    if (!isSupport && message.sender) {
      navigateToUserProfile(message.sender.id, message.sender.name, message.sender.avatar);
    }
  };

  const getTimestamp = () => {
    if (!message.timestamp) {
      console.warn('[MessageItem] Message has no timestamp:', message.id);
      return new Date().toISOString(); // Fallback to current time
    }
    return message.timestamp;
  };

  return (
    <div className={`flex items-start mb-4 ${isUserMessage ? 'justify-end' : 'justify-start'}`}>
      {!isUserMessage && (
        <UserAvatar
          name={message.sender.name || "Unknown"}
          image={message.sender.avatar}
          size="sm"
          className={`flex-shrink-0 mr-2 ${!isSupport ? 'cursor-pointer hover:opacity-80' : ''}`}
          onClick={!isSupport ? handleProfileClick : undefined}
        />
      )}

      <div className={`flex flex-col ${isUserMessage ? 'items-end' : 'items-start'} max-w-sm`}>
        {!isUserMessage && (
          <button
            className={`text-xs text-gray-500 mb-1 ${!isSupport ? 'cursor-pointer hover:text-primary' : ''} text-left`}
            onClick={!isSupport ? handleProfileClick : undefined}
          >
            {message.sender.name || "Unknown"}
            {message.isSupport && <span className="ml-1 text-blue-500">(Support)</span>}
          </button>
        )}

        <MessageContent
          message={message}
          isUserMessage={isUserMessage}
          isSupport={isSupport}
          onDeleteMessage={canDelete && onDeleteMessage ? handleDeleteClick : undefined}
        />

        <div className="text-xs text-gray-500 mt-1 pr-1">
          {formatTime(getTimestamp())}
        </div>
      </div>

      {isUserMessage && (
        <UserAvatar
          name="You"
          image={currentUserAvatar}
          size="sm"
          className="flex-shrink-0 ml-2"
        />
      )}
    </div>
  );
};

export default MessageItem;
