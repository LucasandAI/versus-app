
import React, { useState, useCallback, useEffect } from 'react';
import DMConversationList from './DMConversationList';
import DMConversation from './DMConversation';
import { useApp } from '@/context/AppContext';
import { useUnreadMessages } from '@/context/unread-messages';
import { DirectMessage } from '@/context/ChatContext';

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
  directMessages?: Record<string, DirectMessage[]>;
  onSendDirectMessage?: (message: string, conversationId: string, receiverId: string) => Promise<void>;
  onDeleteMessage?: (messageId: string, type: 'club' | 'direct', contextId: string) => void;
  onSelectUser?: (userId: string, userName: string, userAvatar?: string) => void;
}

interface ConversationUser {
  id: string;
  name: string;
  avatar: string;
}

interface DMConversationItem {
  id: string;
  user: ConversationUser;
  lastMessage?: string;
  timestamp?: string;
  unread: boolean;
}

const DMContainer: React.FC<DMContainerProps> = ({
  directMessageUser,
  setDirectMessageUser,
  unreadConversations,
  directMessages = {},
  onSendDirectMessage = async () => {},
  onDeleteMessage,
  onSelectUser
}) => {
  const { currentUser } = useApp();
  const { markConversationAsRead } = useUnreadMessages();
  const [conversations, setConversations] = useState<DMConversationItem[]>([]);
  
  // Format conversations for the list
  useEffect(() => {
    // Convert DirectConversationsContext data to the format expected by DMConversationList
    const formattedConversations: DMConversationItem[] = Object.keys(directMessages).map(conversationId => {
      const messages = directMessages[conversationId] || [];
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      
      // Get the other user's info from the messages
      const otherUserMessage = messages.find(msg => msg.sender.id !== currentUser?.id);
      const user: ConversationUser = otherUserMessage ? {
        id: otherUserMessage.sender.id,
        name: otherUserMessage.sender.name,
        avatar: otherUserMessage.sender.avatar || '/placeholder.svg'
      } : {
        id: 'unknown',
        name: 'Unknown User',
        avatar: '/placeholder.svg'
      };
      
      return {
        id: conversationId,
        user,
        lastMessage: lastMessage?.text,
        timestamp: lastMessage?.timestamp,
        unread: unreadConversations.has(conversationId)
      };
    });
    
    setConversations(formattedConversations);
  }, [directMessages, currentUser?.id, unreadConversations]);
  
  // Handle back button click
  const handleBack = useCallback(() => {
    setDirectMessageUser(null);
  }, [setDirectMessageUser]);
  
  // Handle selecting a conversation
  const handleSelectConversation = useCallback((conversation: {
    id: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  }) => {
    setDirectMessageUser({
      userId: conversation.user.id,
      userName: conversation.user.name,
      userAvatar: conversation.user.avatar || '/placeholder.svg',
      conversationId: conversation.id
    });
    
    // Mark conversation as read when selected
    if (conversation.id !== 'new') {
      markConversationAsRead(conversation.id);
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
          loading={false}
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
        messages={directMessages[directMessageUser.conversationId] || []}
        onBack={handleBack}
        onSendMessage={(message) => onSendDirectMessage(message, directMessageUser.conversationId, directMessageUser.userId)}
        onDeleteMessage={onDeleteMessage ? 
          (messageId) => onDeleteMessage(messageId, 'direct', directMessageUser.conversationId) : 
          undefined}
        onSelectUser={onSelectUser}
      />
    </div>
  );
};

export default DMContainer;
