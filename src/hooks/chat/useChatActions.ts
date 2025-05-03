import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { ChatMessage } from '@/types/chat';

export const useChatActions = () => {
  const { currentUser } = useApp();

  const sendMessageToClub = useCallback(async (clubId: string, messageText: string, setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>) => {
    try {
      if (!currentUser) {
        throw new Error('Not authenticated');
      }
      
      // Generate a unique temp ID for optimistic UI
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const timestamp = new Date().toISOString();
      
      // Create a fresh optimistic message with the current text input
      const optimisticMessage: ChatMessage = {
        id: tempId,
        text: messageText,
        sender: {
          id: currentUser.id,
          name: currentUser.name || 'You',
          avatar: currentUser.avatar
        },
        timestamp,
        optimistic: true
      };
      
      console.log('[useChatActions] Created optimistic message:', optimisticMessage);
      
      // Directly update local state with optimistic message if setClubMessages is provided
      if (setClubMessages) {
        setClubMessages(prevMessages => {
          const clubMessages = prevMessages[clubId] || [];
          
          // Check if message already exists to prevent duplicates
          if (clubMessages.some(msg => msg.id === optimisticMessage.id)) {
            return prevMessages;
          }
          
          console.log('[useChatActions] Updated local messages with optimistic update');
          
          return {
            ...prevMessages,
            [clubId]: [...clubMessages, optimisticMessage]
          };
        });
      }

      // Add debug log before insert attempt
      console.log('[Chat Debug] About to insert message:', { clubId, messageText });

      const { data: insertedMessage, error: insertError } = await supabase
        .from('club_chat_messages')
        .insert({
          club_id: clubId,
          message: messageText,
          sender_id: currentUser.id
        })
        .select(`
          id, 
          message, 
          timestamp, 
          sender_id,
          club_id,
          sender:sender_id(id, name, avatar)
        `)
        .single();
      
      // Add debug log after insert attempt
      console.log('[Chat Debug] Insert result:', { data: insertedMessage, error: insertError });

      if (insertError) {
        console.error('[useChatActions] Error sending message:', insertError);
        
        if (insertError.code === '42501') {
          toast({
            title: "Permission Error",
            description: "You don't have permission to send messages in this club",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Message Send Error",
            description: insertError.message || "Failed to send message",
            variant: "destructive"
          });
        }
        
        // Remove optimistic message on error if setClubMessages is provided
        if (setClubMessages) {
          setClubMessages(prevMessages => {
            const clubMessages = prevMessages[clubId] || [];
            
            return {
              ...prevMessages,
              [clubId]: clubMessages.filter(msg => msg.id !== tempId)
            };
          });
        }
        
        return null;
      }

      console.log('[useChatActions] Message sent successfully:', insertedMessage);
      
      // Replace optimistic message with real one
      if (setClubMessages && insertedMessage) {
        setClubMessages(prevMessages => {
          const clubMessages = prevMessages[clubId] || [];
          
          return {
            ...prevMessages,
            [clubId]: clubMessages.map(msg => 
              msg.id === tempId ? {
                ...insertedMessage,
                sender: {
                  id: insertedMessage.sender_id,
                  name: insertedMessage.sender?.name || 'User',
                  avatar: insertedMessage.sender?.avatar
                }
              } : msg
            )
          };
        });
      }
      
      return insertedMessage;
    } catch (error) {
      console.error('[useChatActions] Unexpected error sending message:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while sending the message",
        variant: "destructive"
      });
      return null;
    }
  }, [currentUser]);

  const deleteMessage = useCallback(async (messageId: string, setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>) => {
    console.log('[useChatActions] Deleting message with ID:', messageId);
    
    // 1. Immediately remove from UI - true optimistic deletion
    if (setClubMessages) {
      setClubMessages(prevMessages => {
        const updatedMessages = { ...prevMessages };
        
        // Update each club's messages
        Object.keys(updatedMessages).forEach(clubId => {
          const originalLength = updatedMessages[clubId].length;
          updatedMessages[clubId] = updatedMessages[clubId].filter(msg => msg.id !== messageId);
          
          // Log if we actually found and removed a message
          if (originalLength !== updatedMessages[clubId].length) {
            console.log(`[useChatActions] Optimistically removed message ${messageId} from club ${clubId}`);
          }
        });
        
        return updatedMessages;
      });
    }

    // 2. Skip Supabase deletion for temp messages
    if (messageId.startsWith('temp-')) {
      console.log('[useChatActions] Skipping Supabase deletion for temp message:', messageId);
      return true;
    }
    
    try {
      const { error } = await supabase
        .from('club_chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('[useChatActions] Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      });
      return false;
    }
  }, []);

  return {
    sendMessageToClub,
    deleteMessage
  };
};
