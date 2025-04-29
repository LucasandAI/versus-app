
import React, { useEffect, useState } from 'react';
import { Club } from '@/types';
import UserAvatar from '../../shared/UserAvatar';
import ClubMembersPopover from './ClubMembersPopover';
import { useNavigation } from '@/hooks/useNavigation';
import { formatDistanceToNow } from 'date-fns';
import { useClubLastMessages } from '@/hooks/chat/messages/useClubLastMessages';
import { useUnreadCounts } from '@/hooks/chat/useUnreadCounts';

interface ClubsListProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  unreadCounts: Record<string, number>;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  setChatToDelete: (data: {
    id: string;
    name: string;
    isTicket: boolean;
  } | null) => void;
}

const ClubsList: React.FC<ClubsListProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  unreadCounts,
  onSelectUser,
  setChatToDelete,
}) => {
  const { navigateToClubDetail } = useNavigation();
  const lastMessages = useClubLastMessages(clubs);
  const { unreadClubs } = useUnreadCounts();
  
  // Local state to track which clubs should show as unread in the UI
  const [localUnreadClubs, setLocalUnreadClubs] = useState<Set<string>>(new Set());
  
  // Sync local state with unreadClubs from hook
  useEffect(() => {
    setLocalUnreadClubs(new Set(unreadClubs));
  }, [unreadClubs]);
  
  // Listen for real-time club message events
  useEffect(() => {
    const handleClubMessageReceived = (event: CustomEvent) => {
      if (event.detail?.clubId) {
        setLocalUnreadClubs(prev => {
          const updated = new Set(prev);
          updated.add(event.detail.clubId);
          return updated;
        });
      }
    };
    
    window.addEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    
    return () => {
      window.removeEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    };
  }, []);
  
  const handleClubClick = (club: Club, e: React.MouseEvent) => {
    e.preventDefault();
    onSelectClub(club);
    
    // Mark as read locally immediately for UI responsiveness
    setLocalUnreadClubs(prev => {
      const updated = new Set(prev);
      updated.delete(club.id);
      return updated;
    });
    
    console.log('[ClubsList] Club selected for chat:', club.id);
  };

  const truncateMessage = (text: string) => {
    return text?.length > 50 ? `${text.substring(0, 50)}...` : text;
  };

  return (
    <div className="p-3">
      <h3 className="text-sm font-medium mb-2">Your Clubs</h3>
      
      <div className="space-y-1">
        {clubs.map(club => {
          const lastMessage = lastMessages[club.id];
          const formattedTime = lastMessage?.timestamp 
            ? formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: false })
            : '';
          const isUnread = localUnreadClubs.has(club.id);
            
          return (
            <div key={club.id} className="flex flex-col relative group">
              <button 
                className={`w-full flex items-center p-3 rounded-md text-left transition-colors ${
                  selectedClub?.id === club.id ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'
                }`} 
                onClick={(e) => handleClubClick(club, e)}
              >
                <div className="flex-shrink-0 mr-3">
                  <UserAvatar name={club.name} image={club.logo || ''} size="lg" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className={`font-medium truncate text-lg ${isUnread ? 'font-bold' : ''}`}>
                      {club.name}
                    </p>
                    {formattedTime && (
                      <span className={`ml-2 text-sm ${isUnread ? 'text-primary-foreground font-bold' : 'text-gray-500'}`}>
                        {formattedTime}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    {lastMessage ? (
                      <p className={`text-sm ${isUnread ? 'text-foreground font-semibold' : 'text-gray-600'} truncate pr-2`}>
                        <span className="font-medium">{lastMessage.sender?.name || 'Unknown'}: </span>
                        {truncateMessage(lastMessage.message)}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 truncate pr-2">
                        No messages yet
                      </p>
                    )}
                    {isUnread && (
                      <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                        •
                      </span>
                    )}
                  </div>
                  
                  <ClubMembersPopover club={club} onSelectUser={onSelectUser} />
                </div>
              </button>
            </div>
          );
        })}
        
        {clubs.length === 0 && (
          <div className="text-center py-4 text-sm text-gray-500">
            You don't have any clubs yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubsList;
