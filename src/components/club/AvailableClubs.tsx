
import React from 'react';
import { UserPlus } from 'lucide-react';
import Button from '../shared/Button';
import { formatLeagueWithTier } from '@/lib/format';
import UserAvatar from '../shared/UserAvatar';
import { Division } from '@/types';
import { useNavigation } from '@/hooks/useNavigation';

interface AvailableClub {
  id: string;
  name: string;
  division: Division;
  tier: number;
  members: number;
  logo?: string;
}

interface AvailableClubsProps {
  clubs: AvailableClub[];
  onRequestJoin: (clubId: string, clubName: string) => void;
}

const AvailableClubs: React.FC<AvailableClubsProps> = ({ clubs, onRequestJoin }) => {
  const { navigateToClubDetail } = useNavigation();

  const handleClubClick = (club: AvailableClub) => {
    navigateToClubDetail(club.id, {
      id: club.id,
      name: club.name,
      division: club.division,
      tier: club.tier,
      members: [],
      logo: club.logo || '/placeholder.svg',
      matchHistory: []
    });
  };

  if (clubs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <p className="text-gray-500 text-center py-4">
          No clubs available to join at the moment
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <p className="text-gray-500 text-sm mb-4">
        Clubs looking for members
      </p>

      <div className="space-y-3">
        {clubs.map((club) => (
          <div 
            key={club.id} 
            className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0"
          >
            <div 
              className="flex items-center gap-3 cursor-pointer hover:text-primary"
              onClick={() => handleClubClick(club)}
            >
              <UserAvatar
                name={club.name}
                image={club.logo}
                size="sm"
                className="h-10 w-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClubClick(club);
                }}
              />
              <div>
                <h3 className="font-medium text-sm">{club.name}</h3>
                <span className="text-xs text-gray-500">
                  {formatLeagueWithTier(club.division, club.tier)} • {club.members}/5 members
                </span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
              icon={<UserPlus className="h-4 w-4" />}
              onClick={(e) => {
                e.stopPropagation();
                onRequestJoin(club.id, club.name);
              }}
            >
              Request
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableClubs;
