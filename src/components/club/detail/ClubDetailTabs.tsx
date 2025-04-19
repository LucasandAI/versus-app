
import React from 'react';
import { Club, User } from '@/types';
import ClubStats from './ClubStats';
import ClubCurrentMatch from './ClubCurrentMatch';
import ClubMembersList from './ClubMembersList';
import ClubAdminActions from '../../admin/ClubAdminActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from '@/context/AppContext';
import { formatLeagueWithTier } from '@/lib/format';

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
              <h3 className="text-lg font-medium mb-3">Match History</h3>
              <ul className="space-y-6">
                {club.matchHistory.map((match) => {
                  const isHomeTeam = match.homeClub.id === club.id;
                  const ourTeam = isHomeTeam ? match.homeClub : match.awayClub;
                  const theirTeam = isHomeTeam ? match.awayClub : match.homeClub;
                  const weWon = (isHomeTeam && match.winner === 'home') || (!isHomeTeam && match.winner === 'away');
                  
                  // Calculate total distances
                  const ourDistance = ourTeam.members.reduce((sum, m) => sum + (m.distanceContribution || 0), 0);
                  const theirDistance = theirTeam.members.reduce((sum, m) => sum + (m.distanceContribution || 0), 0);
                  
                  // Determine promotion/relegation text
                  const matchOutcome = weWon 
                    ? `Promotion to ${club.division === 'Silver' ? 'Gold' : 'Elite'} ${club.division === 'Silver' ? '3' : ''}`
                    : `Relegation to ${club.division === 'Gold' ? 'Silver' : 'Bronze'} ${club.division === 'Gold' ? '1' : '2'}`;

                  return (
                    <li key={match.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">
                            vs {theirTeam.name}
                            <span className={`ml-2 px-2 py-0.5 rounded text-sm ${weWon ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {weWon ? 'V' : 'D'}
                            </span>
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(match.startDate).toLocaleDateString()} - {new Date(match.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="font-medium text-lg">
                          {ourDistance.toFixed(1)}–{theirDistance.toFixed(1)} km
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Our Team Contributions:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {ourTeam.members.map((member) => (
                            <div key={member.id} className="text-sm">
                              {member.name}: {member.distanceContribution?.toFixed(1) || 0} km
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <p className={`mt-3 text-sm ${weWon ? 'text-green-600' : 'text-red-600'}`}>
                        {matchOutcome}
                      </p>
                    </li>
                  );
                })}
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
