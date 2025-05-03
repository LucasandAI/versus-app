
import React, { useRef, useEffect, useCallback, memo, useMemo } from 'react';
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
import { useUserData } from '@/hooks/chat/dm/useUserData';

interface DMConversationProps {
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  conversationId: string;
  onBack: () => void;
}

// Use memo to prevent unnecessary re-renders
const DMConversation: React.FC<DMConversationProps> = memo(({ 
  user, 
  conversationId,
  onBack
}) => {
  const { currentUser } = useApp();
  const { navigateToUserProfile } = useNavigation();
  const { markConversationAsRead } = useUnreadMessages();
  const [isSending, setIsSending] = React.useState(false);
  const { formatTime } = useMessageFormatting();
  
  // Log comprehensive user data when component mounts/updates
  console.log(`[DMConversation] Using authoritative user data:`, {
    id: user.id,
    name: user.name || 'Unknown',
    avatar: user.avatar || 'none'
  });
  
  // Create a stable reference to the user object that won't change identity
  const userDataForMessages = useMemo(() => ({
    id: user.id,
    name: user.name,
    avatar: user.avatar
  }), [user.id, user.name, user.avatar]);
  
  // Use our hook for active messages - pass the userDataForMessages as source of truth
  const { messages, setMessages, addOptimisticMessage } = useActiveDMMessages(
    conversationId, 
    user.id,
    currentUser?.id,
    userDataForMessages // Pass the authoritative user data to useActiveDMMessages
  );
  
  // Pass the complete user data object to useDMSubscription to ensure consistent display
  useDMSubscription(
    conversationId, 
    user.id, 
    currentUser?.id, 
    setMessages,
    userDataForMessages // This is the authoritative source of user metadata
  );
  
  // Use scroll management hook with optimized scrolling
  const { scrollRef, lastMessageRef, scrollToBottom } = useMessageScroll(messages);
  
  // Custom hooks for conversation management
  const { createConversation } = useConversationManagement(currentUser?.id, user.id);
  
  // Mark conversation as read when opened
  useEffect(() => {
    if (conversationId && conversationId !== 'new') {
      markConversationAsRead(conversationId);
    }
  }, [conversationId, markConversationAsRead]);

  // Stable send message handler
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !currentUser?.id) return;
    
    setIsSending(true);
    
    // Create optimistic message with stable ID format
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage = {
      id: optimisticId,
      text,
      sender: {
        id: currentUser.id,
        name: currentUser.name || 'You',
        avatar: currentUser.avatar
      },
      timestamp: new Date().toISOString(),
      optimistic: true
    };
    
    // Add optimistic message to UI
    addOptimisticMessage(optimisticMessage);
    
    // Scroll to bottom - wrapped in requestAnimationFrame to avoid layout thrashing
    requestAnimationFrame(() => {
      scrollToBottom();
    });
    
    try {
      let finalConversationId = conversationId;
      
      // Create conversation if needed
      if (finalConversationId === 'new') {
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
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  }, [currentUser, user, conversationId, addOptimisticMessage, createConversation, scrollToBottom, setMessages]);
  
  // Club members array for ChatMessages - memoized to prevent recreating
  const clubMembers = useMemo(() => 
    currentUser ? [currentUser] : [], 
    [currentUser]
  );

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
            <DMHeader 
              userId={user.id} 
              userName={user.name} 
              userAvatar={user.avatar} 
            />
          </div>
        </div>
        {/* This empty div helps maintain balance in the header */}
        <div className="w-9"></div>
      </div>
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 min-h-0">
          <ChatMessages 
            messages={messages}
            clubMembers={clubMembers}
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
});

DMConversation.displayName = 'DMConversation';

export default DMConversation;
