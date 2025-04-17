
import React from 'react';
import { Club } from '@/types';
import UserAvatar from '../shared/UserAvatar';

interface ChatSidebarProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ clubs, selectedClub, onSelectClub }) => {
  return (
    <div className="w-[240px] border-r overflow-auto">
      <div className="p-3">
        <h3 className="text-sm font-medium mb-2">Your Clubs</h3>
        
        <div className="space-y-1">
          {clubs.map((club) => (
            <button
              key={club.id}
              className={`w-full flex items-center p-2 rounded-md text-left transition-colors ${
                selectedClub?.id === club.id 
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => onSelectClub(club)}
            >
              <div className="flex-shrink-0 mr-2">
                {club.logo ? (
                  <img src={club.logo} alt={club.name} className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="bg-gray-200 h-8 w-8 rounded-full flex items-center justify-center">
                    <span className="font-bold text-xs text-gray-700">{club.name.substring(0, 2)}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{club.name}</p>
                <p className="text-xs text-gray-500 truncate">{club.members.length} members</p>
              </div>
            </button>
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
