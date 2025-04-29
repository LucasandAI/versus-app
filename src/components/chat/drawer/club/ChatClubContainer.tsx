
import React from 'react';
import { Club } from '@/types';
import ClubsList from '@/components/chat/sidebar/ClubsList';
import ChatMainContent from '../chat-content/ChatMainContent';

interface ChatClubContainerProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  messages?: Record<string, any[]>;
  onSendMessage?: (message: string, clubId?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  unreadClubs?: Set<string>;
}

const ChatClubContainer: React.FC<ChatClubContainerProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  messages = {},
  onSendMessage,
  onDeleteMessage,
  unreadClubs = new Set()
}) => {
  return (
    <div className="h-full flex">
      <div className="w-1/3 border-r overflow-y-auto">
        <ClubsList 
          clubs={clubs} 
          selectedClubId={selectedClub?.id} 
          onSelectClub={onSelectClub}
          unreadClubs={unreadClubs}
        />
      </div>
      <div className="w-2/3 flex flex-col overflow-hidden">
        {selectedClub ? (
          <ChatMainContent
            clubId={selectedClub.id}
            clubName={selectedClub.name}
            messages={selectedClub.id && messages ? messages[selectedClub.id] || [] : []}
            onSendMessage={(message) => onSendMessage?.(message, selectedClub.id)}
            onDeleteMessage={onDeleteMessage}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-4 text-center text-gray-500">
            <div>
              <p>Select a club to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatClubContainer;
