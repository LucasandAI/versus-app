export interface User {
  id: string;
  name: string;
  avatar: string;
  stravaConnected: boolean;
  clubs: Club[];
  bio?: string;
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
  tier?: number;
  members: ClubMember[];
  currentMatch?: Match;
  matchHistory: Match[];
}

export interface ClubMember {
  id: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
  distanceContribution?: number;
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
  status: 'upcoming' | 'active' | 'completed';
  winner?: 'home' | 'away';
}

export type Division = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Elite';

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
  connectToStrava: () => void;
  createClub: (name: string, logo: string) => void;
}
