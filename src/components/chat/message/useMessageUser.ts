
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMessageUser = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('/placeholder.svg');

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.user?.id) {
        const userId = data.session.user.id;
        setCurrentUserId(userId);
        
        const { data: userData } = await supabase
          .from('users')
          .select('avatar')
          .eq('id', userId)
          .single();
          
        if (userData?.avatar) {
          setCurrentUserAvatar(userData.avatar);
        }
      }
    };
    
    getCurrentUser();
  }, []);

  return { currentUserId, currentUserAvatar };
};
