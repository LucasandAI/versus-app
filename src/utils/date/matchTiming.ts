
import { format, addDays, addMinutes, startOfWeek, endOfWeek, differenceInSeconds } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

// Constants for match cycle
const MATCH_DURATION_MS = 5 * 60 * 1000;      // 5 minutes
const COOLDOWN_DURATION_MS = 60 * 1000;       // 1 minute
const CYCLE_DURATION_MS = MATCH_DURATION_MS + COOLDOWN_DURATION_MS; // 6 minutes

// Get Paris Monday 00:00 as base time
const getMondayMidnightParis = (): Date => {
  // Get current date
  const now = new Date();
  
  // Find the most recent Monday
  const currentWeekMonday = startOfWeek(now, { weekStartsOn: 1 }); // 1 = Monday
  
  // Set to midnight in Paris timezone
  return fromZonedTime(
    new Date(
      currentWeekMonday.getFullYear(),
      currentWeekMonday.getMonth(),
      currentWeekMonday.getDate(),
      0, 0, 0, 0
    ),
    'Europe/Paris'
  );
};

// Calculate the next match start time based on the cycle
export const getNextMatchStart = (): Date => {
  const baseTime = getMondayMidnightParis().getTime();
  const now = Date.now();
  const elapsed = now - baseTime;
  const nextStart = baseTime + Math.ceil(elapsed / CYCLE_DURATION_MS) * CYCLE_DURATION_MS;
  
  return new Date(nextStart);
};

// Calculate match end date from a start date
export const getMatchEndFromStart = (startDate: Date): Date => {
  return new Date(new Date(startDate).getTime() + MATCH_DURATION_MS);
};

// Get the current match end time
export const getCurrentMatchEnd = (): Date => {
  const baseTime = getMondayMidnightParis().getTime();
  const now = Date.now();
  const elapsed = now - baseTime;
  const currentCycleStart = baseTime + Math.floor(elapsed / CYCLE_DURATION_MS) * CYCLE_DURATION_MS;
  const matchEndTime = currentCycleStart + MATCH_DURATION_MS;
  
  // If we're in the cooldown period, return the next match start
  if (now > matchEndTime) {
    return getNextMatchStart();
  }
  
  return new Date(matchEndTime);
};

// Check if we're currently in an active match period
export const isActiveMatchWeek = (): boolean => {
  const now = Date.now();
  const baseTime = getMondayMidnightParis().getTime();
  const elapsed = now - baseTime;
  const currentCycleStart = baseTime + Math.floor(elapsed / CYCLE_DURATION_MS) * CYCLE_DURATION_MS;
  const matchEndTime = currentCycleStart + MATCH_DURATION_MS;
  
  // We're in an active match if we're within the match duration of the current cycle
  return now >= currentCycleStart && now < matchEndTime;
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
