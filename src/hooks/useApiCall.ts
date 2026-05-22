import { useState, useCallback, useRef } from 'react';
// -- useState is used to manage loading, error, and data states.
// -- useCallback -- is used to memoize the execute and reset functions, ensuring they have stable references and don't cause unnecessary re-renders in components that use this hook.
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
export const useApiCall = <T,>( // 
  apiCall: () => Promise<T>, // apiCall is a function that returns a promise of type T, which represents the expected data structure of the API response. This allows the hook to be flexible and work with any API endpoint that returns data in the shape of T. shape of T
  onSuccess?: (data: T) => void, // onSuccess is an optional callback function that gets called with the data returned from the API call when it is successful. This allows components using this hook to perform additional actions with the data, such as updating local state or triggering side effects, without having to manage the API call logic themselves.
  onError?: (error: Error) => void //
) => {
  const [loading, setLoading] = useState(false); // why false -- we initialize loading to false because when the hook is first used, we haven't started the API call yet, so we're not in a loading state. The loading state will be set to true when the execute function is called to perform the API call, and then set back to false once the call is completed (either successfully or with an error). This allows components using this hook to know when an API call is in progress and show appropriate loading indicators or disable interactions until the call is finished.
  // setL
  const [error, setError] = useState<string | null>(null); // By using string | null, we can represent both the absence of an error (null) and the presence of an error (a string message).
  const [data, setData] = useState<T | null>(null); // data is initialized to null because we haven't fetched any data yet. Once the API call is successful, we will set this state to the data returned from the API, which will be of type T. This allows components using this hook to access the fetched data once it's available, while also handling the case where no data has been fetched yet (null).

  const onSuccessRef = useRef(onSuccess); // useRef is used to hold the latest version of the onSuccess function without causing re-renders example of re-
  const onErrorRef = useRef(onError); // -- useRef is used to hold the latest version of the onError function without causing re-renders, this allows us to call the most up-to-date onError callback when an error occurs during the API call, without having to include onError in the dependency array of the execute function, which would cause it to change on every render and potentially lead to unnecessary re-renders or stale closures.
  const apiCallRef = useRef(apiCall); 

  // Update refs when dependencies change
  
  onSuccessRef.current = onSuccess; // 
  onErrorRef.current = onError; 
  apiCallRef.current = apiCall;


/**
 * 
 */
  const execute = useCallback(async () => { // execute function is defined using useCallback to ensure it has a stable reference -- what is stable in simple words -- 
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
      setLoading(false); // Set loading to false once the API call is complete
    }
  }, []); // Empty dependency array - stable function reference

  const reset = useCallback(() => { // reset function to clear data and error states, and set loading to false, allowing components to reset the state of the API call when needed (e.g., when unmounting or before making a new call).
    setData(null);
    setError(null);
    setLoading(false);
  }, []); // Empty dependency array - stable function reference

  return { execute, loading, error, data, setData, reset }; // why setData 
};
