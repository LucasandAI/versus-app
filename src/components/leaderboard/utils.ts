import { Division } from '@/types';
import { LeaderboardClub } from './types';

export const generateMockLeaderboardData = (): LeaderboardClub[] => {
  const baseData = [
    { 
      id: '3', 
      name: 'Run For Fun', 
      division: 'elite' as Division, 
      rank: 1, 
      points: 9, 
      change: 'down',
      logo: '/placeholder.svg',
      members: 12
    },
    { 
      id: '4', 
      name: 'Swift Feet', 
      division: 'diamond' as Division, 
      tier: 1, 
      rank: 2, 
      points: 0, 
      change: 'up',
      logo: '/placeholder.svg',
      members: 8
    },
    { 
      id: '5', 
      name: 'Track Stars', 
      division: 'diamond' as Division, 
      tier: 3, 
      rank: 3, 
      points: 0, 
      change: 'down',
      logo: '/placeholder.svg',
      members: 15
    },
    { 
      id: '6', 
      name: 'Finish Line', 
      division: 'platinum' as Division, 
      tier: 1, 
      rank: 4, 
      points: 0, 
      change: 'up',
      logo: '/placeholder.svg',
      members: 6
    },
    { 
      id: '7', 
      name: 'Running Rebels', 
      division: 'platinum' as Division, 
      tier: 2, 
      rank: 5, 
      points: 0, 
      change: 'down',
      logo: '/placeholder.svg',
      members: 10
    },
    { 
      id: '8', 
      name: 'Road Masters', 
      division: 'platinum' as Division, 
      tier: 3, 
      rank: 6, 
      points: 0, 
      change: 'same',
      logo: '/placeholder.svg',
      members: 7
    },
    { 
      id: '2', 
      name: 'Road Runners', 
      division: 'gold' as Division, 
      tier: 1, 
      rank: 7, 
      points: 0, 
      change: 'down',
      logo: '/placeholder.svg',
      members: 9
    },
    { 
      id: '9', 
      name: 'Trailblazers', 
      division: 'gold' as Division, 
      tier: 1, 
      rank: 8, 
      points: 0, 
      change: 'up',
      logo: '/placeholder.svg',
      members: 11
    },
  ] as LeaderboardClub[];

  for (let i = 9; i <= 23; i++) {
    let division: Division;
    let tier: number;
    
    if (i <= 15) {
      division = 'gold';
      tier = Math.floor((i - 9) / 2) + 2;
    } else {
      division = 'silver';
      tier = Math.floor((i - 15) / 2) + 1;
    }
    
    baseData.push({
      id: (i + 10).toString(),
      name: `Club ${i}`,
      division,
      tier,
      rank: i,
      points: 0,
      change: ['up', 'down', 'same'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'same',
      logo: '/placeholder.svg',
      members: Math.floor(Math.random() * 15) + 5
    });
  }

  baseData.push({
    id: '1',
    name: 'Weekend Warriors',
    division: 'silver',
    tier: 2,
    rank: 24,
    points: 0,
    change: 'up',
    logo: '/placeholder.svg',
    members: 8
  });

  for (let i = 25; i <= 100; i++) {
    let division: Division;
    let tier: number;
    
    if (i <= 40) {
      division = 'silver';
      if (i <= 30) {
        tier = 2;
      } else {
        tier = Math.floor((i - 30) / 2) + 3;
      }
    } else {
      division = 'bronze';
      tier = Math.floor((i - 40) / 12) + 1;
    }
    
    baseData.push({
      id: (i + 100).toString(),
      name: `Club ${i}`,
      division,
      tier,
      rank: i,
      points: 0,
      change: ['up', 'down', 'same'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'same',
      logo: '/placeholder.svg',
      members: Math.floor(Math.random() * 15) + 5
    });
  }

  return baseData;
};

export const getDivisionIcon = (division: Division) => {
  switch (division) {
    case 'elite':
      return '👑';
    case 'diamond':
      return '🔷';
    case 'platinum':
      return '💎';
    case 'gold':
      return '🥇';
    case 'silver':
      return '🥈';
    case 'bronze':
      return '🥉';
  }
};

export const getDivisionColor = (division: Division) => {
  switch (division) {
    case 'elite':
      return 'bg-purple-100 text-purple-800';
    case 'diamond':
      return 'bg-blue-100 text-blue-800';
    case 'platinum':
      return 'bg-cyan-100 text-cyan-800';
    case 'gold':
      return 'bg-yellow-100 text-yellow-800';
    case 'silver':
      return 'bg-gray-100 text-gray-800';
    case 'bronze':
      return 'bg-amber-100 text-amber-800';
  }
};

export const formatLeagueWithTier = (division: Division, tier?: number) => {
  if (division === 'elite') return 'Elite League';
  return tier ? `${division.charAt(0).toUpperCase() + division.slice(1)} ${tier}` : division.charAt(0).toUpperCase() + division.slice(1);
};

export const divisions: Division[] = ['elite', 'diamond', 'platinum', 'gold', 'silver', 'bronze'];
