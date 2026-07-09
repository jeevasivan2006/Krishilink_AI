import { useState, useEffect } from 'react';

/**
 * Returns a debounced value that only updates after `delay` ms of inactivity.
 * @param {*}      value  - Value to debounce
 * @param {number} delay  - Milliseconds to wait (default 400)
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
