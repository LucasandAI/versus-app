
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Club } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import { formatLeague } from '@/utils/club/leagueUtils';
import { Clock } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { useNavigation } from '@/hooks/useNavigation';

interface WaitingForMatchCardProps {
  club: Club;
}

const WaitingForMatchCard: React.FC<WaitingForMatchCardProps> = ({ club }) => {
  const { navigateToClubDetail } = useNavigation();

  const handleClubClick = (clubId: string, clubData: any) => {
    navigateToClubDetail(clubId, clubData);
  };

  return (
    <Card className="mb-4 overflow-hidden border-2 border-gray-100 shadow-sm">
      <CardContent className="p-0">
        {/* Club header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <UserAvatar 
                name={club.name} 
                image={club.logo} 
                size="md"
                className="cursor-pointer"
                onClick={() => handleClubClick(club.id, club)}
              />
              <div>
                <h3 
                  className="font-semibold cursor-pointer hover:text-primary transition-colors" 
                  onClick={() => handleClubClick(club.id, club)}
                >
                  {club.name}
                </h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 font-medium">
                    {formatLeague(club.division, club.tier)}
                  </span>
                  <span className="text-xs text-gray-500">
                    • {club.members.length}/5 members
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Club status */}
        <div className="p-5">
          <div className="flex items-center justify-center bg-yellow-50 p-4 rounded-md">
            <div className="text-center">
              <p className="text-sm font-medium text-yellow-700 mb-1">Waiting for match</p>
              <div className="flex items-center justify-center text-sm text-yellow-600">
                <Clock className="h-4 w-4 mr-1" />
                <CountdownTimer 
                  useCurrentCycle={true} 
                  refreshInterval={1000}
                  className="font-mono"
                />
              </div>
              <p className="text-xs text-yellow-600 mt-2">Your club will be matched soon</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WaitingForMatchCard;
