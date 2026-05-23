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

  permissions?: string[];
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

  permissions: string[];

  token?: string;
}

/**
 * Admin-provisioned user (server generates password and emails credentials).
 */
export interface CreateUserRequestDTO {
  firstName: string;
  lastName: string;
  email: string;
  assignedRole: UserRole;
}

export interface CreateUserResponseDTO {
  user: UserDTO;
  message: string;
}

export interface UpdateUserRequestDTO {
  firstName: string;
  lastName: string;
  email: string;
}

/** @deprecated Use CreateUserRequestDTO */
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

  createdAt?: string;
}

/**
 * Forgot Password Request
 */
export interface ForgotPasswordRequestDTO {
  email: string;
}

/**
 * Reset Password Request (6-digit OTP)
 */
export interface ResetPasswordRequestDTO {
  email: string;
  code: string;
  newPassword: string;
}

export interface MessageResponseDTO {
  message: string;
}