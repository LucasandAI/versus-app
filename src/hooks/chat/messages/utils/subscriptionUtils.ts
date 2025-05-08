
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const cleanupChannels = (channels: RealtimeChannel[]) => {
  if (!channels || channels.length === 0) return;
  
  channels.forEach(channel => {
    try {
      if (channel) {
        supabase.removeChannel(channel);
      }
    } catch (error) {
      console.error('[subscriptionUtils] Error cleaning up channel:', error);
    }
  });
};
