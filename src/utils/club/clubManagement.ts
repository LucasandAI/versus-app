
import { Club, ClubMember, Division } from '@/types';
import { availableClubs } from '@/data/availableClubs';
import { slugifyClubName } from '@/utils/slugify';

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
    slug: slugifyClubName(clubName),
    members: [],
    currentMatch: null,
    matchHistory: []
  };
};

export const isUserClubMember = (club: Club, userId: string): boolean => {
  return club.members.some(member => member.id === userId);
};

export const getClubToJoin = (clubId: string, clubName: string, allClubs: Club[]): Club => {
  const mockClub = availableClubs.find(club => club.id === clubId);
  let clubToJoin = findClubById(clubId, allClubs);

  if (!clubToJoin) {
    clubToJoin = mockClub ? 
      { 
        ...createNewClub(mockClub.id, mockClub.name), 
        division: mockClub.division as Division, 
        tier: mockClub.tier,
        slug: slugifyClubName(mockClub.name)
      } :
      createNewClub(clubId, clubName);
  }

  // Ensure club has a slug
  if (!clubToJoin.slug) {
    clubToJoin.slug = slugifyClubName(clubToJoin.name);
  }

  return clubToJoin;
};
