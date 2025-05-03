import React, { memo, useCallback } from 'react';
import { Club } from '@/types/club';
import ChatMessages from '../../ChatMessages';
import ClubMessageInput from './ClubMessageInput';
import { useUnreadMessages } from '@/context/unread-messages';
import { useApp } from '@/context/AppContext';

interface ChatClubContainerProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  messages: Record<string, any[]>;
  unreadClubs: Set<string>;
  onSendMessage: (message: string, clubId?: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
}

const ChatClubContainer: React.FC<ChatClubContainerProps> = memo(({
  clubs,
  selectedClub,
  onSelectClub,
  messages,
  unreadClubs,
  onSendMessage,
  onDeleteMessage
}) => {
  const { currentUser } = useApp();
  const { markClubMessagesAsRead } = useUnreadMessages();

  // Handle club selection and mark as read
  const handleSelectClub = useCallback((club: Club) => {
    onSelectClub(club);
    
    // Mark club messages as read when selected
    if (unreadClubs.has(club.id)) {
      markClubMessagesAsRead(club.id);
    }
  }, [onSelectClub, unreadClubs, markClubMessagesAsRead]);

  // Format time for messages
  const formatTime = useCallback((isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);

  return (
    <div className="flex flex-col h-full">
      {selectedClub ? (
        <>
          <div className="flex-1 min-h-0">
            <ChatMessages
              messages={messages[selectedClub.id] || []}
              clubMembers={selectedClub.members}
              onSelectUser={(userId, userName, userAvatar) => {
                // Handle user selection if needed
              }}
              currentUserAvatar={currentUser?.avatar}
              formatTime={formatTime}
            />
          </div>
          <ClubMessageInput
            onSendMessage={(message) => onSendMessage(message, selectedClub.id)}
            isSending={false}
            clubId={selectedClub.id}
          />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Select a club to start chatting</p>
        </div>
      )}
    </div>
  );
});

ChatClubContainer.displayName = 'ChatClubContainer';

export default ChatClubContainer; 