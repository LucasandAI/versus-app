
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Club } from '@/types';
import { formatLeague } from '@/utils/club/leagueUtils';
import UserAvatar from '@/components/shared/UserAvatar';
import { Users } from 'lucide-react';

interface NeedMoreMembersCardProps {
  club: Club;
}

const NeedMoreMembersCard: React.FC<NeedMoreMembersCardProps> = ({ club }) => {
  const memberCount = club.members.length;
  const neededMembers = 5 - memberCount;
  
  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center">
          <UserAvatar 
            name={club.name} 
            image={club.logo} 
            size="md"
            className="mr-3"
          />
          <div>
            <h3 className="font-medium">{club.name}</h3>
            <span className="text-sm text-gray-600">
              {formatLeague(club.division, club.tier)}
            </span>
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
