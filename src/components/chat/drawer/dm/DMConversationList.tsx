
import React, { useEffect, useRef, useState } from 'react';
import ConversationItem from './ConversationItem';
import { useConversations } from '@/hooks/chat/dm/useConversations';
import { Skeleton } from '@/components/ui/skeleton';
import { DMConversation } from '@/hooks/chat/dm/types';
import { useApp } from '@/context/AppContext';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';

interface Props {
  onSelectUser: (userId: string, userName: string, userAvatar: string, conversationId: string) => void;
  selectedUserId?: string;
  initialConversations?: DMConversation[];
  isInitialLoading?: boolean;
}

const DMConversationList: React.FC<Props> = ({ 
  onSelectUser, 
  selectedUserId,
  initialConversations = [],
  isInitialLoading = false
}) => {
  const { currentUser, isSessionReady } = useApp();
  const { conversations, loading } = useConversations([]);
  const { unreadConversations } = useUnreadMessages();
  const previousConversationsRef = useRef<DMConversation[]>([]);
  const [localConversations, setLocalConversations] = useState<DMConversation[]>([]);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when conversations change
  useEffect(() => {
    if (conversations.length > 0) {
      // Filter out any self-conversations
      const filteredConversations = conversations.filter(c => c.userId !== currentUser?.id);
      previousConversationsRef.current = filteredConversations;
      setLocalConversations(filteredConversations);
    }
  }, [conversations, currentUser?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  const displayConversations = loading ? previousConversationsRef.current : localConversations;
  
  // First, try to use initial conversations if provided and not empty
  const finalConversations = initialConversations.length > 0 
    ? initialConversations 
    : displayConversations;
    
  const showLoading = isInitialLoading && finalConversations.length === 0;
  const isEmpty = !showLoading && finalConversations.length === 0;

  return (
    <div className="flex flex-col h-full bg-white">
      <h1 className="text-4xl font-bold p-4">Messages</h1>
      
      <div className="flex-1 overflow-auto">
        {showLoading ? (
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
            {finalConversations
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
