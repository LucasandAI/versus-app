
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';
import { setGlobalLogoutState } from '@/context/app/useLogoutState';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const safeSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

export const clearAllAuthData = async () => {
  console.log('[clearAllAuthData] Starting logout process');
  
  // Set logout state to prevent auth re-initialization
  setGlobalLogoutState(true);
  
  try {
    // Clear Supabase session
    await safeSupabase.auth.signOut();
    
    // Clear any local storage auth-related items
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('auth')
    );
    authKeys.forEach(key => localStorage.removeItem(key));
    
    console.log('[clearAllAuthData] Logout completed successfully');
  } catch (error) {
    console.error('[clearAllAuthData] Error during logout:', error);
  } finally {
    // Reset logout state after a brief delay to allow UI to settle
    setTimeout(() => {
      setGlobalLogoutState(false);
    }, 100);
  }
};

// Export all the necessary client methods
export { safeSupabase as default };
