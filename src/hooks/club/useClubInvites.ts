
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sendClubInvite } from '@/utils/clubInviteActions';

export function useClubInvites(clubId: string, clubName: string) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingUsers, setProcessingUsers] = useState<{[key: string]: boolean}>({});

  // Fetch users who are not members of the club
  const fetchAvailableUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current club members
      const { data: members, error: membersError } = await supabase
        .from('club_members')
        .select('user_id')
        .eq('club_id', clubId);
        
      if (membersError) {
        throw membersError;
      }
      
      const memberIds = members.map(m => m.user_id);
      
      // Get all existing invites for this club
      const { data: invites, error: invitesError } = await supabase
        .from('club_invites')
        .select('user_id, status')
        .eq('club_id', clubId);
        
      if (invitesError) {
        throw invitesError;
      }
      
      // Get all users who are not members of this club
      const { data: availableUsers, error: usersError } = await supabase
        .from('users')
        .select('id, name, avatar')
        .not('id', 'in', `(${memberIds.length > 0 ? memberIds.join(',') : 'NULL'})`);
        
      if (usersError) {
        throw usersError;
      }
      
      // Mark users who already have pending invites
      const pendingInviteUserIds = invites
        ?.filter(invite => invite.status === 'pending')
        .map(invite => invite.user_id) || [];
        
      // Add the alreadyInvited flag to users
      const processedUsers = availableUsers.map(user => ({
        ...user,
        alreadyInvited: pendingInviteUserIds.includes(user.id)
      }));
      
      setUsers(processedUsers);
      setError(null);
    } catch (err: any) {
      console.error('[useClubInvites] Error fetching available users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [clubId]);
  
  // Send an invite to a user
  const sendInvite = useCallback(async (userId: string, userName: string) => {
    setProcessingUsers(prev => ({ ...prev, [userId]: true }));
    
    try {
      console.log('[useClubInvites] Sending invite to:', userId, userName);
      
      // Use the centralized sendClubInvite function which handles both DB entry and notification
      const success = await sendClubInvite(clubId, clubName, userId, userName);
      
      if (success) {
        console.log('[useClubInvites] Invite sent successfully');
        
        // Update the local state to mark this user as invited
        setUsers(prevUsers => prevUsers.map(user => {
          if (user.id === userId) {
            return { ...user, alreadyInvited: true };
          }
          return user;
        }));
      }
      
      return success;
    } catch (err) {
      console.error('[useClubInvites] Error sending invite:', err);
      toast.error('Failed to send invitation');
      return false;
    } finally {
      setProcessingUsers(prev => ({ ...prev, [userId]: false }));
    }
  }, [clubId, clubName]);

  // Check if a user is currently being processed
  const isProcessing = useCallback((userId: string) => {
    return !!processingUsers[userId];
  }, [processingUsers]);

  // Load users when the hook is first used
  useState(() => {
    fetchAvailableUsers();
  });

  return {
    users,
    loading,
    error,
    sendInvite,
    isProcessing,
    refreshUsers: fetchAvailableUsers
  };
}
