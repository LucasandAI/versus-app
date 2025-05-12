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
      
      // Create a fresh optimistic message with the current text input
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
              msg.id === tempId ? insertedMessage : msg
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

  const sendDirectMessage = useCallback(async (
    conversationId: string,
    messageText: string,
    setMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  ) => {
    try {
      if (!currentUser) {
        throw new Error('Not authenticated');
      }
      
      // Generate a unique temp ID for optimistic UI
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create optimistic message
      const optimisticMessage: ChatMessage = {
        id: tempId,
        text: messageText,
        timestamp: new Date().toISOString(),
        sender: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar
        },
        isUserMessage: true
      };
      
      console.log('[useChatActions] Created optimistic direct message:', optimisticMessage);
      
      // Update local state with optimistic message
      if (setMessages) {
        setMessages(prev => [...prev, optimisticMessage]);
      }

      // Get the other user's ID from the conversation
      const { data: conversation, error: convError } = await supabase
        .from('direct_conversations')
        .select('user1_id, user2_id')
        .eq('id', conversationId)
        .single();

      if (convError) {
        throw convError;
      }

      // Determine the receiver_id (the other user in the conversation)
      const receiver_id = conversation.user1_id === currentUser.id 
        ? conversation.user2_id 
        : conversation.user1_id;

      // Insert message into database
      const { data: insertedMessage, error: insertError } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: conversationId,
          text: messageText,
          sender_id: currentUser.id,
          receiver_id: receiver_id,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('[useChatActions] Error sending direct message:', insertError);
        toast({
          title: "Message Send Error",
          description: insertError.message || "Failed to send message",
          variant: "destructive"
        });
        
        // Remove optimistic message on error
        if (setMessages) {
          setMessages(prev => prev.filter(msg => msg.id !== tempId));
        }
        
        return null;
      }

      console.log('[useChatActions] Direct message sent successfully:', insertedMessage);
      
      // Replace optimistic message with real one
      if (setMessages && insertedMessage) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? {
            ...insertedMessage,
            isUserMessage: true,
            sender: {
              id: currentUser.id,
              name: currentUser.name,
              avatar: currentUser.avatar
            }
          } : msg
        ));
      }
      
      return insertedMessage;
    } catch (error) {
      console.error('[useChatActions] Unexpected error sending direct message:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while sending the message",
        variant: "destructive"
      });
      return null;
    }
  }, [currentUser]);

  const deleteMessage = useCallback(async (
    messageId: string,
    setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>,
    setDirectMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  ) => {
    console.log('[useChatActions] Deleting message with ID:', messageId);
    
    // Handle club messages
    if (setClubMessages) {
      setClubMessages(prevMessages => {
        const updatedMessages = { ...prevMessages };
        Object.keys(updatedMessages).forEach(clubId => {
          updatedMessages[clubId] = updatedMessages[clubId].filter(msg => msg.id !== messageId);
        });
        return updatedMessages;
      });
    }
    
    // Handle direct messages
    if (setDirectMessages) {
      setDirectMessages(prev => prev.filter(msg => msg.id !== messageId));
    }

    // Skip Supabase deletion for temp messages
    if (messageId.startsWith('temp-')) {
      console.log('[useChatActions] Skipping Supabase deletion for temp message:', messageId);
      return true;
    }

    // Determine if this is a club or direct message
    const isDirectMessage = messageId.includes('dm-') || !messageId.includes('club-');
    const table = isDirectMessage ? 'direct_messages' : 'club_chat_messages';

    try {
      console.log(`[useChatActions] Deleting ${isDirectMessage ? 'direct' : 'club'} message from Supabase:`, messageId);
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', messageId);
      
      if (error) {
        console.error('[useChatActions] Error deleting message:', error);
        toast({
          title: "Delete Error",
          description: error.message || "Failed to delete message",
          variant: "destructive"
        });
        
        // Fetch the message again if deletion failed
        const { data: message } = await supabase
          .from(table)
          .select('*')
          .eq('id', messageId)
          .single();
        
        if (message) {
          if (isDirectMessage && setDirectMessages) {
            setDirectMessages(prev => [...prev, {
              ...message,
              isUserMessage: String(message.sender_id) === String(currentUser?.id)
            }]);
          } else if (!isDirectMessage && setClubMessages) {
            setClubMessages(prevMessages => {
              const clubId = message.club_id;
              const clubMessages = prevMessages[clubId] || [];
              return {
                ...prevMessages,
                [clubId]: [...clubMessages, message]
              };
            });
          }
        }
        
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[useChatActions] Unexpected error deleting message:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the message",
        variant: "destructive"
      });
      return false;
    }
  }, [currentUser]);

  return {
    sendMessageToClub,
    sendDirectMessage,
    deleteMessage
  };
};
