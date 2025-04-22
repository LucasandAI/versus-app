
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
        const { error } = await supabase.auth.signOut({ scope: 'local' });
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
  storage: supabase.storage
};

// Add debug method to force sign out and clear session
export const clearAllAuthData = async () => {
  try {
    // Clear browser storage
    localStorage.removeItem('supabase.auth.token');
    
    // Sign out from Supabase
    await safeSupabase.auth.signOut({ scope: 'local' });
    
    console.log('[safeSupabase] Auth data cleared');
    return true;
  } catch (error) {
    console.error('[safeSupabase] Failed to clear auth data:', error);
    return false;
  }
};

// Re-export the original client in case it's needed
export { supabase };
