
import React, { useEffect, useRef } from 'react';
import { Club } from '@/types';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigation } from '@/hooks/useNavigation';
import { useApp } from '@/context/AppContext';

interface ChatClubContentProps {
  club: Club;
  messages: any[];
  onMatchClick: () => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string) => void;
}

const ChatClubContent = ({ 
  club,
  messages,
  onMatchClick,
  onSelectUser,
  onSendMessage
}: ChatClubContentProps) => {
  const { navigateToClub } = useNavigation();
  const { currentUser } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const messageToDelete = messages.find(msg => msg.id === messageId);
      if (!messageToDelete) {
        console.error(`Message with ID ${messageId} not found in local messages`);
        toast({
          title: "Error",
          description: "Message not found",
          variant: "destructive"
        });
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session check error:', sessionError);
        toast({
          title: "Error",
          description: "Could not verify user session",
          variant: "destructive"
        });
        return;
      }

      const sessionUserId = session?.user?.id;
      if (!sessionUserId) {
        console.error('No authenticated user found');
        toast({
          title: "Error",
          description: "You must be logged in to delete messages",
          variant: "destructive"
        });
        return;
      }

      // Debug logging - add more context about the IDs we're comparing
      console.log("Attempting message deletion...");
      console.log("Message ID:", messageId);
      console.log("Session user ID:", sessionUserId);
      console.log("Current user ID:", currentUser?.id);
      console.log("Message sender_id:", messageToDelete.sender_id);
      
      // First try to delete using sessionUserId
      console.log("Attempting deletion with session user ID");
      let { data, error } = await supabase
        .from('club_chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', sessionUserId)
        .select();

      // If that fails and we have a currentUser ID, try with that instead
      if ((!data || data.length === 0) && currentUser?.id && currentUser.id !== sessionUserId) {
        console.log("Session ID deletion failed, trying with currentUser ID");
        const secondAttempt = await supabase
          .from('club_chat_messages')
          .delete()
          .eq('id', messageId)
          .eq('sender_id', currentUser.id)
          .select();
        
        data = secondAttempt.data;
        error = secondAttempt.error;
      }

      if (error) {
        console.error('Supabase delete error:', error);
        toast({
          title: "Error",
          description: "Failed to delete message: " + error.message,
          variant: "destructive"
        });
        return;
      }
      
      console.log('Delete operation response:', data);
      
      if (!data || data.length === 0) {
        console.warn('No message was deleted. Likely ID mismatch or permission issue.');
        
        // Log additional details about the message for debugging
        if (messageToDelete) {
          console.log('Message details:', messageToDelete);
        }
        
        toast({
          title: "Warning",
          description: "Could not delete message. ID mismatch between sender and your account.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Message deleted",
        description: "Your message has been removed from the chat"
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleClubClick = () => {
    if (club && club.id) {
      navigateToClub(club);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader 
        club={club}
        onMatchClick={onMatchClick}
        onSelectUser={onSelectUser}
        onClubClick={handleClubClick}
      />
      
      <ChatMessages 
        messages={messages} 
        clubMembers={club.members || []}
        onDeleteMessage={handleDeleteMessage}
        onSelectUser={onSelectUser}
      />
      
      <ChatInput onSendMessage={onSendMessage} />
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatClubContent;
