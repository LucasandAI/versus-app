
import React from 'react';
import { DMConversation } from '@/hooks/chat/dm/useConversations';
import UserAvatar from '@/components/shared/UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface ConversationItemProps {
  conversation: DMConversation;
  isSelected: boolean;
  onSelect: () => void;
  isLoading?: boolean;
  isUnread?: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onSelect,
  isLoading = false,
  isUnread = false
}) => {
  const isMobile = useIsMobile();

  const formattedTime = conversation.timestamp 
    ? formatDistanceToNow(new Date(conversation.timestamp), { addSuffix: false })
    : '';

  // Truncate message to a shorter length on mobile
  const characterLimit = isMobile ? 25 : 50;
  const truncatedMessage = conversation.lastMessage
    ? conversation.lastMessage.length > characterLimit
      ? `${conversation.lastMessage.substring(0, characterLimit)}...`
      : conversation.lastMessage
    : '';

  return (
    <div 
      className={`flex items-start px-4 py-3 cursor-pointer hover:bg-gray-50 relative group
        ${isSelected ? 'bg-primary/10 text-primary' : ''}
        ${isUnread ? 'font-medium' : ''}`}
      onClick={onSelect}
    >
      <UserAvatar
        name={conversation.userName}
        image={conversation.userAvatar}
        size="lg"
        className="flex-shrink-0 mr-3"
      />
      
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          {isLoading ? (
            <Skeleton className="h-5 w-24" />
          ) : (
            <h2 className={`text-lg truncate max-w-[60%] ${isUnread ? 'font-bold' : 'font-medium'}`}>
              {conversation.userName}
              {isUnread && (
                <span className="ml-2 inline-flex h-2 w-2 bg-red-500 rounded-full" />
              )}
            </h2>
          )}
          {formattedTime && !isLoading ? (
            <span className="text-xs text-gray-500 flex-shrink-0 ml-auto">
              {formattedTime}
            </span>
          ) : isLoading ? (
            <Skeleton className="h-3 w-12 ml-auto" />
          ) : null}
        </div>
        
        <div className="flex items-center">
          {isLoading ? (
            <Skeleton className="h-4 w-full flex-1" />
          ) : (
            <p className={`text-sm truncate flex-1 ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
              {truncatedMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
