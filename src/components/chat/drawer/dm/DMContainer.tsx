
import React, { useState, useEffect } from 'react';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';
import DMConversationList from './DMConversationList';
import DMConversation from './DMConversation';
import ChatEmpty from '../../ChatEmpty';

interface Conversation {
  conversationId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage?: string;
  timestamp?: string;
}

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
  const { conversations, loading } = useDirectConversationsContext();
  const [formattedConversations, setFormattedConversations] = useState<any[]>([]);

  // Format conversations for the list - fix the interface mismatch
  useEffect(() => {
    if (!conversations) return;
    
    const formatted = conversations.map((conv: Conversation) => ({
      id: conv.conversationId,
      user: {
        id: conv.userId,
        name: conv.userName,
        avatar: conv.userAvatar
      },
      lastMessage: conv.lastMessage,
      timestamp: conv.timestamp,
      unread: unreadConversations.has(conv.conversationId)
    }));
    
    setFormattedConversations(formatted);
  }, [conversations, unreadConversations]);

  const handleSelectConversation = (conversation: any) => {
    setDirectMessageUser({
      userId: conversation.user.id,
      userName: conversation.user.name,
      userAvatar: conversation.user.avatar || '/placeholder.svg',
      conversationId: conversation.id
    });
  };

  const handleBack = () => {
    setDirectMessageUser(null);
  };

  // Mock function for sending messages - this will be implemented properly
  const sendMessage = async (text: string) => {
    console.log("Sending message:", text);
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <p>Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {!directMessageUser ? (
        <div className="w-full">
          <DMConversationList
            conversations={formattedConversations}
            onSelectConversation={handleSelectConversation}
          />
        </div>
      ) : (
        <div className="w-full">
          <DMConversation 
            user={{
              id: directMessageUser.userId,
              name: directMessageUser.userName,
              avatar: directMessageUser.userAvatar
            }}
            conversationId={directMessageUser.conversationId}
            onBack={handleBack}
            onSendMessage={sendMessage}
          />
        </div>
      )}
    </div>
  );
};

export default DMContainer;
