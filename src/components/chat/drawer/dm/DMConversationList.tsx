
import React from 'react';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
import ConversationItem from './ConversationItem';
import { useConversations } from '@/hooks/chat/dm/useConversations';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  onSelectUser: (userId: string, userName: string, userAvatar: string, conversationId: string) => void;
  selectedUserId?: string;
  loading?: boolean;
}

const DMConversationList: React.FC<Props> = ({ onSelectUser, selectedUserId, loading = false }) => {
  const { hideConversation, hiddenDMs } = useHiddenDMs();
  const { conversations } = useConversations(hiddenDMs);
  
  const handleHideConversation = (
    e: React.MouseEvent,
    userId: string
  ) => {
    e.stopPropagation();
    console.log('[DMConversationList] Hiding conversation for userId:', userId);
    hideConversation(userId);
  };

  // Show loading skeletons when loading
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white">
        <h1 className="text-4xl font-bold p-4">Messages</h1>
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <h1 className="text-4xl font-bold p-4">Messages</h1>
      
      <div className="flex-1 overflow-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-lg">No messages yet</p>
            <p className="text-sm mt-1">Search below to start a conversation</p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.conversationId}
                conversation={conversation}
                isSelected={selectedUserId === conversation.userId}
                onSelect={() => onSelectUser(
                  conversation.userId,
                  conversation.userName,
                  conversation.userAvatar,
                  conversation.conversationId
                )}
                onHide={(e) => handleHideConversation(e, conversation.userId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DMConversationList;
