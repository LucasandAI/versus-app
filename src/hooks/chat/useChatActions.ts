import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { ChatMessage } from '@/types/chat';
import { useMessageOptimism } from './useMessageOptimism';

export const useChatActions = (chatId: string, isDM: boolean = false) => {
  const { currentUser } = useApp();
  const { addOptimisticMessage, scrollToBottom } = useMessageOptimism();

  const sendMessage = useCallback(async (text: string) => {
    if (!currentUser?.id || !chatId) return;

    try {
      // Create optimistic message
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        text,
        sender: {
          id: currentUser.id,
          name: 'You',
          avatar: currentUser.avatar
        },
        timestamp: new Date().toISOString(),
        optimistic: true
      };

      // Add optimistic message immediately
      addOptimisticMessage(optimisticMessage);
      scrollToBottom();

      // Send message to server
      const { data, error } = await supabase
        .from(isDM ? 'direct_messages' : 'club_messages')
        .insert({
          [isDM ? 'conversation_id' : 'club_id']: chatId,
          sender_id: currentUser.id,
          text,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent(isDM ? 'dmMessageReceived' : 'clubMessageReceived', {
        detail: {
          [isDM ? 'conversationId' : 'clubId']: chatId,
          message: {
            id: data.id,
            text: data.text,
            sender: {
              id: data.sender_id,
              name: 'You',
              avatar: currentUser.avatar
            },
            timestamp: data.timestamp
          }
        }
      }));

    } catch (error) {
      console.error('[useChatActions] Error sending message:', error);
      // Remove optimistic message on error
      window.dispatchEvent(new CustomEvent(isDM ? 'dmMessageDeleted' : 'clubMessageDeleted', {
        detail: {
          [isDM ? 'conversationId' : 'clubId']: chatId,
          messageId: optimisticMessage.id
        }
      }));
    }
  }, [chatId, currentUser, isDM, addOptimisticMessage, scrollToBottom]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!currentUser?.id || !chatId) return;

    try {
      // Optimistically remove message
      window.dispatchEvent(new CustomEvent(isDM ? 'dmMessageDeleted' : 'clubMessageDeleted', {
        detail: {
          [isDM ? 'conversationId' : 'clubId']: chatId,
          messageId
        }
      }));

      // Delete from server
      const { error } = await supabase
        .from(isDM ? 'direct_messages' : 'club_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', currentUser.id);

      if (error) throw error;

    } catch (error) {
      console.error('[useChatActions] Error deleting message:', error);
      // Re-add message on error
      window.dispatchEvent(new CustomEvent(isDM ? 'dmMessageReceived' : 'clubMessageReceived', {
        detail: {
          [isDM ? 'conversationId' : 'clubId']: chatId,
          message: {
            id: messageId,
            text: 'Message could not be deleted',
            sender: {
              id: currentUser.id,
              name: 'You',
              avatar: currentUser.avatar
            },
            timestamp: new Date().toISOString()
          }
        }
      }));
    }
  }, [chatId, currentUser, isDM]);

  return {
    sendMessage,
    deleteMessage
  };
};
