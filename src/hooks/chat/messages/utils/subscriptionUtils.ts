
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';

export const createClubChannel = (club: Club) => {
  console.log(`[subscriptionUtils] Creating channel for club ${club.id}`);
  
  return supabase.channel(`club-messages-${club.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'club_chat_messages',
      filter: `club_id=eq.${club.id}`
    }, 
    async (payload) => {
      // This is just the configuration, the handler will be set in messageHandlerUtils
      console.log(`[subscriptionUtils] Channel for club ${club.id} created`);
    });
};

export const cleanupChannels = (channels: RealtimeChannel[]) => {
  channels.forEach(channel => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  });
};
