
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User, AppView } from '@/types';
import { useLoadCurrentUser } from './useLoadCurrentUser';

export const AUTH_TIMEOUT = 10000; // 10 seconds timeout

interface Props {
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  setCurrentView: React.Dispatch<React.SetStateAction<AppView>>;
  setUserLoading: (loading: boolean) => void;
  setAuthChecked: (checked: boolean) => void;
  setAuthError: (error: string | null) => void;
}

function createMinimalUser(sessionUser: any): User {
  return {
    id: sessionUser.id,
    name: sessionUser.email || 'User',
    avatar: '/placeholder.svg',
    bio: '',
    clubs: [],
  };
}

export function useAuthSessionCore({
  setCurrentUser,
  setCurrentView,
  setUserLoading,
  setAuthChecked,
  setAuthError,
}: Props) {
  const { loadCurrentUser } = useLoadCurrentUser();

  useEffect(() => {
    console.log('[useAuthSessionEffect] Setting up auth state listener...');
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
          variant: "destructive",
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
            variant: "destructive",
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
            // Create a minimal user object to prevent logout
            console.warn('[useAuthSessionEffect] User profile missing or incomplete for id', session.user.id);
            toast({
              title: "Profile Warning",
              description: "Your profile data is incomplete but you can continue to use the app.",
              variant: "destructive",
            });
            setCurrentUser(createMinimalUser(session.user));
            setCurrentView('home');
          }
        } catch (profileError) {
          console.error('[useAuthSessionEffect] Failed to load user profile:', profileError);

          // Don't log out - use minimal profile data
          setCurrentUser(createMinimalUser(session.user));
          setCurrentView('home');
          toast({
            title: "Profile Load Error",
            description: "There was an error loading your full profile, but you're still logged in.",
            variant: "destructive",
          });
        }
      } catch (error) {
        setAuthChecked(true);
        setUserLoading(false);
        setCurrentView('connect');
        setAuthError(error instanceof Error ? error.message : 'Unknown error');
        toast({
          title: "Authentication Error",
          description: error instanceof Error ? error.message : "Unknown error during authentication",
          variant: "destructive",
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
                // Use minimal user to avoid logout
                console.warn('[useAuthSessionEffect] Creating minimal user object to bypass redirect');
                setCurrentUser(createMinimalUser(session.user));
                setCurrentView('home');
                toast({
                  title: "Profile Warning",
                  description: "Your profile data is incomplete but you can continue to use the app.",
                  variant: "destructive",
                });
              }
            } catch (profileError) {
              console.error('[useAuthSessionEffect] Error loading user profile after sign-in:', profileError);

              // Allow login with minimal profile instead of redirecting to login
              setCurrentUser(createMinimalUser(session.user));
              setCurrentView('home');
              toast({
                title: "Profile Load Warning",
                description: "There was an issue loading your complete profile, but you can still use the app.",
                variant: "destructive",
              });
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
  }, [
    setCurrentUser,
    setCurrentView,
    setUserLoading,
    setAuthChecked,
    setAuthError,
    loadCurrentUser,
  ]);
}
