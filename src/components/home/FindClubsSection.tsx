
import React from 'react';
import { Search } from 'lucide-react';
import AvailableClubs from '../club/AvailableClubs';
import Button from '../shared/Button';
import { Skeleton } from '../ui/skeleton';

interface FindClubsSectionProps {
  clubs: any[];
  isLoading?: boolean;
  onRequestJoin: (clubId: string, clubName: string) => void;
  onSearchClick: () => void;
  onCreateClick: () => void;
}

const FindClubsSection: React.FC<FindClubsSectionProps> = ({
  clubs,
  isLoading = false,
  onRequestJoin,
  onSearchClick,
  onCreateClick,
}) => {
  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Find Clubs</h2>
        <button 
          className="text-primary flex items-center gap-1"
          onClick={onSearchClick}
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Search</span>
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-md p-4">
          <Skeleton className="h-4 w-1/3 mb-6" />
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ) : (
        <AvailableClubs 
          clubs={clubs}
          onRequestJoin={onRequestJoin}
        />
      )}

      <div className="mt-6 text-center">
        <Button 
          variant="primary" 
          size="md"
          onClick={onCreateClick}
        >
          Create Club
        </Button>
      </div>
    </div>
  );
};

export default FindClubsSection;
