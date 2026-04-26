import { useState, useEffect, useRef } from 'react';

export function useDebounce<T>(value: T, delay: number, maxWait?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    
    // If we exceeded maxWait, update immediately
    if (maxWait && now - lastUpdateRef.current >= maxWait) {
      setDebouncedValue(value);
      lastUpdateRef.current = now;
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
      lastUpdateRef.current = Date.now();
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, maxWait]);

  return debouncedValue;
}
