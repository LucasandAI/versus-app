import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthState, AuthActions } from './types';
import { toast } from '@/hooks/use-toast';
import { User, Club, Division } from '@/types';
import { ensureDivision } from '@/utils/club/leagueUtils';

export const useAuth = (): AuthState & AuthActions => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('No user data returned');
      
      // Fetch user profile data
      const { data: userData, error: profileError } = await supabase
        .from('users')
        .select('id, name, avatar, bio, clubs(id, name, logo, division, tier, elite_points, bio)')
        .eq('id', authData.user.id)
        .single();
        
      if (profileError) throw new Error('Error fetching user profile');
      if (!userData) throw new Error('No user profile found');
      
      // Transform the clubs data to match our app's type structure
      const clubs: Club[] = (userData.clubs || []).map(club => ({
        id: club.id,
        name: club.name,
        logo: club.logo || '/placeholder.svg',
        division: ensureDivision(club.division),
        tier: club.tier || 1,
        elitePoints: club.elite_points || 0,
        bio: club.bio,
        members: [],
        matchHistory: []
      }));
      
      const userProfile: User = {
        id: userData.id,
        name: userData.name,
        avatar: userData.avatar || '/placeholder.svg',
        bio: userData.bio,
        clubs: clubs
      };
      
      setUser(userProfile);
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
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
      setUser(null);
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
