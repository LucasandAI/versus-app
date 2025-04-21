import { Division } from '@/types';

export const calculateNewDivisionAndTier = (
  currentDivision: Division, 
  currentTier: number = 1, 
  isWin: boolean,
  elitePoints: number = 0
): { division: Division; tier: number; elitePoints?: number } => {
  const divisionOrder: Division[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite'];
  const currentDivisionIndex = divisionOrder.indexOf(currentDivision);
  
  // If it's a tie, maintain the current division and tier
  if (!isWin) {
    return { 
      division: currentDivision, 
      tier: currentTier,
      ...(currentDivision === 'Elite' && { elitePoints })
    };
  }
  
  // Handle Elite division specially (point-based system)
  if (currentDivision === 'Elite') {
    const newPoints = elitePoints + 1;
    
    return { 
      division: 'Elite', 
      tier: 1,
      elitePoints: newPoints
    };
  }
  
  // Normal division progression for wins
  if (currentTier === 1) {
    const nextDivisionIndex = currentDivisionIndex + 1;
    if (nextDivisionIndex < divisionOrder.length) {
      const nextDivision = divisionOrder[nextDivisionIndex];
      return { 
        division: nextDivision, 
        tier: nextDivision === 'Elite' ? 1 : 5,
        elitePoints: nextDivision === 'Elite' ? 0 : undefined
      };
    } else {
      // Stay at current division/tier if already at max
      return { division: currentDivision, tier: currentTier };
    }
  } else {
    // Move up a tier in the same division
    return { 
      division: currentDivision, 
      tier: currentTier - 1 
    };
  }
};

// Helper function to get division emoji
export const getDivisionEmoji = (division: Division): string => {
  switch (division) {
    case 'Bronze':
      return '🥉';
    case 'Silver':
      return '🥈';
    case 'Gold':
      return '🥇';
    case 'Platinum':
      return '💎';
    case 'Diamond':
      return '🔷';
    case 'Elite':
      return '👑';
    default:
      return '';
  }
};

// Format league for display
export const formatLeague = (division: Division, tier?: number): string => {
  if (division === 'Elite') return 'Elite League';
  return tier ? `${division} ${tier}` : division;
};
