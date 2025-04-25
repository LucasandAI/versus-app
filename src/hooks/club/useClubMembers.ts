
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClubMember } from '@/types';

export const useClubMembers = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClubMembers = async (clubId: string): Promise<ClubMember[]> => {
    if (!clubId) {
      console.error('[useClubMembers] No club ID provided');
      return [];
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[useClubMembers] Fetching members for club:', clubId);
      
      // First, get the club members for the specified club
      const { data: membersData, error: membersError } = await supabase
        .from('club_members')
        .select('user_id, is_admin')
        .eq('club_id', clubId);
        
      if (membersError) {
        console.error('[useClubMembers] Error fetching club members:', membersError);
        throw new Error('Error fetching club members');
      }
      
      console.log('[useClubMembers] Retrieved club members data:', membersData);
      
      if (!membersData || membersData.length === 0) {
        console.log('[useClubMembers] No members found for club:', clubId);
        return [];
      }
      
      // Extract user IDs from the members data
      const userIds = membersData.map(member => member.user_id);
      
      // Fetch user details for all members in a single query
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, avatar')
        .in('id', userIds);
        
      if (usersError) {
        console.error('[useClubMembers] Error fetching users data:', usersError);
        throw new Error('Error fetching users data');
      }
      
      console.log('[useClubMembers] Retrieved users data:', usersData);
      
      // Create a map of user data for easy lookup
      const userMap = new Map();
      usersData?.forEach(user => userMap.set(user.id, user));
      
      // Combine the data to create the final member list
      const members = membersData.map(member => {
        const userData = userMap.get(member.user_id);
        
        if (!userData) {
          console.warn('[useClubMembers] Missing user data for member:', member);
          return null;
        }
        
        return {
          id: userData.id,
          name: userData.name,
          avatar: userData.avatar || '/placeholder.svg',
          isAdmin: member.is_admin,
          distanceContribution: 0
        };
      }).filter(Boolean) as ClubMember[];
      
      console.log('[useClubMembers] Formatted members:', members);
      return members;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[useClubMembers] Exception occurred:', errorMessage);
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return { fetchClubMembers, isLoading, error };
};
