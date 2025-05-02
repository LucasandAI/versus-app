
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
  const { conversations } = useConversations([]);
  const { markConversationAsRead } = useUnreadMessages();
  const [isSending, setIsSending] = React.useState(false);
  const { formatTime } = useMessageFormatting();
  const { userCache, fetchUserData } = useUserData();
  
  // Use refs to maintain stable references to props
  const userRef = useRef(user);
  const conversationIdRef = useRef(conversationId);
  
  // Update refs when props change
  useEffect(() => {
    userRef.current = user;
    conversationIdRef.current = conversationId;
    
    // Log when we receive new user data to help debug
    console.log(`[DMConversation] User data updated: id=${user.id}, name=${user.name}, avatar=${user.avatar || 'none'}`);
  }, [user, conversationId]);
  
  // Log comprehensive user data when the component mounts
  useEffect(() => {
    console.log(`[DMConversation] Initial render with user:`, {
      id: user.id,
      name: user.name,
      avatar: user.avatar || 'none'
    });
  }, []);
  
  // Fetch user data if not already in cache - only do this once
  const initialFetchDoneRef = useRef(false);
  useEffect(() => {
    const fetchUserIfNeeded = async () => {
      if (!initialFetchDoneRef.current && user.id && !userCache[user.id]) {
        console.log(`[DMConversation] Fetching data for user ${user.id} on mount`);
        await fetchUserData(user.id);
        initialFetchDoneRef.current = true;
      }
    };
    
    fetchUserIfNeeded();
  }, [user.id, userCache, fetchUserData]);
  
  // Use our hook for active messages
  const { messages, setMessages, addOptimisticMessage } = useActiveDMMessages(
    conversationId, 
    user.id,
    currentUser?.id
  );
  
  // Enhanced logging to ensure we're passing the correct user data
  const fullUserObject = useMemo(() => {
    const result = {
      id: user.id,
      name: user.name || (userCache[user.id]?.name || 'Unknown User'),
      avatar: user.avatar || (userCache[user.id]?.avatar || undefined)
    };
    
    console.log(`[DMConversation] Providing full user object to subscription:`, result);
    return result;
  }, [user, userCache]);
  
  // Use subscription hook with the full user object to prevent flickering
  useDMSubscription(
    conversationId, 
    user.id, 
    currentUser?.id, 
    setMessages,
    // Pass the full user object to prevent flickering on new messages
    fullUserObject
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
      let finalConversationId = conversationIdRef.current;
      
      // Create conversation if needed
      if (finalConversationId === 'new') {
        const newConversationId = await createConversation();
        if (newConversationId) {
          finalConversationId = newConversationId;
          // Update our ref but don't trigger a re-render
          conversationIdRef.current = newConversationId;
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
          receiver_id: userRef.current.id,
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
  }, [currentUser, addOptimisticMessage, createConversation, scrollToBottom, setMessages]);
  
  // Club members array for ChatMessages - memoized to prevent recreating
  const clubMembers = useMemo(() => 
    currentUser ? [currentUser] : [], 
    [currentUser]
  );
  
  // Get the most up-to-date user data by combining props with cache
  const displayedUser = useMemo(() => {
    const cachedUser = userCache[user.id];
    
    if (cachedUser) {
      const result = {
        id: user.id,
        name: user.name || cachedUser.name,
        avatar: user.avatar || cachedUser.avatar
      };
      console.log(`[DMConversation] Using enhanced user data for display:`, result);
      return result;
    }
    
    return user;
  }, [user, userCache]);

  // Log when the component renders to track unnecessary re-renders
  console.log(`[DMConversation] Rendering for user ${user.id} (${displayedUser.name})`);

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
            onClick={() => navigateToUserProfile(displayedUser.id, displayedUser.name, displayedUser.avatar)}
          >
            <DMHeader 
              userId={displayedUser.id} 
              userName={displayedUser.name} 
              userAvatar={displayedUser.avatar} 
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
