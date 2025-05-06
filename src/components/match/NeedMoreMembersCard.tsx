import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Club } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import { useNavigation } from '@/hooks/useNavigation';
import { formatLeague } from '@/utils/club/leagueUtils';
interface NeedMoreMembersCardProps {
  club: Club;
}
const NeedMoreMembersCard: React.FC<NeedMoreMembersCardProps> = ({
  club
}) => {
  const {
    navigateToClubDetail
  } = useNavigation();
  const handleClubClick = () => {
    navigateToClubDetail(club.id, club);
  };
  return <Card className="mb-4 overflow-hidden border-0 shadow-md">
      <CardContent className="p-0">
        
        <div className="p-6 text-center">
          <div className="bg-amber-50 p-4 rounded-lg h-[100px] flex flex-col justify-center">
            <Users className="h-6 w-6 mx-auto text-amber-500 mb-2" />
            <h4 className="text-amber-800 font-medium mb-1">Need More Members</h4>
            <p className="text-amber-700 text-sm">
              Your club needs at least 5 members to compete.
            </p>
            <p className="text-amber-600 text-xs mt-1">
              Current: {club.members.length}/5 members
            </p>
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default NeedMoreMembersCard;