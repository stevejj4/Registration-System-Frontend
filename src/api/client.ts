/**
 * @fileoverview Central HTTP client for the Member Registration frontend.
 *
 * **Purpose:** Provides a single Axios instance used by all API modules, enforces
 * cookie-based authentication (`withCredentials`), manages the volatile in-memory
 * access token, and coordinates silent session refresh when requests fail with 401.
 *
 * **Architectural dependencies:**
 * - Consumed by `authApi`, `navigationApi`, `memberApi`, and other service layers.
 * - Registers lifecycle callbacks from `AuthProvider` (`src/context/AuthContext.tsx`)
 *   so token refresh and session expiry stay synchronized with React state.
 * - Expects Spring Boot endpoints at `/api/auth/login`, `/api/auth/refresh`, and
 *   `/api/auth/logout` for cookie and Bearer token handshakes.
 *
 * **Lifecycle handling:** Access tokens are never persisted to browser storage.
 * They live in module-level memory and are attached to outgoing requests via
 * interceptors. Expired tokens trigger a single background refresh; concurrent
 * failures are queued and reissued after a successful refresh.
 */

import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

/**
 * Shared Axios instance for all backend communication.
 *
 * @summary Sends credentialed requests to the Spring Boot API with optional Bearer auth.
 */
export const apiClient = axios.create({
  baseURL: "http://localhost:9090/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/* -------------------------------------------------------------------------- */
/*                         IN-MEMORY ACCESS TOKEN                             */
/* -------------------------------------------------------------------------- */

/** Ephemeral JWT access token held only in module memory (not localStorage). */
let accessToken: string | null = null;

/**
 * @summary Writes the current ephemeral access token into volatile client memory.
 * @param token - Fresh JWT string from login/refresh, or `null` to clear the session credential.
 * @returns void
 */
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

/**
 * @summary Reads the in-memory access token used by the request interceptor.
 * @returns The active Bearer token, or `null` when unauthenticated.
 */
export const getAccessToken = (): string | null => accessToken;

/* -------------------------------------------------------------------------- */
/*                      AUTH LIFECYCLE HANDLERS (from context)                  */
/* -------------------------------------------------------------------------- */

/**
 * Callback contract allowing `AuthProvider` to react to interceptor-driven auth events.
 */
export interface AuthLifecycleHandlers {
  /** Invoked when a silent refresh yields a new access token. */
  onTokenRefreshed: (token: string) => void;
  /** Invoked when refresh fails and the local session must be torn down. */
  onSessionExpired: () => void;
}

/** Registered handlers from `AuthContext`; `null` until the provider mounts. */
let authLifecycleHandlers: AuthLifecycleHandlers | null = null;

/**
 * @summary Connects React auth state to Axios interceptor lifecycle events.
 * @param handlers - Callbacks for token refresh success and session expiry.
 * @returns void
 */
export const registerAuthLifecycleHandlers = (
  handlers: AuthLifecycleHandlers
): void => {
  authLifecycleHandlers = handlers;
};

/* -------------------------------------------------------------------------- */
/*                         TOKEN REFRESH QUEUE                                */
/* -------------------------------------------------------------------------- */

const AUTH_REFRESH_PATH = "/auth/refresh";
const AUTH_SKIP_BEARER_PATHS = ["/auth/login", AUTH_REFRESH_PATH, "/auth/logout"];

/** Axios config extended with a retry guard to prevent infinite 401 loops. */
type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

/** Pending request waiting for an in-flight refresh to complete. */
type QueuedRequest = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

/**
 * Indicates whether a silent `POST /auth/refresh` handshake is already in progress.
 * When `true`, additional 401 responses must not start parallel refresh calls.
 */
let isRefreshing = false;

/**
 * Holds concurrent API requests that failed with 401 while `isRefreshing` is `true`.
 * Each entry stores promise resolve/reject callbacks that re-run the original
 * request once a fresh token is available.
 */
let refreshQueue: QueuedRequest[] = [];

/**
 * @summary Determines whether the outgoing request should receive a Bearer header.
 * @param url - Relative Axios URL for the request being prepared.
 * @returns `true` when `Authorization` may be attached; `false` for cookie-only auth routes.
 */
const shouldAttachBearerToken = (url: string | undefined): boolean => {
  if (!url) return true;
  return !AUTH_SKIP_BEARER_PATHS.some((path) => url.includes(path));
};

/**
 * @summary Flushes or rejects all requests waiting in the refresh queue.
 * @param error - Refresh failure to propagate to queued callers, or `null` on success.
 * @param token - New access token issued by `/auth/refresh`, or `null` when refresh failed.
 * @returns void
 *
 * Called after the refresh handshake completes. On success, each queued promise is
 * resolved with the new token so callers can reissue their original Axios config.
 * On failure, every queued promise is rejected and the queue is cleared.
 */
const processRefreshQueue = (error: unknown | null, token: string | null): void => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error ?? new Error("Token refresh failed"));
    } else {
      resolve(token);
    }
  });
  refreshQueue = [];
};

/**
 * @summary Attaches an `Authorization: Bearer` header to an Axios request config.
 * @param config - Original Axios request configuration to mutate.
 * @param token - Ephemeral access token returned by login or refresh.
 * @returns The same config object with the Bearer header applied.
 */
const attachBearerToken = (
  config: InternalAxiosRequestConfig,
  token: string
): InternalAxiosRequestConfig => {
  config.headers = config.headers ?? {};
  (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  return config;
};

/**
 * @summary Exchanges the HttpOnly refresh cookie for a new ephemeral access token.
 * @returns The refreshed JWT access token string.
 * @throws {AxiosError} When `/auth/refresh` returns a non-2xx response or the network fails.
 *
 * Used during startup hydration in `AuthProvider` and mirrors the interceptor refresh path.
 */
export const refreshAccessToken = async (): Promise<string> => {
  const response = await apiClient.post<{ token: string }>(AUTH_REFRESH_PATH);
  const newToken = response.data.token;
  setAccessToken(newToken);
  return newToken;
};

/* -------------------------------------------------------------------------- */
/*                            REQUEST INTERCEPTOR                             */
/* -------------------------------------------------------------------------- */

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!shouldAttachBearerToken(config.url)) {
    return config;
  }

  const token = accessToken;
  if (token) {
    return attachBearerToken(config, token);
  }

  return config;
});

/* -------------------------------------------------------------------------- */
/*                           RESPONSE INTERCEPTOR                             */
/* -------------------------------------------------------------------------- */

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? "";

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      requestUrl.includes(AUTH_REFRESH_PATH) ||
      requestUrl.includes("/auth/login")
    ) {
      return Promise.reject(error);
    }

    // Another request already triggered refresh — park this caller in the queue.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token: string) => {
            resolve(apiClient(attachBearerToken(originalRequest, token)));
          },
          reject,
        });
      });
    }

    // First 401 in this window: mark the request as retried and begin refresh.
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await apiClient.post<{ token: string }>(AUTH_REFRESH_PATH);
      const newToken = response.data.token;

      setAccessToken(newToken);
      authLifecycleHandlers?.onTokenRefreshed(newToken);

      // Unblock queued callers, then retry the request that initiated refresh.
      processRefreshQueue(null, newToken);

      return apiClient(attachBearerToken(originalRequest, newToken));
    } catch (refreshError) {
      // Refresh failed: reject the queue, clear memory token, notify AuthProvider.
      processRefreshQueue(refreshError, null);
      setAccessToken(null);
      authLifecycleHandlers?.onSessionExpired();
      return Promise.reject(refreshError);
    } finally {
      // Allow future 401s to start a new refresh cycle.
      isRefreshing = false;
    }
  }
);

/* -------------------------------------------------------------------------- */
/*                            GLOBAL ERROR HANDLER                            */
/* -------------------------------------------------------------------------- */

/**
 * @summary Normalizes unknown API failures into user-facing `Error` messages.
 * @param error - Raw error from Axios, application code, or an unknown throw value.
 * @param fallback - Default message when the server does not supply a readable reason.
 * @returns Never returns; always throws a descriptive `Error`.
 * @throws {Error} Network unreachable, HTTP 4xx/5xx with mapped copy, or validation detail text.
 */
export const handleError = (error: unknown, fallback: string): never => {
  console.error("=== API Error Details ===");
  console.error("Timestamp:", new Date().toISOString());
  console.error("Fallback message:", fallback);

  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{
      error?: string;
      message?: string;
      errors?: Record<string, string | string[]>;
      fieldErrors?: Record<string, string | string[]>;
    }>;

    console.error("Request URL:", err.config?.url);
    console.error("Request Method:", err.config?.method);
    console.error("Request Data:", err.config?.data);
    console.error("Response Status:", err.response?.status);
    console.error("Response Headers:", err.response?.headers);
    console.error("Response Data:", err.response?.data);

    if (!err.response) {
      console.error("Network error - server may be down:", err.message);
      console.error("Request config:", err.config);
      throw new Error(
        "Unable to connect to server. Please check your internet connection and try again."
      );
    }

    const status = err.response.status;
    const serverMessage = err.response?.data?.error || err.response?.data?.message;
    const validationErrors =
      err.response?.data?.errors || err.response?.data?.fieldErrors;

    console.error("Server Message:", serverMessage);
    console.error("Validation Errors:", validationErrors);

    let errorMessage = serverMessage || fallback;

    if (validationErrors && typeof validationErrors === "object") {
      const errorMessages = Object.entries(validationErrors)
        .map(
          ([field, messages]) =>
            `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`
        )
        .join("; ");
      errorMessage += ` (${errorMessages})`;
    }

    switch (status) {
      case 400:
        throw new Error(
          errorMessage || "Invalid data provided. Please check your input and try again."
        );
      case 401:
        throw new Error("Unauthorized. Please log in again.");
      case 403:
        throw new Error("You do not have permission to perform this action.");
      case 404:
        throw new Error("The requested resource was not found.");
      case 500:
        throw new Error("Server error occurred. Please try again later.");
      default:
        throw new Error(errorMessage);
    }
  }

  if (error instanceof Error) {
    console.error("Application error:", error.message);
    console.error("Stack trace:", error.stack);
    throw new Error(error.message || fallback);
  }

  console.error("Unknown error type:", typeof error);
  throw new Error(fallback);
};

/**
 * @summary Probes whether the Spring Boot API is reachable.
 * @returns `true` when `/auth/ping` responds or any HTTP status is returned; `false` on network failure.
 * @throws Does not throw; failures are converted to a `false` return value.
 */
export const checkBackendConnectivity = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get("/auth/ping", { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return true;
    }
    return false;
  }
};
