
import { supabase } from '@/integrations/supabase/client';
import { ClubMember } from '@/types';

export const useClubMembers = () => {
  const fetchClubMembers = async (clubId: string): Promise<ClubMember[]> => {
    console.log('[useClubMembers] Fetching members for club:', clubId);
    
    const { data: membersData, error: membersError } = await supabase
      .from('club_members')
      .select('user_id, is_admin, users(id, name, avatar)')
      .eq('club_id', clubId);
      
    if (membersError) {
      console.error('[useClubMembers] Error fetching club members:', membersError);
      throw new Error('Error fetching club members: ' + membersError.message);
    }
    
    console.log('[useClubMembers] Retrieved members data:', membersData);
    
    if (!membersData || membersData.length === 0) {
      console.log('[useClubMembers] No members found for club:', clubId);
      return [];
    }
    
    const members = membersData.map(member => {
      if (!member.users) {
        console.warn('[useClubMembers] Missing user data for member:', member);
        return null;
      }
      
      return {
        id: member.users.id,
        name: member.users.name,
        avatar: member.users.avatar || '/placeholder.svg',
        isAdmin: member.is_admin || false,
        distanceContribution: 0
      };
    }).filter(Boolean) as ClubMember[];
    
    console.log('[useClubMembers] Formatted members:', members);
    return members;
  };

  return { fetchClubMembers };
};
