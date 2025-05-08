
import React, { useMemo, useState, useEffect } from 'react';
import ConversationItem from './ConversationItem';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/context/AppContext';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';
import SearchBar from './SearchBar';
import { ChevronRight, MessageSquarePlus } from 'lucide-react';

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
  const { conversations, loading, fetchConversations } = useDirectConversationsContext();
  const { unreadConversations: contextUnreadConversations } = useUnreadMessages();
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use prop unreadConversations if provided, otherwise use context
  const unreadConversations = propUnreadConversations || contextUnreadConversations || new Set();
  
  // Ensure conversations are loaded when component mounts
  useEffect(() => {
    if (!isInitialized && currentUser?.id) {
      console.log('[DMConversationList] Initializing and fetching conversations');
      fetchConversations().then(() => {
        setIsInitialized(true);
      });
    }
  }, [currentUser?.id, fetchConversations, isInitialized]);
  
  // Filter out conversations with the current user
  const filteredConversations = useMemo(() => 
    conversations.filter(conversation => 
      conversation.userId !== currentUser?.id &&
      (searchQuery 
        ? conversation.userName.toLowerCase().includes(searchQuery.toLowerCase())
        : true)
    ),
    [conversations, currentUser?.id, searchQuery]
  );
  
  const isEmpty = !loading && filteredConversations.length === 0;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4">
        <h1 className="text-4xl font-bold mb-4">Messages</h1>
        <SearchBar 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
        />
      </div>
      
      <div className="flex-1 overflow-auto">
        {loading && !isInitialized ? (
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
            {searchQuery ? (
              <p className="text-lg">No results for "{searchQuery}"</p>
            ) : (
              <>
                <p className="text-lg">No messages yet</p>
                <p className="text-sm mt-1">Start a new conversation using the button below</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => {
              const isUnread = unreadConversations.has(conversation.conversationId);
              
              // Create a stable key that doesn't include unread status
              const stableKey = `conv-${conversation.conversationId}`;
              
              return (
                <ConversationItem
                  key={stableKey}
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
                    conversation.userAvatar || '/placeholder.svg',
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
