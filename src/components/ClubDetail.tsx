
import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import GoBackHome from './shared/GoBackHome';
import { supabase } from '@/integrations/supabase/client';
import { Club, ClubMember, Match } from '@/types';

const ClubDetail: React.FC = () => {
  const { selectedClub, setSelectedClub, currentUser } = useApp();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  useEffect(() => {
    const loadClubData = async () => {
      if (!selectedClub) return;
      
      setIsLoading(true);
      try {
        // Fetch club data from Supabase
        const { data: clubData, error } = await supabase
          .from('clubs')
          .select('id, name, logo, division, tier, elite_points, bio')
          .eq('id', selectedClub.id)
          .single();
          
        if (error) {
          console.error('Error fetching club:', error);
          return;
        }
        
        // Fetch club members
        const { data: membersData, error: membersError } = await supabase
          .from('club_members')
          .select('user_id, is_admin, users(id, name, avatar)')
          .eq('club_id', selectedClub.id);
          
        if (membersError) {
          console.error('Error fetching club members:', membersError);
          return;
        }
        
        // Transform members data
        const members: ClubMember[] = membersData.map(member => ({
          id: member.users.id,
          name: member.users.name,
          avatar: member.users.avatar || '/placeholder.svg',
          isAdmin: member.is_admin,
          distanceContribution: 0 // Default value
        }));
        
        // Fetch match history
        const { data: matchHistory, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .or(`home_club_id.eq.${selectedClub.id},away_club_id.eq.${selectedClub.id}`)
          .order('end_date', { ascending: false });
          
        if (matchError) {
          console.error('Error fetching match history:', matchError);
        }
        
        // For each match, fetch the participating clubs and member contributions
        const enhancedMatches: Match[] = [];
        
        if (matchHistory && matchHistory.length > 0) {
          for (const match of matchHistory) {
            // Fetch home club
            const { data: homeClub } = await supabase
              .from('clubs')
              .select('id, name, logo')
              .eq('id', match.home_club_id)
              .single();
              
            // Fetch away club
            const { data: awayClub } = await supabase
              .from('clubs')
              .select('id, name, logo')
              .eq('id', match.away_club_id)
              .single();
              
            // Fetch home club members
            const { data: homeMembers } = await supabase
              .from('club_members')
              .select('user_id, is_admin, users(id, name, avatar)')
              .eq('club_id', match.home_club_id);
              
            // Fetch away club members
            const { data: awayMembers } = await supabase
              .from('club_members')
              .select('user_id, is_admin, users(id, name, avatar)')
              .eq('club_id', match.away_club_id);
              
            // Fetch distance contributions for this match
            const { data: distances } = await supabase
              .from('match_distances')
              .select('user_id, club_id, distance_contributed')
              .eq('match_id', match.id);
              
            // Calculate total distances
            let homeTotalDistance = 0;
            let awayTotalDistance = 0;
            
            // Create home members with their contributions
            const homeClubMembers: ClubMember[] = homeMembers.map(member => {
              const memberContribution = distances?.find(d => 
                d.user_id === member.user_id && d.club_id === match.home_club_id
              )?.distance_contributed || 0;
              
              homeTotalDistance += memberContribution;
              
              return {
                id: member.users.id,
                name: member.users.name,
                avatar: member.users.avatar || '/placeholder.svg',
                isAdmin: member.is_admin,
                distanceContribution: memberContribution
              };
            });
            
            // Create away members with their contributions
            const awayClubMembers: ClubMember[] = awayMembers.map(member => {
              const memberContribution = distances?.find(d => 
                d.user_id === member.user_id && d.club_id === match.away_club_id
              )?.distance_contributed || 0;
              
              awayTotalDistance += memberContribution;
              
              return {
                id: member.users.id,
                name: member.users.name,
                avatar: member.users.avatar || '/placeholder.svg',
                isAdmin: member.is_admin,
                distanceContribution: memberContribution
              };
            });
            
            // Create enhanced match
            enhancedMatches.push({
              id: match.id,
              homeClub: {
                id: homeClub.id,
                name: homeClub.name,
                logo: homeClub.logo || '/placeholder.svg',
                totalDistance: homeTotalDistance,
                members: homeClubMembers
              },
              awayClub: {
                id: awayClub.id,
                name: awayClub.name,
                logo: awayClub.logo || '/placeholder.svg',
                totalDistance: awayTotalDistance,
                members: awayClubMembers
              },
              startDate: match.start_date,
              endDate: match.end_date,
              status: new Date(match.end_date) > new Date() ? 'active' : 'completed',
              winner: match.winner,
              leagueBeforeMatch: match.league_before_match,
              leagueAfterMatch: match.league_after_match
            });
          }
        }
        
        // Find current match if any (most recent with end date in the future)
        const currentMatch = enhancedMatches.find(
          match => new Date(match.endDate) > new Date()
        );
        
        // Update the selected club with the fetched data
        const updatedClub: Club = {
          id: clubData.id,
          name: clubData.name,
          logo: clubData.logo || '/placeholder.svg',
          division: clubData.division,
          tier: clubData.tier || 1,
          elitePoints: clubData.elite_points,
          bio: clubData.bio,
          members: members,
          matchHistory: enhancedMatches,
          currentMatch: currentMatch || null
        };
        
        setSelectedClub(updatedClub);
      } catch (error) {
        console.error('Error loading club data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadClubData();
  }, [selectedClub?.id]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading club details...</div>;
  }

  if (!selectedClub) {
    return <GoBackHome />;
  }

  return <ClubDetailContent club={selectedClub} />;
};

export default ClubDetail;
