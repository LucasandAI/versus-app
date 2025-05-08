
import React, { useState, useEffect } from 'react';
import UserAvatar from '@/components/shared/UserAvatar';
import MessageContent from './MessageContent';
import { supabase } from '@/integrations/supabase/client';
import { useNavigation } from '@/hooks/useNavigation';
import MessageDeleteButton from './MessageDeleteButton';
import { ClubMessage, DirectMessage } from '@/context/ChatContext';
import { Loader2 } from 'lucide-react';

interface MessageItemProps {
  message: ClubMessage | DirectMessage;
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
  
  // Debug log to see complete sender data
  console.log(`[MessageItem] Rendering message with id ${message.id}, status: ${message.status || 'none'}`);
  
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
    if (!isSupport && message.sender && onSelectUser) {
      onSelectUser(message.sender.id, message.sender.name, message.sender.avatar);
    }
  };

  const getTimestamp = () => {
    if (!message.timestamp) {
      return new Date().toISOString();
    }
    return message.timestamp;
  };

  const senderName = message.sender?.name || 'Unknown';
  const senderAvatar = message.sender?.avatar;

  const renderDeleteButton = () => {
    if (!isUserMessage || !canDelete || !onDeleteMessage) {
      return <div className="w-8 h-8 opacity-0" aria-hidden="true" />;
    }

    return (
      <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <MessageDeleteButton onDelete={handleDeleteClick} />
      </div>
    );
  };

  // Show sending status for optimistic messages
  const renderStatus = () => {
    if (message.status === 'sending') {
      return <Loader2 className="h-3 w-3 ml-1 animate-spin text-gray-400" />;
    } else if (message.status === 'error') {
      return <span className="text-xs text-red-500 ml-1">Failed</span>;
    }
    return null;
  };

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
            {message.isSupport && <span className="ml-1 text-blue-500">(Support)</span>}
          </button>
        )}

        <div className="flex items-center">
          <MessageContent
            message={message}
            isUserMessage={isUserMessage}
            isSupport={isSupport}
          />
          {renderStatus()}
        </div>

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
