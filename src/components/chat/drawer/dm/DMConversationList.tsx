
import React, { useEffect } from 'react';
import ConversationItem from './ConversationItem';
import { useDirectConversationsContext } from '@/context/direct-conversations';
import { useApp } from '@/context/AppContext';

interface DMConversationListProps {
  onSelectUser: (userId: string, userName: string, userAvatar: string, conversationId: string) => void;
  selectedUserId?: string;
  unreadConversations?: Set<string>;
}

const DMConversationList: React.FC<DMConversationListProps> = ({ 
  onSelectUser, 
  selectedUserId,
  unreadConversations = new Set() 
}) => {
  const { conversations, loading, fetchConversations } = useDirectConversationsContext();
  const { currentUser, isSessionReady } = useApp();
  
  useEffect(() => {
    if (isSessionReady && currentUser?.id) {
      fetchConversations();
    }
  }, [isSessionReady, currentUser?.id, fetchConversations]);
  
  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Loading conversations...</p>
      </div>
    );
  }
  
  if (!conversations || conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No conversations yet</p>
        <p className="text-sm">Search for users to start chatting</p>
      </div>
    );
  }
  
  return (
    <div className="divide-y overflow-y-auto max-h-full">
      {conversations.map((conversation) => {
        const isSelected = conversation.userId === selectedUserId;
        const isUnread = unreadConversations.has(conversation.conversationId);
        
        return (
          <ConversationItem
            key={conversation.conversationId}
            userId={conversation.userId}
            userName={conversation.userName}
            userAvatar={conversation.userAvatar}
            conversationId={conversation.conversationId}
            lastMessage={conversation.lastMessage}
            timestamp={conversation.timestamp}
            isSelected={isSelected}
            isUnread={isUnread}
            onClick={() => onSelectUser(
              conversation.userId,
              conversation.userName,
              conversation.userAvatar,
              conversation.conversationId
            )}
          />
        );
      })}
    </div>
  );
};

export default DMConversationList;
