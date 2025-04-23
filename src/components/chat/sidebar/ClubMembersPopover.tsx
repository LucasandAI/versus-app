
import React from 'react';
import { ChevronDown, Users } from 'lucide-react';
import { PopoverContent, PopoverTrigger, Popover } from "@/components/ui/popover";
import UserAvatar from '../../shared/UserAvatar';
import { Club } from '@/types';
import { useNavigation } from '@/hooks/useNavigation';

interface ClubMembersPopoverProps {
  club: Club;
  onSelectUser?: (userId: string, userName: string, userAvatar?: string) => void;
}

const ClubMembersPopover: React.FC<ClubMembersPopoverProps> = ({
  club,
  onSelectUser
}) => {
  const {
    navigateToUserProfile
  } = useNavigation();
  
  const handleUserClick = (member: any) => {
    if (onSelectUser) {
      onSelectUser(member.id, member.name, member.avatar);
    } else {
      navigateToUserProfile(member.id, member.name, member.avatar);
    }
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 cursor-pointer">
          <Users size={14} />
          <span>{club.members?.length || 0} members</span>
          <ChevronDown size={14} />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-2" align="start">
        <h4 className="text-sm font-medium mb-2">Club Members</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {club.members.map(member => (
            <div 
              key={member.id} 
              className="w-full flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-md cursor-pointer" 
              onClick={() => handleUserClick(member)}
            >
              <UserAvatar 
                name={member.name} 
                image={member.avatar} 
                size="sm" 
                className="cursor-pointer" 
                onClick={e => {
                  e && e.stopPropagation();
                  handleUserClick(member);
                }} 
              />
              <span className="text-sm truncate cursor-pointer hover:text-primary">
                {member.name}
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ClubMembersPopover;
