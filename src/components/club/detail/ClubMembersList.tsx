
import React from 'react';
import { ClubMember, Match } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users } from 'lucide-react';
import { useNavigation } from '@/hooks/useNavigation';

interface ClubMembersListProps {
  members: ClubMember[];
  currentMatch?: Match | null;
}

const ClubMembersList: React.FC<ClubMembersListProps> = ({ 
  members, 
  currentMatch
}) => {
  const { navigateToUserProfile } = useNavigation();
  
  // Create a map to deduplicate members by ID
  const uniqueMembers = members.reduce((acc, member) => {
    if (!acc.has(member.id)) {
      acc.set(member.id, member);
    }
    return acc;
  }, new Map<string, ClubMember>());
  
  // Convert back to array
  const deduplicatedMembers = Array.from(uniqueMembers.values());

  const handleMemberClick = (member: ClubMember) => {
    navigateToUserProfile(member.id, member.name, member.avatar);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Users className="h-5 w-5 mr-2 text-primary" />
            Members
          </CardTitle>
          <span className="text-xs text-gray-500">
            {deduplicatedMembers.length}/5 members
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deduplicatedMembers.map((member) => (
            <div 
              key={member.id} 
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <UserAvatar 
                  name={member.name} 
                  image={member.avatar} 
                  size="sm" 
                  className="cursor-pointer"
                  onClick={() => handleMemberClick(member)}
                />
                <span 
                  className="hover:text-primary cursor-pointer"
                  onClick={() => handleMemberClick(member)}
                >
                  {member.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {member.isAdmin && (
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                    Admin
                  </span>
                )}
                {currentMatch && (
                  <span className="font-medium text-xs text-gray-500">
                    {currentMatch.homeClub.members.find(m => m.id === member.id)?.distanceContribution?.toFixed(1) || "0"} km
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClubMembersList;
