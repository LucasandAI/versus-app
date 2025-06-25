
import { useState, useCallback } from 'react';

interface LogoutState {
  isLoggingOut: boolean;
  setLoggingOut: (logging: boolean) => void;
}

let globalLogoutState = false;
let logoutStateListeners: ((state: boolean) => void)[] = [];

export const setGlobalLogoutState = (state: boolean) => {
  globalLogoutState = state;
  logoutStateListeners.forEach(listener => listener(state));
};

export const getGlobalLogoutState = () => globalLogoutState;

export const useLogoutState = (): LogoutState => {
  const [isLoggingOut, setIsLoggingOut] = useState(globalLogoutState);

  const setLoggingOut = useCallback((logging: boolean) => {
    setGlobalLogoutState(logging);
  }, []);

  // Subscribe to global logout state changes
  useState(() => {
    const listener = (state: boolean) => setIsLoggingOut(state);
    logoutStateListeners.push(listener);
    
    return () => {
      logoutStateListeners = logoutStateListeners.filter(l => l !== listener);
    };
  });

  return { isLoggingOut, setLoggingOut };
};
