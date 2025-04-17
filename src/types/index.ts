
export interface User {
  id: string;
  name: string;
  avatar: string;
  stravaConnected: boolean;
  clubs: Club[];
}

export interface Club {
  id: string;
  name: string;
  logo: string;
  division: Division;
  tier?: number; // Added tier for division rankings (1-5, with 1 being highest)
  members: ClubMember[];
  currentMatch?: Match;
  matchHistory: Match[];
}

export interface ClubMember {
  id: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
  distanceContribution?: number; // in km
}

export interface Match {
  id: string;
  homeClub: {
    id: string;
    name: string;
    logo: string;
    totalDistance: number; // in km
    members: ClubMember[];
  };
  awayClub: {
    id: string;
    name: string;
    logo: string;
    totalDistance: number; // in km
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
  setCurrentView: (view: AppView) => void;
  setSelectedClub: (club: Club | null) => void;
  setSelectedUser: (user: User | null) => void;
  connectToStrava: () => void; // Mock function for now
}
