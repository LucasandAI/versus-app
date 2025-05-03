
import React, { useMemo } from 'react';
import { Club } from '@/types';
import { User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useClubLastMessages } from '@/hooks/chat/messages/useClubLastMessages';
import ClubMembersPopover from './ClubMembersPopover';
import { formatTimeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import UserAvatar from '@/components/shared/UserAvatar';

interface ClubsListProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  unreadCounts?: Record<string, number>;
  unreadClubs?: Set<string>;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  setChatToDelete?: (chat: {id: string, name: string}) => void;
}

const ClubsList: React.FC<ClubsListProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  unreadClubs = new Set(),
  onSelectUser,
  setChatToDelete
}) => {
  // Use the club last messages hook for real-time updates
  const { lastMessages, sortedClubs } = useClubLastMessages(clubs);

  // Render the clubs list with unread indicators and last message information
  return (
    <div className="space-y-0.5 px-1">
      {sortedClubs.map(club => {
        const isSelected = selectedClub?.id === club.id;
        const lastMessage = lastMessages[club.id];
        const hasUnread = unreadClubs.has(club.id);
        
        // Format the last message preview with sender name and timestamp
        const messagePreview = lastMessage ? (
          <div className="truncate text-xs text-gray-500">
            <span className={cn("font-medium", hasUnread && "font-bold text-gray-700")}>
              {lastMessage.sender?.name || 'Unknown'}: 
            </span>{' '}
            <span className={cn(hasUnread && "font-semibold text-gray-600")}>
              {lastMessage.message}
            </span>
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">No messages yet</div>
        );
        
        const timestamp = lastMessage ? formatTimeAgo(lastMessage.timestamp) : '';
        
        return (
          <div
            key={club.id}
            className={cn(
              "p-2 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors",
              isSelected ? "bg-gray-100" : "bg-white",
              hasUnread && "border-l-4 border-primary"
            )}
            onClick={() => onSelectClub(club)}
          >
            <div className="flex items-center flex-1 min-w-0">
              <UserAvatar name={club.name} image={club.logo} size="sm" />
              <div className="ml-2 flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <div className={cn("font-medium truncate", hasUnread && "font-bold text-primary")}>
                    {club.name}
                  </div>
                  {timestamp && (
                    <div className={cn("text-xs text-gray-400 ml-1 shrink-0", hasUnread && "text-gray-700 font-semibold")}>
                      {timestamp}
                    </div>
                  )}
                </div>
                {messagePreview}
              </div>
            </div>
            
            <div className="ml-2 flex space-x-1">
              {hasUnread && (
                <Badge 
                  variant="dot" 
                  className="h-2 w-2 bg-red-500 rounded-full"
                />
              )}
              <ClubMembersPopover 
                clubId={club.id} 
                clubName={club.name} 
                onSelectUser={onSelectUser}
              />
            </div>
          </div>
        );
      })}
      
      {clubs.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          <User className="mx-auto h-10 w-10 text-gray-400 mb-2" />
          <p>You don't have any clubs yet</p>
          <p className="text-sm">Join a club to start chatting</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(ClubsList);
