
import { format, addDays, isBefore, differenceInSeconds, startOfWeek, endOfWeek } from 'date-fns';
import { Club } from '@/types';

// Timezone is not available directly in date-fns - would typically use date-fns-tz
// For now, we'll implement a simplified version using UTC+2 for Paris time
const PARIS_TIMEZONE_OFFSET = 2; // UTC+2

/**
 * Get the next Monday at 00:00 Paris time
 */
export const getNextMatchStart = (): Date => {
  const now = new Date();
  // Get next Monday (1 = Monday in date-fns)
  let nextMonday = startOfWeek(now, { weekStartsOn: 1 });
  
  // If today is after or equal to Monday, get next week's Monday
  if (!isBefore(now, nextMonday)) {
    nextMonday = addDays(nextMonday, 7);
  }
  
  return nextMonday;
};

/**
 * Get the current match end time (Sunday 23:59 Paris time)
 */
export const getCurrentMatchEnd = (): Date => {
  const now = new Date();
  // Get the end of the current week (Sunday)
  let sunday = endOfWeek(now, { weekStartsOn: 1 });
  
  // Set time to 23:59:59
  sunday.setHours(23, 59, 59, 999);
  
  return sunday;
};

/**
 * Format countdown time from seconds
 */
export const formatCountdown = (seconds: number): string => {
  if (seconds <= 0) return "Starting soon...";
  
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Get seconds remaining until the next match start
 */
export const getSecondsUntilNextMatch = (): number => {
  const now = new Date();
  const nextMatchStart = getNextMatchStart();
  return Math.max(0, differenceInSeconds(nextMatchStart, now));
};

/**
 * Get seconds remaining until the current match ends
 */
export const getSecondsUntilMatchEnd = (): number => {
  const now = new Date();
  const matchEnd = getCurrentMatchEnd();
  return Math.max(0, differenceInSeconds(matchEnd, now));
};

/**
 * Check if a club is eligible for matchmaking
 */
export const isClubEligibleForMatch = (club: Club): boolean => {
  return club.members && club.members.length >= 5;
};

/**
 * Get formatted date for the next match start
 */
export const getNextMatchStartFormatted = (): string => {
  const nextMatchStart = getNextMatchStart();
  return format(nextMatchStart, "EEEE, MMMM do 'at' HH:mm");
};

/**
 * Check if we are currently in a match week (Monday-Sunday)
 */
export const isInMatchWeek = (): boolean => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
  
  return !isBefore(now, weekStart) && isBefore(now, weekEnd);
};

/**
 * Get the match status message based on club eligibility and timing
 */
export const getMatchStatusMessage = (club: Club): {
  message: string;
  countdown: boolean;
  matchReady: boolean;
} => {
  if (!club.members || club.members.length < 5) {
    return {
      message: "Your club needs 5 members to start competing in the league.",
      countdown: false,
      matchReady: false
    };
  }
  
  if (isInMatchWeek()) {
    return {
      message: "Match in progress",
      countdown: true,
      matchReady: true
    };
  }
  
  return {
    message: `Matchmaking will begin soon. Your next match starts ${getNextMatchStartFormatted()}.`,
    countdown: true,
    matchReady: false
  };
};
