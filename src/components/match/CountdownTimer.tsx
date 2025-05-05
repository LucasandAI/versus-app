
import React, { useState, useEffect } from 'react';
import { getSecondsUntil, formatCountdown, isTestMode } from '@/utils/date/matchTiming';

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
  refreshInterval
}) => {
  // In test mode, refresh more frequently by default
  const defaultInterval = isTestMode() ? 250 : 1000; // 4 updates per second in test mode
  const interval = refreshInterval || defaultInterval;
  
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
    }, interval);
    
    return () => clearInterval(timer);
  }, [targetDate, onComplete, interval]);
  
  return (
    <div className={`font-mono ${className}`}>
      {formatCountdown(seconds)}
    </div>
  );
};

export default CountdownTimer;
