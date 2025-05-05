
import React, { useState, useEffect, useRef } from 'react';
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
  // Store target time as a number to avoid Date object comparison issues
  const targetTimeRef = useRef<number>(new Date(targetDate).getTime());
  const [seconds, setSeconds] = useState(getSecondsUntil(new Date(targetTimeRef.current)));
  const completedRef = useRef<boolean>(false);
  
  useEffect(() => {
    // Update the target time if it changes
    const newTargetTime = new Date(targetDate).getTime();
    if (targetTimeRef.current !== newTargetTime) {
      targetTimeRef.current = newTargetTime;
      setSeconds(getSecondsUntil(new Date(targetTimeRef.current)));
      completedRef.current = false;
    }
    
    const timer = setInterval(() => {
      const newSeconds = getSecondsUntil(new Date(targetTimeRef.current));
      setSeconds(newSeconds);
      
      if (newSeconds <= 0 && !completedRef.current) {
        completedRef.current = true;
        if (onComplete) {
          onComplete();
        }
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
