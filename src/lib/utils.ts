
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Club, MatchTeam } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to calculate total distance for a club
export function calculateClubTotal(club: Club | MatchTeam): number {
  if (!club || !club.members) return 0;
  
  return club.members.reduce((total, member) => {
    return total + (member.distanceContribution || 0);
  }, 0);
}

// Function to format distance with consistent decimals
export function formatDistance(distance: number): string {
  return distance.toFixed(1);
}
