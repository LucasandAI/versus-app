
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
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

const ChatClubContent = ({ 
  club,
  messages,
  onMatchClick,
  onSelectUser,
  onSendMessage,
  setClubMessages
}: ChatClubContentProps) => {
  const { navigateToClubDetail } = useNavigation();
  const [isSending, setIsSending] = useState(false);
  const { deleteMessage } = useChatActions();

  const handleDeleteMessage = async (messageId: string) => {
    console.log('[ChatClubContent] Deleting message:', messageId);
    // Pass setClubMessages to enable optimistic deletion
    await deleteMessage(messageId, setClubMessages);
  };

  const handleClubClick = () => {
    if (club && club.id) {
      // This will navigate to the full club detail page when clicking on the header
      navigateToClubDetail(club.id, club);
      
      // Close the chat drawer after navigation
      const event = new CustomEvent('chatDrawerClosed');
      window.dispatchEvent(event);
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
    <div className="flex flex-col h-full relative">
      <ChatHeader 
        club={club}
        onMatchClick={onMatchClick}
        onSelectUser={onSelectUser}
        onClubClick={handleClubClick}
      />
      
      <div className="flex-1 overflow-y-auto">
        <ChatMessages 
          messages={messages} 
          clubMembers={club.members || []}
          onDeleteMessage={handleDeleteMessage}
          onSelectUser={onSelectUser}
        />
      </div>
      
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t">
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
