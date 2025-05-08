
import { User } from '@/types';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<boolean>;
}
