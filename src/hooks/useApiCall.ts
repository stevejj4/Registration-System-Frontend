import { useState, useCallback, useRef } from 'react';

/**
 * Common hook for API operations with consistent loading, error, and data handling
 */
export const useApiCall = <T,>(
  apiCall: () => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: Error) => void
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const apiCallRef = useRef(apiCall);

  // Update refs when dependencies change
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  apiCallRef.current = apiCall;

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCallRef.current();
      setData(result);
      onSuccessRef.current?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onErrorRef.current?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - stable function reference

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { execute, loading, error, data, setData, reset };
};
