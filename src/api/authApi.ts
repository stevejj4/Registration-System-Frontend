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

  return data; // Return the entire response data, which includes both the token and user information, to allow components to access all relevant authentication details without needing to make an additional API call to fetch the user profile.
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
  return res.data?.message ?? "If an account exists for that email, a verification code has been sent.";
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