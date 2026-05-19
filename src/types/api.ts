// src/types/api.ts

/**
 * Generic API Response Wrapper
 */
export interface ApiResponse<T> {
  success: boolean;

  data?: T;

  error?: string;

  message?: string;
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
  timestamp?: string;

  status?: number;

  error?: string;

  message?: string;

  path?: string;

  validationErrors?: Record<string, string>;
}

/**
 * Pagination Metadata
 */
export interface PaginationMeta {
  page: number;

  size: number;

  totalElements: number;

  totalPages: number;

  last: boolean;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  content: T[];

  meta: PaginationMeta;
}