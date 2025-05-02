import React, { useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ChatMessages from '../../ChatMessages';
import { useActiveDMMessages } from '@/hooks/chat/dm/useActiveDMMessages';
import { useDMSubscription } from '@/hooks/chat/dm/useDMSubscription';
import { useNavigation } from '@/hooks/useNavigation';
import { useConversations } from '@/hooks/chat/dm/useConversations';
import { useMessageFormatting } from '@/hooks/chat/messages/useMessageFormatting';
import { useConversationManagement } from '@/hooks/chat/dm/useConversationManagement';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { useMessageScroll } from '@/hooks/chat/useMessageScroll';
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
  const { conversations, fetchConversations } = useConversations([]);
  const { markConversationAsRead } = useUnreadMessages();
  const [isSending, setIsSending] = React.useState(false);
  const { formatTime } = useMessageFormatting();
  
  // Use our new hook for active messages
  const { messages, setMessages, addOptimisticMessage } = useActiveDMMessages(
    conversationId, 
    user.id,
    currentUser?.id
  );
  
  // Use subscription hook
  useDMSubscription(conversationId, user.id, currentUser?.id, setMessages);
  
  // Use scroll management hook
  const { scrollRef, lastMessageRef, scrollToBottom } = useMessageScroll(messages);
  
  // Custom hooks for conversation management
  const { createConversation } = useConversationManagement(currentUser?.id, user.id);
  
  // Mark conversation as read when opened
  useEffect(() => {
    if (conversationId && conversationId !== 'new') {
      markConversationAsRead(conversationId);
    }
  }, [conversationId, markConversationAsRead]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !currentUser?.id) return;
    
    setIsSending(true);
    
    // Create optimistic message
    const optimisticMessage = {
      id: `optimistic-${Date.now()}`,
      text,
      sender: {
        id: currentUser.id,
        name: 'You',
        avatar: currentUser.avatar
      },
      timestamp: new Date().toISOString(),
      optimistic: true
    };
    
    // Add optimistic message to UI
    addOptimisticMessage(optimisticMessage);
    
    // Scroll to bottom
    scrollToBottom();
    
    try {
      let finalConversationId = conversationId;
      
      // Create conversation if needed
      if (conversationId === 'new') {
        const newConversationId = await createConversation();
        if (newConversationId) {
          finalConversationId = newConversationId;
        } else {
          throw new Error("Failed to create conversation");
        }
      }
      
      // Send message to database
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          text,
          sender_id: currentUser.id,
          receiver_id: user.id,
          conversation_id: finalConversationId
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
    } catch (error) {
      console.error('[DMConversation] Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

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
            onSelectUser={(userId, userName, userAvatar) => 
              navigateToUserProfile(userId, userName, userAvatar)
            }
            currentUserAvatar={currentUser?.avatar}
            lastMessageRef={lastMessageRef}
            formatTime={formatTime}
            scrollRef={scrollRef}
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
