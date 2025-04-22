
import { supabase } from '@/integrations/supabase/client';

export const useFetchUserProfile = async (userId: string) => {
  // Fetch user profile fields
  const { data: userData, error } = await supabase
    .from('users')
    .select('id, name, avatar, bio, instagram, twitter, facebook, linkedin, website, tiktok')
    .eq('id', userId)
    .single();

  return { userData, error };
};
