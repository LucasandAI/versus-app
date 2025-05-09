
import React, { useEffect } from 'react';
import { Club } from '@/types';
import ChatClubContent from '../../ChatClubContent';

interface ChatMainContentProps {
  selectedClub: Club | null;
  selectedTicket: null;
  messages: Record<string, any[]>;
  onMatchClick: (club: Club) => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string, clubId?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  loadOlderMessages?: (clubId: string) => Promise<void>;
  isLoading?: Record<string, boolean>;
  hasMore?: Record<string, boolean>;
}

const ChatMainContent: React.FC<ChatMainContentProps> = ({
  selectedClub,
  messages,
  onMatchClick,
  onSelectUser,
  onSendMessage,
  onDeleteMessage,
  setClubMessages,
  loadOlderMessages,
  isLoading = {},
  hasMore = {},
}) => {
  useEffect(() => {
    // Dispatch event when a club is selected
    if (selectedClub?.id) {
      window.dispatchEvent(new CustomEvent('clubSelected', {
        detail: { clubId: selectedClub.id }
      }));
    }
    
    return () => {
      // Dispatch event when club is deselected
      window.dispatchEvent(new CustomEvent('clubDeselected'));
    };
  }, [selectedClub?.id]);

  // If we have a selected club, render the club content
  if (selectedClub) {
    const clubMessages = messages[selectedClub.id] || [];
    const isLoadingMore = isLoading[selectedClub.id] || false;
    const hasMoreMessages = hasMore[selectedClub.id] || false;
    
    // Define the load more function for this specific club
    const handleLoadMore = async () => {
      if (loadOlderMessages && hasMoreMessages && !isLoadingMore) {
        console.log('[ChatMainContent] Loading older messages for club:', selectedClub.id);
        await loadOlderMessages(selectedClub.id);
      }
    };
    
    return (
      <div className="flex-1 h-full flex flex-col">
        <ChatClubContent 
          key={selectedClub.id} // Force re-render when club changes
          club={selectedClub}
          messages={clubMessages}
          onMatchClick={() => onMatchClick(selectedClub)}
          onSelectUser={onSelectUser}
          onSendMessage={(message) => {
            console.log('[ChatMainContent] Sending club message to:', { 
              clubId: selectedClub.id, 
              messageLength: message.length 
            });
            onSendMessage(message, selectedClub.id);
          }}
          onDeleteMessage={onDeleteMessage}
          setClubMessages={setClubMessages}
          clubId={selectedClub.id}
          globalMessages={messages}
          onLoadMore={handleLoadMore}
          hasMore={hasMoreMessages}
          isLoadingMore={isLoadingMore}
        />
      </div>
    );
  }

  // If nothing is selected, show an empty state
  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      {selectedClub ? 'Loading chat...' : 'Select a club to start chatting'}
    </div>
  );
};

export default ChatMainContent;
