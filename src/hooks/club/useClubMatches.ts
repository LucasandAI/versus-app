
import { Match, ClubMember } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { ensureDivision } from '@/utils/club/leagueUtils';
import { debounce } from 'lodash';

export const useClubMatches = () => {
  const fetchClubMatches = async (clubId: string): Promise<Match[]> => {
    // Fetch match history data from view_full_match_info
    const { data: matchesData, error: matchesError } = await supabase
      .from('view_full_match_info')
      .select('*')
      .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
      .eq('status', 'completed') // Only include completed matches in history
      .order('end_date', { ascending: false });
      
    if (matchesError) {
      console.error('Error fetching match history:', matchesError);
      throw new Error('Error fetching match history: ' + matchesError.message);
    }

    const enhancedMatches: Match[] = [];
    
    for (const matchData of matchesData || []) {
      try {
        const isHomeTeam = matchData.home_club_id === clubId;
        
        // Parse members data - using standardized approach
        const parseMembers = (membersJson: any): ClubMember[] => {
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

        // Parse home and away members using the standardized function
        const homeMembers = parseMembers(matchData.home_club_members);
        const awayMembers = parseMembers(matchData.away_club_members);

        // Calculate total distances based on member contributions
        const homeTotalDistance = homeMembers.reduce((sum, member) => 
          sum + (member.distanceContribution || 0), 0);
          
        const awayTotalDistance = awayMembers.reduce((sum, member) => 
          sum + (member.distanceContribution || 0), 0);

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

        // Ensure winner value is one of the allowed literal types
        const getWinnerValue = (winnerStr: string | null): 'home' | 'away' | 'draw' | undefined => {
          if (winnerStr === 'home' || winnerStr === 'away' || winnerStr === 'draw') {
            return winnerStr;
          }
          
          // If winner is not a valid value, determine based on distances
          return determineWinner(
            matchData.home_total_distance !== null ?
              parseFloat(String(matchData.home_total_distance)) : homeTotalDistance,
            matchData.away_total_distance !== null ?
              parseFloat(String(matchData.away_total_distance)) : awayTotalDistance
          );
        };

        const match: Match = {
          id: matchData.match_id,
          homeClub: {
            id: matchData.home_club_id,
            name: matchData.home_club_name || 'Unknown Team',
            logo: matchData.home_club_logo || '/placeholder.svg',
            division: ensureDivision(matchData.home_club_division || 'bronze'),
            tier: Number(matchData.home_club_tier || 1),
            totalDistance: matchData.home_total_distance !== null ? 
              parseFloat(String(matchData.home_total_distance)) : homeTotalDistance,
            members: homeMembers
          },
          awayClub: {
            id: matchData.away_club_id,
            name: matchData.away_club_name || 'Unknown Team',
            logo: matchData.away_club_logo || '/placeholder.svg',
            division: ensureDivision(matchData.away_club_division || 'bronze'),
            tier: Number(matchData.away_club_tier || 1),
            totalDistance: matchData.away_total_distance !== null ? 
              parseFloat(String(matchData.away_total_distance)) : awayTotalDistance,
            members: awayMembers
          },
          startDate: matchData.start_date,
          endDate: matchData.end_date,
          status: matchData.status as 'active' | 'completed',
          // Use our safe getter function to ensure type safety
          winner: getWinnerValue(matchData.winner),
          leagueBeforeMatch: parseLeagueData(matchData.league_before_match),
          leagueAfterMatch: parseLeagueData(matchData.league_after_match)
        };

        enhancedMatches.push(match);
      } catch (error) {
        console.error('Error processing match data:', error);
      }
    }
    
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
