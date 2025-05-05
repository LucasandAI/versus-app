
import React from 'react';
import { Clock } from 'lucide-react';
import { Club } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import UserAvatar from '@/components/shared/UserAvatar';
import { useCurrentMatchCycle } from '@/hooks/home/useCurrentMatchCycle';

interface AwaitingMatchCardProps {
  club: Club;
  onSelectUser: (userId: string, name: string, avatar?: string) => void;
}

const AwaitingMatchCard: React.FC<AwaitingMatchCardProps> = ({
  club,
  onSelectUser,
}) => {
  const { timeRemaining } = useCurrentMatchCycle();
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <UserAvatar 
              name={club.name} 
              image={club.logo} 
              size="sm"
            />
            <div>
              <h3 className="font-semibold">{club.name}</h3>
              <p className="text-xs text-gray-500 capitalize">{club.division} {club.tier}</p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg text-center mb-4">
            <p className="text-blue-700 font-medium mb-2">
              Your club is ready. A new opponent will be found in the next match cycle.
            </p>
            <div className="flex justify-center items-center bg-blue-100 rounded-full px-3 py-1 w-max mx-auto">
              <Clock className="h-3 w-3 mr-1 text-blue-700" />
              <span className="text-xs font-medium text-blue-700">{timeRemaining}</span>
            </div>
          </div>
          
          <div className="w-full">
            <h4 className="text-sm font-medium mb-2">Team Members</h4>
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

export default AwaitingMatchCard;
