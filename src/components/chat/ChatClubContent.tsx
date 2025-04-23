
import React, { useState } from 'react';
import { Club } from '@/types';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useNavigation } from '@/hooks/useNavigation';
import { useChatActions } from '@/hooks/chat/useChatActions';

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
  const [isSending, setIsSending] = useState(false);
  const { deleteMessage } = useChatActions();

  const handleDeleteMessage = async (messageId: string) => {
    console.log('[ChatClubContent] Deleting message:', messageId);
    const success = await deleteMessage(messageId);
    
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
    console.log('[ChatClubContent] Sending message for club:', club.id);
    setIsSending(true);
    try {
      await onSendMessage(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader 
        club={club}
        onMatchClick={onMatchClick}
        onSelectUser={onSelectUser}
        onClubClick={handleClubClick}
      />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <ChatMessages 
          messages={messages} 
          clubMembers={club.members || []}
          onDeleteMessage={handleDeleteMessage}
          onSelectUser={onSelectUser}
        />
      </div>
      
      <div className="mt-auto border-t">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isSending={isSending}
          placeholder="Type a message..."
        />
      </div>
    </div>
  );
};

export default ChatClubContent;
