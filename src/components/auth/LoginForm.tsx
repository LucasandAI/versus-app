
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type FormValues = z.infer<typeof formSchema>;

const LoginForm: React.FC = () => {
  const { signIn } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: 'test@example.com', // Test credentials
      password: 'password123',    // Test credentials
    },
  });

  // Reset loading state after 15 seconds to prevent getting stuck
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setIsLoading(false);
        setError('Login is taking longer than expected. Please try again.');
      }, 15000);
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  const onSubmit = async (values: FormValues) => {
    if (isLoading) return; // Prevent multiple submissions
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[LoginForm] Submitting login form with email:', values.email);
      
      toast({
        title: "Signing in",
        description: "Attempting to sign you in...",
      });
      
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

  return (
    <div className="w-full max-w-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
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
            control={form.control}
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
            <p>Test credentials pre-filled for demo purposes</p>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;
