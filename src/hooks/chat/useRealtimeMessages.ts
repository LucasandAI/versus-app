import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeMessages = (open: boolean, setLocalClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>) => {
  // This hook has been deprecated in favor of more focused subscription hooks
  // like useClubMessageSubscriptions. Keeping it for backward compatibility but
  // it doesn't set up subscriptions anymore.
  
  useEffect(() => {
    if (!open) return;

    console.log('[useRealtimeMessages] ⚠️ This hook is deprecated. Using useClubMessageSubscriptions instead.');
    
    // No subscriptions are set up here anymore
    return () => {
      // No cleanup needed
    };
  }, [open, setLocalClubMessages]);
};

export default useRealtimeMessages;
