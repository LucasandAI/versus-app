import React from 'react';
import { Club } from '@/types';
import UserAvatar from '../../shared/UserAvatar';
import ClubMembersPopover from './ClubMembersPopover';
import { useNavigation } from '@/hooks/useNavigation';
import { useUnreadMessages } from '@/context/unread-messages';
import { Badge } from '@/components/ui/badge';

interface ClubsListProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  unreadCounts: Record<string, number>;
  unreadClubs?: Set<string>;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  setChatToDelete: (data: {
    id: string;
    name: string;
    isTicket: boolean;
  } | null) => void;
  lastMessages: Record<string, any>;
  sortedClubs: Club[];
}

const ClubsList: React.FC<ClubsListProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  onSelectUser,
  unreadClubs: propUnreadClubs,
  setChatToDelete,
  lastMessages,
  sortedClubs,
}) => {
  const { navigateToClubDetail } = useNavigation();
  const { unreadClubs: contextUnreadClubs, markClubMessagesAsRead } = useUnreadMessages();
  
  // Use either the passed props (preferred) or fall back to context
  const unreadClubs = propUnreadClubs || contextUnreadClubs;
  
  // Add a debug effect to log unread clubs when they change
  React.useEffect(() => {
    console.log('[ClubsList] unreadClubs set updated:', Array.from(unreadClubs));
    console.log('[ClubsList] Using prop unread clubs?', !!propUnreadClubs);
  }, [unreadClubs, propUnreadClubs]);
  
  const handleClubClick = (club: Club, e: React.MouseEvent) => {
    e.preventDefault();
    onSelectClub(club);
    markClubMessagesAsRead(club.id);
    console.log('[ClubsList] Club selected for chat:', club.id);
  };

  const truncateMessage = (text: string) => {
    return text?.length > 50 ? `${text.substring(0, 50)}...` : text;
  };

  // Create a key that will change whenever unread status changes
  const unreadKey = Array.from(unreadClubs).join(',');

  return (
    <div className="p-3">
      <h1 className="text-4xl font-bold mb-4">Clubs</h1>
      
      <div className="divide-y">
        {clubs.map(club => {
          // Get club ID as string to ensure consistent comparison
          const clubId = String(club.id);
          const isUnread = unreadClubs.has(clubId);
          
          console.log(`[ClubsList] Rendering club ${club.name} (${clubId}), isUnread:`, isUnread);
          
          const lastMessage = lastMessages[club.id];
          
          return (
            <div 
              key={`${club.id}-${isUnread ? 'unread' : 'read'}-${unreadKey}`}
              className={`flex items-start px-4 py-3 cursor-pointer hover:bg-gray-50 relative group
                ${selectedClub?.id === club.id ? 'bg-primary/10 text-primary' : ''}
                ${isUnread ? 'font-medium' : ''}`}
              onClick={(e) => handleClubClick(club, e)}
            >
              <UserAvatar 
                name={club.name} 
                image={club.logo || ''} 
                size="lg"
                className="flex-shrink-0 mr-3"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium truncate">{club.name}</h3>
                </div>
                {lastMessage && (
                  <p className="text-sm text-gray-500 truncate">
                    {truncateMessage(lastMessage.message)}
                  </p>
                )}
              </div>
              {isUnread && (
                <div className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  New
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClubsList;
