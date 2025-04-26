
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';

export const createClubChannel = (club: Club) => {
  const clubId = club.id;
  console.log(`[subscriptionUtils] Creating channel for club ${clubId}`);
  
  // Create a separate unique channel name for each club to avoid mixing events
  return supabase.channel(`club-messages-${clubId}-${Date.now()}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'club_chat_messages',
      filter: `club_id=eq.${clubId}`
    }, 
    async (payload) => {
      // This is just the configuration, the handler will be set in messageHandlerUtils
      console.log(`[subscriptionUtils] Channel for club ${clubId} created`);
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
