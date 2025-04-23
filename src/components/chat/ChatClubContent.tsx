
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
      // Attempt to delete the message from Supabase
      const { error } = await supabase
        .from('club_chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', currentUser?.id); // Ensure only the sender can delete their own messages

      if (error) {
        throw error;
      }

      toast({
        title: "Message deleted",
        description: "Your message has been removed from the chat"
      });
      
      // Note: We don't need to update messages state locally because the real-time subscription 
      // in MainChatDrawer will handle removing the message from the UI for all users
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

  console.log(`Rendering ChatClubContent for club: ${club.name}, messages:`, messages);

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
