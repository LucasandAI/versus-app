
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Club } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import SearchOpponentButton from './SearchOpponentButton';

interface WaitingForMatchCardProps {
  club: Club;
}

const WaitingForMatchCard: React.FC<WaitingForMatchCardProps> = ({ club }) => {
  const hasEnoughMembers = club.members.length >= 5;
  
  return (
    <Card className="mb-4 overflow-hidden border-0 shadow-md">
      <CardContent className="p-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center">
            <UserAvatar
              name={club.name}
              image={club.logo}
              size="md"
              className="mr-3"
            />
            <div>
              <h3 className="font-semibold">{club.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                  {club.members.length} members
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h4 className="text-blue-800 font-medium mb-1">Ready to Compete</h4>
            <p className="text-blue-700 text-sm">
              Your club has enough members to compete in matches.
            </p>
          </div>
          <SearchOpponentButton club={club} />
        </div>
      </CardContent>
    </Card>
  );
};

export default WaitingForMatchCard;
