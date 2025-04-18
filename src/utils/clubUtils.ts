
import { Club, Division } from '@/types';
import { availableClubs } from '@/data/availableClubs';

export const MAX_CLUBS_PER_USER = 3;

export const findClubById = (clubId: string, allClubs: Club[]): Club | undefined => {
  return allClubs.find(club => club.id === clubId);
};

export const createNewClub = (clubId: string, clubName: string): Club => {
  return {
    id: clubId,
    name: clubName,
    logo: '/placeholder.svg',
    division: 'Bronze' as Division,
    tier: 3,
    members: [],
    currentMatch: null,
    matchHistory: []
  };
};

export const isUserClubMember = (club: Club, userId: string): boolean => {
  return club.members.some(member => member.id === userId);
};

export const getClubToJoin = (clubId: string, clubName: string, allClubs: Club[]): Club => {
  // Try to find the club in available clubs first
  const mockClub = availableClubs.find(club => club.id === clubId);
  let clubToJoin = findClubById(clubId, allClubs);

  if (!clubToJoin) {
    clubToJoin = mockClub ? 
      { ...createNewClub(mockClub.id, mockClub.name), division: mockClub.division, tier: mockClub.tier } :
      createNewClub(clubId, clubName);
  }

  return clubToJoin;
};
