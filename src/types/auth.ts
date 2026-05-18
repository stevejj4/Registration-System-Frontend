// src/types/auth.ts

import { UserRole } from "./enums";

// Re-export for convenience
export type { UserRole } from "./enums";

/**
 * Login Request
 */
export interface LoginRequestDTO {
  email: string;
  password: string;
}

/**
 * Authentication Response
 */
export interface AuthResponseDTO {
  token: string;

  role: UserRole;

  id: number;

  email: string;

  fullName: string;
}

/**
 * Authenticated User
 * Stored in frontend state/context
 */
export interface AuthUser {
  id: number;

  email: string;

  fullName: string;

  role: UserRole;

  token?: string;
}

/**
 * Register User Request
 */
export interface RegisterUserDTO {
  email: string;

  fullName: string;

  password: string;

  role: UserRole;
}

/**
 * Public User DTO
 */
export interface UserDTO {
  id: number;

  email: string;

  fullName: string;

  role: UserRole;
}

/**
 * Forgot Password Request
 */
export interface ForgotPasswordRequestDTO {
  email: string;
}

/**
 * Reset Password Request
 */
export interface ResetPasswordRequestDTO {
  token: string;

  newPassword: string;
}