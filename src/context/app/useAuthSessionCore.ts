
import { useEffect } from 'react';
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { User, AppView } from '@/types';
import { useLoadCurrentUser } from './useLoadCurrentUser';

interface AuthSessionCoreProps {
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  setCurrentView: React.Dispatch<React.SetStateAction<AppView>>;
  setUserLoading: (loading: boolean) => void;
  setAuthChecked: (checked: boolean) => void;
  setAuthError: (error: string | null) => void;
  setNeedsProfileCompletion?: (needsCompletion: boolean) => void;
}

/**
 * Core functionality for managing authentication state changes
 * This is used by useAuthSessionEffect to handle auth state changes
 */
export const useAuthSessionCore = ({
  setCurrentUser,
  setCurrentView,
  setUserLoading,
  setAuthChecked,
  setAuthError,
  setNeedsProfileCompletion,
}: AuthSessionCoreProps) => {
  const { loadCurrentUser } = useLoadCurrentUser();

  useEffect(() => {
    let unsubscribe: any;

    const checkUserProfile = async (userId: string): Promise<boolean> => {
      console.log('[useAuthSessionCore] Checking if user has profile:', userId);
      
      try {
        // Check if the user has a profile in the users table
        const { data: userProfile, error } = await safeSupabase
          .from('users')
          .select('id, name')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('[useAuthSessionCore] Error checking user profile:', error);
          return false;
        }
        
        // If no profile found or if profile is incomplete (no name)
        if (!userProfile || !userProfile.name) {
          console.log('[useAuthSessionCore] User has no profile or incomplete profile');
          if (setNeedsProfileCompletion) {
            setNeedsProfileCompletion(true);
          }
          return false;
        }
        
        console.log('[useAuthSessionCore] User has complete profile');
        return true;
      } catch (error) {
        console.error('[useAuthSessionCore] Error in checkUserProfile:', error);
        return false;
      }
    };

    const setupAuthListener = async () => {
      console.log('[useAuthSessionCore] Setting up auth listener');
      
      // First check if we already have a session
      const { data: sessionData } = await safeSupabase.auth.getSession();
      const existingSession = sessionData?.session;
      
      if (existingSession?.user) {
        console.log('[useAuthSessionCore] Found existing session, user:', existingSession.user.id);
        setUserLoading(true);
        
        // Check profile status
        const hasProfile = await checkUserProfile(existingSession.user.id);
        
        if (!hasProfile) {
          console.log('[useAuthSessionCore] Existing user needs to complete profile');
          setCurrentView('connect');
          if (setNeedsProfileCompletion) {
            setNeedsProfileCompletion(true);
          }
        } else {
          try {
            const user = await loadCurrentUser(existingSession.user.id);
            if (user) {
              setCurrentUser(user);
              setCurrentView('home');
            }
          } catch (error) {
            console.error('[useAuthSessionCore] Error loading existing user:', error);
            setCurrentView('connect');
          }
        }
        
        setUserLoading(false);
      }
      
      // Now set up the auth state change listener
      const { data: { subscription } } = safeSupabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('[useAuthSessionCore] Auth state change:', event);
          
          setAuthChecked(true);
          
          if (event === 'SIGNED_OUT') {
            console.log('[useAuthSessionCore] User signed out');
            setCurrentUser(null);
            setCurrentView('connect');
            setUserLoading(false);
            if (setNeedsProfileCompletion) {
              setNeedsProfileCompletion(false);
            }
            return;
          }
          
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
            console.log('[useAuthSessionCore] User signed in:', session.user.id);
            setUserLoading(true);
            
            // Check if user has a profile
            const hasProfile = await checkUserProfile(session.user.id);
            
            if (!hasProfile) {
              console.log('[useAuthSessionCore] User needs to complete profile');
              setCurrentView('connect');
              if (setNeedsProfileCompletion) {
                setNeedsProfileCompletion(true);
              }
              setUserLoading(false);
              return;
            }
            
            try {
              const user = await loadCurrentUser(session.user.id);
              if (user) {
                setCurrentUser(user);
                setCurrentView('home');
                console.log('[useAuthSessionCore] User profile loaded successfully');
              } else {
                setCurrentView('connect');
                console.error('[useAuthSessionCore] Failed to load user profile');
              }
            } catch (error) {
              console.error('[useAuthSessionCore] Error loading user:', error);
              setAuthError(error instanceof Error ? error.message : 'Unknown error loading user profile');
              setCurrentView('connect');
            } finally {
              setUserLoading(false);
            }
          }
        }
      );
      
      unsubscribe = subscription.unsubscribe;
    };
    
    setupAuthListener();
    
    return () => {
      if (unsubscribe) {
        console.log('[useAuthSessionCore] Unsubscribing from auth listener');
        unsubscribe();
      }
    };
  }, [setCurrentUser, setCurrentView, setUserLoading, setAuthChecked, setAuthError, loadCurrentUser, setNeedsProfileCompletion]);
};
