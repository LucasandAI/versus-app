
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club, ClubMember, Match } from '@/types';
import { ensureDivision } from '@/utils/club/leagueUtils';
import { transformMatchData } from '@/utils/club/matchHistoryUtils';

export const useClubData = (clubId: string | undefined) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [club, setClub] = useState<Club | null>(null);

  useEffect(() => {
    const loadClubData = async () => {
      if (!clubId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch club data
        const { data: clubData, error } = await supabase
          .from('clubs')
          .select('id, name, logo, division, tier, bio, elite_points')
          .eq('id', clubId)
          .single();
        
        if (error) {
          throw new Error('Error fetching club: ' + error.message);
        }

        if (!clubData) {
          throw new Error('No club data found');
        }
        
        // Fetch club members
        const { data: membersData, error: membersError } = await supabase
          .from('club_members')
          .select('user_id, is_admin, users(id, name, avatar)')
          .eq('club_id', clubId);
          
        if (membersError) {
          throw new Error('Error fetching club members: ' + membersError.message);
        }
        
        // Transform members data
        const members: ClubMember[] = membersData.map(member => ({
          id: member.users.id,
          name: member.users.name,
          avatar: member.users.avatar || '/placeholder.svg',
          isAdmin: member.is_admin,
          distanceContribution: 0
        }));
        
        // Fetch match history
        const { data: matchHistory, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
          .order('end_date', { ascending: false });
          
        if (matchError) {
          throw new Error('Error fetching match history: ' + matchError.message);
        }
        
        // Process matches with enhanced data
        const enhancedMatches: Match[] = [];
        
        if (matchHistory && matchHistory.length > 0) {
          for (const match of matchHistory) {
            const homeClubData = await supabase
              .from('clubs')
              .select('id, name, logo')
              .eq('id', match.home_club_id)
              .single();
              
            const awayClubData = await supabase
              .from('clubs')
              .select('id, name, logo')
              .eq('id', match.away_club_id)
              .single();
              
            const homeMembers = await supabase
              .from('club_members')
              .select('user_id, is_admin, users(id, name, avatar)')
              .eq('club_id', match.home_club_id);
              
            const awayMembers = await supabase
              .from('club_members')
              .select('user_id, is_admin, users(id, name, avatar)')
              .eq('club_id', match.away_club_id);
              
            const distances = await supabase
              .from('match_distances')
              .select('user_id, club_id, distance_contributed')
              .eq('match_id', match.id);

            if (!homeClubData.data || !awayClubData.data) continue;

            // Calculate total distances and member contributions
            let homeTotalDistance = 0;
            let awayTotalDistance = 0;
            
            // Process home club members
            const homeClubMembers: ClubMember[] = (homeMembers.data || []).map(member => {
              const contribution = distances.data?.find(d => 
                d.user_id === member.user_id && d.club_id === match.home_club_id
              )?.distance_contributed || 0;
              
              homeTotalDistance += contribution;
              
              return {
                id: member.users.id,
                name: member.users.name,
                avatar: member.users.avatar || '/placeholder.svg',
                isAdmin: member.is_admin,
                distanceContribution: contribution
              };
            });
            
            // Process away club members
            const awayClubMembers: ClubMember[] = (awayMembers.data || []).map(member => {
              const contribution = distances.data?.find(d => 
                d.user_id === member.user_id && d.club_id === match.away_club_id
              )?.distance_contributed || 0;
              
              awayTotalDistance += contribution;
              
              return {
                id: member.users.id,
                name: member.users.name,
                avatar: member.users.avatar || '/placeholder.svg',
                isAdmin: member.is_admin,
                distanceContribution: contribution
              };
            });

            // Handle league data correctly, ensuring we safely access JSON data
            const leagueBeforeMatch = match.league_before_match ? {
              division: ensureDivision(typeof match.league_before_match === 'object' && match.league_before_match?.division ? 
                String(match.league_before_match.division) : 'bronze'),
              tier: typeof match.league_before_match === 'object' && match.league_before_match?.tier ? 
                Number(match.league_before_match.tier) : 1,
              elitePoints: typeof match.league_before_match === 'object' && match.league_before_match?.elite_points ? 
                Number(match.league_before_match.elite_points) : 0
            } : undefined;
            
            const leagueAfterMatch = match.league_after_match ? {
              division: ensureDivision(typeof match.league_after_match === 'object' && match.league_after_match?.division ? 
                String(match.league_after_match.division) : 'bronze'),
              tier: typeof match.league_after_match === 'object' && match.league_after_match?.tier ? 
                Number(match.league_after_match.tier) : 1,
              elitePoints: typeof match.league_after_match === 'object' && match.league_after_match?.elite_points ? 
                Number(match.league_after_match.elite_points) : 0
            } : undefined;

            // Determine match status (either "active" or "completed")
            const matchStatus = new Date(match.end_date) > new Date() ? 'active' : 'completed';

            const enhancedMatch: Match = {
              id: match.id,
              homeClub: {
                id: homeClubData.data.id,
                name: homeClubData.data.name,
                logo: homeClubData.data.logo || '/placeholder.svg',
                totalDistance: homeTotalDistance,
                members: homeClubMembers
              },
              awayClub: {
                id: awayClubData.data.id,
                name: awayClubData.data.name,
                logo: awayClubData.data.logo || '/placeholder.svg',
                totalDistance: awayTotalDistance,
                members: awayClubMembers
              },
              startDate: match.start_date,
              endDate: match.end_date,
              status: matchStatus,
              winner: match.winner as 'home' | 'away' | 'draw' | undefined,
              leagueBeforeMatch,
              leagueAfterMatch
            };
            
            enhancedMatches.push(enhancedMatch);
          }
        }
        
        // Find current match if any
        const currentMatch = enhancedMatches.find(
          match => new Date(match.endDate) > new Date()
        );
        
        // Create the final club object
        const updatedClub: Club = {
          id: clubData.id,
          name: clubData.name,
          logo: clubData.logo || '/placeholder.svg',
          division: ensureDivision(clubData.division),
          tier: clubData.tier || 1,
          elitePoints: clubData.elite_points || 0,
          bio: clubData.bio,
          members,
          matchHistory: enhancedMatches,
          currentMatch: currentMatch || null
        };
        
        setClub(updatedClub);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error loading club data';
        console.error(message);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadClubData();
  }, [clubId]);

  return { club, isLoading, error };
};
