import { useCallback, useEffect, useRef } from 'react';

export function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;

export function useMemoizedFn<T extends AnyFn>(fn: T): T {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const memoizedFn = useCallback((...args: Parameters<T>) => {
    return fnRef.current(...args);
  }, []);

  return memoizedFn as T;
}

export function useUnmount(fn: () => void) {
  const fnRef = useLatest(fn);
  useEffect(() => {
    return () => {
      fnRef.current();
    };
  }, []);
}
