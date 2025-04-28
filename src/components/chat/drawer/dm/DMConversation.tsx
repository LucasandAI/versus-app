
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
  userAvatar?: string;
  conversationId?: string;
}

const DMConversation: React.FC<DMConversationProps> = ({ 
  userId, 
  userName, 
  userAvatar,
  conversationId: initialConversationId
}) => {
  const { currentUser } = useApp();
  const { navigateToUserProfile } = useNavigation();
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const { messages, setMessages, isSending, setIsSending } = useDMMessages(userId, userName, conversationId);
  const { updateConversation } = useConversations([]);
  const { unhideConversation } = useHiddenDMs();
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const { formatTime } = useMessageFormatting();
  
  useDMSubscription(conversationId, userId, currentUser?.id, setMessages);

  // Create or get conversation ID if not provided
  useEffect(() => {
    const getOrCreateConversation = async () => {
      if (!currentUser?.id || !userId || conversationId) return;
      
      try {
        // Generate a stable conversation ID by sorting user IDs
        const [user1, user2] = [currentUser.id, userId].sort();
        
        // Check if conversation already exists
        const { data: existingConversation, error: fetchError } = await supabase
          .from('direct_conversations')
          .select('id')
          .eq('user1_id', user1)
          .eq('user2_id', user2)
          .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') { // Not found error is okay
          throw fetchError;
        }
        
        if (existingConversation) {
          console.log('[DMConversation] Found existing conversation:', existingConversation.id);
          setConversationId(existingConversation.id);
          return existingConversation.id;
        }
        
        // Create new conversation if it doesn't exist
        const newConversationId = `conv_${user1.substring(0, 8)}_${user2.substring(0, 8)}_${Date.now()}`;
        const { error: insertError } = await supabase
          .from('direct_conversations')
          .insert({
            id: newConversationId,
            user1_id: user1,
            user2_id: user2
          });
          
        if (insertError) throw insertError;
        
        console.log('[DMConversation] Created new conversation:', newConversationId);
        setConversationId(newConversationId);
        return newConversationId;
      } catch (error) {
        console.error('Error getting/creating conversation:', error);
        toast({
          title: "Error",
          description: "Could not establish conversation",
          variant: "destructive"
        });
      }
    };
    
    getOrCreateConversation();
  }, [currentUser?.id, userId, conversationId]);

  // Scroll to bottom on new messages or when conversation opens
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages.length]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !currentUser?.id || !userId) return;
    setIsSending(true);
    
    unhideConversation(userId);
    
    const optimisticId = `temp-${Date.now()}`;
    const newMessageObj = {
      id: optimisticId,
      text: message,
      sender: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      },
      timestamp: new Date().toISOString()
    };
    
    // Get or create conversation ID before sending
    let actualConversationId = conversationId;
    if (!actualConversationId) {
      const [user1, user2] = [currentUser.id, userId].sort();
      
      try {
        // Check if conversation exists
        const { data: existingConv, error: fetchError } = await supabase
          .from('direct_conversations')
          .select('id')
          .eq('user1_id', user1)
          .eq('user2_id', user2)
          .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
        
        if (existingConv) {
          actualConversationId = existingConv.id;
        } else {
          // Create new conversation
          const newId = `conv_${user1.substring(0, 8)}_${user2.substring(0, 8)}_${Date.now()}`;
          const { error: insertError } = await supabase
            .from('direct_conversations')
            .insert({
              id: newId,
              user1_id: user1,
              user2_id: user2
            });
            
          if (insertError) throw insertError;
          actualConversationId = newId;
        }
        
        setConversationId(actualConversationId);
      } catch (error) {
        console.error('Error getting/creating conversation for message:', error);
        toast({
          title: "Error",
          description: "Could not establish conversation",
          variant: "destructive"
        });
        setIsSending(false);
        return;
      }
    }

    try {
      // Add message to the chat window immediately after attempting to send
      setMessages(prev => [...prev, newMessageObj]);
      
      // Update the conversation list immediately
      if (actualConversationId) {
        updateConversation(actualConversationId, userId, message, userName, userAvatar);
      }

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
      
      if (data) {
        setMessages(prev => 
          prev.map(msg => msg.id === optimisticId ? {
            ...msg,
            id: data.id
          } : msg)
        );
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
            conversationId={userId}
            conversationType="dm"
          />
        </div>
      </div>
    </div>
  );
};

export default DMConversation;
