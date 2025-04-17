
import React from 'react';
import { ArrowUp, ArrowDown, Trophy } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Division } from '@/types';

interface LeaderboardClub {
  id: string;
  name: string;
  division: Division;
  rank: number;
  points: number;
  change: 'up' | 'down' | 'same';
}

// Mock data for the leaderboard
const mockLeaderboardData: LeaderboardClub[] = [
  { id: '1', name: 'Speed Demons', division: 'Elite', rank: 1, points: 1250, change: 'same' },
  { id: '2', name: 'Mountain Goats', division: 'Elite', rank: 2, points: 1205, change: 'up' },
  { id: '3', name: 'Run For Fun', division: 'Elite', rank: 3, points: 1199, change: 'down' },
  { id: '4', name: 'Swift Feet', division: 'Diamond', rank: 4, points: 980, change: 'up' },
  { id: '5', name: 'Weekend Warriors', division: 'Diamond', rank: 5, points: 965, change: 'same' },
  { id: '6', name: 'Track Stars', division: 'Diamond', rank: 6, points: 932, change: 'down' },
  { id: '7', name: 'Finish Line', division: 'Platinum', rank: 7, points: 815, change: 'up' },
  { id: '8', name: 'Running Rebels', division: 'Platinum', rank: 8, points: 802, change: 'down' },
  { id: '9', name: 'Road Runners', division: 'Platinum', rank: 9, points: 798, change: 'same' },
  { id: '10', name: 'Trailblazers', division: 'Gold', rank: 10, points: 720, change: 'up' },
];

// Expanded to top 100
for (let i = 11; i <= 100; i++) {
  const division = i <= 20 ? 'Gold' : 
                  i <= 40 ? 'Silver' : 
                  i <= 70 ? 'Bronze' : 'Bronze';
  
  mockLeaderboardData.push({
    id: i.toString(),
    name: `Club ${i}`,
    division,
    rank: i,
    points: Math.max(100, 1250 - i * 12),
    change: ['up', 'down', 'same'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'same'
  });
}

const divisions: Division[] = ['Elite', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'];

const Leaderboard: React.FC = () => {
  const { setCurrentView, setSelectedClub, currentUser } = useApp();
  const [selectedDivision, setSelectedDivision] = React.useState<Division | 'All'>('All');
  const [leaderboardData] = React.useState<LeaderboardClub[]>(mockLeaderboardData);

  const filteredClubs = selectedDivision === 'All' 
    ? leaderboardData
    : leaderboardData.filter(club => club.division === selectedDivision);

  // Find user's clubs
  const userClubs = currentUser?.clubs || [];
  
  const handleSelectClub = (clubId: string) => {
    // In a real app, we would fetch the club data
    const club = mockLeaderboardData.find(c => c.id === clubId);
    if (club) {
      setSelectedClub({
        id: club.id,
        name: club.name,
        logo: '/placeholder.svg',
        division: club.division,
        members: [],
        matchHistory: []
      });
      setCurrentView('clubDetail');
    }
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

  return (
    <div className="pb-20">
      <div className="bg-primary/95 text-white p-4 sticky top-0 z-10">
        <div className="container-mobile">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 mr-2" />
            <h1 className="text-xl font-bold">Leaderboard</h1>
          </div>
        </div>
      </div>

      <div className="container-mobile pt-4">
        {userClubs.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">My Clubs</h2>
            <div className="bg-white rounded-lg shadow-md p-4">
              {userClubs.map(club => {
                const leaderboardPosition = leaderboardData.findIndex(c => c.id === club.id) + 1;
                return (
                  <div 
                    key={club.id} 
                    className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer"
                    onClick={() => handleSelectClub(club.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-200 h-10 w-10 rounded-full flex items-center justify-center">
                        <span className="font-bold text-xs text-gray-700">{club.name.substring(0, 2)}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{club.name}</h3>
                        <div className="flex items-center gap-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getDivisionColor(club.division)}`}>
                            {club.division}
                          </span>
                          <span className="text-xs text-gray-500">• Rank #{leaderboardPosition || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Top Clubs</h2>
          <div className="relative">
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value as Division | 'All')}
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="All">All Divisions</option>
              {divisions.map((division) => (
                <option key={division} value={division}>
                  {division}
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
                  Division
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
                  onClick={() => handleSelectClub(club.id)}
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {club.rank}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 hover:text-primary">
                    {club.name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDivisionColor(club.division)}`}>
                      {club.division}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                    {club.points}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getChangeIcon(club.change)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-md p-4">
          <h3 className="font-semibold mb-3">Division Breakdown</h3>
          <div className="space-y-3">
            {divisions.map((division) => (
              <div key={division} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${getDivisionColor(division).split(' ')[0].replace('bg-', 'bg-')}`}></span>
                  <span>{division}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {leaderboardData.filter(club => club.division === division).length} clubs
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
