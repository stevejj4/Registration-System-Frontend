import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

/**
 * Single Axios instance for API communication.
 * - Sends HttpOnly cookies via withCredentials
 * - Attaches in-memory Bearer tokens when available
 * - Silently refreshes expired sessions and queues concurrent requests
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

let accessToken: string | null = null;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const getAccessToken = (): string | null => accessToken;

/* -------------------------------------------------------------------------- */
/*                      AUTH LIFECYCLE HANDLERS (from context)                  */
/* -------------------------------------------------------------------------- */

export interface AuthLifecycleHandlers {
  onTokenRefreshed: (token: string) => void;
  onSessionExpired: () => void;
}

let authLifecycleHandlers: AuthLifecycleHandlers | null = null;

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

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type QueuedRequest = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let refreshQueue: QueuedRequest[] = [];

const shouldAttachBearerToken = (url: string | undefined): boolean => {
  if (!url) return true;
  return !AUTH_SKIP_BEARER_PATHS.some((path) => url.includes(path));
};

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

const attachBearerToken = (
  config: InternalAxiosRequestConfig,
  token: string
): InternalAxiosRequestConfig => {
  config.headers = config.headers ?? {};
  (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  return config;
};

/**
 * Exchange the HttpOnly refresh cookie for a new ephemeral access token.
 * Used during session hydration on app startup.
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

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await apiClient.post<{ token: string }>(AUTH_REFRESH_PATH);
      const newToken = response.data.token;

      setAccessToken(newToken);
      authLifecycleHandlers?.onTokenRefreshed(newToken);
      processRefreshQueue(null, newToken);

      return apiClient(attachBearerToken(originalRequest, newToken));
    } catch (refreshError) {
      processRefreshQueue(refreshError, null);
      setAccessToken(null);
      authLifecycleHandlers?.onSessionExpired();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/* -------------------------------------------------------------------------- */
/*                            GLOBAL ERROR HANDLER                            */
/* -------------------------------------------------------------------------- */

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
 * Check backend connectivity
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
