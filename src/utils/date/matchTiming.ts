
import { format, addDays, startOfWeek, endOfWeek, differenceInSeconds } from 'date-fns';

// Get the next Monday at midnight Paris time
export const getNextMatchStart = (): Date => {
  // Get the current date in the user's timezone
  const now = new Date();
  
  // Calculate the next Monday
  // Set to midnight and get the next week's Monday
  const nextMonday = startOfWeek(addDays(now, 7), { weekStartsOn: 1 });
  
  return nextMonday;
};

// Get the current match end time (Sunday at 23:59:59)
export const getCurrentMatchEnd = (): Date => {
  const now = new Date();
  
  // Calculate the end of the current week (Sunday)
  const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 });
  
  // Set the time to 23:59:59
  endOfCurrentWeek.setHours(23, 59, 59, 999);
  
  return endOfCurrentWeek;
};

// Check if we're currently in an active match week (Monday-Sunday)
export const isActiveMatchWeek = (): boolean => {
  const now = new Date();
  
  // Get start and end of the current week
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });     // Sunday
  weekEnd.setHours(23, 59, 59, 999);
  
  // Check if current time is within the week
  return now >= weekStart && now <= weekEnd;
};

// Format a countdown display from seconds
export const formatCountdown = (seconds: number): string => {
  if (seconds <= 0) return "00:00:00";
  
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
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
