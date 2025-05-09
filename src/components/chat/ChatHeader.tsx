
import React from 'react';
import { Club } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import { useNavigation } from '@/hooks/useNavigation';

interface ChatHeaderProps {
  club: Club;
  onMatchClick: () => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  club, 
  onMatchClick, 
  onSelectUser 
}) => {
  const { navigateToClubDetail } = useNavigation();

  const handleHeaderClick = () => {
    if (club?.id) {
      navigateToClubDetail(club.id, club);
    }
  };

  return (
    <div 
      className="flex items-center p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={handleHeaderClick}
    >
      <UserAvatar 
        name={club.name} 
        image={club.logo || ''} 
        size="md"
        className="mr-3"
      />
      
      <div className="flex-1">
        <h2 className="font-semibold text-lg">{club.name}</h2>
        <p className="text-xs text-gray-500">
          {club.members ? `${club.members.length} members` : ''}
        </p>
      </div>
    </div>
  );
};

export default ChatHeader;
