import { useState } from 'react';
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { AuthState, AuthActions } from './types';
import { toast } from '@/hooks/use-toast';
import { User } from '@/types';

export const useAuth = (): AuthState & AuthActions => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const signIn = async (email: string, password: string): Promise<User | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[useAuth] Attempting to sign in with email:', email);
      const { data: authData, error: authError } = await safeSupabase.auth.signInWithPassword({
        email,
        password
      });
      console.log("[useAuth] signInWithPassword result:", { 
        user: authData?.user?.id, 
        hasSession: !!authData?.session,
        authError
      });

      if (authError) {
        console.error('[useAuth] Auth error:', authError.message);
        throw new Error(authError.message);
      }
      
      if (!authData.user) {
        console.error('[useAuth] No user data returned');
        throw new Error('No user data returned');
      }
      
      const basicUser: User = {
        id: authData.user.id,
        name: authData.user.email || 'User',
        avatar: '/placeholder.svg',
        bio: '',
        clubs: []
      };
      
      toast({
        title: "Authentication successful",
        description: "Loading your profile...",
      });
      
      console.log('[useAuth] Returning basic user:', basicUser.id);
      return basicUser;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sign in";
      setError(message);
      toast({
        title: "Authentication failed",
        description: message,
        variant: "destructive"
      });
      console.error('[useAuth] Sign in error:', message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      console.log('[useAuth] Signing out user');
      const { error } = await safeSupabase.auth.signOut();
      if (error) throw new Error(error.message);
      setUser(null);
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
