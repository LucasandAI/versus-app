
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InvitableUser {
  id: string;
  name: string;
  avatar: string | null;
}

export const useClubInvites = (clubId: string) => {
  const [users, setUsers] = useState<InvitableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!clubId) return;
      
      setLoading(true);
      try {
        // Get current members of this club to exclude them
        const { data: members } = await supabase
          .from('club_members')
          .select('user_id')
          .eq('club_id', clubId);
        
        const memberIds = members?.map(member => member.user_id) || [];
        
        // Also get users who already have pending invites or requests
        const { data: pendingNotifications } = await supabase
          .from('notifications')
          .select('user_id')
          .eq('club_id', clubId)
          .in('type', ['invite', 'join_request'])
          .eq('status', 'pending');
          
        const pendingUserIds = pendingNotifications?.map(notification => notification.user_id) || [];
        
        // Combine both sets of IDs to exclude
        const excludeIds = [...new Set([...memberIds, ...pendingUserIds])];

        // Get users who are not members and don't have pending invites/requests
        const { data: nonMembers, error: usersError } = await supabase
          .from('users')
          .select('id, name, avatar');

        if (usersError) {
          throw usersError;
        }

        // Client-side filtering to exclude members and pending users
        const availableUsers = nonMembers?.filter(user => 
          !excludeIds.includes(user.id)
        ) || [];

        setUsers(availableUsers);
      } catch (err) {
        console.error('Error fetching invitable users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [clubId]);

  return { users, loading, error };
};
