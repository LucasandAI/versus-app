
import { useState, useEffect } from "react";
export const useWeeklyDistance = (userId: string | undefined) => {
  const [weeklyDistance, setWeeklyDistance] = useState(0);
  useEffect(() => {
    if (!userId) return;
    // Demo: randomize value for now
    setWeeklyDistance(Math.round((Math.random() * 50 + 20) * 10) / 10);
  }, [userId]);
  return weeklyDistance;
};
