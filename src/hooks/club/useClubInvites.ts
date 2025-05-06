
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
  const [processingInvites, setProcessingInvites] = useState<Record<string, boolean>>({});
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
        
        // Also get users who already have pending invites
        const { data: inviteData, error: inviteError } = await supabase
          .from('club_invites')
          .select('user_id')
          .eq('club_id', clubId)
          .eq('status', 'pending');

        if (inviteError) throw inviteError;
        
        const invitedIds = inviteData?.map(i => i.user_id) || [];
        const excludeIds = [...memberIds, ...invitedIds];
        
        // Then get all users except those who are members or have pending invites
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, avatar');

        if (userError) throw userError;

        const nonMembers = userData.filter(user => 
          !excludeIds.includes(user.id)
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

  const checkClubCapacity = async () => {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .select('user_id', { count: 'exact' })
        .eq('club_id', clubId);
        
      if (error) throw error;
      
      return (data?.length || 0) >= 5;
    } catch (error) {
      console.error('Error checking club capacity:', error);
      return false; // Default to allowing the invite if we can't check
    }
  };

  const sendInvite = async (userId: string, userName?: string) => {
    setProcessingInvites(prev => ({ ...prev, [userId]: true }));
    
    try {
      // Check if club is full
      const isClubFull = await checkClubCapacity();
      if (isClubFull) {
        toast({
          title: "Club is full",
          description: "This club already has the maximum number of members (5)",
          variant: "destructive"
        });
        return false;
      }
      
      // Check if user already has a pending invite
      const { data: existingInvite, error: checkError } = await supabase
        .from('club_invites')
        .select('id')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single();
        
      if (existingInvite) {
        toast({
          title: "Invite already sent",
          description: "This user already has a pending invitation to this club",
          variant: "destructive"
        });
        return false;
      }
      
      // Get club information
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', clubId)
        .single();
        
      if (clubError) throw clubError;

      // Create the invite
      const { error } = await supabase
        .from('club_invites')
        .insert([
          { user_id: userId, club_id: clubId, status: 'pending' }
        ]);

      if (error) throw error;

      // Create notification for the user
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            club_id: clubId,
            type: 'invite',
            message: `You've been invited to join ${clubData?.name || 'a club'}.`,
            status: 'pending',
            read: false
          });
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Continue even if notification creation fails
      }

      toast({
        title: "Invite sent",
        description: `${userName || 'The user'} has been invited to join the club`
      });
      
      // Update available users list
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      return true;
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Error",
        description: "Could not send invite",
        variant: "destructive"
      });
      return false;
    } finally {
      setProcessingInvites(prev => ({ ...prev, [userId]: false }));
    }
  };

  const respondToInvite = async (inviteId: string, accept: boolean) => {
    setProcessingInvites(prev => ({ ...prev, [inviteId]: true }));
    
    try {
      if (accept) {
        // Check if club is full before accepting
        const isClubFull = await checkClubCapacity();
        if (isClubFull) {
          toast({
            title: "Club is full",
            description: "This club already has the maximum number of members (5)",
            variant: "destructive"
          });
          return false;
        }
        
        // Get the invite details
        const { data: inviteData, error: inviteError } = await supabase
          .from('club_invites')
          .select('club_id, user_id')
          .eq('id', inviteId)
          .single();
          
        if (inviteError) throw inviteError;
        
        // Add user to club members
        const { error: memberError } = await supabase
          .from('club_members')
          .insert([{
            club_id: inviteData.club_id,
            user_id: inviteData.user_id,
            is_admin: false
          }]);
          
        if (memberError) throw memberError;
      }
      
      // Update invite status based on the action
      const newStatus = accept ? 'accepted' : 'rejected';
      
      // Update invite status
      const { error } = await supabase
        .from('club_invites')
        .update({ status: newStatus })
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: accept ? "Invite accepted" : "Invite declined",
        description: accept ? "You have joined the club" : "You have declined the invite"
      });
      
      // Remove the invite from the list
      setInvites(prevInvites => prevInvites.filter(invite => invite.id !== inviteId));
      
      return true;
    } catch (error) {
      console.error('Error responding to invite:', error);
      toast({
        title: "Error",
        description: "Could not process your response",
        variant: "destructive"
      });
      return false;
    } finally {
      setProcessingInvites(prev => ({ ...prev, [inviteId]: false }));
    }
  };

  return {
    invites,
    users,
    loading,
    error,
    sendInvite,
    respondToInvite,
    isProcessing: (id: string) => !!processingInvites[id]
  };
};
