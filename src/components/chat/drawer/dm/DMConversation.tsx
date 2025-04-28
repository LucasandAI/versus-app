
import React, { useRef, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import ChatMessages from '../../ChatMessages';
import ChatInput from '../../ChatInput';
import { useDMMessages } from '@/hooks/chat/dm/useDMMessages';
import { useDMSubscription } from '@/hooks/chat/dm/useDMSubscription';
import { useNavigation } from '@/hooks/useNavigation';
import { toast } from '@/hooks/use-toast';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
import { useConversations } from '@/hooks/chat/dm/useConversations';
import { useMessageFormatting } from '@/hooks/chat/messages/useMessageFormatting';

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
  const { 
    messages, 
    setMessages, 
    addMessage,
    isSending, 
    setIsSending 
  } = useDMMessages(userId, userName, conversationId);
  const { conversations, fetchConversations } = useConversations([]);
  const { unhideConversation } = useHiddenDMs();
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const { formatTime } = useMessageFormatting();
  
  // Use our improved subscription hook - if conversationId exists and is not 'new'
  useEffect(() => {
    if (conversationId && conversationId !== 'new') {
      useDMSubscription(conversationId, userId, currentUser?.id, setMessages, addMessage);
    }
  }, [conversationId, userId, currentUser?.id, setMessages, addMessage]);

  // Scroll to bottom on new messages or when conversation opens
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages.length]);

  // Local function to update conversation in the list
  const updateLocalConversation = () => {
    // After sending a message, refresh conversations
    fetchConversations();
  };

  // Function to create a new conversation in the database
  const createConversation = async () => {
    if (!currentUser?.id || !userId) return null;
    
    try {
      console.log('Checking for existing conversation between', currentUser.id, 'and', userId);
      
      // Check if conversation already exists between these two users
      const { data: existingConversation, error: checkError } = await supabase
        .from('direct_conversations')
        .select('id')
        .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${currentUser.id})`)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking for existing conversation:', checkError);
        throw checkError;
      }
      
      // If conversation exists, return its ID
      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation.id);
        return existingConversation.id;
      }
      
      console.log('Creating new conversation between', currentUser.id, 'and', userId);
      // Create a new conversation
      const { data: newConversation, error } = await supabase
        .from('direct_conversations')
        .insert({
          user1_id: currentUser.id,
          user2_id: userId
        })
        .select('id')
        .single();
        
      if (error) {
        console.error('Error creating conversation:', error);
        throw error;
      }
      
      console.log('Created new conversation with ID:', newConversation.id);
      return newConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Could not create conversation",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !currentUser?.id || !userId) return;
    setIsSending(true);
    
    unhideConversation(userId);
    
    const optimisticId = `temp-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const newMessageObj = {
      id: optimisticId,
      text: message,
      sender: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      },
      timestamp
    };

    try {
      // Add message to the chat window immediately (with duplicate check)
      addMessage(newMessageObj);
      
      // Get or create a conversation ID
      let actualConversationId = conversationId;
      if (!actualConversationId || actualConversationId === 'new') {
        console.log('Need to create/find conversation for users:', currentUser.id, userId);
        const newConversationId = await createConversation();
        if (!newConversationId) {
          throw new Error('Could not create conversation');
        }
        actualConversationId = newConversationId;
        console.log('Got conversation ID:', actualConversationId);
      }
      
      // Update the conversation list immediately
      updateLocalConversation();

      console.log('Sending message with conversation ID:', actualConversationId);
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: userId,
          text: message,
          conversation_id: actualConversationId
        })
        .select('*')
        .single();

      if (error) throw error;
      
      console.log('Message sent successfully:', data);
      
      // If this was a new conversation, update the UI to use the new conversation ID
      if (conversationId !== actualConversationId) {
        console.log('Updating conversation ID from', conversationId, 'to', actualConversationId);
        // Dispatch event to update conversation ID in parent components
        window.dispatchEvent(new CustomEvent('conversationCreated', {
          detail: {
            userId,
            conversationId: actualConversationId
          }
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Could not send message",
        variant: "destructive"
      });
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      const { error } = await supabase
        .from('direct_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Could not delete message",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 min-h-0">
          <ChatMessages 
            messages={messages}
            clubMembers={currentUser ? [currentUser] : []}
            onDeleteMessage={handleDeleteMessage}
            onSelectUser={(userId, userName, userAvatar) => 
              navigateToUserProfile(userId, userName, userAvatar)
            }
            currentUserAvatar={currentUser?.avatar}
            lastMessageRef={lastMessageRef}
            formatTime={formatTime}
          />
        </div>
        
        <div className="bg-white">
          <ChatInput 
            onSendMessage={handleSendMessage}
            isSending={isSending}
            clubId={userId}
            conversationId={conversationId || 'new'}
            conversationType="dm"
          />
        </div>
      </div>
    </div>
  );
};

export default DMConversation;
