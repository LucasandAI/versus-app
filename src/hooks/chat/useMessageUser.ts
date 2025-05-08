
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

export const useMessageUser = () => {
  const { currentUser } = useApp();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('/placeholder.svg');
  
  useEffect(() => {
    const fetchAuthUser = async () => {
      if (currentUser) {
        setCurrentUserId(currentUser.id);
        setCurrentUserAvatar(currentUser.avatar || '/placeholder.svg');
        return;
      }
      
      // If no currentUser in context, try to get from auth
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
        
        // Get avatar from users table
        const { data: userData } = await supabase
          .from('users')
          .select('avatar')
          .eq('id', data.user.id)
          .single();
          
        if (userData?.avatar) {
          setCurrentUserAvatar(userData.avatar);
        }
      }
    };
    
    fetchAuthUser();
  }, [currentUser]);
  
  return {
    currentUserId,
    currentUserAvatar
  };
};
