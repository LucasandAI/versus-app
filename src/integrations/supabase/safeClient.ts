
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
    getAvailableClubs: async () => {
      try {
        const { data, error } = await supabase
          .from('clubs')
          .select('id, name, division, tier, logo')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) {
          console.error('[safeSupabase] Error fetching available clubs:', error);
          return { data: [], error };
        }
        
        // Count members for each club
        const clubsWithMemberCount = await Promise.all(
          data.map(async (club) => {
            const { count, error: countError } = await supabase
              .from('club_members')
              .select('*', { count: 'exact', head: true })
              .eq('club_id', club.id);
            
            return {
              ...club,
              members: countError ? 0 : count || 0
            };
          })
        );
        
        return { data: clubsWithMemberCount, error: null };
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
    
    // Get clubs for the leaderboard view
    getLeaderboardClubs: async () => {
      try {
        const { data, error } = await supabase
          .from('clubs')
          .select('id, name, division, tier, elite_points')
          .order('division', { ascending: false })
          .order('tier', { ascending: true })
          .order('elite_points', { ascending: false });
        
        if (error) {
          console.error('[safeSupabase] Error fetching leaderboard clubs:', error);
          return { data: [], error };
        }
        
        // Transform to leaderboard format
        const leaderboardData = data.map((club, index) => {
          return {
            id: club.id,
            name: club.name,
            division: club.division.toLowerCase(),
            tier: club.tier,
            rank: index + 1,
            points: club.division.toLowerCase() === 'elite' ? club.elite_points : 0,
            change: ['up', 'down', 'same'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'same'
          };
        });
        
        return { data: leaderboardData, error: null };
      } catch (error) {
        console.error('[safeSupabase] Unexpected error fetching leaderboard clubs:', error);
        return {
          data: [],
          error: error instanceof Error ? 
            { message: error.message } as PostgrestError : 
            { message: 'Unknown error fetching leaderboard data' } as PostgrestError
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
