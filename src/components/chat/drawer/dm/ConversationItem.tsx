
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { DMConversation } from '@/hooks/chat/dm/useConversations';
import UserAvatar from '@/components/shared/UserAvatar';
import { formatDistanceToNow } from 'date-fns';

interface ConversationItemProps {
  conversation: DMConversation;
  isSelected: boolean;
  onSelect: () => void;
  onHide: (e: React.MouseEvent) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onSelect,
  onHide
}) => {
  const formattedTime = conversation.timestamp 
    ? formatDistanceToNow(new Date(conversation.timestamp), { addSuffix: true })
    : '';

  return (
    <div 
      className={`flex items-center p-3 rounded-md transition-colors cursor-pointer
        ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
      onClick={onSelect}
    >
      <UserAvatar
        name={conversation.userName}
        image={conversation.userAvatar}
        size="md"
      />
      
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-900 truncate">
            {conversation.userName}
          </span>
          <span className="text-xs text-gray-500">
            {formattedTime}
          </span>
        </div>
        
        <p className="text-sm text-gray-500 truncate">
          {conversation.lastMessage}
        </p>
      </div>
      
      <button
        onClick={onHide}
        className="ml-2 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
        aria-label={`Hide conversation with ${conversation.userName}`}
      >
        <EyeOff size={16} className="text-gray-500" />
      </button>
    </div>
  );
};

export default ConversationItem;
