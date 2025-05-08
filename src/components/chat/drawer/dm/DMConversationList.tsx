
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useFormatRelativeTime } from '@/hooks/useFormatRelativeTime';

interface Conversation {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  lastMessage?: string;
  timestamp?: string;
  unread: boolean;
}

interface DMConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
}

const DMConversationList: React.FC<DMConversationListProps> = ({
  conversations,
  onSelectConversation,
  selectedConversationId
}) => {
  const { formatRelativeTime } = useFormatRelativeTime();

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onSelectConversation(conversation)}
          className={`
            flex items-center p-3 cursor-pointer transition-colors
            ${selectedConversationId === conversation.id ? 'bg-gray-100' : 'hover:bg-gray-50'}
            ${conversation.unread ? 'font-medium' : ''}
          `}
        >
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={conversation.user.avatar || '/placeholder.svg'} alt={conversation.user.name} />
            <AvatarFallback>
              {conversation.user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium truncate">{conversation.user.name}</p>
              {conversation.unread && (
                <Badge variant="default" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  •
                </Badge>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500 truncate">
                {conversation.lastMessage || 'No messages yet'}
              </p>
              {conversation.timestamp && (
                <p className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                  {formatRelativeTime(conversation.timestamp)}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DMConversationList;
