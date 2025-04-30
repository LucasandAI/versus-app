
import React, { useEffect } from 'react';
import { Club } from '@/types';
import UserAvatar from '../../shared/UserAvatar';
import ClubMembersPopover from './ClubMembersPopover';
import { useNavigation } from '@/hooks/useNavigation';
import { formatDistanceToNow } from 'date-fns';
import { useClubLastMessages } from '@/hooks/chat/messages/useClubLastMessages';
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
}

const ClubsList: React.FC<ClubsListProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  onSelectUser,
  unreadClubs: propUnreadClubs,
  setChatToDelete,
}) => {
  const { navigateToClubDetail } = useNavigation();
  const { lastMessages, sortedClubs } = useClubLastMessages(clubs);
  const { unreadClubs: contextUnreadClubs, markClubMessagesAsRead } = useUnreadMessages();
  
  // Use either the passed props (preferred) or fall back to context
  const unreadClubs = propUnreadClubs || contextUnreadClubs;
  
  // Add a debug effect to log unread clubs when they change
  useEffect(() => {
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
      <h3 className="text-sm font-medium mb-2">Your Clubs</h3>
      
      <div className="space-y-1">
        {sortedClubs.map(club => {
          // Get club ID as string to ensure consistent comparison
          const clubId = String(club.id);
          const isUnread = unreadClubs.has(clubId);
          
          console.log(`[ClubsList] Rendering club ${club.name} (${clubId}), isUnread:`, isUnread);
          console.log(`[ClubsList] Club ${clubId} contained in unreadClubs:`, 
            Array.from(unreadClubs).includes(clubId));
          
          const lastMessage = lastMessages[club.id];
          const formattedTime = lastMessage?.timestamp 
            ? formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: false })
            : '';
            
          return (
            <div 
              // Use a composite key that changes when unread status changes
              key={`${club.id}-${isUnread ? 'unread' : 'read'}-${unreadKey}`}
              className="flex flex-col relative group"
            >
              <button 
                className={`w-full flex items-center p-3 rounded-md text-left transition-colors ${
                  selectedClub?.id === club.id ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'
                }`} 
                onClick={(e) => handleClubClick(club, e)}
              >
                <div className="flex-shrink-0 mr-3 relative">
                  <UserAvatar name={club.name} image={club.logo || ''} size="lg" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <p 
                        className={`truncate text-lg ${isUnread ? 'font-bold' : 'font-medium'}`}
                        style={{
                          fontWeight: isUnread ? 900 : 400,
                          color: isUnread ? 'black' : 'inherit' 
                        }}
                      >
                        {club.name}
                      </p>
                      {isUnread && (
                        <Badge 
                          variant="dot" 
                          className="ml-2 !inline-block !visible" 
                          style={{
                            display: 'block', 
                            opacity: 1, 
                            visibility: 'visible' as const,
                            backgroundColor: '#ef4444',
                            width: '8px',
                            height: '8px',
                            minWidth: '8px',
                            minHeight: '8px',
                            borderRadius: '50%'
                          }}
                        />
                      )}
                    </div>
                    {formattedTime && (
                      <span 
                        className={`ml-2 text-xs ${isUnread ? 'font-bold text-gray-900' : 'text-gray-500'}`}
                        style={{
                          fontWeight: isUnread ? 700 : 400,
                          color: isUnread ? '#111827' : ''
                        }}
                      >
                        {formattedTime}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    {lastMessage ? (
                      <p 
                        className={`text-sm ${isUnread ? 'font-bold text-gray-900' : 'text-gray-600'} truncate pr-2`}
                        style={{
                          fontWeight: isUnread ? 700 : 400,
                          color: isUnread ? '#111827' : ''
                        }}
                      >
                        <span 
                          className={isUnread ? 'font-bold' : 'font-medium'}
                          style={{
                            fontWeight: isUnread ? 700 : 500
                          }}
                        >
                          {lastMessage.sender?.name || 'Unknown'}:
                        </span>{' '}
                        {truncateMessage(lastMessage.message)}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 truncate pr-2">
                        No messages yet
                      </p>
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
