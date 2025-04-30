
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
  setChatToDelete,
}) => {
  const { navigateToClubDetail } = useNavigation();
  const { lastMessages, sortedClubs } = useClubLastMessages(clubs);
  const { unreadClubs, markClubMessagesAsRead } = useUnreadMessages();
  
  // Add a debug effect to log unread clubs when they change
  useEffect(() => {
    console.log('[ClubsList] unreadClubs set updated:', Array.from(unreadClubs));
  }, [unreadClubs]);
  
  const handleClubClick = (club: Club, e: React.MouseEvent) => {
    e.preventDefault();
    onSelectClub(club);
    markClubMessagesAsRead(club.id);
    console.log('[ClubsList] Club selected for chat:', club.id);
  };

  const truncateMessage = (text: string) => {
    return text?.length > 50 ? `${text.substring(0, 50)}...` : text;
  };

  return (
    <div className="p-3">
      <h3 className="text-sm font-medium mb-2">Your Clubs</h3>
      
      <div className="space-y-1">
        {sortedClubs.map(club => {
          // Add the suggested debug logging
          console.log('[ClubsList] Rendering club:', {
            clubId: club.id,
            clubIdType: typeof club.id,
            isUnread: unreadClubs.has(club.id),
            unreadClubs: Array.from(unreadClubs)
          });
          
          const lastMessage = lastMessages[club.id];
          const formattedTime = lastMessage?.timestamp 
            ? formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: false })
            : '';
          const isUnread = unreadClubs.has(club.id);
          
          console.log(`[ClubsList] Club ${club.name} isUnread:`, isUnread);
            
          return (
            <div key={club.id} className="flex flex-col relative group">
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
                      <p className={`truncate text-lg ${isUnread ? '!font-bold' : 'font-medium'}`}>
                        {club.name}
                      </p>
                      {isUnread && (
                        <Badge variant="dot" className="ml-2 !inline-block !visible" />
                      )}
                    </div>
                    {formattedTime && (
                      <span className={`ml-2 text-xs ${isUnread ? '!font-bold !text-gray-900' : 'text-gray-500'}`}>
                        {formattedTime}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    {lastMessage ? (
                      <p className={`text-sm ${isUnread ? '!font-bold !text-gray-900' : 'text-gray-600'} truncate pr-2`}>
                        <span className={isUnread ? '!font-bold' : 'font-medium'}>
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
