
import { format, addDays, startOfWeek, endOfWeek, differenceInSeconds } from 'date-fns';

// Test mode configuration
// In a production environment, these could be controlled via environment variables
const TEST_MODE = true;
const MATCH_DURATION_MS = TEST_MODE ? 5 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 5 minutes or 7 days
const NEXT_MATCH_DELAY_MS = TEST_MODE ? 60 * 1000 : 0; // 1 minute delay in test mode

// Get the next match start time
export const getNextMatchStart = (): Date => {
  const now = new Date();
  
  if (TEST_MODE) {
    // In test mode, next match starts after the configured delay
    return new Date(now.getTime() + NEXT_MATCH_DELAY_MS);
  }
  
  // Regular production logic - next Monday
  const nextMonday = startOfWeek(addDays(now, 7), { weekStartsOn: 1 });
  return nextMonday;
};

// Calculate match end time based on a start date
export const getMatchEndFromStart = (startDate: Date): Date => {
  if (TEST_MODE) {
    // In test mode, match ends after duration
    return new Date(startDate.getTime() + MATCH_DURATION_MS);
  }
  
  // Regular production logic - end of week (Sunday)
  const endOfMatchWeek = endOfWeek(startDate, { weekStartsOn: 1 });
  endOfMatchWeek.setHours(23, 59, 59, 999);
  return endOfMatchWeek;
};

// Get the current match end time
export const getCurrentMatchEnd = (): Date => {
  if (TEST_MODE) {
    // For an active match, calculate time left
    const now = new Date();
    
    // Assume the match started recently and calculate end time
    // This is for display purposes when we don't have the actual start time
    return new Date(now.getTime() + MATCH_DURATION_MS);
  }
  
  // Regular production logic - Sunday at 23:59:59
  const now = new Date();
  const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 });
  endOfCurrentWeek.setHours(23, 59, 59, 999);
  return endOfCurrentWeek;
};

// Check if we're currently in an active match period
export const isActiveMatchWeek = (): boolean => {
  if (TEST_MODE) {
    // In test mode, always considered active for matchmaking
    return true;
  }
  
  // Regular production logic - check if within Monday-Sunday
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });     // Sunday
  weekEnd.setHours(23, 59, 59, 999);
  return now >= weekStart && now <= weekEnd;
};

// Format a countdown display from seconds
export const formatCountdown = (seconds: number): string => {
  if (seconds <= 0) return "00:00:00";
  
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (TEST_MODE) {
    // In test mode, just show minutes and seconds
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Calculate seconds remaining until a target date
export const getSecondsUntil = (targetDate: Date): number => {
  const now = new Date();
  return Math.max(0, differenceInSeconds(targetDate, now));
};

// Helper functions to expose test mode settings
export const isTestMode = (): boolean => TEST_MODE;
export const getMatchDuration = (): { ms: number; seconds: number } => ({
  ms: MATCH_DURATION_MS,
  seconds: MATCH_DURATION_MS / 1000
});
export const getMatchDelay = (): { ms: number; seconds: number } => ({
  ms: NEXT_MATCH_DELAY_MS,
  seconds: NEXT_MATCH_DELAY_MS / 1000
});
