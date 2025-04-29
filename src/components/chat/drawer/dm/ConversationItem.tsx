
import React from 'react';
import UserAvatar from '@/components/shared/UserAvatar';
import { formatDistanceToNow } from 'date-fns';

interface ConversationItemProps {
  userId: string;
  userName: string;
  userAvatar: string;
  conversationId: string;
  lastMessage?: string;
  timestamp?: string;
  isSelected?: boolean;
  isUnread?: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  userName,
  userAvatar,
  lastMessage,
  timestamp,
  isSelected,
  isUnread,
  onClick
}) => {
  const formattedTime = timestamp 
    ? formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    : '';
  
  return (
    <div 
      className={`
        p-3 cursor-pointer hover:bg-gray-50 flex items-center
        ${isSelected ? 'bg-gray-100' : ''}
        ${isUnread ? 'font-semibold' : ''}
      `}
      onClick={onClick}
    >
      <UserAvatar name={userName} image={userAvatar} size="md" />
      
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className={`text-sm ${isUnread ? 'font-semibold' : 'font-medium'}`}>{userName}</p>
          {timestamp && (
            <span className="text-xs text-gray-500">{formattedTime}</span>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          {lastMessage ? (
            <p className="text-sm text-gray-500 truncate">{lastMessage}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">No messages yet</p>
          )}
          
          {isUnread && (
            <div className="h-3 w-3 bg-red-500 rounded-full flex-shrink-0 ml-2" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
