
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
  isSupport = false,
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
  // Never fall back to defaults for name - this ensures consistent display
  const senderName = message.sender?.name || 'Unknown';
  
  // Only use the avatar that was provided, no placeholder
  const senderAvatar = message.sender?.avatar;

  const renderDeleteButton = () => {
    if (!isUserMessage || !canDelete || !onDeleteMessage) {
      return (
        <div className="w-8 h-8 opacity-0" aria-hidden="true">
          {/* Placeholder to maintain layout */}
        </div>
      );
    }

    return (
      <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <MessageDeleteButton onDelete={handleDeleteClick} />
      </div>
    );
  };

  // Use the proper alignment for messages
  return (
    <div className={`flex ${isUserMessage ? 'justify-end mr-4' : 'justify-start ml-4'} mb-6 group`}>
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

      {/* Delete button for user's own messages */}
      {isUserMessage && renderDeleteButton()}
    </div>
  );
};

export default MessageItem;
