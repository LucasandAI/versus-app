
import { Division } from '@/types';

export const formatLeagueWithTier = (division?: Division, tier?: number) => {
  if (!division) return 'Unknown League';
  
  // Handle the elite division case specifically
  if (division.toLowerCase() === 'elite') return 'Elite League';
  
  // Safely capitalize the first letter if the division name exists
  const capitalizedDivision = division.charAt(0).toUpperCase() + division.slice(1);
  
  // Return with tier if available, otherwise just the division name
  return tier ? `${capitalizedDivision} ${tier}` : capitalizedDivision;
};

// Added formatTimeAgo function to handle relative time formatting
export const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const messageDate = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }
  
  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  
  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
  
  // Format as date
  return messageDate.toLocaleDateString(undefined, { 
    month: 'short',
    day: 'numeric'
  });
};
