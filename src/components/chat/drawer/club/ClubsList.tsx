
import React, { useState } from 'react';
import { Search, Users } from 'lucide-react';
import { Club } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ClubAvatar from '@/components/shared/ClubAvatar';

interface ClubsListProps {
  clubs: Club[];
  selectedClub?: Club | null;
  onSelectClub: (club: Club) => void;
  unreadClubs?: Set<string>;
  unreadCounts?: Record<string, number>;
  onSelectUser?: (userId: string, userName: string, userAvatar?: string) => void;
  setChatToDelete?: (chat: { id: string, name: string }) => void;
}

const ClubsList: React.FC<ClubsListProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  unreadClubs = new Set(),
  unreadCounts = {},
  onSelectUser,
  setChatToDelete
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredClubs = searchQuery 
    ? clubs.filter(club => 
        club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (club.bio || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : clubs;
    
  // Sort clubs: first by unread status, then alphabetically
  const sortedClubs = [...filteredClubs].sort((a, b) => {
    // Unread clubs come first
    if (unreadClubs.has(a.id) && !unreadClubs.has(b.id)) return -1;
    if (!unreadClubs.has(a.id) && unreadClubs.has(b.id)) return 1;
    
    // Then sort alphabetically
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      <div className="p-4 pb-2">
        <Input
          placeholder="Search clubs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
          prefix={<Search className="h-4 w-4 text-gray-400" />}
        />
      </div>
      
      <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
        {sortedClubs.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? "No clubs found" : "You aren't in any clubs yet"}
          </div>
        ) : (
          sortedClubs.map(club => (
            <Button
              key={club.id}
              variant="ghost"
              className={`w-full flex items-center gap-3 px-4 py-3 justify-start rounded-none ${
                selectedClub?.id === club.id ? "bg-gray-100" : ""
              }`}
              onClick={() => onSelectClub(club)}
            >
              <ClubAvatar 
                name={club.name}
                imageSrc={club.logo}
                size="md"
              />
              <div className="flex-1 text-left truncate">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{club.name}</span>
                  {unreadClubs.has(club.id) && (
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                  )}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Users className="w-3 h-3 mr-1" />
                  <span>
                    {/* Safely handle member_count which may not be available */}
                    {club.members ? club.members.length : (club as any).member_count || '?'} members
                  </span>
                </div>
              </div>
            </Button>
          ))
        )}
      </div>
    </div>
  );
};

export default ClubsList;
