
import React, { useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import ChatMessages from '../../ChatMessages';
import { useDMMessages } from '@/hooks/chat/dm/useDMMessages';
import { useDMSubscription } from '@/hooks/chat/dm/useDMSubscription';
import { useNavigation } from '@/hooks/useNavigation';
import { useConversations } from '@/hooks/chat/dm/useConversations';
import { useMessageFormatting } from '@/hooks/chat/messages/useMessageFormatting';
import { useConversationManagement } from '@/hooks/chat/dm/useConversationManagement';
import { useMessageHandling } from '@/hooks/chat/dm/useMessageHandling';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import DMMessageInput from './DMMessageInput';

interface DMConversationProps {
  userId: string;
  userName: string;
  userAvatar: string;
  conversationId: string;
}

const DMConversation: React.FC<DMConversationProps> = ({ 
  userId, 
  userName, 
  userAvatar,
  conversationId
}) => {
  const { currentUser } = useApp();
  const { navigateToUserProfile } = useNavigation();
  const { messages, setMessages, addMessage, isSending, setIsSending, deleteMessage } = useDMMessages(userId, userName, conversationId);
  const { conversations, fetchConversations } = useConversations([]);
  const { formatTime } = useMessageFormatting();
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const { markConversationAsRead } = useUnreadMessages();
  
  // Custom hooks
  const { createConversation } = useConversationManagement(currentUser?.id, userId);
  const { handleSendMessage, handleDeleteMessage } = useMessageHandling(
    currentUser?.id,
    userId,
    conversationId,
    setMessages,
    setIsSending,
    createConversation
  );
  
  // Use subscription hook
  useDMSubscription(conversationId, userId, currentUser?.id, setMessages, addMessage);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages.length]);
  
  // Mark conversation as read when opened and on new messages
  useEffect(() => {
    if (conversationId && conversationId !== 'new') {
      markConversationAsRead(conversationId);
    }
  }, [conversationId, markConversationAsRead, messages]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 min-h-0">
          <ChatMessages 
            messages={messages}
            clubMembers={currentUser ? [currentUser] : []}
            onDeleteMessage={deleteMessage}
            onSelectUser={(userId, userName, userAvatar) => 
              navigateToUserProfile(userId, userName, userAvatar)
            }
            currentUserAvatar={currentUser?.avatar}
            lastMessageRef={lastMessageRef}
            formatTime={formatTime}
          />
        </div>
        
        <DMMessageInput
          onSendMessage={handleSendMessage}
          isSending={isSending}
          userId={userId}
          conversationId={conversationId}
        />
      </div>
    </div>
  );
};

export default DMConversation;
