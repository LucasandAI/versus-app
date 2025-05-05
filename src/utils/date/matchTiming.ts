
import { format, addDays, addMinutes, startOfWeek, endOfWeek, differenceInSeconds } from 'date-fns';

// Production constants for shortened match cycle
const MATCH_DURATION_MS = 5 * 60 * 1000;      // 5 minutes
const NEXT_MATCH_DELAY_MS = 60 * 1000;        // 1 minute

// Get the next match start time
export const getNextMatchStart = (): Date => {
  // Next match starts immediately (for testing) instead of waiting for Monday
  const now = new Date();
  return new Date(now.getTime() + NEXT_MATCH_DELAY_MS);
};

// Calculate match end date from a start date
export const getMatchEndFromStart = (startDate: Date): Date => {
  return new Date(new Date(startDate).getTime() + MATCH_DURATION_MS);
};

// Get the current match end time
export const getCurrentMatchEnd = (): Date => {
  const now = new Date();
  // For display purposes when we don't know the actual start time
  return new Date(now.getTime() + MATCH_DURATION_MS);
};

// Check if we're currently in an active match period
export const isActiveMatchWeek = (): boolean => {
  // Always return true to allow matches to start anytime
  return true;
};

// Format a countdown display from seconds
export const formatCountdown = (seconds: number): string => {
  if (seconds <= 0) return "00:00:00";
  
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  // For short durations, just show minutes and seconds
  if (days === 0 && hours === 0) {
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
