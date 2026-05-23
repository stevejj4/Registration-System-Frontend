export const ERROR_MESSAGES = {
  INVALID_MEMBER_ID: "Invalid member ID",
  INVALID_PHONE: "Phone must be at least 10 digits",
  INVALID_ID: "ID is required",
  INVALID_NATIONAL_ID_FORMAT: "National ID must be 6 to 10 digits",
  INVALID_DATE: "Invalid date",
  INVALID_NAME: "Name is required",
  REGISTRATION_FAILED: "Registration failed",
  NETWORK_ERROR: "Network error occurred",
  UNAUTHORIZED: "Unauthorized access",
  NOT_FOUND: "Resource not found",
  SERVER_ERROR: "Server error occurred",
};

export const VALIDATION_RULES = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  /** Kenyan national IDs are typically 6–10 numeric digits */
  NATIONAL_ID_REGEX: /^\d{6,10}$/,
  PHONE_REGEX: /^07\d{8}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

export const API_ENDPOINTS = {
  MEMBERS: '/members',
  AUTH: '/auth',
};

export const APP_CONFIG = {
  API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:9090/api',
  API_TIMEOUT: parseInt(process.env.VITE_API_TIMEOUT || '10000'),
  USE_MOCK_API: process.env.VITE_USE_MOCK_API === 'true',
};
