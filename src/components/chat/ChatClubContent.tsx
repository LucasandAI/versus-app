
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
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle deleting a message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const session = await supabase.auth.getSession();
      const sessionUserId = session.data.session?.user?.id;
      
      console.log('Delete attempt:', {
        messageId,
        sessionUserId,
        currentUserId: currentUser?.id,
      });
      
      if (!sessionUserId) {
        console.error('No active session user found');
        toast({
          title: "Error",
          description: "You must be logged in to delete messages",
          variant: "destructive"
        });
        return;
      }

      // Get the message first to verify ownership
      const { data: messageData, error: messageError } = await supabase
        .from('club_chat_messages')
        .select('sender_id')
        .eq('id', messageId)
        .single();

      if (messageError || !messageData) {
        console.error('Error fetching message:', messageError);
        toast({
          title: "Error",
          description: "Could not verify message ownership",
          variant: "destructive"
        });
        return;
      }

      console.log('Message ownership check:', {
        messageSenderId: messageData.sender_id,
        sessionUserId: sessionUserId,
        isOwner: messageData.sender_id === sessionUserId
      });

      if (messageData.sender_id !== sessionUserId) {
        toast({
          title: "Permission denied",
          description: "You can only delete your own messages",
          variant: "destructive"
        });
        return;
      }
      
      // Attempt to delete the message
      const { data, error } = await supabase
        .from('club_chat_messages')
        .delete()
        .eq('id', messageId)
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
        console.warn('No message was deleted.');
        toast({
          title: "Warning",
          description: "Message could not be deleted",
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
