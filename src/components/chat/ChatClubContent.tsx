
import React from 'react';
import { Club } from '@/types';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useNavigation } from '@/hooks/useNavigation';
import { useChatActions } from '@/hooks/chat/useChatActions';
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
  
  // currentUser is still passed but not used for sender_id checks anymore
  const { deleteMessage } = useChatActions(currentUser);

  const handleDeleteMessage = async (messageId: string) => {
    console.log('[ChatClubContent] Deleting message:', messageId);
    const success = await deleteMessage(messageId);
    
    // No need to show a toast here as the useChatActions hook already handles that
    if (!success) {
      console.log('[ChatClubContent] Failed to delete message');
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
