
import React, { useState, useEffect } from 'react';
import { getSecondsUntil, formatCountdown } from '@/utils/date/matchTiming';

interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  targetDate, 
  onComplete,
  className = ""
}) => {
  const [seconds, setSeconds] = useState(getSecondsUntil(targetDate));
  
  useEffect(() => {
    const timer = setInterval(() => {
      const newSeconds = getSecondsUntil(targetDate);
      setSeconds(newSeconds);
      
      if (newSeconds <= 0 && onComplete) {
        onComplete();
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate, onComplete]);
  
  return (
    <div className={`font-mono ${className}`}>
      {formatCountdown(seconds)}
    </div>
  );
};

export default CountdownTimer;
