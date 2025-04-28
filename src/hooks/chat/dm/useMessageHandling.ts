
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';

export const useMessageHandling = (
  currentUserId: string | undefined,
  userId: string,
  conversationId: string,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>,
  setIsSending: React.Dispatch<React.SetStateAction<boolean>>,
  createConversation: () => Promise<string | null>
) => {
  const { unhideConversation } = useHiddenDMs();
  
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !currentUserId || !userId) return;
    setIsSending(true);
    
    unhideConversation(userId);
    
    const optimisticId = `temp-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const newMessageObj = {
      id: optimisticId,
      text: message,
      sender: {
        id: currentUserId,
        name: currentUserId,
        avatar: undefined
      },
      timestamp
    };

    try {
      setMessages(prev => [...prev, newMessageObj]);
      
      // Get or create a conversation ID
      let actualConversationId = conversationId;
      if (!actualConversationId || actualConversationId === 'new') {
        console.log('Need to create/find conversation for users:', currentUserId, userId);
        const newConversationId = await createConversation();
        if (!newConversationId) {
          throw new Error('Could not create conversation');
        }
        actualConversationId = newConversationId;
      }

      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: userId,
          text: message,
          conversation_id: actualConversationId
        })
        .select('*')
        .single();

      if (error) throw error;
      
      // If this was a new conversation, update the UI
      if (conversationId !== actualConversationId) {
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

  return { handleSendMessage, handleDeleteMessage };
};
