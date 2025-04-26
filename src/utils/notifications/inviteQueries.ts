
import { supabase } from '@/integrations/supabase/client';

// Function to check if a user has a pending invite for a specific club
export const hasPendingInvite = async (clubId: string, userId?: string): Promise<boolean> => {
  try {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      userId = user.id;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .in('type', ['invite'])
      .eq('status', 'pending')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      console.error('Error checking pending invites:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in hasPendingInvite:', error);
    return false;
  }
};
