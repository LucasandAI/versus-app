
import { supabase } from './client';

// This file provides a temporary workaround for type errors until 
// the src/integrations/supabase/types.ts file is regenerated with the correct types.

type AnyTableName = 'users' | 'clubs' | 'club_members' | 'matches' | 'match_distances' | 
                    'notifications' | 'achievements' | 'user_achievements' | 
                    'club_chat_messages' | 'support_tickets' | 'support_messages';

// Safely wrap the supabase client with type assertions to prevent type errors
export const safeSupabase = {
  from: (table: AnyTableName) => {
    // @ts-ignore - This assertion allows us to use the client until types are regenerated
    return supabase.from(table);
  },
  auth: supabase.auth
};

// Re-export the original client in case it's needed
export { supabase };
