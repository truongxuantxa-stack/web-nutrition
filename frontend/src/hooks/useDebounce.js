import { useState, useEffect } from 'react';

/**
 * Hook custom để trì hoãn việc update giá trị cho đến khi user ngừng nhập.
 * Hữu ích cho việc giảm số lượng request API khi search.
 * 
 * @param {any} value Giá trị cần debounce
 * @param {number} delay Thời gian chờ (ms)
 * @returns {any} Giá trị sau khi debounce
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timer to update the debounced value
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes before the delay passes
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]); // Only re-call effect if value or delay changes

  return debouncedValue;
}
