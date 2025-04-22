
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
  onClubUpdated?: () => void;
}

const ClubDetailTabs: React.FC<ClubDetailTabsProps> = ({ 
  club, 
  isActuallyMember, 
  currentUser,
  onClubUpdated
}) => {
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
          club={club}
          currentUser={currentUser}
          onSelectUser={handleSelectUser}
          onClubUpdated={onClubUpdated}
        />
      </TabsContent>
      
      <TabsContent value="members">
        <ClubMembersList
          members={club.members}
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
