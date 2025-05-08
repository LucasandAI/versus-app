import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import DMConversationList from './DMConversationList';
import DMConversation from './DMConversation';
import DMSearchPanel from './DMSearchPanel';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';
import { useMessageReadStatus } from '@/hooks/chat/useMessageReadStatus';
import { useApp } from '@/context/AppContext';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { toast } from '@/hooks/use-toast';

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
  unreadConversations: propUnreadConversations
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const { getOrCreateConversation } = useDirectConversationsContext();
  const { markConversationAsRead } = useUnreadMessages();
  const { currentUser } = useApp();

  // Create a handler for search results selection
  const handleSearchSelect = useCallback(async (userId: string, userName: string, userAvatar: string) => {
    console.log(`[DMContainer] User selected from search: ${userId}, ${userName}`);
    
    if (isCreatingConversation) {
      // Prevent duplicate creation attempts
      return;
    }
    
    try {
      setIsCreatingConversation(true);
      const conversation = await getOrCreateConversation(userId, userName, userAvatar);
      
      if (conversation) {
        setDirectMessageUser({
          userId,
          userName,
          userAvatar: userAvatar || '/placeholder.svg',
          conversationId: conversation.conversationId
        });
        setShowSearch(false);
      } else {
        throw new Error("Failed to create conversation");
      }
    } catch (error) {
      console.error('[DMContainer] Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingConversation(false);
    }
  }, [getOrCreateConversation, setDirectMessageUser, isCreatingConversation]);
  
  // Mark conversation as read when selected
  useEffect(() => {
    if (directMessageUser && directMessageUser.conversationId && directMessageUser.conversationId !== 'new' && currentUser?.id) {
      console.log(`[DMContainer] Marking conversation ${directMessageUser.conversationId} as read`);
      markConversationAsRead(directMessageUser.conversationId);
    }
  }, [directMessageUser?.conversationId, currentUser?.id, markConversationAsRead]);

  // Only create these components once and keep them in memory
  const conversationListComponent = useMemo(() => (
    <DMConversationList
      onSelectUser={(userId, userName, userAvatar, conversationId) => {
        setDirectMessageUser({
          userId,
          userName,
          userAvatar: userAvatar || '/placeholder.svg',
          conversationId: conversationId || 'new'
        });
      }}
      selectedUserId={directMessageUser?.userId}
      unreadConversations={propUnreadConversations}
    />
  ), [directMessageUser?.userId, propUnreadConversations, setDirectMessageUser]);
  
  const searchPanelComponent = useMemo(() => (
    <DMSearchPanel 
      onSelect={handleSearchSelect} 
      onBack={() => setShowSearch(false)} 
      isLoading={isCreatingConversation}
    />
  ), [handleSearchSelect, isCreatingConversation]);

  // The user has selected a DM conversation
  if (directMessageUser) {
    // Ensure all required properties are present
    const userData = {
      id: directMessageUser.userId,
      name: directMessageUser.userName,
      avatar: directMessageUser.userAvatar || '/placeholder.svg'
    };
    
    return (
      <DMConversation
        user={userData}
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
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        {conversationListComponent}
      </div>
      <div className="p-4 border-t">
        <button
          className="w-full py-2 px-4 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors"
          onClick={() => setShowSearch(true)}
        >
          New Message
        </button>
      </div>
    </div>
  );
});

DMContainer.displayName = 'DMContainer';

export default DMContainer;
