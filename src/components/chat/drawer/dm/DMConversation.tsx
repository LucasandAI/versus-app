
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import ChatMessages from '../../ChatMessages';
import { useNavigation } from '@/hooks/useNavigation';
import { useMessageFormatting } from '@/hooks/chat/messages/useMessageFormatting';
import { useMessageScroll } from '@/hooks/chat/useMessageScroll';
import DMMessageInput from './DMMessageInput';
import DMHeader from './DMHeader';
import { ArrowLeft } from 'lucide-react';
import { DirectMessage } from '@/context/ChatContext';

interface DMConversationProps {
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  conversationId: string;
  messages: DirectMessage[];
  onBack: () => void;
  onSendMessage: (message: string, conversationId: string, receiverId: string) => Promise<void>;
  onDeleteMessage?: (messageId: string, type: 'club' | 'direct', contextId: string) => void;
}

const DMConversation: React.FC<DMConversationProps> = ({ 
  user, 
  conversationId,
  messages,
  onBack,
  onSendMessage,
  onDeleteMessage
}) => {
  const { currentUser } = useApp();
  const { navigateToUserProfile } = useNavigation();
  const [isSending, setIsSending] = useState(false);
  const { formatTime } = useMessageFormatting();
  const { scrollRef, lastMessageRef, scrollToBottom } = useMessageScroll(messages);

  // Log messages for debugging
  console.log(`[DMConversation] Rendering with ${messages?.length || 0} messages for conversation ${conversationId}`);
  
  // Sort messages by timestamp
  const sortedMessages = useMemo(() => {
    if (!messages) return [];
    return [...messages].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [messages]);
  
  // Scroll to bottom when component mounts or conversation changes
  useEffect(() => {
    scrollToBottom();
  }, [conversationId]);

  const handleSendMessage = async (message: string) => {
    console.log('[DMConversation] Sending message for conversation:', conversationId);
    setIsSending(true);
    try {
      await onSendMessage(message, conversationId, user.id);
      // Scroll to bottom after sending
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('[DMConversation] Error sending DM:', error);
    } finally {
      setIsSending(false);
    }
  };
  
  const handleDeleteMessage = async (messageId: string) => {
    if (onDeleteMessage) {
      await onDeleteMessage(messageId, 'direct', conversationId);
    }
  };

  // Club members array for ChatMessages - include both current user and the other user
  const chatMembers = useMemo(() => {
    const members = [];
    if (currentUser) {
      members.push({
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      });
    }
    members.push({
      id: user.id,
      name: user.name,
      avatar: user.avatar
    });
    return members;
  }, [currentUser, user]);

  return (
    <div className="flex flex-col h-full w-full">
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
            <DMHeader 
              userId={user.id} 
              userName={user.name} 
              userAvatar={user.avatar} 
            />
          </div>
        </div>
        <div className="w-9"></div>
      </div>
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
          <ChatMessages 
            messages={sortedMessages}
            clubMembers={chatMembers}
            onSelectUser={(userId, userName, userAvatar) => 
              navigateToUserProfile(userId, userName, userAvatar)
            }
            currentUserAvatar={currentUser?.avatar}
            lastMessageRef={lastMessageRef}
            formatTime={formatTime}
            onDeleteMessage={handleDeleteMessage}
          />
        </div>
        
        <div className="bg-white border-t">
          <DMMessageInput
            onSendMessage={handleSendMessage}
            isSending={isSending}
            userId={user.id}
            conversationId={conversationId}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(DMConversation);
