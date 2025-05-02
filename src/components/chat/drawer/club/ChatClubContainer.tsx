
import React, { useEffect, useState } from 'react';
import { Club } from '@/types';
import ChatSidebarContent from '../ChatSidebarContent';
import ChatClubContent from '../../../chat/ChatClubContent';
import { ArrowLeft } from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';
import { useNavigation } from '@/hooks/useNavigation';
import { useUnreadMessages } from '@/context/unread-messages';

interface ChatClubContainerProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  messages?: Record<string, any[]>;
  unreadClubs?: Set<string>;
  onSendMessage: (message: string, clubId?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  activeClubId?: string | null;
}

const ChatClubContainer: React.FC<ChatClubContainerProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  messages = {},
  unreadClubs = new Set(),
  onSendMessage,
  onDeleteMessage,
  activeClubId
}) => {
  const {
    navigateToClubDetail
  } = useNavigation();
  const {
    markClubMessagesAsRead
  } = useUnreadMessages();
  
  // Local state for recording active club ID
  const [localActiveClubId, setLocalActiveClubId] = useState<string | null>(activeClubId || null);

  // Mark messages as read when a club is selected
  useEffect(() => {
    if (selectedClub) {
      console.log(`[ChatClubContainer] Selected club: ${selectedClub.id} (type: ${typeof selectedClub.id})`);
      console.log(`[ChatClubContainer] Marking club ${selectedClub.id} messages as read`);
      console.log(`[ChatClubContainer] Current unreadClubs:`, Array.from(unreadClubs));
      
      // Update local active club ID
      setLocalActiveClubId(selectedClub.id);

      // Mark as read when selected
      markClubMessagesAsRead(selectedClub.id);

      // Dispatch club selected event for other components
      window.dispatchEvent(new CustomEvent('clubSelected', {
        detail: {
          clubId: selectedClub.id
        }
      }));
    }
    return () => {
      // Dispatch club deselected event when component unmounts or club changes
      window.dispatchEvent(new CustomEvent('clubDeselected'));
    };
  }, [selectedClub, markClubMessagesAsRead, unreadClubs]);

  const handleMatchClick = () => {
    // Future implementation
  };

  const handleSelectUser = (userId: string, userName: string, userAvatar?: string) => {
    const event = new CustomEvent('openDirectMessage', {
      detail: {
        userId,
        userName,
        userAvatar
      }
    });
    window.dispatchEvent(event);
  };

  const handleGoBack = () => {
    onSelectClub(null);
  };

  const handleClubClick = () => {
    if (selectedClub) {
      navigateToClubDetail(selectedClub.id, selectedClub);
    }
  };

  // Log club messages for debugging
  useEffect(() => {
    if (selectedClub && messages) {
      console.log(`[ChatClubContainer] Club messages for ${selectedClub.id}:`, {
        hasMessages: selectedClub.id in messages,
        messageCount: messages[selectedClub.id]?.length || 0
      });
    }
  }, [selectedClub, messages]);

  // If no club is selected, show the clubs list
  if (!selectedClub) {
    return <div className="flex flex-col h-full overflow-hidden">
        <ChatSidebarContent clubs={clubs} selectedClub={selectedClub} onSelectClub={onSelectClub} onSelectUser={handleSelectUser} activeTab="clubs" unreadClubs={unreadClubs} />
      </div>;
  }

  // If a club is selected, show the full-width chat
  return <div className="flex flex-col h-full">
      <div className="border-b p-3 flex items-center">
        <button onClick={handleGoBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div onClick={handleClubClick} className="flex-1 flex justify-center items-center gap-2 cursor-pointer hover:text-primary transition-colors px-0 mx-auto">
          <UserAvatar name={selectedClub.name} image={selectedClub.logo} size="sm" />
          <h3 className="font-semibold">{selectedClub.name}</h3>
        </div>
        <div className="w-9"></div>
      </div>
      
      <div className="flex-1">
        <ChatClubContent 
          club={selectedClub} 
          onMatchClick={handleMatchClick} 
          onSelectUser={handleSelectUser} 
          onSendMessage={onSendMessage} 
          onDeleteMessage={onDeleteMessage}
          clubId={selectedClub.id}
          setActiveClubId={setLocalActiveClubId}
        />
      </div>
    </div>;
};

export default ChatClubContainer;
