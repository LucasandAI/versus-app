
import React, { useState } from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import UserAvatar from '../shared/UserAvatar';
import { ChevronDown, Users, HelpCircle } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useApp } from '@/context/AppContext';

interface ChatSidebarProps {
  clubs: Club[];
  selectedClub: Club | null;
  selectedTicket: SupportTicket | null;
  supportTickets: SupportTicket[];
  onSelectClub: (club: Club) => void;
  onSelectTicket: (ticket: SupportTicket) => void;
  unreadCounts?: Record<string, number>;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  clubs, 
  selectedClub, 
  selectedTicket,
  supportTickets,
  onSelectClub,
  onSelectTicket,
  unreadCounts = {}
}) => {
  const { setCurrentView, setSelectedUser } = useApp();
  const [refreshKey] = useState(Date.now()); // Force component refresh

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
      {supportTickets.length > 0 && (
        <div className="p-3">
          <h3 className="text-sm font-medium mb-2">Support Tickets</h3>
          
          <div className="space-y-1">
            {supportTickets.map((ticket) => (
              <button
                key={`ticket-${ticket.id}-${refreshKey}`}
                className={`w-full flex items-center p-2 rounded-md text-left transition-colors ${
                  selectedTicket?.id === ticket.id 
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => onSelectTicket(ticket)}
              >
                <div className="flex-shrink-0 mr-2">
                  <div className="bg-blue-100 text-blue-700 h-8 w-8 rounded-full flex items-center justify-center">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{ticket.subject}</p>
                    {unreadCounts[ticket.id] > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadCounts[ticket.id] > 9 ? '9+' : unreadCounts[ticket.id]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-3">
        <h3 className="text-sm font-medium mb-2">Your Clubs</h3>
        
        <div className="space-y-1">
          {clubs.map((club) => (
            <div key={`${club.id}-${refreshKey}`} className="flex flex-col">
              <button
                className={`w-full flex items-center p-2 rounded-md text-left transition-colors ${
                  selectedClub?.id === club.id 
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => onSelectClub(club)}
              >
                <div className="flex-shrink-0 mr-2">
                  <UserAvatar 
                    name={club.name} 
                    image={club.logo || ''} 
                    size="sm"
                    key={`club-avatar-${club.id}-${refreshKey}`}
                  />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{club.name}</p>
                    {unreadCounts[club.id] > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadCounts[club.id] > 9 ? '9+' : unreadCounts[club.id]}
                      </span>
                    )}
                  </div>
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
                              key={`${member.id}-${refreshKey}`}
                              className="w-full flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-md"
                            >
                              <UserAvatar 
                                name={member.name} 
                                image={member.avatar} 
                                size="sm" 
                                className="cursor-pointer"
                                onClick={() => handleSelectUser(member.id, member.name, member.avatar)}
                                key={`member-avatar-${member.id}-${refreshKey}`}
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
