
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ClubInvite } from '@/types';

interface NonMemberUser {
  id: string;
  name: string;
  avatar: string;
}

export const useClubInvites = (clubId: string) => {
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState<ClubInvite[]>([]);
  const [users, setUsers] = useState<NonMemberUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch users who are not already members of the club
  useEffect(() => {
    const fetchNonMembers = async () => {
      setLoading(true);
      try {
        // First get existing member IDs
        const { data: memberData, error: memberError } = await supabase
          .from('club_members')
          .select('user_id')
          .eq('club_id', clubId);

        if (memberError) throw memberError;

        const memberIds = memberData.map(m => m.user_id);
        
        // Then get all users except those who are members
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, avatar');

        if (userError) throw userError;

        const nonMembers = userData.filter(user => 
          !memberIds.includes(user.id)
        );

        setUsers(nonMembers);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching non-member users:', err);
        setError(err.message || 'Failed to load users');
        toast({
          title: "Error",
          description: "Could not load users",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (clubId) {
      fetchNonMembers();
    }
  }, [clubId]);

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
    users, // Added this
    loading,
    error,  // Added this
    sendInvite,
    respondToInvite
  };
};
