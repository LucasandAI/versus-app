
import React, { useEffect } from 'react';
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

  const handleDeleteMessage = async (messageId: string) => {
    try {
      if (!currentUser?.id) {
        console.error('No authenticated user found');
        toast({
          title: "Error",
          description: "You must be logged in to delete messages",
          variant: "destructive"
        });
        return;
      }

      console.log('Attempting to delete message:', messageId, 'by user:', currentUser.id);
      
      const { data, error } = await supabase
        .from('club_chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', currentUser.id)
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
      
      if (!data || data.length === 0) {
        toast({
          title: "Warning",
          description: "Could not delete message. You may not have permission.",
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
    </div>
  );
};

export default ChatClubContent;
