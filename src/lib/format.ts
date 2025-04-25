
import { Division } from '@/types';

export const formatLeagueWithTier = (division: Division, tier?: number) => {
  if (division === 'elite') return 'Elite League';
  return tier ? `${division.charAt(0).toUpperCase() + division.slice(1)} ${tier}` : division.charAt(0).toUpperCase() + division.slice(1);
};
