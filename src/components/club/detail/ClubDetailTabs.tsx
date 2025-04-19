
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
import MatchProgressBar from '@/components/shared/MatchProgressBar';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

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

  const handleViewMatchDetails = (matchId: string) => {
    console.log('Navigating to match details:', matchId);
    // This is a placeholder - in a real app, we would navigate to a match details page
    // navigate(`/matches/${matchId}`);
  };

  const handleViewAllHistory = () => {
    console.log('Viewing all match history for club:', club.id);
    // This is a placeholder - in a real app, we would navigate to a full history page
    // navigate(`/clubs/${club.id}/history`);
  };

  // Helper function to get correct promotion/relegation text based on division and result
  const getLeagueImpactText = (division: string, tier: number | undefined, isWin: boolean) => {
    // Default to tier 1 if undefined
    const currentTier = tier || 1;
    
    if (isWin) {
      // Promotion logic
      if (division === 'Bronze') {
        return 'Promoted to Silver ' + currentTier;
      } else if (division === 'Silver') {
        return 'Promoted to Gold ' + currentTier;
      } else if (division === 'Gold') {
        return 'Promoted to Platinum ' + currentTier;
      } else if (division === 'Platinum') {
        return 'Promoted to Diamond ' + currentTier;
      } else if (division === 'Diamond') {
        return 'Promoted to Elite';
      } else {
        return 'Maintained Elite status';
      }
    } else {
      // Relegation logic
      if (division === 'Elite') {
        return 'Relegated to Diamond 1';
      } else if (division === 'Diamond') {
        return 'Relegated to Platinum ' + currentTier;
      } else if (division === 'Platinum') {
        return 'Relegated to Gold ' + currentTier;
      } else if (division === 'Gold') {
        return 'Relegated to Silver ' + currentTier;
      } else if (division === 'Silver') {
        return 'Relegated to Bronze ' + currentTier;
      } else {
        return 'Remained in Bronze ' + currentTier;
      }
    }
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
        <div className="bg-white rounded-lg shadow p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-primary h-5 w-5" />
            <h2 className="text-xl font-semibold">Match History</h2>
          </div>

          {club.matchHistory && club.matchHistory.length > 0 ? (
            <div className="space-y-6">
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
                  <div key={match.id} className="space-y-3 pb-4 border-b border-gray-100 last:border-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{dateRange}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <h3 className="text-base font-medium">{ourTeam.name}</h3>
                          <span className="text-gray-500 text-sm">vs</span>
                          <h3 className="text-base font-medium">{theirTeam.name}</h3>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        weWon ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {weWon ? 'WIN' : 'LOSS'}
                      </span>
                    </div>

                    <MatchProgressBar 
                      homeDistance={ourDistance} 
                      awayDistance={theirDistance}
                      className="h-4 text-xs"
                    />

                    <div>
                      <p className="flex items-center gap-1 text-sm font-medium">
                        League Impact: 
                        <span className={weWon ? 'text-green-600' : 'text-red-600'}>
                          {getLeagueImpactText(club.division, club.tier, weWon)}
                        </span>
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-sm mt-2"
                      onClick={() => handleViewMatchDetails(match.id)}
                    >
                      View Complete Match Details
                    </Button>
                  </div>
                );
              })}

              <Button
                variant="link"
                className="w-full text-primary hover:text-primary/80 text-sm py-2"
                onClick={handleViewAllHistory}
              >
                View All Match History
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
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
