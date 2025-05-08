import React, { useState, useEffect } from 'react';
import ChatHeader from '../ChatHeader';
import ChatMessages from '../ChatMessages';
import ChatInput from '../ChatInput';
import { useChatActions } from '@/hooks/chat/useChatActions';
import { useDirectMessages } from '@/hooks/chat/dm/useDirectMessages';

interface DirectChatContentProps {
  conversationId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string, conversationId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  globalMessages?: Record<string, any[]>;
}

const DirectChatContent = ({
  conversationId,
  userId,
  userName,
  userAvatar,
  onSelectUser,
  onSendMessage,
  onDeleteMessage,
  globalMessages = {}
}: DirectChatContentProps) => {
  const [isSending, setIsSending] = useState(false);
  const { deleteMessage } = useChatActions();

  // Use our hook to get messages with pagination
  const { messages, hasMore, isLoadingMore, loadMoreMessages } = useDirectMessages(
    conversationId,
    globalMessages
  );

  useEffect(() => {
    console.log('[DirectChatContent] Conversation changed, resetting state for:', conversationId);
    setIsSending(false);
  }, [conversationId]);

  const handleDeleteMessage = async (messageId: string) => {
    console.log('[DirectChatContent] Deleting message:', messageId);
    
    if (onDeleteMessage) {
      await onDeleteMessage(messageId);
    }
  };

  const handleSendMessage = async (message: string) => {
    console.log('[DirectChatContent] Sending message for conversation:', conversationId);
    setIsSending(true);
    try {
      const messageToSend = message.trim();
      if (conversationId) {
        await onSendMessage(messageToSend, conversationId);
      }
    } catch (error) {
      console.error('[DirectChatContent] Error sending direct message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        userName={userName}
        userAvatar={userAvatar}
        onSelectUser={() => onSelectUser(userId, userName, userAvatar)}
      />
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 min-h-0">
          <ChatMessages
            messages={messages}
            clubMembers={[]}
            onDeleteMessage={handleDeleteMessage}
            onSelectUser={onSelectUser}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMoreMessages}
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-white">
          <ChatInput
            onSendMessage={handleSendMessage}
            conversationType="direct"
            conversationId={conversationId}
            isSending={isSending}
          />
        </div>
      </div>
    </div>
  );
};

export default DirectChatContent; 