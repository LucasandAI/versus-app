import React from 'react';
import { Users, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Club } from '@/types';
import UserAvatar from '../shared/UserAvatar';
import { useNavigation } from '@/hooks/useNavigation';

interface ChatHeaderProps {
  club?: Club;
  onSelectUser?: (userId: string, name: string, avatar?: string) => void;
  onClubClick?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  club,
  onSelectUser,
  onClubClick
}) => {
  const { navigateToClubDetail } = useNavigation();

  if (!club) {
    return null;
  }
  
  const handleClubClick = () => {
    if (onClubClick) {
      onClubClick();
    } else {
      navigateToClubDetail(club.id, club);
    }
  };

  return (
    <div className="border-b p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleClubClick}>
          <UserAvatar name={club.name} image={club.logo} size="md" />
          <div>
            <h3 className="font-medium">{club.name}</h3>
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-xs text-gray-500 hover:text-primary flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {club.members.length} members
                  <ChevronDown className="h-3 w-3 ml-1" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-2" align="start">
                <h4 className="text-sm font-medium mb-2">Club Members</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {club.members.map(member => (
                    <div key={member.id} className="w-full flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-md">
                      <UserAvatar 
                        name={member.name} 
                        image={member.avatar} 
                        size="sm" 
                        className="cursor-pointer" 
                        onClick={() => onSelectUser?.(member.id, member.name, member.avatar)} 
                      />
                      <span 
                        className="text-sm truncate cursor-pointer hover:text-primary" 
                        onClick={() => onSelectUser?.(member.id, member.name, member.avatar)}
                      >
                        {member.name}
                      </span>
                      {member.isAdmin && (
                        <span className="text-xs bg-primary/10 text-primary px-1 py-0.5 rounded ml-auto">
                          Admin
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;