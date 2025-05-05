
import React, { useState, useEffect } from 'react';
import { getSecondsUntil, formatCountdown } from '@/utils/date/matchTiming';

interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
  className?: string;
  refreshInterval?: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  targetDate, 
  onComplete,
  className = "",
  refreshInterval = 500 // Default to 500ms (2 updates per second) for smoother countdown
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
