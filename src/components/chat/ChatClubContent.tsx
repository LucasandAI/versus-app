
import React from 'react';
import { Club } from '@/types';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigation } from '@/hooks/useNavigation';

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

  const handleDeleteMessage = async (messageId: string) => {
    try {
      // Get the current auth session directly
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session?.user) {
        console.error('Authentication error:', sessionError || 'No authenticated session found');
        toast({
          title: "Error",
          description: "You must be logged in to delete messages",
          variant: "destructive"
        });
        return;
      }
      
      const authUserId = sessionData.session.user.id;
      
      console.log('[ChatClubContent] Attempting to delete message:', messageId, 'by user:', authUserId);
      
      // Delete the message (RLS will check if sender_id = auth.uid())
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

  const handleSendMessage = async (message: string) => {
    await onSendMessage(message);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
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
      
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatClubContent;
