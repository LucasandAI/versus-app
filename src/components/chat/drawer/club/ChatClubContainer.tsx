
import React, { useState } from 'react';
import { Club } from '@/types';
import { ArrowLeft } from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';
import ClubsList from '../../sidebar/ClubsList';
import ChatClubContent from '../../ChatClubContent';

interface ChatClubContainerProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  messages: Record<string, any[]>;
  onSendMessage: (message: string, clubId?: string) => void;
  unreadCounts: Record<string, number>;
  onDeleteChat?: (chatId: string, isTicket?: boolean) => void;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

const ChatClubContainer: React.FC<ChatClubContainerProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  messages,
  onSendMessage,
  unreadCounts,
  onDeleteChat,
  setClubMessages
}) => {
  const handleGoBack = () => {
    onSelectClub(null as any);
  };

  const handleMatchClick = () => {
    console.log('[ChatClubContainer] Match clicked');
  };

  return (
    <div className="flex flex-col w-full h-full bg-white">
      {!selectedClub ? (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h1 className="text-4xl font-bold">Club Chats</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ClubsList
              clubs={clubs}
              selectedClub={selectedClub}
              onSelectClub={onSelectClub}
              onDeleteChat={onDeleteChat}
              unreadCounts={unreadMessages}
              onSelectUser={() => {}}
              setChatToDelete={() => {}}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex items-center border-b p-3 gap-3">
            <button onClick={handleGoBack} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3 flex-1 justify-center">
              <UserAvatar 
                name={selectedClub.name} 
                image={selectedClub.logo || ''} 
                size="sm"
              />
              <span className="font-semibold text-lg">{selectedClub.name}</span>
            </div>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
          
          <div className="flex-1 overflow-hidden">
            <ChatClubContent
              club={selectedClub}
              messages={messages[selectedClub.id] || []}
              onMatchClick={handleMatchClick}
              onSelectUser={() => {}}
              onSendMessage={(message) => onSendMessage(message, selectedClub.id)}
              setClubMessages={setClubMessages}
              clubId={selectedClub.id}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatClubContainer;
