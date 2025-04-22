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
  type: 'invite' | 'join_request' | 'match_result' | 'match_start' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, any>;
}

export type AppView = 'connect' | 'home' | 'clubDetail' | 'leaderboard' | 'profile';

export interface AppContextType {
  currentUser: User | null;
  currentView: AppView;
  selectedClub: Club | null;
  selectedUser: User | null;
  setCurrentUser: (user: User | null | ((prev: User | null) => User | null)) => void;
  setCurrentView: (view: AppView) => void;
  setSelectedClub: (club: Club | null) => void;
  setSelectedUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createClub: (name: string, logo?: string) => Promise<Club | null>;
}
