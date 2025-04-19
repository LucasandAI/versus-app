
import { Division } from '@/types';

export const calculateNewDivisionAndTier = (
  currentDivision: Division, 
  currentTier: number = 1, 
  isWin: boolean
): { division: Division; tier: number } => {
  const divisionOrder: Division[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite'];
  const currentDivisionIndex = divisionOrder.indexOf(currentDivision);
  
  if (isWin) {
    if (currentDivision === 'Elite') {
      return { division: 'Elite', tier: 1 };
    }
    
    if (currentTier === 1) {
      return { 
        division: divisionOrder[currentDivisionIndex + 1], 
        tier: 1 
      };
    } else {
      return { 
        division: currentDivision, 
        tier: currentTier - 1 
      };
    }
  } else {
    if (currentDivision === 'Bronze' && currentTier === 5) {
      return { division: 'Bronze', tier: 5 };
    }
    
    if (currentTier === 5 || (currentDivision === 'Elite' && currentTier === 1)) {
      return { 
        division: divisionOrder[Math.max(0, currentDivisionIndex - 1)], 
        tier: 1 
      };
    } else {
      return { 
        division: currentDivision, 
        tier: currentTier + 1 
      };
    }
  }
};
