import axios, { AxiosError } from "axios";

/**
 * Axios instance acts as the single source of HTTP configuration
 */
export const apiClient = axios.create({
  baseURL: "http://localhost:9090/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Global error handler
 */
export const handleError = (error: unknown, fallback: string): never => {
  console.error('=== API Error Details ===');
  console.error('Timestamp:', new Date().toISOString());
  console.error('Fallback message:', fallback);
  
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<any>;
    
    console.error('Request URL:', err.config?.url);
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
  if (error instanceof Error) {
    console.error('Application error:', error.message);
    console.error('Stack trace:', error.stack);
    throw new Error(error.message || fallback);
  }
  
  console.error('Unknown error type:', typeof error);
  throw new Error(fallback);
};

/**
 * Check backend connectivity
 */
export const checkBackendConnectivity = async (): Promise<boolean> => {
  try {
    // Try to get members list as a connectivity check
    const response = await apiClient.get('/members', { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.warn('Backend connectivity check failed:', error);
    return false;
  }
};
