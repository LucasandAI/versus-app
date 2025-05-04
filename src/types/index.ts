export interface User {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  clubs: Club[];
  // Social media fields for the profile page
  instagram?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
  tiktok?: string;
}

export interface Club {
  id: string;
  name: string;
  logo: string;
  division: Division;
  tier: number;
  elitePoints: number;
  bio?: string;
  members: ClubMember[];
  matchHistory?: Match[];
  currentMatch?: Match | null;
  joinRequests?: JoinRequest[];
  isPreviewClub?: boolean;
}

export interface ClubMember {
  id: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
  distanceContribution: number;
}

export type Division = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'elite';

export interface JoinRequest {
  id: string;
  userId: string;
  clubId: string;
  userName: string;
  userAvatar: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ClubRequest {
  id: string;
  userId: string;
  clubId: string;
  createdAt: string;
}

export interface ClubInvite {
  id: string;
  clubId: string;
  userId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Match {
  id: string;
  homeClub: {
    id: string;
    name: string;
    logo: string;
    totalDistance: number;
    members: ClubMember[];
  };
  awayClub: {
    id: string;
    name: string;
    logo: string;
    totalDistance: number;
    members: ClubMember[];
  };
  startDate: string;
  endDate: string;
  status: 'active' | 'completed';
  winner?: 'home' | 'away' | 'draw';
  leagueBeforeMatch?: {
    division: Division;
    tier?: number;
    elitePoints?: number;
  };
  leagueAfterMatch?: {
    division: Division;
    tier?: number;
    elitePoints?: number;
  };
}

export interface Notification {
  id: string;
  type: string;
  userId?: string;
  userName?: string;
  userAvatar?: string | null;
  clubId?: string;
  clubName?: string;
  clubLogo?: string | null;
  title?: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

export type AppView = 'connect' | 'home' | 'clubDetail' | 'leaderboard' | 'profile';

export interface AppContextType {
  currentUser: User | null;
  currentView: AppView;
  selectedClub: Club | null;
  selectedUser: User | null;
  isSessionReady: boolean;
  needsProfileCompletion: boolean;
  setNeedsProfileCompletion: (value: boolean) => void;
  setCurrentUser: (user: User | null | ((prev: User | null) => User | null)) => void;
  setCurrentView: (view: AppView) => void;
  setSelectedClub: (club: Club | null) => void;
  setSelectedUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  createClub: (clubData: any) => Promise<Club | null>;
  refreshCurrentUser: () => Promise<User | null>;
}

export type { ChatMessage } from './chat';
