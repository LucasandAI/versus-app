
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { User } from '@/types';
import { ensureDivision } from '@/utils/club/leagueUtils';
import { toast } from '@/hooks/use-toast';

export const useLoadCurrentUser = () => {
  const loadCurrentUser = async (userId: string): Promise<User | null> => {
    try {
      console.log('[useLoadCurrentUser] Loading user data for ID:', userId);

      const { data: userData, error, status, statusText } = await safeSupabase
        .from('users')
        .select('id, name, avatar, bio')
        .eq('id', userId)
        .maybeSingle();

      console.log('[useLoadCurrentUser] User query response:', { 
        userData, 
        error, 
        status, 
        statusText, 
        hasUserData: !!userData 
      });

      if (error) {
        console.error('[useLoadCurrentUser] Error fetching user profile:', error);
        toast({
          title: "User Profile Error",
          description: "Error fetching user profile: " + error.message,
          variant: "destructive"
        });
        throw new Error("Error fetching user profile from users table: " + error.message);
      }
      
      if (!userData) {
        console.warn('[useLoadCurrentUser] No user row found in users table for ID:', userId);
        toast({
          title: "Missing User Profile",
          description: "Your user account exists but no profile was found in the database. Loading with basic information.",
          variant: "destructive"
        });
        
        return {
          id: userId,
          name: 'User',
          avatar: '/placeholder.svg',
          bio: '',
          clubs: []
        };
      }

      let clubs = [];
      try {
        console.log('[useLoadCurrentUser] Fetching clubs for user:', userId);
        const { data: memberships, error: clubsError } = await safeSupabase
          .from('club_members')
          .select('club_id, is_admin')
          .eq('user_id', userId);

        console.log('[useLoadCurrentUser] Club memberships result:', { 
          memberships, 
          clubsError,
          membershipCount: memberships?.length || 0 
        });

        if (clubsError) {
          console.error('[useLoadCurrentUser] Error fetching user clubs:', clubsError);
          toast({
            title: "Club Data Error",
            description: "Error loading your clubs: " + clubsError.message,
            variant: "destructive"
          });
        } else {
          clubs = await Promise.all((memberships || []).map(async (membership) => {
            // Get club data
            const { data: club, error: clubError } = await safeSupabase
              .from('clubs')
              .select('id, name, logo, division, tier, elite_points, bio')
              .eq('id', membership.club_id)
              .single();
              
            if (clubError || !club) {
              console.error('[useLoadCurrentUser] Error fetching club details:', clubError);
              return null;
            }
              
            return {
              id: club.id,
              name: club.name,
              logo: club.logo || '/placeholder.svg',
              division: ensureDivision(club.division),
              tier: club.tier || 1,
              elitePoints: club.elite_points || 0,
              bio: club.bio || '',
              members: [],
              matchHistory: []
            };
          }));
          
          // Filter out null values
          clubs = clubs.filter(Boolean);
        }
      } catch (clubsError) {
        console.error('[useLoadCurrentUser] Error in clubs loading:', clubsError);
        toast({
          title: "Club Data Error",
          description: "Failed to load your clubs, but login will proceed.",
          variant: "destructive"
        });
      }

      const userProfile: User = {
        id: userData.id,
        name: userData.name || 'User',
        avatar: userData.avatar || '/placeholder.svg',
        bio: userData.bio || '',
        clubs: clubs
      };

      console.log('[useLoadCurrentUser] Successfully built user profile:', userProfile);
      return userProfile;
    } catch (error) {
      console.error('[useLoadCurrentUser] Error in loadCurrentUser:', error);
      toast({
        title: "Profile Load Error",
        description: error instanceof Error ? error.message : "Unknown error loading profile",
        variant: "destructive"
      });
      
      return {
        id: userId,
        name: 'User',
        avatar: '/placeholder.svg',
        bio: '',
        clubs: []
      };
    }
  };
  return { loadCurrentUser };
};
