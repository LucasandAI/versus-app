
import { Match, ClubMember } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { ensureDivision } from '@/utils/club/leagueUtils';
import { Json } from '@/integrations/supabase/types';

export const useClubMatches = () => {
  const fetchClubMatches = async (clubId: string): Promise<Match[]> => {
    // Fetch match history data from view_full_match_info
    const { data: matchesData, error: matchesError } = await supabase
      .from('view_full_match_info')
      .select('*')
      .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
      .order('end_date', { ascending: false });
      
    if (matchesError) {
      console.error('Error fetching match history:', matchesError);
      throw new Error('Error fetching match history: ' + matchesError.message);
    }

    const enhancedMatches: Match[] = [];
    
    for (const matchData of matchesData || []) {
      try {
        const isHomeTeam = matchData.home_club_id === clubId;
        
        // Parse home members data
        const homeMembers: ClubMember[] = [];
        if (matchData.home_member_contributions) {
          const memberContributions = typeof matchData.home_member_contributions === 'string' 
            ? JSON.parse(matchData.home_member_contributions) 
            : matchData.home_member_contributions;
            
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
                isAdmin: member.is_admin || false,
                distanceContribution: parseFloat(member.distance || '0')
              });
            }
          });
        }

        // Parse away members data
        const awayMembers: ClubMember[] = [];
        if (matchData.away_member_contributions) {
          const memberContributions = typeof matchData.away_member_contributions === 'string' 
            ? JSON.parse(matchData.away_member_contributions) 
            : matchData.away_member_contributions;
            
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
                isAdmin: member.is_admin || false,
                distanceContribution: parseFloat(member.distance || '0')
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

        const match: Match = {
          id: matchData.match_id,
          homeClub: {
            id: matchData.home_club_id,
            name: matchData.home_club_name || 'Unknown Team',
            logo: matchData.home_club_logo || '/placeholder.svg',
            division: ensureDivision(matchData.home_division || 'bronze'),
            tier: Number(matchData.home_tier || 1),
            totalDistance: parseFloat(matchData.home_total_distance || '0'),
            members: homeMembers
          },
          awayClub: {
            id: matchData.away_club_id,
            name: matchData.away_club_name || 'Unknown Team',
            logo: matchData.away_club_logo || '/placeholder.svg',
            division: ensureDivision(matchData.away_division || 'bronze'),
            tier: Number(matchData.away_tier || 1),
            totalDistance: parseFloat(matchData.away_total_distance || '0'),
            members: awayMembers
          },
          startDate: matchData.start_date,
          endDate: matchData.end_date,
          status: matchData.status as 'active' | 'completed',
          winner: matchData.winner as 'home' | 'away' | 'draw' | undefined,
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

  return { fetchClubMatches };
};
