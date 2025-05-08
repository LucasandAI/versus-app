
import React, { useEffect, useMemo } from 'react';
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
  const unreadClubs = useMemo(() => {
    if (propUnreadClubs && propUnreadClubs.size > 0) {
      return propUnreadClubs;
    }
    return contextUnreadClubs;
  }, [propUnreadClubs, contextUnreadClubs]);
  
  // Add logging to track unread updates
  useEffect(() => {
    const logUnreadChanges = () => {
      console.log('[ClubsList] unreadClubs updated:', Array.from(unreadClubs));
    };
    
    window.addEventListener('unreadMessagesUpdated', logUnreadChanges);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', logUnreadChanges);
    };
  }, [unreadClubs]);
  
  const handleClubClick = (club: Club, e: React.MouseEvent) => {
    e.preventDefault();
    onSelectClub(club);
    
    // Mark as read and emit event for any other components to update
    markClubMessagesAsRead(club.id);
    window.dispatchEvent(new CustomEvent('clubSelected', { detail: { clubId: club.id } }));
    
    console.log('[ClubsList] Club selected for chat:', club.id);
  };

  const truncateMessage = (text: string) => {
    return text?.length > 50 ? `${text.substring(0, 50)}...` : text;
  };

  return (
    <div className="p-3">
      <h1 className="text-4xl font-bold mb-4">Clubs</h1>
      
      <div className="divide-y">
        {sortedClubs.map(club => {
          // Get club ID as string to ensure consistent comparison
          const clubId = String(club.id);
          const isUnread = unreadClubs.has(clubId);
          const isSelected = selectedClub?.id === club.id;
          
          const lastMessage = lastMessages[club.id];
          const formattedTime = lastMessage?.timestamp 
            ? formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: false })
            : '';
            
          return (
            <div 
              key={`${club.id}`}
              className={`flex items-start px-4 py-3 cursor-pointer hover:bg-gray-50 relative group
                ${isSelected ? 'bg-primary/10 text-primary' : ''}
                ${isUnread ? 'font-medium' : ''}`}
              onClick={(e) => handleClubClick(club, e)}
              data-club-id={clubId}
              data-unread={isUnread ? 'true' : 'false'}
            >
              <UserAvatar 
                name={club.name} 
                image={club.logo || ''} 
                size="lg"
                className="flex-shrink-0 mr-3"
              />

              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <h2 className={`text-lg truncate max-w-[60%] ${isUnread ? 'font-bold' : 'font-medium'}`}>
                    {club.name}
                  </h2>
                  {formattedTime && (
                    <span className={`text-xs ${isUnread ? 'font-bold' : 'text-gray-500'} flex-shrink-0 ml-auto`}>
                      {formattedTime}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center">
                  <p className={`text-sm truncate flex-1 ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                    {lastMessage ? (
                      <>
                        <span className={isUnread ? 'font-bold' : 'font-medium'}>
                          {lastMessage.sender?.name || 'Unknown'}:
                        </span>{' '}
                        {truncateMessage(lastMessage.message)}
                      </>
                    ) : (
                      "No messages yet"
                    )}
                  </p>
                  {isUnread && (
                    <Badge variant="dot" className="ml-2" />
                  )}
                </div>
                
                <ClubMembersPopover club={club} onSelectUser={onSelectUser} />
              </div>
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
