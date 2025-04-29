
import React, { useEffect, useRef, useState } from 'react';
import ConversationItem from './ConversationItem';
import { Skeleton } from '@/components/ui/skeleton';
import { DMConversation } from '@/hooks/chat/dm/types';
import { useApp } from '@/context/AppContext';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { useDirectConversations } from '@/hooks/chat/dm/useDirectConversations';

interface Props {
  onSelectUser: (userId: string, userName: string, userAvatar: string, conversationId: string) => void;
  selectedUserId?: string;
  onRefresh?: () => Promise<any>;
  isLoading?: boolean;
}

const DMConversationList: React.FC<Props> = ({ 
  onSelectUser, 
  selectedUserId,
  onRefresh,
  isLoading = false
}) => {
  const { currentUser } = useApp();
  const { conversations } = useDirectConversations([]); // Just access conversations, don't fetch
  const { unreadConversations } = useUnreadMessages();
  const previousConversationsRef = useRef<DMConversation[]>([]);
  const [localConversations, setLocalConversations] = useState<DMConversation[]>([]);

  // Update local state when conversations change
  useEffect(() => {
    if (conversations.length > 0) {
      // Filter out any self-conversations
      const filteredConversations = conversations.filter(c => c.userId !== currentUser?.id);
      previousConversationsRef.current = filteredConversations;
      setLocalConversations(filteredConversations);
    }
  }, [conversations, currentUser?.id]);

  const displayConversations = localConversations.length > 0 ? localConversations : previousConversationsRef.current;
  const isEmpty = !isLoading && displayConversations.length === 0;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex justify-between items-center p-4">
        <h1 className="text-4xl font-bold">Messages</h1>
      </div>
      
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-lg">No messages yet</p>
            <p className="text-sm mt-1">Search above to start a conversation</p>
          </div>
        ) : (
          <div className="divide-y">
            {displayConversations
              // Extra filter to ensure we never show conversations with yourself
              .filter(conversation => conversation.userId !== currentUser?.id)
              .map((conversation) => (
                <ConversationItem
                  key={conversation.conversationId}
                  conversation={conversation}
                  isSelected={selectedUserId === conversation.userId}
                  isUnread={unreadConversations.has(conversation.conversationId)}
                  onSelect={() => onSelectUser(
                    conversation.userId,
                    conversation.userName,
                    conversation.userAvatar,
                    conversation.conversationId
                  )}
                  isLoading={conversation.isLoading}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DMConversationList;
