
import { useState, useEffect } from 'react';

const CYCLE_MINUTES = 6; // 6-minute match cycle

export const useCurrentMatchCycle = () => {
  const [cycleData, setCycleData] = useState({
    cycleStart: new Date(),
    cycleEnd: new Date(),
    timeRemaining: '',
  });

  useEffect(() => {
    const calculateNextCycle = () => {
      const now = new Date();
      
      // Calculate the start of the current hour
      const hourStart = new Date(now);
      hourStart.setMinutes(0, 0, 0);
      
      // Find which cycle we're in within the hour
      const minutesSinceHourStart = Math.floor((now.getTime() - hourStart.getTime()) / (1000 * 60));
      const currentCycleIndex = Math.floor(minutesSinceHourStart / CYCLE_MINUTES);
      
      // Calculate the start of the current cycle
      const cycleStart = new Date(hourStart);
      cycleStart.setMinutes(currentCycleIndex * CYCLE_MINUTES, 0, 0);
      
      // Calculate the end of the current cycle
      const cycleEnd = new Date(cycleStart);
      cycleEnd.setMinutes(cycleStart.getMinutes() + CYCLE_MINUTES, 0, 0);
      
      // Calculate time remaining to next cycle
      const diffMs = cycleEnd.getTime() - now.getTime();
      
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      const timeRemaining = `${diffMinutes.toString().padStart(2, '0')}:${diffSeconds.toString().padStart(2, '0')}`;
      
      setCycleData({
        cycleStart,
        cycleEnd,
        timeRemaining
      });
    };
    
    calculateNextCycle();
    const timerId = setInterval(calculateNextCycle, 1000);
    
    return () => clearInterval(timerId);
  }, []);
  
  return cycleData;
};
