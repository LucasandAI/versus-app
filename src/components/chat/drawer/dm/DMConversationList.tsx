
import React, { useEffect, useRef } from 'react';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
import ConversationItem from './ConversationItem';
import { useConversations } from '@/hooks/chat/dm/useConversations';
import { Skeleton } from '@/components/ui/skeleton';
import { DMConversation } from '@/hooks/chat/dm/types';
import { useApp } from '@/context/AppContext';

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
  const { hideConversation, hiddenDMs } = useHiddenDMs();
  const { currentUser } = useApp();
  const { conversations, loading, fetchConversations } = useConversations(hiddenDMs);
  const hasFetchedRef = useRef(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Only fetch once when user ID becomes available
  useEffect(() => {
    if (currentUser?.id && !hasFetchedRef.current) {
      console.log("[DMConversationList] Current user ID available:", currentUser.id);
      hasFetchedRef.current = true;
      
      // Clear any existing timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      // Small delay to ensure auth is fully ready
      fetchTimeoutRef.current = setTimeout(() => {
        console.log("[DMConversationList] Triggering fetchConversations after delay");
        fetchConversations();
      }, 300); // Increased delay
    } else if (!currentUser?.id) {
      console.log("[DMConversationList] Waiting for current user ID");
      hasFetchedRef.current = false;
    }
  }, [currentUser?.id, fetchConversations]);
  
  // Determine which conversations to display
  // Use fully loaded conversations if available, otherwise use initial basic conversations
  const displayConversations = conversations.length > 0 ? conversations : initialConversations;
  const showLoading = (isInitialLoading || loading) && displayConversations.length === 0;
  const isEmpty = !showLoading && displayConversations.length === 0;
  
  const handleHideConversation = (
    e: React.MouseEvent,
    userId: string
  ) => {
    e.stopPropagation();
    console.log('[DMConversationList] Hiding conversation for userId:', userId);
    hideConversation(userId);
  };

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
            {displayConversations.map((conversation) => (
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
