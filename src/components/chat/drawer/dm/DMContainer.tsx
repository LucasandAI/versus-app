import React, { useState, useCallback, useEffect } from 'react';
import DMConversationList from './DMConversationList';
import DMConversation from './DMConversation';
import { useApp } from '@/context/AppContext';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';

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
  unreadConversations: Set<string>;
}

const DMContainer: React.FC<DMContainerProps> = ({
  directMessageUser,
  setDirectMessageUser,
  unreadConversations
}) => {
  const { currentUser } = useApp();
  const { conversations, loading, hasLoaded, fetchConversations } = useDirectConversationsContext();
  const { markConversationAsRead } = useUnreadMessages();
  
  // Fetch conversations when component mounts if they haven't been loaded
  useEffect(() => {
    if (!hasLoaded && !loading) {
      fetchConversations();
    }
  }, [hasLoaded, loading, fetchConversations]);
  
  // Handle back button click
  const handleBack = useCallback(() => {
    setDirectMessageUser(null);
  }, [setDirectMessageUser]);
  
  // Handle selecting a conversation
  const handleSelectConversation = useCallback((conversation: {
    conversationId: string;
    userId: string;
    userName: string;
    userAvatar: string;
  }) => {
    setDirectMessageUser({
      userId: conversation.userId,
      userName: conversation.userName,
      userAvatar: conversation.userAvatar,
      conversationId: conversation.conversationId
    });
    
    // Mark conversation as read when selected
    if (conversation.conversationId !== 'new') {
      markConversationAsRead(conversation.conversationId);
    }
  }, [setDirectMessageUser, markConversationAsRead]);
  
  // If no conversation is selected, show the conversation list
  if (!directMessageUser) {
    return (
      <div className="h-full">
        <DMConversationList 
          conversations={conversations}
          onSelectConversation={handleSelectConversation}
          unreadConversations={unreadConversations}
          loading={loading}
        />
      </div>
    );
  }

  // If a conversation is selected, show it
  return (
    <div className="h-full">
      <DMConversation 
        user={{
          id: directMessageUser.userId,
          name: directMessageUser.userName,
          avatar: directMessageUser.userAvatar
        }}
        conversationId={directMessageUser.conversationId}
        onBack={handleBack}
      />
    </div>
  );
};

export default DMContainer;
