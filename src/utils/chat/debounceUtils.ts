/**
 * Utility for debouncing functions to avoid excessive operations
 */

type DebouncedFunction = (...args: any[]) => void;

interface DebouncedFunctions {
  [key: string]: {
    timeoutId: ReturnType<typeof setTimeout> | null;
    lastArgs: any[];
  };
}

// Keep track of all debounced functions
const debouncedFunctions: DebouncedFunctions = {};

/**
 * Debounce a function to avoid calling it too frequently
 * 
 * @param key A unique identifier for this debounced function
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the function
 */
export const debounce = (key: string, fn: (...args: any[]) => void, delay: number): DebouncedFunction => {
  return (...args: any[]) => {
    // If we already have a pending execution for this key, cancel it
    if (debouncedFunctions[key]?.timeoutId) {
      clearTimeout(debouncedFunctions[key].timeoutId);
    }
    
    // Store the latest arguments
    if (!debouncedFunctions[key]) {
      debouncedFunctions[key] = { timeoutId: null, lastArgs: [] };
    }
    debouncedFunctions[key].lastArgs = args;
    
    // Schedule a new execution
    debouncedFunctions[key].timeoutId = setTimeout(() => {
      fn(...debouncedFunctions[key].lastArgs);
      debouncedFunctions[key].timeoutId = null;
    }, delay);
  };
};

/**
 * Cancel a debounced function
 * 
 * @param key The unique identifier for the debounced function
 */
export const cancelDebounce = (key: string): void => {
  if (debouncedFunctions[key]?.timeoutId) {
    clearTimeout(debouncedFunctions[key].timeoutId);
    debouncedFunctions[key].timeoutId = null;
  }
};

/**
 * Execute a debounced function immediately, canceling any pending timeout
 * 
 * @param key The unique identifier for the debounced function
 * @param fn The function to execute
 */
export const flushDebounce = (key: string, fn: (...args: any[]) => void): void => {
  if (debouncedFunctions[key]) {
    cancelDebounce(key);
    fn(...debouncedFunctions[key].lastArgs);
  }
};
