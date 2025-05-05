
import React from 'react';
import { Club } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import UserAvatar from '@/components/shared/UserAvatar';

interface InsufficientMembersCardProps {
  club: Club;
  onSelectUser: (userId: string, name: string, avatar?: string) => void;
}

const InsufficientMembersCard: React.FC<InsufficientMembersCardProps> = ({
  club,
  onSelectUser,
}) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col items-center p-4">
          <h3 className="font-semibold mb-1">{club.name}</h3>
          <p className="text-xs text-gray-500 capitalize mb-4">{club.division} {club.tier}</p>
          
          <div className="bg-amber-50 p-3 rounded-lg text-center mb-4 w-full">
            <p className="text-amber-700 font-medium">
              Your club needs 5 members to start competing in the league.
            </p>
          </div>
          
          <div className="w-full">
            <h4 className="text-sm font-medium mb-2">Current Members ({club.members.length}/5)</h4>
            <div className="space-y-2">
              {club.members.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center text-sm"
                  onClick={() => onSelectUser(member.id, member.name, member.avatar)}
                >
                  <UserAvatar 
                    name={member.name} 
                    image={member.avatar} 
                    size="xxs" 
                  />
                  <span className="ml-2">{member.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InsufficientMembersCard;
