export interface User {
  id: string;
  name: string;
  avatar: string;
  stravaConnected: boolean;
  bio?: string;
  clubs: Club[];
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

export type Division = 'bronze' | 'silver' | 'gold' | 'platinum' | 'elite';

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
