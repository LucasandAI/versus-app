
import { Division } from '@/types';

export const formatLeague = (division: Division, tier?: number) => {
  if (division === 'elite') {
    return 'Elite League';
  }
  
  const divisionName = division.charAt(0).toUpperCase() + division.slice(1);
  return tier ? `${divisionName} ${tier}` : divisionName;
};

export const getDivisionEmoji = (division: Division) => {
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
    default:
      return '';
  }
};
