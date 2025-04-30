
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
import DMHeader from './DMHeader';
import { ArrowLeft } from 'lucide-react';

interface DMConversationProps {
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  conversationId: string;
  onBack: () => void;
}

const DMConversation: React.FC<DMConversationProps> = ({ 
  user, 
  conversationId,
  onBack
}) => {
  const { currentUser } = useApp();
  const { navigateToUserProfile } = useNavigation();
  const { messages, setMessages, addMessage, isSending, setIsSending, deleteMessage } = useDMMessages(user.id, user.name, conversationId);
  const { conversations, fetchConversations } = useConversations([]);
  const { formatTime } = useMessageFormatting();
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const { markConversationAsRead } = useUnreadMessages();
  
  // Custom hooks
  const { createConversation } = useConversationManagement(currentUser?.id, user.id);
  const { handleSendMessage, handleDeleteMessage } = useMessageHandling(
    currentUser?.id,
    user.id,
    conversationId,
    setMessages,
    setIsSending,
    createConversation
  );
  
  // Use subscription hook
  useDMSubscription(conversationId, user.id, currentUser?.id, setMessages, addMessage);

  // Scroll to bottom on new messages
  React.useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages.length]);
  
  // Mark conversation as read when opened
  useEffect(() => {
    if (conversationId && conversationId !== 'new') {
      markConversationAsRead(conversationId);
    }
  }, [conversationId, markConversationAsRead]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header with back button and centered user info */}
      <div className="border-b p-3 flex items-center">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 flex justify-center">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80" 
            onClick={() => navigateToUserProfile(user.id, user.name, user.avatar)}
          >
            <DMHeader userId={user.id} userName={user.name} userAvatar={user.avatar} />
          </div>
        </div>
        {/* This empty div helps maintain balance in the header */}
        <div className="w-9"></div>
      </div>
      
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
          userId={user.id}
          conversationId={conversationId}
        />
      </div>
    </div>
  );
};

export default DMConversation;
