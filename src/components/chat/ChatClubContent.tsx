
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
  // Scroll ref to move to bottom on new messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle deleting a message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      console.log(`Attempting to delete message with ID: ${messageId} by user ${currentUser?.id}`);
      
      if (!currentUser?.id) {
        console.error('No current user found');
        toast({
          title: "Error",
          description: "You must be logged in to delete messages",
          variant: "destructive"
        });
        return;
      }
      
      // Attempt to delete the message from Supabase
      const { data, error } = await supabase
        .from('club_chat_messages')
        .delete()
        .match({ id: messageId, sender_id: currentUser.id })
        .select();

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
      
      // If data is empty array, the message might not exist or belong to this user
      if (!data || data.length === 0) {
        console.warn('No message was deleted. Message may not exist or you may not have permission.');
        toast({
          title: "Warning",
          description: "No message was deleted. You can only delete your own messages.",
          variant: "destructive"
        });
        return;
      }
      
      // Successful deletion
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
