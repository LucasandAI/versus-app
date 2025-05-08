
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

interface DMConversationProps {
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  conversationId: string;
  onBack: () => void;
}

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
  const [loadError, setLoadError] = React.useState<string | null>(null);
  
  // Check if user data is complete
  const hasValidUserData = useMemo(() => {
    const isValid = Boolean(user && user.id && user.name);
    console.log('[DMConversation] User data validation:', {
      id: user?.id || 'missing',
      name: user?.name || 'missing',
      avatar: user?.avatar || 'missing',
      isValid
    });
    return isValid;
  }, [user]);
  
  // Create a stable reference to the user object
  const userDataForMessages = useMemo(() => ({
    id: user?.id || '',
    name: user?.name || 'Unknown',
    avatar: user?.avatar || '/placeholder.svg'
  }), [user?.id, user?.name, user?.avatar]);
  
  // Use hooks for active messages with proper error handling
  const { 
    messages, 
    setMessages, 
    addOptimisticMessage,
    isLoading,
    error: messagesError
  } = useActiveDMMessages(
    conversationId, 
    user?.id,
    currentUser?.id,
    userDataForMessages
  );
  
  // Set up subscription for real-time updates
  useDMSubscription(
    conversationId, 
    user?.id, 
    currentUser?.id, 
    setMessages,
    userDataForMessages
  );
  
  // Optimize scroll management
  const { scrollRef, lastMessageRef, scrollToBottom } = useMessageScroll(messages);
  
  // Conversation management
  const { createConversation } = useConversationManagement(currentUser?.id, user?.id);
  
  // Handle errors and loading states
  useEffect(() => {
    if (messagesError) {
      setLoadError(messagesError);
    } else {
      setLoadError(null);
    }
  }, [messagesError]);
  
  // Mark conversation as read when opened
  useEffect(() => {
    if (conversationId && conversationId !== 'new') {
      markConversationAsRead(conversationId);
    }
  }, [conversationId, markConversationAsRead]);

  // Handle sending messages
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !currentUser?.id || !hasValidUserData) return;
    
    setIsSending(true);
    
    // Create optimistic message with stable ID
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage = {
      id: optimisticId,
      text,
      sender: {
        id: currentUser.id,
        name: currentUser.name || 'You',
        avatar: currentUser.avatar || '/placeholder.svg'
      },
      timestamp: new Date().toISOString(),
      optimistic: true
    };
    
    // Add optimistic message
    addOptimisticMessage(optimisticMessage);
    
    // Schedule scroll to bottom
    requestAnimationFrame(() => scrollToBottom());
    
    try {
      let finalConversationId = conversationId;
      
      // Create new conversation if needed
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
  }, [currentUser, user, conversationId, addOptimisticMessage, createConversation, scrollToBottom, setMessages, hasValidUserData]);
  
  // Club members array for ChatMessages - memoized to prevent recreating
  const clubMembers = useMemo(() => 
    currentUser ? [
      {
        id: currentUser.id,
        name: currentUser.name || 'You',
        avatar: currentUser.avatar
      },
      {
        id: user?.id || '',
        name: user?.name || 'User',
        avatar: user?.avatar
      }
    ] : [], 
    [currentUser, user]
  );
  
  // If user data is invalid, show an error
  if (!hasValidUserData) {
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
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="w-9"></div>
        </div>
        <div className="flex-1 flex items-center justify-center flex-col p-4 text-center">
          <p className="text-gray-500 mb-2">Cannot display conversation</p>
          <p className="text-sm text-gray-400">Missing user data</p>
          <button 
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
            onClick={onBack}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

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
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-r-2"></div>
          </div>
        ) : loadError ? (
          <div className="flex-1 flex items-center justify-center flex-col">
            <p className="text-red-500 mb-2">Error loading messages</p>
            <p className="text-sm text-gray-500">{loadError}</p>
          </div>
        ) : (
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
        )}
        
        <DMMessageInput
          onSendMessage={handleSendMessage}
          isSending={isSending}
          userId={user.id}
          conversationId={conversationId}
          disabled={isLoading || Boolean(loadError)}
        />
      </div>
    </div>
  );
});

DMConversation.displayName = 'DMConversation';

export default DMConversation;
