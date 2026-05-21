// src/services/authApi.ts

import { apiClient, setAuthToken } from "./client";

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
 * Authenticate user
 */
export const login = async (
  payload: LoginRequestDTO
): Promise<AuthResponseDTO> => {
  const response = await apiClient.post(
    "/auth/login",
    payload
  );

  const data =
    response.data as AuthResponseDTO;

  /**
   * Persist JWT token
   */
  if (data?.token) {
    setAuthToken(data.token);
  }

  return data;
};


/* -------------------------------------------------------------------------- */
/*                              FORGOT PASSWORD                               */
/* -------------------------------------------------------------------------- */

/**
 * Send password reset email
 */
export const forgotPassword =
  async (
    payload: ForgotPasswordRequestDTO
  ): Promise<void> => {
    await apiClient.post(
      "/auth/password/forgot",
      payload
    );
  };

/* -------------------------------------------------------------------------- */
/*                               RESET PASSWORD                               */
/* -------------------------------------------------------------------------- */

/**
 * Reset password using token
 */
export const resetPassword =
  async (
    payload: ResetPasswordRequestDTO
  ): Promise<void> => {
    await apiClient.post(
      "/auth/password/reset",
      payload
    );
  };

/* -------------------------------------------------------------------------- */
/*                                CURRENT USER                                */
/* -------------------------------------------------------------------------- */

/**
 * Get authenticated user profile
 */
export const getCurrentUser =
  async (): Promise<UserDTO> => {
    const response =
      await apiClient.get(
        "/auth/me"
      );

    return response.data as UserDTO;
  };

/* -------------------------------------------------------------------------- */
/*                                   LOGOUT                                   */
/* -------------------------------------------------------------------------- */

/**
 * Logout user
 */
export const logout = (): void => {
  setAuthToken(undefined);

  localStorage.removeItem("token");

  localStorage.removeItem("user");
};