
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

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
        // Get users who are not members of this club
        const { data: nonMembers, error: usersError } = await supabase
          .from('users')
          .select('id, name, avatar')
          .not('id', 'in', (subquery) => {
            return subquery
              .from('club_members')
              .select('user_id')
              .eq('club_id', clubId);
          });

        if (usersError) {
          throw usersError;
        }

        setUsers(nonMembers || []);
      } catch (err) {
        console.error('Error fetching invitable users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [clubId]);

  const sendInvite = async (userId: string, userName: string) => {
    try {
      // Create a notification of type 'invite'
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'invite',
          club_id: clubId,
          title: 'Club Invitation',
          description: `You've been invited to join a club`,
          message: `You've been invited to join a club`,
          status: 'pending'
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error sending invite:', err);
      return false;
    }
  };

  return { users, loading, error, sendInvite };
};
