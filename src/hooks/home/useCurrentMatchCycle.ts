
import { useState, useEffect } from 'react';

export const useCurrentMatchCycle = () => {
  const [timeUntilNextCycle, setTimeUntilNextCycle] = useState(0);
  
  useEffect(() => {
    // Calculate base time for match cycles: Using 6-minute cycles for testing
    const cycleLength = 6 * 60 * 1000; // 6 minutes in milliseconds
    
    // Set the base time at a fixed hour (16:42 Paris time as mentioned in the database function)
    const baseTime = new Date();
    baseTime.setHours(16);
    baseTime.setMinutes(42);
    baseTime.setSeconds(0);
    baseTime.setMilliseconds(0);
    
    // Function to calculate time until next cycle
    const calculateTimeUntilNext = () => {
      const now = new Date().getTime();
      const baseTimeMs = baseTime.getTime();
      const elapsed = now - baseTimeMs;
      const currentCycle = Math.floor(elapsed / cycleLength);
      const nextCycleStart = baseTimeMs + ((currentCycle + 1) * cycleLength);
      return nextCycleStart - now;
    };
    
    // Initial calculation
    setTimeUntilNextCycle(calculateTimeUntilNext());
    
    // Update every second
    const interval = setInterval(() => {
      setTimeUntilNextCycle(calculateTimeUntilNext());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Format countdown in mm:ss format
  const formatCountdown = (timeInMs: number) => {
    const totalSeconds = Math.ceil(timeInMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return { timeUntilNextCycle, formatCountdown };
};
