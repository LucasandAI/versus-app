import { supabase } from './client';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Provides a safer Supabase client wrapper to handle API interactions
 * with consistent error handling and improved type safety.
 */
export const safeSupabase = {
  from: (table: string) => {
    return supabase.from(table as any) as any;
  },
  auth: {
    // Wrap signInWithPassword to add better error handling
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      try {
        const response = await supabase.auth.signInWithPassword(credentials);
        
        if (response.error) {
          console.error('[safeSupabase] Auth error:', response.error);
        }
        
        return response;
      } catch (error) {
        console.error('[safeSupabase] Unexpected auth error:', error);
        return {
          data: { user: null, session: null },
          error: error instanceof Error ? 
            { message: error.message } as PostgrestError : 
            { message: 'Unknown authentication error' } as PostgrestError
        };
      }
    },
    
    // Safely wrap onAuthStateChange
    onAuthStateChange: (callback) => {
      return supabase.auth.onAuthStateChange(callback);
    },
    
    // Pass through other auth methods directly
    getSession: () => supabase.auth.getSession(),
    signOut: () => supabase.auth.signOut(),
    
    // Add clear session method for testing
    clearSession: async () => {
      try {
        // Clear any existing session
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('[safeSupabase] Error clearing session:', error);
        }
        return { error };
      } catch (error) {
        console.error('[safeSupabase] Unexpected error clearing session:', error);
        return {
          error: error instanceof Error ? 
            { message: error.message } as PostgrestError : 
            { message: 'Unknown error clearing session' } as PostgrestError
        };
      }
    }
  },
  storage: supabase.storage,
  clubs: {
    // Get available clubs that the user can join
    getAvailableClubs: async (currentUserId?: string) => {
      try {
        // Get clubs where:
        // 1. User is not a member
        // 2. Club has less than 5 members
        const { data: availableClubs, error: clubsError } = await supabase
          .from('clubs')
          .select(`
            id,
            name,
            division,
            tier,
            logo,
            (
              select count(*)
              from club_members cm 
              where cm.club_id = clubs.id
            ) as member_count
          `)
          .not(
            'id',
            'in',
            currentUserId 
              ? supabase
                  .from('club_members')
                  .select('club_id')
                  .eq('user_id', currentUserId)
              : []
          )
          .lt('(select count(*) from club_members cm where cm.club_id = clubs.id)', 5)
          .order('name');

        if (clubsError) {
          console.error('[safeSupabase] Error fetching available clubs:', clubsError);
          return { data: [], error: clubsError };
        }

        // Transform data to match expected format
        const formattedClubs = availableClubs.map(club => ({
          ...club,
          members: parseInt(club.member_count) || 0,
          member_count: undefined // Remove count from final object
        }));

        return { data: formattedClubs, error: null };
      } catch (error) {
        console.error('[safeSupabase] Unexpected error fetching available clubs:', error);
        return {
          data: [],
          error: error instanceof Error ? 
            { message: error.message } as PostgrestError : 
            { message: 'Unknown error fetching clubs' } as PostgrestError
        };
      }
    },
    
    // Add the missing getLeaderboardClubs function
    getLeaderboardClubs: async () => {
      try {
        const { data, error } = await supabase
          .from('clubs')
          .select(`
            id,
            name,
            division,
            tier,
            elite_points
          `)
          .order('elite_points', { ascending: false });
          
        if (error) {
          console.error('[safeSupabase] Error fetching leaderboard clubs:', error);
          return { data: [], error };
        }
        
        // Transform to leaderboard format with dummy change status for now
        const leaderboardData = data.map((club, index) => ({
          ...club,
          rank: index + 1,
          points: club.elite_points,
          change: 'same' as const
        }));
        
        return { data: leaderboardData, error: null };
      } catch (error) {
        console.error('[safeSupabase] Unexpected error fetching leaderboard data:', error);
        return {
          data: [],
          error: error instanceof Error ? 
            { message: error.message } as PostgrestError : 
            { message: 'Unknown error fetching leaderboard clubs' } as PostgrestError
        };
      }
    }
  }
};

// Add debug method to force sign out and clear session
export const clearAllAuthData = async () => {
  try {
    // Clear browser storage
    localStorage.removeItem('supabase.auth.token');
    
    // Sign out from Supabase
    await safeSupabase.auth.signOut();
    
    console.log('[safeSupabase] Auth data cleared');
    return true;
  } catch (error) {
    console.error('[safeSupabase] Failed to clear auth data:', error);
    return false;
  }
};

// Re-export the original client in case it's needed
export { supabase };
