
import React from 'react';
import { Club } from '@/types';
import UserAvatar from '../shared/UserAvatar';
import { ChevronDown, Users } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useApp } from '@/context/AppContext';

interface ChatSidebarProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ clubs, selectedClub, onSelectClub }) => {
  const { setCurrentView, setSelectedUser } = useApp();

  const handleSelectUser = (userId: string, userName: string, userAvatar: string = '/placeholder.svg') => {
    setSelectedUser({
      id: userId,
      name: userName,
      avatar: userAvatar,
      stravaConnected: true,
      clubs: []
    });
    setCurrentView('profile');
  };

  return (
    <div className="w-[240px] border-r overflow-auto">
      <div className="p-3">
        <h3 className="text-sm font-medium mb-2">Your Clubs</h3>
        
        <div className="space-y-1">
          {clubs.map((club) => (
            <div key={club.id} className="flex flex-col">
              <button
                className={`w-full flex items-center p-2 rounded-md text-left transition-colors ${
                  selectedClub?.id === club.id 
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => onSelectClub(club)}
              >
                <div className="flex-shrink-0 mr-2">
                  {club.logo ? (
                    <img 
                      src={`${club.logo}?t=${Date.now()}`} 
                      alt={club.name} 
                      className="h-8 w-8 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="bg-gray-200 h-8 w-8 rounded-full flex items-center justify-center">
                      <span className="font-bold text-xs text-gray-700">{club.name.substring(0, 2)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{club.name}</p>
                  <div className="flex items-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="text-xs text-gray-500 hover:text-primary flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {club.members.length} members
                          <ChevronDown className="h-3 w-3 ml-1" />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-60 p-2" align="start">
                        <h4 className="text-sm font-medium mb-2">Club Members</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {club.members.map(member => (
                            <div
                              key={member.id}
                              className="w-full flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-md"
                            >
                              <UserAvatar 
                                name={member.name} 
                                image={member.avatar} 
                                size="sm" 
                                className="cursor-pointer"
                                onClick={() => handleSelectUser(member.id, member.name, member.avatar)}
                              />
                              <span 
                                className="text-sm truncate cursor-pointer hover:text-primary"
                                onClick={() => handleSelectUser(member.id, member.name, member.avatar)}
                              >
                                {member.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </button>
            </div>
          ))}
          
          {clubs.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              You don't have any clubs yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
