
import { supabase } from '@/integrations/supabase/client';
import { Club, ClubMember } from '@/types';
import { transformRawMatchesToMatchType } from '@/utils/club/matchHistoryUtils';
import { ensureDivision } from '@/utils/club/leagueUtils';

export const useFetchUserClubs = async (userId: string) => {
  // Fetch club memberships
  const { data: memberships, error: membershipsError } = await supabase
    .from('club_members')
    .select('club_id, is_admin')
    .eq('user_id', userId);

  if (membershipsError) {
    return { clubs: [], error: membershipsError };
  }

  const clubs: Club[] = [];
  if (memberships && memberships.length > 0) {
    for (const membership of memberships) {
      // Fetch club details
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('id, name, logo, division, tier, elite_points, bio')
        .eq('id', membership.club_id)
        .single();

      if (clubError || !clubData) {
        continue;
      }

      // Fetch club members
      const { data: membersData } = await supabase
        .from('club_members')
        .select('user_id, is_admin')
        .eq('club_id', membership.club_id);

      const members: ClubMember[] = [];
      for (const member of membersData || []) {
        const { data: memberUserData } = await supabase
          .from('users')
          .select('id, name, avatar')
          .eq('id', member.user_id)
          .single();
        if (!memberUserData) continue;
        members.push({
          id: memberUserData.id,
          name: memberUserData.name || 'Unknown User',
          avatar: memberUserData.avatar || '/placeholder.svg',
          isAdmin: member.is_admin,
          distanceContribution: 0
        });
      }

      // Fetch match history
      const { data: matchHistory } = await supabase
        .from('matches')
        .select('*')
        .or(`home_club_id.eq.${clubData.id},away_club_id.eq.${clubData.id}`)
        .order('end_date', { ascending: false });

      // Transform match data
      const transformedMatches = transformRawMatchesToMatchType(matchHistory || [], clubData.id);

      // Transform club data
      clubs.push({
        id: clubData.id,
        name: clubData.name,
        logo: clubData.logo || '/placeholder.svg',
        division: ensureDivision(clubData.division),
        tier: clubData.tier || 1,
        elitePoints: clubData.elite_points || 0,
        members: members,
        matchHistory: transformedMatches,
        bio: clubData.bio || 'No description available'
      });
    }
  }

  return { clubs, error: null };
};
