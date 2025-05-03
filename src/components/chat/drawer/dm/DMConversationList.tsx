
import React, { useEffect, useState } from 'react';
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
  unreadConversations = new Set()
}) => {
  const { currentUser } = useApp();
  const { conversations, loading, refreshConversations } = useDirectConversationsContext();
  const { forceRefresh } = useUnreadMessages();
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  const isEmpty = !loading && conversations.length === 0;
  
  // Debug logging to check the unread conversations
  console.log('[DMConversationList] unreadConversations:', Array.from(unreadConversations));
  
  // Add event listeners for dynamic updates
  useEffect(() => {
    const handleUnreadUpdated = () => {
      console.log('[DMConversationList] Detected unread state change');
      setUpdateTrigger(prev => prev + 1);
    };
    
    const handleDmReceived = (e: CustomEvent) => {
      console.log('[DMConversationList] Received new DM, refreshing conversations');
      if (e.detail?.conversationId) {
        refreshConversations();
        setUpdateTrigger(prev => prev + 1);
      }
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadUpdated);
    window.addEventListener('dmMessageReceived', handleDmReceived as EventListener);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadUpdated);
      window.removeEventListener('dmMessageReceived', handleDmReceived as EventListener);
    };
  }, [forceRefresh, refreshConversations]);
  
  // Make sure to refresh conversations when component mounts
  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);
  
  // Add updateTrigger to the component key to force full re-renders
  const componentKey = `dm-list-${updateTrigger}-${Array.from(unreadConversations).join(',')}`;
  console.log('[DMConversationList] Rendering with key:', componentKey);

  return (
    <div className="flex flex-col h-full bg-white" key={componentKey}>
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
                const itemKey = `conversation-${conversation.conversationId}-${isUnread ? 'unread' : 'read'}-${updateTrigger}`;
                
                console.log(`[DMConversationList] Rendering conversation ${conversation.conversationId} isUnread: ${isUnread} key: ${itemKey}`);
                
                return (
                  <ConversationItem
                    key={itemKey}
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

export default React.memo(DMConversationList);
