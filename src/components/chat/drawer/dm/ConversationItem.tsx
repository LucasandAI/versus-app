
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/shared/UserAvatar';

interface ConversationProps {
  conversation: {
    conversationId: string;
    userId: string;
    userName: string;
    userAvatar: string;
    lastMessage: string;
    timestamp: string;
  };
  isSelected: boolean;
  isUnread: boolean;
  onSelect: () => void;
  isLoading: boolean;
}

const ConversationItem: React.FC<ConversationProps> = ({ 
  conversation, 
  isSelected, 
  isUnread,
  onSelect,
  isLoading
}) => {
  const formattedTime = conversation.timestamp 
    ? formatDistanceToNow(new Date(conversation.timestamp), { addSuffix: true }) 
    : '';

  const unreadClass = isUnread 
    ? 'font-bold' 
    : 'font-normal text-gray-900';

  return (
    <div 
      className={`p-3 cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-2 ${
        isSelected ? 'bg-gray-100' : ''
      }`}
      onClick={onSelect}
    >
      <div className="relative">
        <UserAvatar 
          name={conversation.userName}
          image={conversation.userAvatar}
          size="md"
        />
        {isUnread && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-2.5 w-2.5 p-0 rounded-full"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className={`${unreadClass} truncate`}>{conversation.userName}</h3>
          {formattedTime && <span className="text-xs text-gray-500 whitespace-nowrap">{formattedTime}</span>}
        </div>
        {conversation.lastMessage && (
          <p className="text-sm text-gray-500 truncate">
            {conversation.lastMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default ConversationItem;
