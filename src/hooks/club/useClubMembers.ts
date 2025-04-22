
import { supabase } from '@/integrations/supabase/client';
import { ClubMember } from '@/types';

export const useClubMembers = () => {
  const fetchClubMembers = async (clubId: string): Promise<ClubMember[]> => {
    const { data: membersData, error: membersError } = await supabase
      .from('club_members')
      .select('user_id, is_admin, users(id, name, avatar)')
      .eq('club_id', clubId);
      
    if (membersError) {
      throw new Error('Error fetching club members: ' + membersError.message);
    }
    
    return membersData.map(member => ({
      id: member.users.id,
      name: member.users.name,
      avatar: member.users.avatar || '/placeholder.svg',
      isAdmin: member.is_admin,
      distanceContribution: 0
    }));
  };

  return { fetchClubMembers };
};
