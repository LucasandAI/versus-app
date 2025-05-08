
import React, { useEffect, useMemo } from 'react';
import ConversationItem from './ConversationItem';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/context/AppContext';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';

interface Props {
  onSelectUser: (userId: string, userName: string, userAvatar: string, conversationId: string) => void;
  selectedUserId?: string;
  unreadConversations?: Set<string>;
}

const DMConversationList: React.FC<Props> = ({ 
  onSelectUser, 
  selectedUserId,
  unreadConversations: propUnreadConversations
}) => {
  const { currentUser } = useApp();
  const { conversations, loading, refreshConversations } = useDirectConversationsContext();
  const { unreadConversations: contextUnreadConversations } = useUnreadMessages();
  
  // Merge unread conversations from props and context
  const unreadConversations = useMemo(() => {
    if (propUnreadConversations && propUnreadConversations.size > 0) {
      return propUnreadConversations;
    }
    return contextUnreadConversations;
  }, [propUnreadConversations, contextUnreadConversations]);
  
  const isEmpty = !loading && conversations.length === 0;
  
  // Listen for new messages to update conversation list
  useEffect(() => {
    const handleDMReceived = (e: CustomEvent) => {
      if (e.detail && e.detail.conversationId) {
        // Refresh conversations when a new message is received
        refreshConversations();
      }
    };
    
    window.addEventListener('dmMessageReceived', handleDMReceived as EventListener);
    
    return () => {
      window.removeEventListener('dmMessageReceived', handleDMReceived as EventListener);
    };
  }, [refreshConversations]);

  return (
    <div className="flex flex-col h-full bg-white">
      <h1 className="text-4xl font-bold p-4">Messages</h1>
      
      <div className="flex-1 overflow-auto">
        {loading ? (
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
            {conversations
              .filter(conversation => conversation.userId !== currentUser?.id)
              .map((conversation) => {
                const isUnread = unreadConversations.has(conversation.conversationId);
                
                return (
                  <ConversationItem
                    key={conversation.conversationId}
                    conversation={{
                      ...conversation,
                      lastMessage: conversation.lastMessage || '',
                      timestamp: conversation.timestamp || ''
                    }}
                    isSelected={selectedUserId === conversation.userId}
                    isUnread={isUnread}
                    onSelect={() => onSelectUser(
                      conversation.userId,
                      conversation.userName,
                      conversation.userAvatar,
                      conversation.conversationId
                    )}
                    isLoading={false}
                  />
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DMConversationList;
