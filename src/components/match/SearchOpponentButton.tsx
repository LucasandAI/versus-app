
import React from 'react';
import { Button } from '@/components/ui/button';
import { useMatchmaking } from '@/hooks/match/useMatchmaking';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { SearchIcon } from 'lucide-react';

interface SearchOpponentButtonProps {
  club: Club;
}

const SearchOpponentButton: React.FC<SearchOpponentButtonProps> = ({ club }) => {
  const { currentUser } = useApp();
  const { isSearching, searchForOpponent, isClubAdmin } = useMatchmaking(currentUser);
  
  const handleSearchClick = async () => {
    await searchForOpponent(club.id, club.division, club.tier);
  };
  
  // Only show the button to admins
  if (!isClubAdmin(club.id)) {
    return null;
  }
  
  return (
    <Button 
      onClick={handleSearchClick}
      disabled={isSearching}
      className="w-full flex justify-center items-center gap-2"
      size="sm"
    >
      <SearchIcon className="w-4 h-4" />
      {isSearching ? 'Searching...' : 'Search for Opponent'}
    </Button>
  );
};

export default SearchOpponentButton;
