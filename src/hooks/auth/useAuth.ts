
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
      
      // Use signInWithPassword for email/password authentication
      const { data: authData, error: authError } = await safeSupabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log("[useAuth] signInWithPassword result:", { 
        user: authData?.user?.id, 
        hasSession: !!authData?.session,
        error: authError ? authError.message : 'none'
      });

      if (authError) {
        console.error('[useAuth] Auth error:', authError.message);
        toast({
          title: "Login failed",
          description: authError.message || "Authentication error occurred",
          variant: "destructive"
        });
        setError(authError.message);
        return null;
      }
      
      if (!authData.user) {
        console.error('[useAuth] No user data returned');
        toast({
          title: "Login failed",
          description: "No user data returned",
          variant: "destructive"
        });
        setError("No user data returned");
        return null;
      }
      
      // Check if the user has a profile
      const { data: userProfile, error: profileError } = await safeSupabase
        .from('users')
        .select('id, name')
        .eq('id', authData.user.id)
        .maybeSingle();
        
      if (profileError) {
        console.error('[useAuth] Profile check error:', profileError);
      }
      
      // Create a basic user object with what we know from auth and profile
      const basicUser: User = {
        id: authData.user.id,
        name: userProfile?.name || authData.user.email || 'User',
        avatar: userProfile?.avatar || '/placeholder.svg',
        bio: userProfile?.bio || '',
        clubs: []
      };
      
      // If the user doesn't have a profile, we'll need to create one
      if (!userProfile || !userProfile.name) {
        console.log('[useAuth] User needs to complete profile');
      } else {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
      }
      
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
      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      setUser(null);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully"
      });
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
