
import { Club } from '@/types';

export const getBestLeague = (clubs: Club[] = []) => {
  if (!clubs || clubs.length === 0) {
    return { league: 'Bronze', tier: 5 };
  }

  const leagueRanking = {
    'Elite': 0,
    'Diamond': 1,
    'Platinum': 2,
    'Gold': 3,
    'Silver': 4,
    'Bronze': 5
  };

  return clubs.reduce((best, club) => {
    const clubRank = leagueRanking[club.division];
    const clubTier = club.tier || 5;
    
    if (clubRank < best.rank || (clubRank === best.rank && clubTier < best.tier)) {
      return { 
        league: club.division, 
        tier: clubTier,
        rank: clubRank
      };
    }
    return best;
  }, { league: 'Bronze' as const, tier: 5, rank: 5 });
};
