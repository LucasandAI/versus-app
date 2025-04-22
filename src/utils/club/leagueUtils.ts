import { Division } from '@/types';

export const calculateNewDivisionAndTier = (
  currentDivision: Division, 
  currentTier: number = 1, 
  isWin: boolean,
  elitePoints: number = 0
): { division: Division; tier: number; elitePoints?: number } => {
  const divisionOrder: Division[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'elite'];
  const currentDivisionIndex = divisionOrder.indexOf(currentDivision);
  
  // If it's a tie, maintain the current division and tier
  if (!isWin) {
    return { 
      division: currentDivision, 
      tier: currentTier,
      ...(currentDivision === 'elite' && { elitePoints })
    };
  }
  
  // Handle Elite division specially (point-based system)
  if (currentDivision === 'elite') {
    const newPoints = elitePoints + 1;
    
    return { 
      division: 'elite', 
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
        tier: nextDivision === 'elite' ? 1 : 5,
        elitePoints: nextDivision === 'elite' ? 0 : undefined
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

// Handle demotion logic - separate from the promotion logic
export const handleDemotion = (
  currentDivision: Division, 
  currentTier: number = 1, 
  elitePoints: number = 0
): { division: Division; tier: number; elitePoints?: number } => {
  const divisionOrder: Division[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'elite'];
  const currentDivisionIndex = divisionOrder.indexOf(currentDivision);
  
  // Special case for Elite division - points-based system
  if (currentDivision === 'elite') {
    const newPoints = elitePoints - 1;
    
    // If points drop below 0, demote to Diamond 1
    if (newPoints < 0) {
      return { 
        division: 'diamond', 
        tier: 1
      };
    }
    
    // Otherwise just reduce the points
    return { 
      division: 'elite', 
      tier: 1,
      elitePoints: newPoints
    };
  }
  
  // For lowest division (Bronze), can't demote further than tier 5
  if (currentDivision === 'bronze') {
    return { 
      division: 'bronze', 
      tier: Math.min(5, currentTier + 1) 
    };
  }
  
  // For other divisions
  if (currentTier === 5) {
    // Demote to previous division Tier 1
    const previousDivisionIndex = currentDivisionIndex - 1;
    const previousDivision = divisionOrder[previousDivisionIndex];
    return { 
      division: previousDivision,
      tier: 1
    };
  } else {
    // Move down a tier in the same division
    return { 
      division: currentDivision, 
      tier: currentTier + 1 
    };
  }
};

// Helper function to get division emoji
export const getDivisionEmoji = (division: Division): string => {
  switch (division) {
    case 'bronze':
      return '🥉';
    case 'silver':
      return '🥈';
    case 'gold':
      return '🥇';
    case 'platinum':
      return '💎';
    case 'diamond':
      return '🔷';
    case 'elite':
      return '👑';
    default:
      return '';
  }
};

// Format league for display
export const formatLeague = (division: Division, tier?: number): string => {
  if (division === 'elite') return 'Elite League';
  return tier ? `${division.charAt(0).toUpperCase() + division.slice(1)} ${tier}` : division.charAt(0).toUpperCase() + division.slice(1);
};
