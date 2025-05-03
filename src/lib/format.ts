
import { Division } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export const formatLeagueWithTier = (division?: Division, tier?: number) => {
  if (!division) return 'Unknown League';
  
  // Handle the elite division case specifically
  if (division.toLowerCase() === 'elite') return 'Elite League';
  
  // Safely capitalize the first letter if the division name exists
  const capitalizedDivision = division.charAt(0).toUpperCase() + division.slice(1);
  
  // Return with tier if available, otherwise just the division name
  return tier ? `${capitalizedDivision} ${tier}` : capitalizedDivision;
};

export const formatTimeAgo = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};
