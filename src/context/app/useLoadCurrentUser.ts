
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { ensureDivision } from '@/utils/club/leagueUtils';

export const useLoadCurrentUser = () => {
  const loadCurrentUser = async (userId: string): Promise<User | null> => {
    try {
      console.log('[useLoadCurrentUser] Loading user data for ID:', userId);

      const { data: userData, error } = await supabase
        .from('users')
        .select('id, name, avatar, bio')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[useLoadCurrentUser] Error fetching user profile:', error);
        // surface error, not just null
        throw new Error("Error fetching user profile from users table: " + error.message);
      }
      if (!userData) {
        console.warn('[useLoadCurrentUser] No user row found in users table for ID:', userId);
        return null;
      }

      let clubs = [];
      try {
        const { data: memberships, error: clubsError } = await supabase
          .from('club_members')
          .select('club:clubs(id, name, logo, division, tier, elite_points)')
          .eq('user_id', userId);

        if (clubsError) {
          console.error('[useLoadCurrentUser] Error fetching user clubs:', clubsError);
        } else {
          clubs = memberships && memberships.length > 0
            ? memberships.map(membership => {
                if (!membership.club) return null;
                return {
                  id: membership.club.id,
                  name: membership.club.name,
                  logo: membership.club.logo || '/placeholder.svg',
                  division: ensureDivision(membership.club.division),
                  tier: membership.club.tier || 1,
                  elitePoints: membership.club.elite_points || 0,
                  members: [],
                  matchHistory: []
                };
              }).filter(Boolean)
            : [];
        }
      } catch (clubsError) {
        console.error('[useLoadCurrentUser] Error in clubs loading:', clubsError);
      }

      const userProfile: User = {
        id: userData.id,
        name: userData.name,
        avatar: userData.avatar || '/placeholder.svg',
        bio: userData.bio,
        clubs: clubs
      };

      return userProfile;
    } catch (error) {
      // Log the error and surface
      console.error('[useLoadCurrentUser] Error in loadCurrentUser:', error);
      throw error;
    }
  };
  return { loadCurrentUser };
};

