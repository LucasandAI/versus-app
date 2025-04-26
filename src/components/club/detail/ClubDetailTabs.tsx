
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
  const { navigateToUserProfile } = useNavigation();

  const handleSelectUser = (userId: string, userName: string, userAvatar?: string) => {
    navigateToUserProfile(userId, userName, userAvatar);
  };

  // Make sure club.members is defined before passing it to components
  const safeMembers = club.members || [];

  return (
    <Tabs defaultValue="overview" className="mb-6">
      <TabsList className="grid grid-cols-3 mb-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <OverviewTab 
          club={club}
          currentUser={currentUser}
          onSelectUser={handleSelectUser}
        />
      </TabsContent>
      
      <TabsContent value="members">
        <ClubMembersList
          members={safeMembers}
          currentMatch={club.currentMatch}
          onSelectMember={handleSelectUser}
        />
      </TabsContent>
      
      <TabsContent value="history">
        <MatchHistoryTab club={club} />
      </TabsContent>
    </Tabs>
  );
};

export default ClubDetailTabs;
