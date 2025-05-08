
import React, { useEffect } from 'react';
import { Club } from '@/types';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useNavigation } from '@/hooks/useNavigation';
import { useClubChatMessages } from '@/hooks/chat/useClubChatMessages';

interface ChatClubContentProps {
  club: Club;
  onMatchClick: () => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  clubId?: string;
}

const ChatClubContent = ({ 
  club,
  onMatchClick,
  onSelectUser,
  clubId,
}: ChatClubContentProps) => {
  const { navigateToClubDetail } = useNavigation();
  const effectiveClubId = clubId || club?.id;
  
  // Use our new hook for club messages
  const {
    messages,
    isLoading,
    hasMore,
    loadMore,
    scrollRef,
    lastMessageRef,
    sendMessage,
    deleteMessage,
    isSubmitting,
    scrollToBottom
  } = useClubChatMessages(effectiveClubId);
  
  // Mark club as viewed to reset unread count
  useEffect(() => {
    if (effectiveClubId) {
      // Dispatch an event that the unread count context will listen for
      const event = new CustomEvent('clubSelected', { 
        detail: { clubId: effectiveClubId } 
      });
      window.dispatchEvent(event);
      
      return () => {
        window.dispatchEvent(new Event('clubDeselected'));
      };
    }
  }, [effectiveClubId]);

  const handleClubClick = () => {
    if (club && club.id) {
      navigateToClubDetail(club.id, club);
      const event = new CustomEvent('chatDrawerClosed');
      window.dispatchEvent(event);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (message.trim() && effectiveClubId) {
      await sendMessage(message);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (messageId) {
      await deleteMessage(messageId);
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
      
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 min-h-0">
          <ChatMessages 
            messages={messages} 
            clubMembers={club.members || []}
            onDeleteMessage={handleDeleteMessage}
            onSelectUser={onSelectUser}
            isLoading={isLoading}
            hasMore={hasMore}
            loadMore={loadMore}
            scrollRef={scrollRef}
            lastMessageRef={lastMessageRef}
          />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-white">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            conversationType="club"
            conversationId={effectiveClubId} 
            isSending={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatClubContent;
