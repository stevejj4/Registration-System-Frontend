import { useState, useCallback, useRef } from 'react';
// -- useState is used to manage loading, error, and data states.
// -- useCallback is used to memoize the execute and reset functions.
// -- useRef is used to hold the latest versions of the apiCall, onSuccess, and onError functions without causing re-renders.
// 
/**
 * Common hook for API operations with consistent loading, error, and data handling
 * - apiCall: The asynchronous function that performs the API request and returns a promise.
 * - onSuccess: Optional callback function to handle successful API responses.
 * - onError: Optional callback function to handle API errors.
 */

/**
 * manage logic and state (loading, error, data) and expose them to components.
 */
export const useApiCall = <T,>( 
  apiCall: () => Promise<T>, // apiCall is a function that returns a promise of type T, which represents the expected data structure of the API response. This allows the hook to be flexible and work with any API endpoint that returns data in the shape of T.
  onSuccess?: (data: T) => void,
  onError?: (error: Error) => void
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // const [error, setError] = useState<string | null>(null); 
  const [data, setData] = useState<T | null>(null);

  const onSuccessRef = useRef(onSuccess); // useRef is used to hold the latest version of the onSuccess function without causing re-renders.
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
