import { apiClient } from "./client";

import type {
  AuthResponseDTO,
  LoginRequestDTO,
  RegisterUserDTO,
  ForgotPasswordRequestDTO,
  ResetPasswordRequestDTO,
  UserDTO,
} from "@/types/auth";

/* -------------------------------------------------------------------------- */
/*                                   LOGIN                                    */
/* -------------------------------------------------------------------------- */

/**
 * Authenticate user. HttpOnly cookies are set by the server; the ephemeral
 * access token in the response body is held in-memory by AuthContext only.
 */
export const login = async (
  payload: LoginRequestDTO
): Promise<AuthResponseDTO> => {
  const response = await apiClient.post("/auth/login", payload);
  return response.data as AuthResponseDTO;
};

/* -------------------------------------------------------------------------- */
/*                              FORGOT PASSWORD                               */
/* -------------------------------------------------------------------------- */

/**
 * Send password reset email
 */
export const forgotPassword = async (
  payload: ForgotPasswordRequestDTO
): Promise<string> => {
  const res = await apiClient.post<{ message: string }>(
    "/v1/auth/forgot-password",
    payload
  );
  return (
    res.data?.message ??
    "If an account exists for that email, a verification code has been sent."
  );
};

/* -------------------------------------------------------------------------- */
/*                               RESET PASSWORD                               */
/* -------------------------------------------------------------------------- */

/**
 * Reset password using token
 */
export const resetPassword = async (
  payload: ResetPasswordRequestDTO
): Promise<string> => {
  const res = await apiClient.post<{ message: string }>(
    "/v1/auth/reset-password",
    payload
  );
  return res.data?.message ?? "Password successfully reset.";
};

/* -------------------------------------------------------------------------- */
/*                                CURRENT USER                                */
/* -------------------------------------------------------------------------- */

/**
 * Get authenticated user profile
 */
export const getCurrentUser = async (): Promise<UserDTO> => {
  const response = await apiClient.get("/auth/me");
  return response.data as UserDTO;
};

/* -------------------------------------------------------------------------- */
/*                                   LOGOUT                                   */
/* -------------------------------------------------------------------------- */

/**
 * Invalidate the server session and clear HttpOnly auth cookies.
 */
export const logout = async (): Promise<void> => {
  await apiClient.post("/auth/logout");
};
