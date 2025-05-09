
import React, { useRef, useEffect } from 'react';
import { Club } from '@/types';
import ChatMessages from './ChatMessages';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import { useApp } from '@/context/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatClubContentProps {
  club: Club;
  messages: any[];
  onMatchClick: () => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string) => void;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  clubId: string;
  globalMessages?: Record<string, any[]>;
  onDeleteMessage?: (messageId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const ChatClubContent: React.FC<ChatClubContentProps> = ({
  club,
  messages,
  onMatchClick,
  onSelectUser,
  onSendMessage,
  onDeleteMessage,
  setClubMessages,
  clubId,
  globalMessages,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}) => {
  const { currentUser } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Store this reference to notify when the club is selected
  useEffect(() => {
    // Dispatch the club selected event to update real-time message status
    if (club?.id) {
      window.dispatchEvent(new CustomEvent('clubSelected', {
        detail: { clubId: club.id }
      }));
    }
    
    // Clean up on unmount
    return () => {
      window.dispatchEvent(new CustomEvent('clubDeselected'));
    };
  }, [club?.id]);
  
  return (
    <>
      <ChatHeader 
        club={club}
        onMatchClick={onMatchClick}
        onSelectUser={onSelectUser}
      />
      
      <div className="flex-1 overflow-hidden">
        <ChatMessages 
          messages={messages} 
          clubMembers={club.members || []} 
          onSelectUser={onSelectUser}
          onDeleteMessage={onDeleteMessage}
          currentUserAvatar={currentUser?.avatar}
          onLoadMore={onLoadMore}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
        />
      </div>
      
      <ChatInput 
        onSendMessage={onSendMessage} 
        placeholder={`Message ${club.name}`}
      />
    </>
  );
};

export default ChatClubContent;
