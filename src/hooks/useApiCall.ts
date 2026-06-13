/**
 * @fileoverview Reusable hook for imperative API calls with shared loading/error state.
 *
 * **Purpose:** Encapsulates a consistent request lifecycle (`loading`, `data`, `error`)
 * for feature hooks such as `useDashboard` and `useMembers`, keeping components free
 * of duplicated try/catch and spinner logic.
 *
 * **Architectural dependencies:**
 * - Accepts any async function (typically wrapping `apiClient` service methods).
 * - Does not perform HTTP itself; callers supply the `apiCall` closure.
 * - Uses refs for callbacks so `execute` keeps a stable identity across renders.
 *
 * **Lifecycle handling:** `execute()` sets `loading` to `true`, clears prior errors,
 * resolves into `data` or captures a string `error`, and always resets `loading` in
 * `finally`. Optional `onSuccess` / `onError` callbacks fire after state updates.
 */

import { useState, useCallback, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";

/**
 * Return shape exposed to components consuming the hook.
 */
export interface UseApiCallResult<T> {
  /** Imperatively triggers the supplied `apiCall` function. */
  execute: () => Promise<void>;
  /** `true` while a request started by `execute` is in flight. */
  loading: boolean;
  /** Human-readable error message, or `null` when the last call succeeded. */
  error: string | null;
  /** Last successful response payload, or `null` before the first success. */
  data: T | null;
  /** Allows callers to optimistically or manually adjust cached response data. */
  setData: Dispatch<SetStateAction<T | null>>;
  /** Clears `data`, `error`, and sets `loading` to `false`. */
  reset: () => void;
}

/**
 * @summary Runs an async API function with standardized loading, error, and data state.
 * @param apiCall - Zero-argument function returning the promise produced by a service method.
 * @param onSuccess - Optional side-effect invoked with the resolved payload after `data` is set.
 * @param onError - Optional side-effect invoked with the caught `Error` after `error` is set.
 * @returns Hook API containing `execute`, `loading`, `error`, `data`, `setData`, and `reset`.
 * @throws Does not throw from the hook itself; failures are captured in `error` and forwarded to `onError`.
 */
export const useApiCall = <T,>(
  apiCall: () => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: Error) => void
): UseApiCallResult<T> => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const apiCallRef = useRef(apiCall);

  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  apiCallRef.current = apiCall;

  /**
   * @summary Starts the API call, updates hook state, and invokes optional callbacks.
   * @returns Promise that settles when the underlying `apiCall` completes.
   */
  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCallRef.current();
      setData(result);
      onSuccessRef.current?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      onErrorRef.current?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * @summary Returns the hook to its idle state without issuing a network request.
   * @returns void
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { execute, loading, error, data, setData, reset };
};
