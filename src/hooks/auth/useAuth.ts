
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthState, AuthActions } from './types';
import { toast } from '@/hooks/use-toast';
import { User } from '@/types';

export const useAuth = (): AuthState & AuthActions => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[useAuth] Attempting to sign in with email:', email);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('No user data returned');
      
      console.log('[useAuth] Successfully signed in user:', authData.user.id);
      
      // Don't set the user here - AppContext will handle loading the full profile
      // This makes sure we don't have race conditions
      
      return authData.user; // Return the user to indicate successful login
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sign in";
      setError(message);
      toast({
        title: "Authentication failed",
        description: message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      console.log('[useAuth] Signing out user');
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
      setUser(null);
      
      // Make sure to clear user data
      console.log('[useAuth] User signed out successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sign out";
      toast({
        title: "Sign out failed",
        description: message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    error,
    signIn,
    signOut
  };
};
