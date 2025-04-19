
import React from 'react';
import { Club, User } from '@/types';
import { Calendar } from "lucide-react";
import ClubStats from './ClubStats';
import ClubCurrentMatch from './ClubCurrentMatch';
import ClubMembersList from './ClubMembersList';
import ClubAdminActions from '../../admin/ClubAdminActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from '@/context/AppContext';
import { Button } from "@/components/ui/button";
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
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="text-primary h-6 w-6" />
            <h2 className="text-2xl font-semibold">Match History</h2>
          </div>

          {club.matchHistory && club.matchHistory.length > 0 ? (
            <div className="space-y-8">
              {club.matchHistory.map((match) => {
                const isHomeTeam = match.homeClub.id === club.id;
                const ourTeam = isHomeTeam ? match.homeClub : match.awayClub;
                const theirTeam = isHomeTeam ? match.awayClub : match.homeClub;
                const weWon = (isHomeTeam && match.winner === 'home') || (!isHomeTeam && match.winner === 'away');
                
                // Calculate total distances
                const ourDistance = ourTeam.members.reduce((sum, m) => sum + (m.distanceContribution || 0), 0);
                const theirDistance = theirTeam.members.reduce((sum, m) => sum + (m.distanceContribution || 0), 0);
                
                const matchDate = new Date(match.startDate);
                const endDate = new Date(match.endDate);
                const dateRange = `${matchDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}–${endDate.getDate()}, ${endDate.getFullYear()}`;

                return (
                  <div key={match.id} className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-lg text-gray-600">{dateRange}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <h3 className="text-xl font-semibold">{ourTeam.name}</h3>
                          <span className="text-gray-500">vs</span>
                          <h3 className="text-xl font-semibold">{theirTeam.name}</h3>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        weWon ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {weWon ? 'WIN' : 'LOSS'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-lg">
                      <span>{ourDistance.toFixed(1)} km</span>
                      <span>{theirDistance.toFixed(1)} km</span>
                    </div>

                    <div className="h-2 w-full rounded-full overflow-hidden bg-gray-200">
                      <div
                        className={`h-full ${weWon ? 'bg-primary' : 'bg-secondary'}`}
                        style={{
                          width: `${(ourDistance / (ourDistance + theirDistance)) * 100}%`
                        }}
                      />
                    </div>

                    <div>
                      <p className="flex items-center gap-2 font-medium">
                        League Impact: 
                        <span className={weWon ? 'text-green-600' : 'text-red-600'}>
                          {weWon 
                            ? `Promoted to ${club.division === 'Silver' ? 'Gold 1' : 'Elite'}`
                            : `Relegated to ${club.division === 'Gold' ? 'Silver 1' : 'Bronze 2'}`
                          }
                        </span>
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => console.log('View match details:', match.id)}
                    >
                      View Complete Match Details
                    </Button>
                  </div>
                );
              })}

              <Button
                variant="link"
                className="w-full text-primary hover:text-primary/80"
                onClick={() => console.log('View all history')}
              >
                View All Match History
              </Button>
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
