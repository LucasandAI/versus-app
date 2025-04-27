
import React from 'react';
import { ChatMessage } from '@/types/chat';
import UserAvatar from '@/components/shared/UserAvatar';
import MessageContent from './MessageContent';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { useMessageFormatting } from '@/hooks/chat/messages/useMessageFormatting';

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
    <div className="flex mb-4 group">
      <div className={`flex max-w-[80%] ${isUserMessage ? 'ml-auto flex-row-reverse' : ''}`}>
        {/* Avatar positioned to the left of the message box */}
        <UserAvatar 
          name={message.sender.name || (isUserMessage ? "You" : "Unknown")} 
          image={isUserMessage ? currentUserAvatar : message.sender.avatar} 
          size="sm" 
          className={`flex-shrink-0 mx-2 ${!isSupport && !isUserMessage ? 'cursor-pointer hover:opacity-80' : ''}`}
          onClick={!isSupport && !isUserMessage ? handleProfileClick : undefined}
        />
        
        <div className="flex flex-col">
          {/* Only show sender name for non-user messages */}
          {!isUserMessage && (
            <button 
              className={`text-xs text-gray-500 mb-1 ${!isSupport ? 'cursor-pointer hover:text-primary' : ''} text-left`}
              onClick={!isSupport ? handleProfileClick : undefined}
            >
              {message.sender.name || "Unknown"}
              {message.isSupport && <span className="ml-1 text-blue-500">(Support)</span>}
            </button>
          )}
          
          <div className="flex flex-col">
            <MessageContent 
              message={message}
              isUserMessage={isUserMessage}
              isSupport={isSupport}
              onDeleteMessage={canDelete && onDeleteMessage ? handleDeleteClick : undefined}
            />
            
            {/* Timestamp aligned below message and not overflowing to the right */}
            <div className={`text-xs text-gray-500 mt-1 ${isUserMessage ? 'text-right' : ''}`}>
              {formatTime(getTimestamp())}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
