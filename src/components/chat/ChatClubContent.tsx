
import React, { useRef } from 'react';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  
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
          clubMembers={[]} 
          onSelectUser={onSelectUser}
          onDeleteMessage={onDeleteMessage}
          currentUserAvatar={currentUser?.avatar}
          scrollRef={scrollRef}
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
