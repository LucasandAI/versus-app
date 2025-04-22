import React from 'react';
import { ArrowUp, ArrowDown, Trophy, Medal } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Division } from '@/types';
import AppHeader from '@/components/shared/AppHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClubNavigation } from '@/hooks/useClubNavigation';

interface LeaderboardClub {
  id: string;
  name: string;
  division: Division;
  tier?: number; // For divisions with tiers (Bronze 5, Silver 3, etc.)
  rank: number;
  points: number;
  change: 'up' | 'down' | 'same';
}

const mockLeaderboardData: LeaderboardClub[] = [
  { id: '3', name: 'Run For Fun', division: 'Elite', rank: 1, points: 9, change: 'down' },
  { id: '4', name: 'Swift Feet', division: 'Diamond', tier: 1, rank: 2, points: 0, change: 'up' },
  { id: '5', name: 'Track Stars', division: 'Diamond', tier: 3, rank: 3, points: 0, change: 'down' },
  { id: '6', name: 'Finish Line', division: 'Platinum', tier: 1, rank: 4, points: 0, change: 'up' },
  { id: '7', name: 'Running Rebels', division: 'Platinum', tier: 2, rank: 5, points: 0, change: 'down' },
  { id: '8', name: 'Road Masters', division: 'Platinum', tier: 3, rank: 6, points: 0, change: 'same' },
  { id: '2', name: 'Road Runners', division: 'Gold', tier: 1, rank: 7, points: 0, change: 'down' },
  { id: '9', name: 'Trailblazers', division: 'Gold', tier: 1, rank: 8, points: 0, change: 'up' },
];

for (let i = 9; i <= 23; i++) {
  let division: Division;
  let tier: number;
  
  if (i <= 15) {
    division = 'Gold';
    tier = Math.floor((i - 9) / 2) + 2; // Gold tiers 2-5
  } else {
    division = 'Silver';
    tier = Math.floor((i - 15) / 2) + 1; // Silver tiers 1
  }
  
  mockLeaderboardData.push({
    id: (i + 10).toString(), // Using i+10 to avoid conflicts with existing IDs
    name: `Club ${i}`,
    division,
    tier,
    rank: i,
    points: 0,
    change: ['up', 'down', 'same'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'same'
  });
}

mockLeaderboardData.push({
  id: '1',
  name: 'Weekend Warriors',
  division: 'Silver',
  tier: 2,
  rank: 24,
  points: 0,
  change: 'up'
});

for (let i = 25; i <= 100; i++) {
  let division: Division;
  let tier: number;
  
  if (i <= 40) {
    division = 'Silver';
    if (i <= 30) {
      tier = 2; // More Silver tier 2
    } else {
      tier = Math.floor((i - 30) / 2) + 3; // Silver tiers 3-5
    }
  } else {
    division = 'Bronze';
    tier = Math.floor((i - 40) / 12) + 1; // Bronze tiers
  }
  
  mockLeaderboardData.push({
    id: (i + 100).toString(), // Using i+100 to ensure unique IDs
    name: `Club ${i}`,
    division,
    tier,
    rank: i,
    points: 0,
    change: ['up', 'down', 'same'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'same'
  });
}

const divisions: Division[] = ['Elite', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'];

const Leaderboard: React.FC = () => {
  const { setCurrentView, setSelectedClub, currentUser } = useApp();
  const { navigateToClub } = useClubNavigation();
  const [selectedDivision, setSelectedDivision] = React.useState<Division | 'All'>('All');
  const [activeTab, setActiveTab] = React.useState<'global' | 'myClubs'>('global');

  const [leaderboardData] = React.useState<LeaderboardClub[]>(() => {
    const baseData = [...mockLeaderboardData];
    
    if (currentUser?.clubs) {
      currentUser.clubs.forEach(club => {
        const existingClub = baseData.find(c => c.id === club.id);
        if (!existingClub) {
          const newRank = baseData.length + 1;
          baseData.push({
            id: club.id,
            name: club.name,
            division: club.division,
            tier: club.tier,
            rank: newRank,
            points: 0,
            change: 'same'
          });
        }
      });
    }
    
    return baseData;
  });

  const filteredClubs = selectedDivision === 'All' 
    ? leaderboardData
    : leaderboardData.filter(club => club.division === selectedDivision);

  const userClubIds = currentUser?.clubs.map(club => club.id) || [];
  const userClubsInLeaderboard = leaderboardData.filter(club => userClubIds.includes(club.id));
  
  const handleSelectClub = (clubData: LeaderboardClub) => {
    navigateToClub({
      id: clubData.id,
      name: clubData.name,
      division: clubData.division,
      tier: clubData.tier,
      members: [],
      matchHistory: []
    });
  };

  const getChangeIcon = (change: 'up' | 'down' | 'same') => {
    switch (change) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <span className="h-4 w-4 text-gray-300">-</span>;
    }
  };

  const getDivisionIcon = (division: Division) => {
    switch (division) {
      case 'Elite':
        return '👑';
      case 'Diamond':
        return '🔷';
      case 'Platinum':
        return '💎';
      case 'Gold':
        return '🥇';
      case 'Silver':
        return '🥈';
      case 'Bronze':
        return '🥉';
    }
  };

  const getDivisionColor = (division: Division) => {
    switch (division) {
      case 'Elite':
        return 'bg-purple-100 text-purple-800';
      case 'Diamond':
        return 'bg-blue-100 text-blue-800';
      case 'Platinum':
        return 'bg-cyan-100 text-cyan-800';
      case 'Gold':
        return 'bg-yellow-100 text-yellow-800';
      case 'Silver':
        return 'bg-gray-100 text-gray-800';
      case 'Bronze':
        return 'bg-amber-100 text-amber-800';
    }
  };

  const formatLeagueWithTier = (division: Division, tier?: number) => {
    if (division === 'Elite') return 'Elite League';
    return tier ? `${division} ${tier}` : division;
  };

  return (
    <div className="pb-20">
      <AppHeader
        title="Leagues"
        rightElement={<Trophy className="h-5 w-5" />}
      />

      <div className="container-mobile pt-4">
        <div className="flex border-b mb-4">
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'global' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('global')}
          >
            Global Rankings
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'myClubs' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('myClubs')}
          >
            My Clubs
          </button>
        </div>

        {activeTab === 'myClubs' && userClubsInLeaderboard.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">My Clubs Rankings</h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Club
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      League
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userClubsInLeaderboard.map((club) => (
                    <tr 
                      key={club.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelectClub(club)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {club.rank}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 hover:text-primary">
                        {club.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDivisionColor(club.division)}`}>
                          {getDivisionIcon(club.division)} {formatLeagueWithTier(club.division, club.tier)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                        {club.division === 'Elite' ? club.points : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getChangeIcon(club.change)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'myClubs' && userClubsInLeaderboard.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center mb-6">
            <h3 className="font-medium mb-2">No Clubs in Rankings</h3>
            <p className="text-gray-500 text-sm mb-4">
              Join or create a club to see your rankings here
            </p>
          </div>
        )}

        {activeTab === 'global' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Top Leagues</h2>
              <div className="relative">
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value as Division | 'All')}
                  className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="All">All Leagues</option>
                  {divisions.map((league) => (
                    <option key={league} value={league}>
                      {league}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4 4 4-4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Club
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      League
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClubs.slice(0, 100).map((club) => (
                    <tr 
                      key={club.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelectClub(club)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {club.rank}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 hover:text-primary">
                        {club.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDivisionColor(club.division)}`}>
                          {getDivisionIcon(club.division)} {formatLeagueWithTier(club.division, club.tier)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                        {club.division === 'Elite' ? club.points : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getChangeIcon(club.change)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-6 bg-white rounded-lg shadow-md p-4">
          <h3 className="font-semibold mb-3">League System</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2">👑</span>
                <span>Elite League</span>
              </div>
              <span className="text-sm text-gray-500">
                Point-based (+1 win, -1 loss)
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2">🔷</span>
                <span>Diamond 5 → Diamond 1</span>
              </div>
              <span className="text-sm text-gray-500">
                Top promotion to Elite
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2">💎</span>
                <span>Platinum 5 → Platinum 1</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2">🥇</span>
                <span>Gold 5 → Gold 1</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2">🥈</span>
                <span>Silver 5 → Silver 1</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2">🥉</span>
                <span>Bronze 5 → Bronze 1</span>
              </div>
              <span className="text-sm text-gray-500">
                Entry level
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
