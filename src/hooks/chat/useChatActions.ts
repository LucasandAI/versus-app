
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

export const useChatActions = () => {
  const { currentUser } = useApp();

  const sendMessageToClub = useCallback(async (clubId: string, messageText: string, setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>) => {
    try {
      if (!currentUser) {
        throw new Error('Not authenticated');
      }
      
      // Generate a unique temp ID for optimistic UI
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create a fresh optimistic message with the current text input
      // This ensures we're never reusing old message objects
      const optimisticMessage = {
        id: tempId,
        message: messageText,
        club_id: clubId,
        sender_id: currentUser.id,
        timestamp: new Date().toISOString(),
        sender: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar
        }
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
          
          console.log('[MainChatDrawer] Updated local messages with optimistic update:', [optimisticMessage]);
          
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
        return null;
      }

      console.log('[useChatActions] Message sent successfully:', insertedMessage);
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

    // 3. Call Supabase in the background for real messages - no awaiting
    try {
      console.log('[useChatActions] Deleting message from Supabase in background:', messageId);
      
      // Fire and forget - don't await the response
      supabase
        .from('club_chat_messages')
        .delete()
        .eq('id', messageId)
        .then(({ error }) => {
          if (error) {
            console.error('[useChatActions] Background deletion failed:', error);
            // Don't revert UI or show toast - just log the error
          } else {
            console.log('[useChatActions] Background deletion successful for message:', messageId);
          }
        });
      
      return true;
    } catch (error) {
      console.error('[useChatActions] Exception during background deletion:', error);
      return true; // Still return true since UI is already updated
    }
  }, []);

  return {
    sendMessageToClub,
    deleteMessage
  };
};
