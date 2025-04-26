
import { supabase } from '@/integrations/supabase/client';
import { JoinRequest } from '@/types';

// Function to check if a user has pending join requests for a club
export const hasPendingJoinRequest = async (userId: string, clubId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('club_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .eq('status', 'pending')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      console.error('Error checking pending join requests:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in hasPendingJoinRequest:', error);
    return false;
  }
};

// Function to fetch join requests for a club
export const fetchClubJoinRequests = async (clubId: string): Promise<JoinRequest[]> => {
  try {
    const { data: requestsData, error: requestsError } = await supabase
      .from('club_requests')
      .select('id, user_id, club_id, status, created_at')
      .eq('club_id', clubId)
      .eq('status', 'pending');

    if (requestsError) {
      console.error('Error fetching join requests:', requestsError);
      return [];
    }

    if (!requestsData || requestsData.length === 0) {
      return [];
    }

    const results: JoinRequest[] = [];
    
    for (const request of requestsData) {
      const { data: userData } = await supabase
        .from('users')
        .select('name, avatar')
        .eq('id', request.user_id)
        .single();
        
      results.push({
        id: request.id,
        userId: request.user_id,
        clubId: request.club_id,
        userName: userData?.name || 'Unknown User',
        userAvatar: userData?.avatar || '',
        createdAt: request.created_at
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error in fetchClubJoinRequests:', error);
    return [];
  }
};
