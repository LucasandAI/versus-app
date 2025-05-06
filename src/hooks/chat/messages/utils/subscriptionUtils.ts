
import { RealtimeChannel } from '@supabase/supabase-js';
import { Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const createClubChannel = (club: Club): RealtimeChannel => {
  const clubId = club.id;
  console.log(`[subscriptionUtils] Creating channel for club ${clubId}`);
  
  // Create a unique channel name with timestamp to avoid conflicts
  return supabase.channel(`club-messages-${clubId}-${Date.now()}`, {
    config: {
      broadcast: {
        self: false
      }
    }
  });
};

export const cleanupChannels = (channels: RealtimeChannel[]) => {
  console.log(`[subscriptionUtils] Cleaning up ${channels.length} channels`);
  
  channels.forEach((channel, index) => {
    if (channel) {
      console.log(`[subscriptionUtils] Removing channel #${index}: ${channel.topic}`);
      supabase.removeChannel(channel);
    }
  });
};
