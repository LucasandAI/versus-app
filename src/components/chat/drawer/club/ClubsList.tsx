
import React, { useState } from 'react';
import { Club } from '@/types';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ClubAvatar from '@/components/shared/ClubAvatar';
import { Badge } from '@/components/ui/badge';

interface ClubsListProps {
  clubs: Club[];
  onSelectClub: (club: Club) => void;
  unreadClubs: Set<string>;
}

const ClubsList: React.FC<ClubsListProps> = ({ clubs, onSelectClub, unreadClubs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredClubs = clubs.filter(club => 
    club.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search clubs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredClubs.length === 0 ? (
          <div className="p-5 text-center text-gray-500">
            {searchQuery ? "No clubs found" : "No clubs available"}
          </div>
        ) : (
          <div className="divide-y">
            {filteredClubs.map((club) => (
              <button
                key={club.id}
                className={`w-full p-3 flex items-center hover:bg-gray-100 transition-colors ${
                  unreadClubs.has(club.id) ? 'bg-gray-50' : ''
                }`}
                onClick={() => onSelectClub(club)}
              >
                <div className="relative">
                  <ClubAvatar club={club} size="md" />
                  {unreadClubs.has(club.id) && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                <div className="ml-3 flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{club.name}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {club.member_count || club.members?.length || 0} members
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubsList;
