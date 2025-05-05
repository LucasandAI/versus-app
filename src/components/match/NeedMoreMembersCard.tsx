
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Club } from '@/types';
import { formatLeague } from '@/utils/club/leagueUtils';
import UserAvatar from '@/components/shared/UserAvatar';
import { Users } from 'lucide-react';
import { useNavigation } from '@/hooks/useNavigation';

interface NeedMoreMembersCardProps {
  club: Club;
}

const NeedMoreMembersCard: React.FC<NeedMoreMembersCardProps> = ({ club }) => {
  const memberCount = club.members.length;
  const neededMembers = 5 - memberCount;
  const { navigateToClubDetail } = useNavigation();
  
  const handleClubClick = () => {
    navigateToClubDetail(club.id, club);
  };
  
  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center">
          <UserAvatar 
            name={club.name} 
            image={club.logo} 
            size="md"
            className="mr-3 cursor-pointer"
            onClick={handleClubClick}
          />
          <div>
            <h3 
              className="font-medium cursor-pointer hover:text-primary transition-colors"
              onClick={handleClubClick}
            >
              {club.name}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                {formatLeague(club.division, club.tier)}
              </span>
              <span className="text-xs text-gray-500">
                • {memberCount}/5 members
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center mb-2">
            <Users size={16} className="text-gray-500 mr-2" />
            <span className="text-sm font-medium">
              {memberCount}/5 members
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Your club needs {neededMembers} more {neededMembers === 1 ? 'member' : 'members'} to start competing in the league.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NeedMoreMembersCard;
