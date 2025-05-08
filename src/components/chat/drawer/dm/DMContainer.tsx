import React, { useState, useEffect, memo, useMemo } from 'react';
import DMConversationList from './DMConversationList';
import DMConversation from './DMConversation';
import DMSearchPanel from './DMSearchPanel';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';
import { useMessageReadStatus } from '@/hooks/chat/useMessageReadStatus';
import { useApp } from '@/context/AppContext';

interface DMContainerProps {
  directMessageUser: {
    userId: string;
    userName: string;
    userAvatar: string;
    conversationId: string;
  } | null;
  setDirectMessageUser: React.Dispatch<React.SetStateAction<{
    userId: string;
    userName: string;
    userAvatar: string;
    conversationId: string;
  } | null>>;
  unreadConversations?: Set<string>;
}

// Memo the component to prevent unnecessary re-renders
const DMContainer: React.FC<DMContainerProps> = memo(({ 
  directMessageUser, 
  setDirectMessageUser,
  unreadConversations = new Set<string>()
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const { getOrCreateConversation } = useDirectConversationsContext();
  const { markDirectMessagesAsRead } = useMessageReadStatus();
  const { currentUser } = useApp();

  // Create a handler for search results selection - memoized to keep reference stable
  const handleSearchSelect = useMemo(() => async (userId: string, userName: string, userAvatar: string) => {
    console.log(`[DMContainer] User selected from search: ${userId}, ${userName}`);
    const conversation = await getOrCreateConversation(userId, userName, userAvatar);
    if (conversation) {
      setDirectMessageUser({
        userId,
        userName,
        userAvatar: userAvatar || '/placeholder.svg',
        conversationId: conversation.conversationId
      });
      setShowSearch(false);
    }
  }, [getOrCreateConversation, setDirectMessageUser]);
  
  // Mark conversation as read when selected
  useEffect(() => {
    if (directMessageUser && currentUser?.id) {
      console.log(`[DMContainer] Marking conversation ${directMessageUser.conversationId} as read`);
      markDirectMessagesAsRead(directMessageUser.conversationId, currentUser.id);
    }
  }, [directMessageUser?.conversationId, currentUser?.id, markDirectMessagesAsRead]);

  // Only create these components once and keep them in memory
  const conversationListComponent = useMemo(() => (
    <DMConversationList
      onSelectUser={(userId, userName, userAvatar, conversationId) => {
        setDirectMessageUser({
          userId,
          userName,
          userAvatar,
          conversationId
        });
      }}
      selectedUserId={directMessageUser?.userId}
      unreadConversations={unreadConversations}
    />
  ), [directMessageUser?.userId, unreadConversations, setDirectMessageUser]);
  
  const searchPanelComponent = useMemo(() => (
    <DMSearchPanel 
      onSelect={handleSearchSelect} 
      onBack={() => setShowSearch(false)} 
    />
  ), [handleSearchSelect]);

  // The user has selected a DM conversation
  if (directMessageUser) {
    return (
      <DMConversation
        user={{
          id: directMessageUser.userId,
          name: directMessageUser.userName,
          avatar: directMessageUser.userAvatar
        }}
        conversationId={directMessageUser.conversationId}
        onBack={() => setDirectMessageUser(null)}
      />
    );
  }

  // The user wants to search for someone
  if (showSearch) {
    return searchPanelComponent;
  }

  // Show the conversation list (default view)
  return conversationListComponent;
});

DMContainer.displayName = 'DMContainer';

export default DMContainer;
