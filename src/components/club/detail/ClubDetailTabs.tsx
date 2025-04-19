
import React from 'react';
import { Club, User } from '@/types';
import ClubStats from './ClubStats';
import ClubCurrentMatch from './ClubCurrentMatch';
import ClubMembersList from './ClubMembersList';
import ClubAdminActions from '../../admin/ClubAdminActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from '@/context/AppContext';

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
  const { setSelectedUser, setCurrentView } = useApp();

  const handleSelectUser = (userId: string, name: string, avatar?: string) => {
    setSelectedUser({
      id: userId,
      name: name,
      avatar: avatar || '/placeholder.svg',
      stravaConnected: true,
      clubs: []
    });
    setCurrentView('profile');
  };

  return (
    <Tabs defaultValue="overview" className="mb-6">
      <TabsList className="grid grid-cols-3 mb-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <ClubStats 
          club={club} 
          matchHistory={club.matchHistory} 
        />
        {club.currentMatch && (
          <ClubCurrentMatch
            match={club.currentMatch}
            onViewProfile={handleSelectUser}
          />
        )}
      </TabsContent>
      
      <TabsContent value="members">
        <ClubMembersList
          members={club.members}
          currentMatch={club.currentMatch}
          onSelectMember={handleSelectUser}
        />
      </TabsContent>
      
      <TabsContent value="history">
        <div className="bg-white rounded-lg shadow p-4">
          {club.matchHistory && club.matchHistory.length > 0 ? (
            <div>
              {/* Match history content would go here */}
              <h3 className="text-lg font-medium mb-3">Match History</h3>
              <ul className="space-y-4">
                {club.matchHistory.map((match) => (
                  <li key={match.id} className="border-b pb-3">
                    <p className="font-medium">{match.homeClub.name} vs {match.awayClub.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(match.startDate).toLocaleDateString()} - {new Date(match.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                      Result: {match.winner === 'home' ? match.homeClub.name : match.awayClub.name} won
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No match history yet.</p>
              <p className="text-sm text-gray-400">Completed matches will appear here.</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ClubDetailTabs;
