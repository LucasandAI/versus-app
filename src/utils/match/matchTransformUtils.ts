
import { Club, Match, MatchTeam, ClubMember } from '@/types';
import { ensureDivision } from '../club/leagueUtils';

// Enhanced cache with longer TTL and preview data support
const matchDataCache: Record<string, {
  data: Match,
  timestamp: number,
  isPreview?: boolean
}> = {};

// Increased cache TTL for better performance
const CACHE_TTL = 30000; // 30 seconds
const PREVIEW_CACHE_TTL = 60000; // 1 minute for preview data

// Parse members data with performance optimization
export const parseMembers = (membersJson: any): ClubMember[] => {
  if (!membersJson) return [];
  
  try {
    // Handle both string and object formats
    const parsedMembers = typeof membersJson === 'string' 
      ? JSON.parse(membersJson) 
      : membersJson;
      
    // Handle both array and object formats
    const membersArray = Array.isArray(parsedMembers) 
      ? parsedMembers 
      : Object.values(parsedMembers);
    
    return membersArray.map((member: any) => ({
      id: member.user_id,
      name: member.name || 'Unknown',
      avatar: member.avatar || '/placeholder.svg',
      isAdmin: member.is_admin || false,
      distanceContribution: parseFloat(String(member.distance || '0'))
    }));
  } catch (error) {
    console.error('Error parsing members JSON:', error);
    return [];
  }
};

// Calculate total distance for a team
export const calculateTotalDistance = (members: ClubMember[]): number => {
  return members.reduce((sum, member) => sum + (member.distanceContribution || 0), 0);
};

// Get winner value of the allowed literal types
export const getWinnerValue = (winnerStr: string | null): 'home' | 'away' | 'draw' | undefined => {
  if (winnerStr === 'home' || winnerStr === 'away' || winnerStr === 'draw') {
    return winnerStr;
  }
  return undefined;
};

// Transform raw match data to Match type with enhanced caching
export const transformMatchData = (rawMatch: any, userClubId: string, isPreview = false): Match => {
  // Generate cache key with preview flag
  const cacheKey = `${rawMatch.match_id}_${rawMatch.updated_at || ''}_${userClubId}_${isPreview}`;
  
  // Check if we have a valid cached version
  const cachedMatch = matchDataCache[cacheKey];
  const now = Date.now();
  const ttl = isPreview ? PREVIEW_CACHE_TTL : CACHE_TTL;
  
  if (cachedMatch && (now - cachedMatch.timestamp < ttl)) {
    return cachedMatch.data;
  }
  
  // Process members data - skip for preview mode for faster loading
  const homeMembers = isPreview ? [] : parseMembers(rawMatch.home_club_members);
  const awayMembers = isPreview ? [] : parseMembers(rawMatch.away_club_members);
  
  // Calculate total distances - use provided totals if available for better performance
  const homeTotalDistance = rawMatch.home_total_distance !== null ? 
    parseFloat(String(rawMatch.home_total_distance)) : 
    calculateTotalDistance(homeMembers);
    
  const awayTotalDistance = rawMatch.away_total_distance !== null ? 
    parseFloat(String(rawMatch.away_total_distance)) : 
    calculateTotalDistance(awayMembers);

  // Create team objects
  const homeTeam: MatchTeam = {
    id: rawMatch.home_club_id,
    name: rawMatch.home_club_name || "Unknown Club",
    logo: rawMatch.home_club_logo || '/placeholder.svg',
    division: ensureDivision(rawMatch.home_club_division),
    tier: Number(rawMatch.home_club_tier || 1),
    totalDistance: homeTotalDistance,
    members: homeMembers
  };
  
  const awayTeam: MatchTeam = {
    id: rawMatch.away_club_id,
    name: rawMatch.away_club_name || "Unknown Club", 
    logo: rawMatch.away_club_logo || '/placeholder.svg',
    division: ensureDivision(rawMatch.away_club_division),
    tier: Number(rawMatch.away_club_tier || 1),
    totalDistance: awayTotalDistance,
    members: awayMembers
  };
  
  // Create the match object
  const match: Match = {
    id: rawMatch.match_id,
    homeClub: homeTeam,
    awayClub: awayTeam,
    startDate: rawMatch.start_date,
    endDate: rawMatch.end_date,
    status: rawMatch.status as 'active' | 'completed',
    winner: getWinnerValue(rawMatch.winner)
  };
  
  // Cache the result
  matchDataCache[cacheKey] = {
    data: match,
    timestamp: now,
    isPreview
  };
  
  return match;
};

// Extract club IDs from club objects for efficient dependency tracking
export const getClubIdsString = (clubs: Club[]): string => {
  if (!clubs || clubs.length === 0) return '';
  return clubs.map(club => club.id).sort().join(',');
};

// Clear cache when needed (e.g., on manual refresh)
export const clearMatchCache = () => {
  Object.keys(matchDataCache).forEach(key => {
    delete matchDataCache[key];
  });
};

// Get cached preview data if available
export const getCachedPreviewData = (matchId: string, userClubId: string): Match | null => {
  const cacheKey = `${matchId}__${userClubId}_true`;
  const cachedMatch = matchDataCache[cacheKey];
  const now = Date.now();
  
  if (cachedMatch && (now - cachedMatch.timestamp < PREVIEW_CACHE_TTL)) {
    return cachedMatch.data;
  }
  
  return null;
};
