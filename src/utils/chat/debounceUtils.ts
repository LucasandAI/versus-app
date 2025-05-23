
/**
 * Store for debounced functions to allow for external flushing
 */
const debouncedFunctions: Record<string, {
  timeout: ReturnType<typeof setTimeout> | null;
  lastArgs: any[] | null;
  func: (...args: any[]) => any;
  wait: number;
}> = {};

/**
 * Creates a named debounced function that delays invoking `func` until after `wait` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * The key parameter allows for externally flushing this specific debounce function.
 */
export const debounce = <T extends (...args: any[]) => any>(
  key: string,
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  // Store reference in our tracking object
  debouncedFunctions[key] = {
    timeout: null,
    lastArgs: null,
    func,
    wait
  };
  
  return (...args: Parameters<T>) => {
    const debounceState = debouncedFunctions[key];
    
    if (!debounceState) {
      console.error(`Debounced function with key ${key} not found`);
      return;
    }
    
    // Update last args
    debounceState.lastArgs = args;
    
    // Clear existing timeout
    if (debounceState.timeout !== null) {
      clearTimeout(debounceState.timeout);
      debounceState.timeout = null;
    }
    
    // Set new timeout
    debounceState.timeout = setTimeout(() => {
      if (debounceState.lastArgs !== null) {
        func(...debounceState.lastArgs);
        debounceState.lastArgs = null;
      }
      debounceState.timeout = null;
    }, wait);
  };
};

/**
 * Flushes a named debounced function, executing it immediately if there's a pending call
 * and cancelling the timeout. Returns true if a function was flushed, false otherwise.
 */
export const flushDebounce = (key: string): boolean => {
  const debounceState = debouncedFunctions[key];
  
  if (!debounceState || debounceState.lastArgs === null) {
    return false;
  }
  
  // Clear timeout
  if (debounceState.timeout !== null) {
    clearTimeout(debounceState.timeout);
    debounceState.timeout = null;
  }
  
  // Execute the function immediately
  debounceState.func(...debounceState.lastArgs);
  debounceState.lastArgs = null;
  return true;
};

/**
 * Forces a flush of a named debounced function, executing it immediately if there's a pending call
 * and cancelling the timeout. Unlike flushDebounce, this doesn't check the state and immediately
 * executes any pending function. Returns true if a function was flushed, false otherwise.
 */
export const forceFlushDebounce = (key: string): boolean => {
  const debounceState = debouncedFunctions[key];
  
  if (!debounceState) {
    console.warn(`No debounced function with key ${key} found to force flush`);
    return false;
  }
  
  // Clear timeout
  if (debounceState.timeout !== null) {
    clearTimeout(debounceState.timeout);
    debounceState.timeout = null;
  }
  
  // Execute the function immediately if we have args
  if (debounceState.lastArgs !== null) {
    debounceState.func(...debounceState.lastArgs);
    debounceState.lastArgs = null;
    return true;
  }
  
  return false;
};

/**
 * Creates a throttled function that only invokes `func` at most once per
 * every `wait` milliseconds.
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastCall);
    
    if (remaining <= 0) {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
      
      lastCall = now;
      func(...args);
    } else if (timeout === null) {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  };
};

/**
 * RAF-based debounce that uses requestAnimationFrame for smooth UI updates
 * Ensures the function is called on the next frame, batching visual updates
 */
export const rafDebounce = <T extends (...args: any[]) => any>(
  func: T
): ((...args: Parameters<T>) => void) => {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  
  return (...args: Parameters<T>) => {
    lastArgs = args;
    
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    
    rafId = requestAnimationFrame(() => {
      if (lastArgs !== null) {
        func(...lastArgs);
        lastArgs = null;
      }
      rafId = null;
    });
  };
};
