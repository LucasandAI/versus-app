
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
        // First, get clubs that have less than 5 members
        const { data: clubsWithMemberCount, error: clubsError } = await supabase
          .from('clubs')
          .select(`
            id,
            name,
            division,
            tier,
            logo,
            club_members (count)
          `)
          .not('club_members.user_id', 'eq', currentUserId) // Exclude clubs where user is a member
          .order('name')
          .limit(10);

        if (clubsError) {
          console.error('[safeSupabase] Error fetching available clubs:', clubsError);
          return { data: [], error: clubsError };
        }

        // Filter clubs with less than 5 members
        const availableClubs = clubsWithMemberCount
          .filter(club => (club.club_members?.[0]?.count || 0) < 5)
          .map(club => ({
            ...club,
            members: club.club_members?.[0]?.count || 0,
            club_members: undefined // Remove the club_members array from the final object
          }));

        return { data: availableClubs, error: null };
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
