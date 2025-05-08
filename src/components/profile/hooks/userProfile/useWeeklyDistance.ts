
import { useState, useEffect } from "react";

// Simplified cache for weekly distance
const weeklyDistanceCache: Record<string, {value: number, timestamp: number}> = {};
const CACHE_TTL = 60000; // 1 minute cache

export const useWeeklyDistance = (userId: string | undefined) => {
  const [weeklyDistance, setWeeklyDistance] = useState(0);
  
  useEffect(() => {
    if (!userId) return;
    
    // Check cache first
    const now = Date.now();
    const cachedValue = weeklyDistanceCache[userId];
    
    if (cachedValue && (now - cachedValue.timestamp < CACHE_TTL)) {
      setWeeklyDistance(cachedValue.value);
      return;
    }
    
    // Demo: randomize value for now (but do it immediately)
    const newDistance = Math.round((Math.random() * 50 + 20) * 10) / 10;
    
    // Cache the result
    weeklyDistanceCache[userId] = {
      value: newDistance,
      timestamp: now
    };
    
    setWeeklyDistance(newDistance);
  }, [userId]);
  
  return weeklyDistance;
};
