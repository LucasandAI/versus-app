
import { Club, Division } from '@/types';
import { slugifyClubName } from '@/utils/slugify';
import { generateMatchHistoryFromDivision } from './matchGenerationUtils';
import { availableClubs } from '@/data/availableClubs';

/**
 * Find a club by its slug from a list of clubs
 */
export const findClubBySlug = (slug: string, clubs: Club[]): Club | undefined => {
  return clubs.find(club => club.slug === slug);
};

/**
 * Find a club by its ID from a list of clubs
 */
export const findClubById = (id: string, clubs: Club[]): Club | undefined => {
  return clubs.find(club => club.id === id);
};

/**
 * Generates a fallback club when club not found in user clubs
 */
export const generateFallbackClub = (slug: string): Club => {
  // Try to find in available clubs first
  const foundInAvailable = availableClubs.find(
    club => slugifyClubName(club.name) === slug
  );

  // Get club name from slug if not found
  const clubName = foundInAvailable?.name || slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Create club with minimal data
  const fallbackClub: Club = {
    id: `fallback-${Date.now()}`,
    name: clubName,
    logo: '/placeholder.svg',
    division: foundInAvailable?.division as Division || 'Bronze',
    tier: foundInAvailable?.tier || 5,
    slug: slug,
    members: [],
    matchHistory: []
  };

  // Generate match history for the club
  fallbackClub.matchHistory = generateMatchHistoryFromDivision(fallbackClub);

  return fallbackClub;
};

/**
 * Ensures a club has a slug
 */
export const ensureClubHasSlug = (club: Club): Club => {
  if (!club.slug) {
    return {
      ...club,
      slug: slugifyClubName(club.name)
    };
  }
  return club;
};
