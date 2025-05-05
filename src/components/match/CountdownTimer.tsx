
import React, { useState, useEffect } from 'react';
import { getSecondsUntil, formatCountdown } from '@/utils/date/matchTiming';

interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
  className?: string;
  refreshInterval?: number; // Allow customizing the refresh rate
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  targetDate, 
  onComplete,
  className = "",
  refreshInterval = 1000 // Default to 1 second refresh
}) => {
  const [seconds, setSeconds] = useState(getSecondsUntil(targetDate));
  
  useEffect(() => {
    // Immediately update seconds when targetDate changes
    setSeconds(getSecondsUntil(targetDate));
    
    const timer = setInterval(() => {
      const newSeconds = getSecondsUntil(targetDate);
      setSeconds(newSeconds);
      
      if (newSeconds <= 0) {
        if (onComplete) {
          onComplete();
        }
        clearInterval(timer);
      }
    }, refreshInterval);
    
    return () => clearInterval(timer);
  }, [targetDate, onComplete, refreshInterval]);
  
  return (
    <div className={`font-mono ${className}`}>
      {formatCountdown(seconds)}
    </div>
  );
};

export default CountdownTimer;
