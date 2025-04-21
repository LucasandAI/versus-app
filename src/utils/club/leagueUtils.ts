import { Division } from '@/types';

export const calculateNewDivisionAndTier = (
  currentDivision: Division, 
  currentTier: number = 1, 
  isWin: boolean,
  elitePoints: number = 0
): { division: Division; tier: number; elitePoints?: number } => {
  const divisionOrder: Division[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite'];
  const currentDivisionIndex = divisionOrder.indexOf(currentDivision);
  
  // Handle Elite division specially (point-based system)
  if (currentDivision === 'Elite') {
    const newPoints = isWin ? elitePoints + 1 : elitePoints - 1;
    
    // Drop to Diamond 1 if points go below 0
    if (newPoints < 0) {
      return { 
        division: 'Diamond', 
        tier: 1,
        elitePoints: 0
      };
    }
    
    return { 
      division: 'Elite', 
      tier: 1,
      elitePoints: newPoints
    };
  }
  
  // Normal division progression
  if (isWin) {
    // If at tier 1, promote to next division's tier 5 (or Elite)
    if (currentTier === 1) {
      const nextDivisionIndex = currentDivisionIndex + 1;
      // Check if we can promote to next division
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
      // Otherwise move up a tier in the same division
      return { 
        division: currentDivision, 
        tier: currentTier - 1 
      };
    }
  } else {
    // Handle relegation for loss
    // At Bronze 5, can't go lower
    if (currentDivision === 'Bronze' && currentTier === 5) {
      return { division: 'Bronze', tier: 5 };
    }
    
    // If at tier 5, relegate to previous division's tier 1
    if (currentTier === 5) {
      const prevDivisionIndex = currentDivisionIndex - 1;
      if (prevDivisionIndex >= 0) {
        const prevDivision = divisionOrder[prevDivisionIndex];
        return { 
          division: prevDivision, 
          tier: 1 
        };
      } else {
        // Stay at current division/tier if already at min
        return { division: currentDivision, tier: currentTier };
      }
    } else {
      // Otherwise move down a tier in the same division
      return { 
        division: currentDivision, 
        tier: currentTier + 1 
      };
    }
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
