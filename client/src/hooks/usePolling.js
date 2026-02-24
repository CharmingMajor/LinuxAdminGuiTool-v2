import { useEffect, useRef, useState, useCallback } from 'react';

export function usePolling(fetchFn, interval = 3000, enabled = true) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    try {
      const result = await fetchFn();
      if (mountedRef.current) {
        setData(result);
        setError(null);
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
        setLoading(false);
      }
    }
  }, [fetchFn]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) return;

    execute();
    timerRef.current = setInterval(execute, interval);

    return () => {
      mountedRef.current = false;
      clearInterval(timerRef.current);
    };
  }, [execute, interval, enabled]);

  return { data, error, loading, refetch: execute };
}
