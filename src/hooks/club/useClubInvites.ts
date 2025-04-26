
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ClubInvite } from '@/types';

export const useClubInvites = (clubId: string) => {
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState<ClubInvite[]>([]);

  const sendInvite = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('club_invites')
        .insert([
          { user_id: userId, club_id: clubId }
        ]);

      if (error) throw error;

      toast({
        title: "Invite sent",
        description: "The user has been invited to join the club"
      });
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Error",
        description: "Could not send invite",
        variant: "destructive"
      });
    }
  };

  const respondToInvite = async (inviteId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('club_invites')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: accept ? "Invite accepted" : "Invite declined",
        description: accept ? "You have joined the club" : "You have declined the invite"
      });
    } catch (error) {
      console.error('Error responding to invite:', error);
      toast({
        title: "Error",
        description: "Could not process your response",
        variant: "destructive"
      });
    }
  };

  return {
    invites,
    loading,
    sendInvite,
    respondToInvite
  };
};
