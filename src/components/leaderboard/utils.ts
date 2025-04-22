
import { Division } from '@/types';
import { LeaderboardClub } from './types';

export const generateMockLeaderboardData = (): LeaderboardClub[] => {
  const baseData = [
    { id: '3', name: 'Run For Fun', division: 'Elite', rank: 1, points: 9, change: 'down' },
    { id: '4', name: 'Swift Feet', division: 'Diamond', tier: 1, rank: 2, points: 0, change: 'up' },
    { id: '5', name: 'Track Stars', division: 'Diamond', tier: 3, rank: 3, points: 0, change: 'down' },
    { id: '6', name: 'Finish Line', division: 'Platinum', tier: 1, rank: 4, points: 0, change: 'up' },
    { id: '7', name: 'Running Rebels', division: 'Platinum', tier: 2, rank: 5, points: 0, change: 'down' },
    { id: '8', name: 'Road Masters', division: 'Platinum', tier: 3, rank: 6, points: 0, change: 'same' },
    { id: '2', name: 'Road Runners', division: 'Gold', tier: 1, rank: 7, points: 0, change: 'down' },
    { id: '9', name: 'Trailblazers', division: 'Gold', tier: 1, rank: 8, points: 0, change: 'up' },
  ] as LeaderboardClub[];

  for (let i = 9; i <= 23; i++) {
    let division: Division;
    let tier: number;
    
    if (i <= 15) {
      division = 'Gold';
      tier = Math.floor((i - 9) / 2) + 2;
    } else {
      division = 'Silver';
      tier = Math.floor((i - 15) / 2) + 1;
    }
    
    baseData.push({
      id: (i + 10).toString(),
      name: `Club ${i}`,
      division,
      tier,
      rank: i,
      points: 0,
      change: ['up', 'down', 'same'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'same'
    });
  }

  baseData.push({
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
        tier = 2;
      } else {
        tier = Math.floor((i - 30) / 2) + 3;
      }
    } else {
      division = 'Bronze';
      tier = Math.floor((i - 40) / 12) + 1;
    }
    
    baseData.push({
      id: (i + 100).toString(),
      name: `Club ${i}`,
      division,
      tier,
      rank: i,
      points: 0,
      change: ['up', 'down', 'same'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'same'
    });
  }

  return baseData;
};

export const getDivisionIcon = (division: Division) => {
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

export const getDivisionColor = (division: Division) => {
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

export const formatLeagueWithTier = (division: Division, tier?: number) => {
  if (division === 'Elite') return 'Elite League';
  return tier ? `${division} ${tier}` : division;
};

export const divisions: Division[] = ['Elite', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'];
