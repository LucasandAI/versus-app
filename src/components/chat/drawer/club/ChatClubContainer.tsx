
import React, { useState } from 'react';
import { Club } from '@/types';
import ChatDrawerContent from '../ChatDrawerContent';
import { BackButton } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ClubsList from '../../sidebar/ClubsList';

interface ChatClubContainerProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  messages: Record<string, any[]>;
  unreadClubs: Set<string>;
  onSendMessage: (message: string, clubId?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  loadOlderMessages?: (clubId: string) => Promise<void>;
  isLoading?: Record<string, boolean>;
  hasMore?: Record<string, boolean>;
}

const ChatClubContainer: React.FC<ChatClubContainerProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  messages,
  unreadClubs,
  onSendMessage,
  onDeleteMessage,
  loadOlderMessages,
  isLoading,
  hasMore
}) => {
  const handleSelectUser = (userId: string, userName: string, userAvatar?: string) => {
    // Dispatch event to open DM with selected user
    const openDmEvent = new CustomEvent('openDirectMessage', {
      detail: {
        userId,
        userName,
        userAvatar,
        conversationId: undefined // Will be determined by the DM handler
      }
    });
    
    window.dispatchEvent(openDmEvent);
  };
  
  if (clubs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Join a club to chat</p>
      </div>
    );
  }

  // Show full width club list when no club is selected
  if (!selectedClub) {
    return (
      <div className="w-full h-full">
        <ClubsList 
          clubs={clubs}
          selectedClub={selectedClub}
          onSelectClub={onSelectClub}
          unreadCounts={{}}
          unreadClubs={unreadClubs}
          onSelectUser={handleSelectUser}
          setChatToDelete={() => {}}
        />
      </div>
    );
  }

  // Show full width chat content when a club is selected
  return (
    <div className="w-full h-full flex flex-col">
      <div className="border-b p-3 flex items-center">
        <button 
          onClick={() => onSelectClub(null as any)} 
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 flex justify-center">
          <h2 className="text-lg font-semibold">{selectedClub.name}</h2>
        </div>
        <div className="w-10"></div> {/* For balanced spacing */}
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatDrawerContent 
          selectedClub={selectedClub}
          messages={messages}
          onMatchClick={(club: Club) => {}}
          onSelectUser={handleSelectUser}
          onSendMessage={onSendMessage}
          onDeleteMessage={onDeleteMessage}
          loadOlderMessages={loadOlderMessages}
          isLoading={isLoading}
          hasMore={hasMore}
        />
      </div>
    </div>
  );
};

export default ChatClubContainer;
