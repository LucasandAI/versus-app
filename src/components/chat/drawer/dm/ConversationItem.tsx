
import React from 'react';
import { EyeOff } from 'lucide-react';
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
    ? formatDistanceToNow(new Date(conversation.timestamp), { addSuffix: false })
    : '';

  return (
    <div 
      className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50
        ${isSelected ? 'bg-gray-100' : ''}`}
      onClick={onSelect}
    >
      <UserAvatar
        name={conversation.userName}
        image={conversation.userAvatar}
        size="lg"
        className="flex-shrink-0"
      />
      
      <div className="ml-4 flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h2 className="text-xl font-semibold text-gray-900 truncate">
            {conversation.userName}
          </h2>
          <span className="text-sm text-gray-500 ml-2">
            {formattedTime}
          </span>
        </div>
        
        <p className="text-gray-600 truncate mt-1">
          {conversation.lastMessage}
        </p>
      </div>
      
      <button
        onClick={onHide}
        className="ml-2 p-2 rounded-full hover:bg-gray-200 transition-colors"
        aria-label={`Hide conversation with ${conversation.userName}`}
      >
        <EyeOff size={20} className="text-gray-400" />
      </button>
    </div>
  );
};

export default ConversationItem;
