
import { supabase } from '@/integrations/supabase/client';

export const useFetchUserProfile = async (userId: string) => {
  // Fetch all user profile fields in one optimized query
  const { data: userData, error } = await supabase
    .from('users')
    .select('id, name, avatar, bio, instagram, twitter, facebook, linkedin, website, tiktok')
    .eq('id', userId)
    .single();

  return { userData, error };
};
