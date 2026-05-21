import axios, { AxiosError } from 'axios'; // our HTTP client library
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

/**
 * Axios instance acts as the single source of HTTP configuration
 * consistent base URL
 * Easier to swap environments (dev, staging, prod) by changing one place
 */
export const apiClient = axios.create({ 
  baseURL: "http://localhost:9090/api", // default base URL for all API requests,
  headers: { 
    "Content-Type": "application/json", // 
  }, 
});

// Token storage key used by auth provider
const TOKEN_KEY = 'auth_token';

/**
 * Helper to set/remove token in localStorage and keep axios interceptor working
 */
export const setAuthToken = (token?: string) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token); // login case: store the token in localStorage so it can be used by the interceptor to set the Authorization header on future requests
  } else {
    localStorage.removeItem(TOKEN_KEY); // logout case: remove the token from localStorage to effectively log the user out and prevent the interceptor from adding an Authorization header to future requests
  }
};

// Attach JWT token to every login request if available
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => { 
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      // Ensure headers object exists and set Authorization in a type-safe way
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  } catch (err) {
    // ignore localStorage errors
  }
  return config;
});

// Global response interceptor to handle unauthorized access centrally
apiClient.interceptors.response.use(
  (r) => r,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch (e) {
        // ignore
      }
      // Redirect to login for a simple MVP flow
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Global error handler
 * catches all errors from API calls and provides consistent error messages to the UI
 * throws user-friendly error messages based on error type (network, validation, server)
 * logs detailed error information for debugging
 */
export const handleError = (error: unknown, fallback: string): never => { // error: unknown allows us to catch any type of error, not just Axios errors, fallback is a generic message to use if we can't determine the error type, never return type indicates this function will always throw an error and never return a value (what is never return type? -- it tells TypeScript that this function will always throw an error and never return a value, which helps with type safety and control flow analysis in the rest of the codebase)
  console.error('=== API Error Details ==='); // log the error details for debugging purposes, this will help us understand what went wrong when an API call fails, especially during development and troubleshooting
  console.error('Timestamp:', new Date().toISOString()); // logs the exact time the error occurred for better debugging and correlation with backend logs, toI
  console.error('Fallback message:', fallback); // logs the fallback message that will be used if we can't determine the error type, this helps us understand what the user will see when this error is thrown
  
  if (axios.isAxiosError(error)) { // checks if the error is an AxiosError, which means it came from an HTTP request made using our apiClient, this allows us to handle network errors and server responses in a consistent way e.g if the server is down, if the request was invalid, if the user is unauthorized, etc.
    const err = error as AxiosError<any>; // type assertion to treat the error as an AxiosError with any response data, this allows us to access properties like err.response and err.config without TypeScript errors, since AxiosError is a specific type of error that has these properties
    // what is type assertion? -- Type assertion is a way to tell TypeScript to treat a value as a specific type, even if TypeScript can't infer it on its own. It's like saying "I know better than you, TypeScript, this value is actually of this type". In this case, we're telling TypeScript that the error is an AxiosError with any response data, which allows us to access properties specific to Axios errors without TypeScript complaining about it.
    console.error('Request URL:', err.config?.url); // 
    console.error('Request Method:', err.config?.method);
    console.error('Request Data:', err.config?.data);
    console.error('Response Status:', err.response?.status);
    console.error('Response Headers:', err.response?.headers);
    console.error('Response Data:', err.response?.data);
    
    // Network error (server unreachable)
    if (!err.response) {
      console.error('Network error - server may be down:', err.message);
      console.error('Request config:', err.config);
      throw new Error('Unable to connect to server. Please check your internet connection and try again.');
    }
    
    // Server responded with error
    const status = err.response.status;
    const serverMessage = err.response?.data?.error || err.response?.data?.message;
    const validationErrors = err.response?.data?.errors || err.response?.data?.fieldErrors;
    
    console.error('Server Message:', serverMessage);
    console.error('Validation Errors:', validationErrors);
    
    let errorMessage = serverMessage || fallback;
    
    // Include validation errors if present
    if (validationErrors && typeof validationErrors === 'object') {
      const errorMessages = Object.entries(validationErrors)
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join('; ');
      errorMessage += ` (${errorMessages})`;
    }
    
    switch (status) {
      case 400:
        throw new Error(errorMessage || 'Invalid data provided. Please check your input and try again.');
      case 401:
        throw new Error('Unauthorized. Please log in again.');
      case 403:
        throw new Error('You do not have permission to perform this action.');
      case 404:
        throw new Error('The requested resource was not found.');
      case 500:
        throw new Error('Server error occurred. Please try again later.');
      default:
        throw new Error(errorMessage);
    }
  }
  
  // Non-Axios errors
  /**
 * Check backend connectivity
 * catches error that are non Axios related (e.g. programming errors, unexpected exceptions)
 * logs the error details for debugging
 * throws a generic error message to avoid exposing sensitive information 
 * ensure non network errors are also handled gracefully in the UI
 */
  if (error instanceof Error) { // checks if the error is a standard JavaScript Error object, which means it's likely a programming error or an unexpected exception that occurred in our code, this allows us to catch and log these types of errors as well, ensuring that all errors are handled gracefully and logged for debugging
    console.error('Application error:', error.message); // application error is a non-network error that occurred in our code, this could be a bug, an unexpected exception, or any error that is not related to an HTTP request, logging the error message helps us understand what went wrong in our code
    console.error('Stack trace:', error.stack);  // stack 
    throw new Error(error.message || fallback);
  }
  
  console.error('Unknown error type:', typeof error); // safety net for unexpected cases 
  throw new Error(fallback);
};

/**
 * Check backend connectivity
 */
// In client.ts — change the connectivity check endpoint to one that's public
export const checkBackendConnectivity = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/auth/ping', { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    // If it's a 4xx the server IS reachable, just rejecting the request
    if (axios.isAxiosError(error) && error.response) {
      return true; // server responded = it's up
    }
    return false; // no response = server is down
  }
};