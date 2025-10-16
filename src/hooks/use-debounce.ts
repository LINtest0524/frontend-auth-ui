import { useCallback, useRef } from 'react';

// 防抖 Hook
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // 清除之前的計時器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 設置新的計時器
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  // 清理函數
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // 添加 cancel 方法到返回的函數上
  Object.assign(debouncedCallback, { cancel });

  return debouncedCallback;
}

// 節流 Hook（額外提供）
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTimeRef.current;

      if (timeSinceLastCall >= delay) {
        // 立即執行
        lastCallTimeRef.current = now;
        callback(...args);
      } else {
        // 延遲執行（確保最後一次調用會被執行）
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCallTimeRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    },
    [callback, delay]
  ) as T;

  return throttledCallback;
}