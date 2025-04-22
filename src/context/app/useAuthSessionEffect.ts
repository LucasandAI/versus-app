import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User, AppView } from '@/types';
import { useLoadCurrentUser } from './useLoadCurrentUser';

interface Props {
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  setCurrentView: React.Dispatch<React.SetStateAction<AppView>>;
  setUserLoading: (loading: boolean) => void;
  setAuthChecked: (checked: boolean) => void;
  setAuthError: (error: string | null) => void;
}

export const AUTH_TIMEOUT = 10000; // Increased from 5000 to 10000 (10 seconds)

export const useAuthSessionEffect = ({
  setCurrentUser,
  setCurrentView,
  setUserLoading,
  setAuthChecked,
  setAuthError,
}: Props) => {
  const { loadCurrentUser } = useLoadCurrentUser();

  useEffect(() => {
    console.log('[AppProvider] Setting up auth state listener...');
    let authTimeoutId: number;
    let sessionCheckAttempted = false;

    authTimeoutId = window.setTimeout(() => {
      if (!sessionCheckAttempted) {
        setAuthChecked(true);
        setCurrentView('connect');
        setUserLoading(false);
        setAuthError('Authentication check timed out');
        toast({
          title: "Authentication Timeout",
          description: "The authentication check took too long to complete. Please try again.",
          variant: "destructive"
        });
        console.warn('[useAuthSessionEffect] Auth check timed out after', AUTH_TIMEOUT, 'ms');
      }
    }, AUTH_TIMEOUT);

    // First check if there's an existing session
    const checkSession = async () => {
      try {
        sessionCheckAttempted = true;
        console.log('[useAuthSessionEffect] Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('[useAuthSessionEffect] getSession result:', { 
          session, 
          error, 
          hasUser: !!session?.user 
        });
        
        if (error) {
          setCurrentView('connect');
          setAuthChecked(true);
          setUserLoading(false);
          setAuthError(error.message);
          toast({
            title: "Session Check Failed",
            description: error.message,
            variant: "destructive"
          });
          console.error('[useAuthSessionEffect] Error in getSession:', error);
          return;
        }
        
        if (!session?.user) {
          setCurrentView('connect');
          setAuthChecked(true);
          setUserLoading(false);
          console.log('[useAuthSessionEffect] No session or user. Redirecting to connect screen.');
          return;
        }
        setAuthChecked(true);

        console.log('[useAuthSessionEffect] Session detected for user ID:', session.user.id);
        try {
          const userProfile = await loadCurrentUser(session.user.id);
          console.log('[useAuthSessionEffect] User profile loaded:', userProfile);
          
          if (userProfile) {
            setCurrentUser(userProfile);
            setCurrentView('home');
            console.log('[useAuthSessionEffect] Loaded user profile, switching to home.');
            toast({
              title: "Welcome back!",
              description: `Signed in as ${userProfile.name || userProfile.id}`,
            });
          } else {
            // TEMPORARY: Instead of redirecting to connect screen, log a warning and proceed
            console.warn('[useAuthSessionEffect] User row missing in users table for id', session.user.id);
            toast({
              title: "Profile Warning",
              description: "Your user profile was not found, but you can still use basic features. Please check your database.",
              variant: "destructive"
            });
            
            // Create a minimal user object from auth data to allow login
            const minimalUser: User = {
              id: session.user.id,
              name: session.user.email || 'User',
              avatar: '/placeholder.svg',
              bio: '',
              clubs: []
            };
            setCurrentUser(minimalUser);
            setCurrentView('home');
          }
        } catch (profileError) {
          console.error('[useAuthSessionEffect] Failed to load user profile:', profileError);
          toast({
            title: "Profile Load Error",
            description: profileError instanceof Error ? profileError.message : "Unknown error loading profile",
            variant: "destructive"
          });
          // Keep current view - don't redirect to login if we have a valid session
        }
      } catch (error) {
        setAuthChecked(true);
        setUserLoading(false);
        setCurrentView('connect');
        setAuthError(error instanceof Error ? error.message : 'Unknown error');
        toast({
          title: "Authentication Error",
          description: error instanceof Error ? error.message : "Unknown error during authentication",
          variant: "destructive"
        });
        console.error('[useAuthSessionEffect] Exception during checkSession:', error);
      } finally {
        setUserLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuthSessionEffect] onAuthStateChange event:', event, session);
        if (event === 'SIGNED_IN' && session?.user) {
          clearTimeout(authTimeoutId);
          sessionCheckAttempted = true;
          try {
            setAuthChecked(true);
            setUserLoading(true);
            // Log the session to verify contents
            console.log('[useAuthSessionEffect] SIGNED_IN: session.user:', session.user);
            try {
              const userProfile = await loadCurrentUser(session.user.id);
              console.log('[useAuthSessionEffect] User profile after SIGNED_IN event:', userProfile);
              
              if (userProfile) {
                setCurrentUser(userProfile);
                setCurrentView('home');
                console.log('[useAuthSessionEffect] User authenticated and profile loaded, home view.');
                toast({
                  title: "Welcome back!",
                  description: `Signed in as ${userProfile.name || userProfile.id}`,
                });
              } else {
                // TEMPORARY: Create minimal user to bypass redirect
                console.warn('[useAuthSessionEffect] Creating minimal user object to bypass redirect');
                toast({
                  title: "Profile Warning",
                  description: "Your user profile could not be loaded fully, but you can still use basic features.",
                  variant: "destructive"
                });
                
                // Create a minimal user object from auth data
                const minimalUser: User = {
                  id: session.user.id,
                  name: session.user.email || 'User',
                  avatar: '/placeholder.svg',
                  bio: '',
                  clubs: []
                };
                setCurrentUser(minimalUser);
                setCurrentView('home');
              }
            } catch (profileError) {
              console.error('[useAuthSessionEffect] Error loading user profile after sign-in:', profileError);
              toast({
                title: "Profile Load Error",
                description: "There was an error loading your profile: " + 
                  (profileError instanceof Error ? profileError.message : "Unknown error"),
                variant: "destructive"
              });
              // Allow login with minimal profile instead of redirecting to login
              const minimalUser: User = {
                id: session.user.id,
                name: session.user.email || 'User',
                avatar: '/placeholder.svg',
                bio: '',
                clubs: []
              };
              setCurrentUser(minimalUser);
              setCurrentView('home');
            }
          } finally {
            setUserLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setCurrentView('connect');
          setAuthChecked(true);
          setUserLoading(false);
          clearTimeout(authTimeoutId);
          console.log('[useAuthSessionEffect] SIGNED_OUT: Cleared user and returned to connect view.');
        }
      }
    );

    checkSession();

    return () => {
      subscription.unsubscribe();
      clearTimeout(authTimeoutId);
    };
  }, [setCurrentUser, setCurrentView, setUserLoading, setAuthChecked, setAuthError, loadCurrentUser]);
};
