
import React from 'react';
import { Club, User } from '@/types';
import ClubMembersList from './ClubMembersList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MatchHistoryTab from './tabs/MatchHistoryTab';
import OverviewTab from './tabs/OverviewTab';
import { useNavigation } from '@/hooks/useNavigation';

interface ClubDetailTabsProps {
  club: Club;
  isActuallyMember: boolean;
  currentUser: User | null;
}

const ClubDetailTabs: React.FC<ClubDetailTabsProps> = ({ 
  club, 
  isActuallyMember, 
  currentUser 
}) => {
  // Ensure members and matchHistory are always arrays, even if undefined
  const safeClub = {
    ...club,
    members: club.members || [],
    matchHistory: club.matchHistory || []
  };
  
  const { navigateToUserProfile } = useNavigation();

  const handleSelectUser = (userId: string, userName: string, userAvatar?: string) => {
    navigateToUserProfile(userId, userName, userAvatar);
  };

  return (
    <Tabs defaultValue="overview" className="mb-6">
      <TabsList className="grid grid-cols-3 mb-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <OverviewTab 
          club={safeClub}
          currentUser={currentUser}
          onSelectUser={handleSelectUser}
        />
      </TabsContent>
      
      <TabsContent value="members">
        <ClubMembersList
          members={safeClub.members}
          currentMatch={safeClub.currentMatch}
          onSelectMember={handleSelectUser}
        />
      </TabsContent>
      
      <TabsContent value="history">
        <MatchHistoryTab club={safeClub} />
      </TabsContent>
    </Tabs>
  );
};

export default ClubDetailTabs;
