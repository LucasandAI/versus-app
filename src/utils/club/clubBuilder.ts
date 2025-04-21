
import { Club } from '@/types';

const CLUB_NAMES = [
  'Weekend Warriors', 'Sprint Squad', 'Hill Climbers',
  'Mountain Goats', 'Trail Blazers', 'Urban Pacers',
  'Night Striders', 'Marathon Masters', 'Peak Performers'
];

export const buildMinimalClub = (clubId: string, name?: string): Club => {
  return {
    id: clubId,
    name: name || CLUB_NAMES[Math.floor(Math.random() * CLUB_NAMES.length)],
    logo: '/placeholder.svg',
    division: 'Bronze',
    tier: 5,
    members: [],
    matchHistory: []
  };
};
