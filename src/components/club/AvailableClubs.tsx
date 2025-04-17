
import React from 'react';
import { UserPlus } from 'lucide-react';
import Button from '../shared/Button';
import { formatLeagueWithTier } from '@/lib/format';

interface AvailableClub {
  id: string;
  name: string;
  division: string;
  tier: number;
  members: number;
}

interface AvailableClubsProps {
  clubs: AvailableClub[];
  onRequestJoin: (clubId: string, clubName: string) => void;
}

const AvailableClubs: React.FC<AvailableClubsProps> = ({ clubs, onRequestJoin }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <p className="text-gray-500 text-sm mb-4">
        Clubs looking for members
      </p>

      <div className="space-y-3">
        {clubs.map((club) => (
          <div key={club.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
            <div className="flex items-center gap-3">
              <div className="bg-gray-200 h-10 w-10 rounded-full flex items-center justify-center">
                <span className="font-bold text-xs text-gray-700">{club.name.substring(0, 2)}</span>
              </div>
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
              onClick={() => onRequestJoin(club.id, club.name)}
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
