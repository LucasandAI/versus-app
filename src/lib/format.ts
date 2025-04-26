
import { Division } from '@/types';

export const formatLeagueWithTier = (division?: Division, tier?: number) => {
  if (!division) return 'Unknown';
  
  // Handle the elite division case specifically
  if (division === 'elite') return 'Elite League';
  
  // Safely capitalize the first letter if the division name exists
  const capitalizedDivision = division.charAt(0).toUpperCase() + division.slice(1);
  
  // Return with tier if available, otherwise just the division name
  return tier ? `${capitalizedDivision} ${tier}` : capitalizedDivision;
};
