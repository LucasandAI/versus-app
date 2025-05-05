
import React, { useState, useEffect } from 'react';
import { formatCountdown } from '@/utils/match/matchTimingUtils';

interface CountdownTimerProps {
  secondsRemaining: number;
  onComplete?: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  secondsRemaining,
  onComplete,
  className = "" 
}) => {
  const [seconds, setSeconds] = useState<number>(secondsRemaining);

  useEffect(() => {
    setSeconds(secondsRemaining);
  }, [secondsRemaining]);

  useEffect(() => {
    if (seconds <= 0) {
      if (onComplete) onComplete();
      return;
    }

    const interval = setInterval(() => {
      setSeconds(prevSeconds => {
        const newSeconds = prevSeconds - 1;
        if (newSeconds <= 0 && onComplete) {
          onComplete();
        }
        return Math.max(0, newSeconds);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onComplete]);

  return (
    <div className={`font-mono text-sm ${className}`}>
      {formatCountdown(seconds)}
    </div>
  );
};

export default CountdownTimer;
