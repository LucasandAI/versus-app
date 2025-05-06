
import { supabase } from '@/integrations/supabase/client';

// Function to check if a club is full
export const isClubFull = async (clubId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('club_members')
      .select('user_id', { count: 'exact' })
      .eq('club_id', clubId);

    if (error) {
      console.error('Error checking club capacity:', error);
      return false;
    }

    return (data?.length || 0) >= 5;
  } catch (error) {
    console.error('Error in isClubFull:', error);
    return false;
  }
};
