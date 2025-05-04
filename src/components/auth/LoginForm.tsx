
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { AuthMode, SignupFormValues, ProfileFormValues } from '@/types/auth';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

// Sign-up form schema with password confirmation
const signupSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Profile completion schema
const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  bio: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const { signIn } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [userId, setUserId] = useState<string | null>(null);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'test@example.com', // Test credentials
      password: 'password123',    // Test credentials
    },
  });

  // Sign-up form
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Profile completion form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      bio: '',
    },
  });

  // Reset loading state after 10 seconds to prevent getting stuck
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setIsLoading(false);
        setError('Operation is taking longer than expected. Please try again.');
      }, 10000);
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  const handleLogin = async (values: LoginFormValues) => {
    if (isLoading) return; // Prevent multiple submissions
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[LoginForm] Submitting login form with email:', values.email);
      const user = await signIn(values.email, values.password);
      
      if (user) {
        console.log('[LoginForm] Sign-in successful:', user.id);
        // The navigation will be handled by the auth state change listener
      } else {
        console.error('[LoginForm] Login failed: No user returned');
        setError("Login failed. Please check your credentials and try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[LoginForm] Login error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in');
      setIsLoading(false);
    }
  };

  const handleSignup = async (values: SignupFormValues) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      console.log('[LoginForm] Submitting signup form with email:', values.email);
      
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        console.log('[LoginForm] Signup successful, user:', data.user.id);
        setUserId(data.user.id);
        
        // Check if email confirmation is required
        if (data.session) {
          // User is authenticated immediately, proceed to profile completion
          setAuthMode('profile-completion');
        } else {
          // Email confirmation is required
          toast({
            title: "Sign-up successful",
            description: "Please check your email to confirm your account.",
          });
        }
      }
    } catch (error) {
      console.error('[LoginForm] Signup error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileCompletion = async (values: ProfileFormValues) => {
    if (isLoading || !userId) return;
    setIsLoading(true);
    setError(null);

    try {
      console.log('[LoginForm] Completing profile for user:', userId);
      
      const { error } = await supabase
        .from('users')
        .insert({
          id: userId,
          name: values.name,
          bio: values.bio || null,
          avatar: '/placeholder.svg', // Default avatar
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Profile completed",
        description: "Welcome to Versus!",
      });

      // Refresh the page to trigger the auth state change
      window.location.reload();
    } catch (error) {
      console.error('[LoginForm] Profile completion error:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Render the appropriate form based on the current auth mode
  const renderForm = () => {
    if (authMode === 'profile-completion') {
      return (
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(handleProfileCompletion)} className="space-y-4">
            <h2 className="text-xl font-bold text-center">Complete Your Profile</h2>
            <FormField
              control={profileForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your name"
                      type="text"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={profileForm.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Say something about yourself (optional)"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Complete Profile'}
              </Button>
            </div>
          </form>
        </Form>
      );
    }

    return (
      <Tabs defaultValue="login" value={authMode} onValueChange={(value) => setAuthMode(value as AuthMode)}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="login">Log In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        type="email"
                        autoComplete="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        autoComplete="current-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </div>
              
              <div className="text-center text-sm text-gray-500">
                <p>Don't have an account? <Button variant="link" className="p-0 h-auto" onClick={() => setAuthMode('signup')}>Sign up</Button></p>
                <p className="mt-2">Test credentials pre-filled for demo purposes</p>
              </div>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="signup">
          <Form {...signupForm}>
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <FormField
                control={signupForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        type="email"
                        autoComplete="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={signupForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={signupForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing up...' : 'Sign Up'}
                </Button>
              </div>
              
              <div className="text-center text-sm text-gray-500">
                <p>Already have an account? <Button variant="link" className="p-0 h-auto" onClick={() => setAuthMode('login')}>Log in</Button></p>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="w-full max-w-md">
      {renderForm()}
    </div>
  );
};

export default LoginForm;
