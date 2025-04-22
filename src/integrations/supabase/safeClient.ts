
import { supabase } from './client';

// This file provides a temporary workaround for type errors until 
// the src/integrations/supabase/types.ts file is regenerated with the correct types.

// Create a safer client that uses any types to avoid TypeScript errors
// while still providing the Supabase client functionality
export const safeSupabase = {
  from: (table: string) => {
    // Cast to any to bypass type checking
    return supabase.from(table as any) as any;
  },
  auth: supabase.auth,
  storage: supabase.storage
};

// Re-export the original client in case it's needed
export { supabase };
