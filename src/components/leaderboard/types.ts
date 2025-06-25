
import { Division } from '@/types';

export interface LeaderboardClub {
  id: string;
  name: string;
  division: Division;
  tier?: number;
  elitePoints?: number;
  logo: string;
  members: number;
  // These are calculated/derived properties for display
  rank?: number;
  points?: number;
  change?: 'up' | 'down' | 'same';
}
