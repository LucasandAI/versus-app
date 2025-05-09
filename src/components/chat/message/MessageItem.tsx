
import React from 'react';
import { ChatMessage } from '@/types/chat';
import UserAvatar from '@/components/shared/UserAvatar';
import MessageContent from './MessageContent';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import MessageDeleteButton from './MessageDeleteButton';

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
  currentUserAvatar
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
      console.log('[MessageItem] Profile clicked, using sender data:', message.sender);
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

  // IMPORTANT: Always use the data provided in the message object
  const senderName = message.sender?.name || 'Unknown';
  const senderAvatar = message.sender?.avatar;

  const renderDeleteButton = () => {
    if (!isUserMessage || !canDelete || !onDeleteMessage) {
      return null;
    }

    return (
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <MessageDeleteButton onDelete={handleDeleteClick} />
      </div>
    );
  };

  // Use the proper alignment for messages with fixed layout
  return (
    <div className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-6 group relative`}>
      {/* Avatar appears only for non-user messages */}
      {!isUserMessage && (
        <UserAvatar
          name={senderName}
          image={senderAvatar}
          size="sm"
          className={`flex-shrink-0 mr-2 ${!isSupport ? 'cursor-pointer hover:opacity-80' : ''}`}
          onClick={!isSupport ? handleProfileClick : undefined}
        />
      )}

      <div className={`flex flex-col ${isUserMessage ? 'items-end' : 'items-start'} max-w-[75%]`}>
        {/* Sender name appears only for non-user messages */}
        {!isUserMessage && (
          <button
            className={`text-xs text-gray-500 mb-1 ${!isSupport ? 'cursor-pointer hover:text-primary' : ''} text-left w-full`}
            onClick={!isSupport ? handleProfileClick : undefined}
          >
            {senderName}
            {message.isSupport && <span className="ml-1 text-blue-500">(Support)</span>}
          </button>
        )}

        <MessageContent
          message={message}
          isUserMessage={isUserMessage}
          isSupport={isSupport}
        />

        <div className={`text-xs text-gray-500 mt-1 ${isUserMessage ? 'pr-1 text-right' : 'pl-1 text-left'} w-full`}>
          {formatTime(getTimestamp())}
        </div>
      </div>

      {/* User avatar for user's own messages */}
      {isUserMessage && (
        <div className="flex items-start ml-2">
          {renderDeleteButton()}
          <UserAvatar
            name="You"
            image={currentUserAvatar}
            size="sm"
            className="flex-shrink-0"
          />
        </div>
      )}
    </div>
  );
};

export default MessageItem;
