
import { Match, ClubMember } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { ensureDivision } from '@/utils/club/leagueUtils';
import { Json } from '@/integrations/supabase/types';

export const useClubMatches = () => {
  const fetchClubMatches = async (clubId: string): Promise<Match[]> => {
    console.log('[useClubMatches] Fetching matches for club:', clubId);
    
    // Fetch match history data from view_full_match_info
    const { data: matchesData, error: matchesError } = await supabase
      .from('view_full_match_info')
      .select('*')
      .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
      .order('end_date', { ascending: false });
      
    if (matchesError) {
      console.error('[useClubMatches] Error fetching match history:', matchesError);
      throw new Error('Error fetching match history: ' + matchesError.message);
    }

    console.log('[useClubMatches] Raw matches data:', matchesData?.length || 0, 'matches found');
    
    const enhancedMatches: Match[] = [];
    
    for (const matchData of matchesData || []) {
      try {
        const isHomeTeam = matchData.home_club_id === clubId;
        
        // Parse home members data directly using the new column
        const homeMembers: ClubMember[] = [];
        if (matchData.home_club_members) {
          const memberContributions = typeof matchData.home_club_members === 'string' 
            ? JSON.parse(matchData.home_club_members) 
            : matchData.home_club_members;
            
          // Convert to array if it's an object
          const membersArray = Array.isArray(memberContributions) 
            ? memberContributions 
            : Object.values(memberContributions);
            
          membersArray.forEach((member: any) => {
            if (member && member.user_id) {
              homeMembers.push({
                id: member.user_id,
                name: member.name || 'Unknown',
                avatar: member.avatar || '/placeholder.svg',
                isAdmin: false, // We don't have is_admin in view_full_match_info
                distanceContribution: parseFloat(String(member.distance || '0'))
              });
            }
          });
        }

        // Parse away members data directly using the new column
        const awayMembers: ClubMember[] = [];
        if (matchData.away_club_members) {
          const memberContributions = typeof matchData.away_club_members === 'string' 
            ? JSON.parse(matchData.away_club_members) 
            : matchData.away_club_members;
            
          // Convert to array if it's an object
          const membersArray = Array.isArray(memberContributions) 
            ? memberContributions 
            : Object.values(memberContributions);
            
          membersArray.forEach((member: any) => {
            if (member && member.user_id) {
              awayMembers.push({
                id: member.user_id,
                name: member.name || 'Unknown',
                avatar: member.avatar || '/placeholder.svg',
                isAdmin: false, // We don't have is_admin in view_full_match_info
                distanceContribution: parseFloat(String(member.distance || '0'))
              });
            }
          });
        }

        // Process league data into the new format
        const parseLeagueData = (leagueData: any) => {
          if (!leagueData) return undefined;
          
          try {
            const parsedData = typeof leagueData === 'string' 
              ? JSON.parse(leagueData) 
              : leagueData;
              
            // Check if it already has home/away structure
            if (parsedData.home && parsedData.away) {
              return {
                home: {
                  division: ensureDivision(parsedData.home.division || 'bronze'),
                  tier: Number(parsedData.home.tier || 1),
                  elitePoints: Number(parsedData.home.elite_points || parsedData.home.elitePoints || 0)
                },
                away: {
                  division: ensureDivision(parsedData.away.division || 'bronze'),
                  tier: Number(parsedData.away.tier || 1),
                  elitePoints: Number(parsedData.away.elite_points || parsedData.away.elitePoints || 0)
                }
              };
            } 
            
            // Old format - convert to new format
            return {
              home: {
                division: ensureDivision(parsedData.division || 'bronze'),
                tier: Number(parsedData.tier || 1),
                elitePoints: Number(parsedData.elite_points || parsedData.elitePoints || 0)
              },
              away: {
                division: ensureDivision(parsedData.division || 'bronze'),
                tier: Number(parsedData.tier || 1),
                elitePoints: Number(parsedData.elite_points || parsedData.elitePoints || 0)
              }
            };
          } catch (e) {
            console.error('Error parsing league data:', e);
            return undefined;
          }
        };

        // Use winner directly from database, with fallback to calculation if not available
        const getWinner = (): 'home' | 'away' | 'draw' => {
          // First check if winner is already set in the database
          if (matchData.winner) {
            console.log(`[useClubMatches] Using winner from database: ${matchData.winner}`);
            if (matchData.winner === 'home' || matchData.winner === 'away' || matchData.winner === 'draw') {
              return matchData.winner as 'home' | 'away' | 'draw';
            }
          }
          
          // Calculate based on distance as fallback
          const homeDistance = parseFloat(String(matchData.home_total_distance || '0'));
          const awayDistance = parseFloat(String(matchData.away_total_distance || '0'));
          
          if (homeDistance > awayDistance) return 'home';
          if (awayDistance > homeDistance) return 'away';
          return 'draw';
        };

        const match: Match = {
          id: matchData.match_id,
          homeClub: {
            id: matchData.home_club_id,
            name: matchData.home_club_name || 'Unknown Team',
            logo: matchData.home_club_logo || '/placeholder.svg',
            division: ensureDivision(matchData.home_club_division || 'bronze'),
            tier: Number(matchData.home_club_tier || 1),
            totalDistance: parseFloat(String(matchData.home_total_distance || '0')),
            members: homeMembers
          },
          awayClub: {
            id: matchData.away_club_id,
            name: matchData.away_club_name || 'Unknown Team',
            logo: matchData.away_club_logo || '/placeholder.svg',
            division: ensureDivision(matchData.away_club_division || 'bronze'),
            tier: Number(matchData.away_club_tier || 1),
            totalDistance: parseFloat(String(matchData.away_total_distance || '0')),
            members: awayMembers
          },
          startDate: matchData.start_date,
          endDate: matchData.end_date,
          status: matchData.status as 'active' | 'completed',
          winner: getWinner(),
          leagueBeforeMatch: parseLeagueData(matchData.league_before_match),
          leagueAfterMatch: parseLeagueData(matchData.league_after_match)
        };

        enhancedMatches.push(match);
      } catch (error) {
        console.error('[useClubMatches] Error processing match data:', error);
      }
    }
    
    console.log('[useClubMatches] Processed', enhancedMatches.length, 'matches successfully');
    return enhancedMatches;
  };

  // Helper function to determine the winner based on distances
  const determineWinner = (homeDistance: number, awayDistance: number): 'home' | 'away' | 'draw' => {
    if (homeDistance > awayDistance) return 'home';
    if (awayDistance > homeDistance) return 'away';
    return 'draw';
  };

  return { fetchClubMatches };
};
