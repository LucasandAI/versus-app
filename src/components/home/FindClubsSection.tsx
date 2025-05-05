
import React from 'react';
import { Club } from '@/types';
import Button from '../shared/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import UserAvatar from '../shared/UserAvatar';
import { Search, PlusCircle } from 'lucide-react';
import { formatLeague } from '@/utils/club/leagueUtils';

interface FindClubsSectionProps {
  clubs: any[];
  isLoading: boolean;
  onRequestJoin: (clubId: string, clubName: string) => void;
  onSearchClick: () => void;
  onCreateClick: () => void;
}

const FindClubsSection: React.FC<FindClubsSectionProps> = ({
  clubs,
  isLoading,
  onRequestJoin,
  onSearchClick,
  onCreateClick,
}) => {
  const handleRequestJoin = (clubId: string, clubName: string) => {
    onRequestJoin(clubId, clubName);
  };

  // Slice to only show up to 3 clubs
  const displayedClubs = clubs.slice(0, 3);

  return (
    <Card className="mt-8">
      <CardHeader>
        <h2 className="text-lg font-semibold">Find a Club</h2>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between items-center py-3 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                  <div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded mt-1"></div>
                  </div>
                </div>
                <div className="w-24 h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : displayedClubs.length > 0 ? (
          <div className="space-y-4">
            {displayedClubs.map((club) => (
              <div key={club.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div className="flex items-center space-x-3">
                  <UserAvatar 
                    name={club.name} 
                    image={club.logo} 
                    size="sm"
                  />
                  <div>
                    <h3 className="font-medium">{club.name}</h3>
                    <p className="text-xs text-gray-500">
                      {formatLeague(club.division, club.tier)} • {club.members?.length || 0} members
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm"
                  variant="secondary"
                  onClick={() => handleRequestJoin(club.id, club.name)}
                >
                  Request
                </Button>
              </div>
            ))}
            
            {clubs.length > 3 && (
              <Button 
                variant="link" 
                size="sm"
                className="w-full text-primary mt-2"
                onClick={onSearchClick}
              >
                <Search className="h-4 w-4 mr-1" />
                Browse more clubs
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">No active clubs found</p>
            <Button
              onClick={onCreateClick}
              variant="outline"
              className="flex items-center"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create a club
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FindClubsSection;
