
import React, { useEffect, useRef } from 'react';
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
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

const ChatClubContainer: React.FC<ChatClubContainerProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  messages = {}, // No longer the primary source of truth
  unreadClubs = new Set(),
  onSendMessage,
  onDeleteMessage,
  setClubMessages
}) => {
  const {
    navigateToClubDetail
  } = useNavigation();
  const {
    markClubMessagesAsRead
  } = useUnreadMessages();
  
  // Add a ref to track renders for debugging
  const renderCountRef = useRef(0);
  const previousSelectedClubRef = useRef<string | null>(null);
  
  // Debug effect to track renders
  useEffect(() => {
    renderCountRef.current += 1;
    console.log(`[ChatClubContainer] 🔄 Render #${renderCountRef.current}`, {
      selectedClub: selectedClub?.id,
      prevSelectedClub: previousSelectedClubRef.current,
      hasMessages: selectedClub ? (messages[selectedClub.id]?.length || 0) : 0
    });
    
    if (selectedClub?.id !== previousSelectedClubRef.current) {
      previousSelectedClubRef.current = selectedClub?.id || null;
    }
  });

  // Mark messages as read when a club is selected
  useEffect(() => {
    if (selectedClub) {
      console.log(`[ChatClubContainer] 📋 Selected club: ${selectedClub.id}`);
      console.log(`[ChatClubContainer] ✅ Marking club ${selectedClub.id} messages as read`);

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
  }, [selectedClub, markClubMessagesAsRead]);

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

  // Create a key for forced re-renders when unread status changes
  const unreadKey = JSON.stringify([...unreadClubs].sort());
  const clubKey = selectedClub ? `club-${selectedClub.id}-${renderCountRef.current}` : 'no-club';

  // If no club is selected, show the clubs list
  if (!selectedClub) {
    return <div className="flex flex-col h-full overflow-hidden">
        <ChatSidebarContent 
          key={`sidebar-content-${unreadKey}`} 
          clubs={clubs} 
          selectedClub={selectedClub} 
          onSelectClub={onSelectClub} 
          onSelectUser={handleSelectUser} 
          activeTab="clubs" 
          unreadClubs={unreadClubs} 
        />
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
          key={clubKey}
          club={selectedClub} 
          onMatchClick={handleMatchClick} 
          onSelectUser={handleSelectUser} 
          onSendMessage={onSendMessage} 
          onDeleteMessage={onDeleteMessage} 
          setClubMessages={setClubMessages}
          clubId={selectedClub.id}
        />
      </div>
    </div>;
};

export default ChatClubContainer;
