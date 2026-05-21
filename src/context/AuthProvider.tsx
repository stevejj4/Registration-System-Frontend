import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import type {
  AuthUser,
  LoginRequestDTO,
  AuthResponseDTO,
  UserRole,
} from "@/types/auth";

import { login as apiLogin } from "@/api/authApi";
import { setAuthToken } from "@/api/client";
import { normalizeRole } from "@/utils/auth";

/**
 * Authentication Context and Provider
 * Manages user authentication state and provides login/logout functions.
 * Uses localStorage to persist auth state across page reloads.
 * Syncs JWT token with Axios for authenticated API requests.
 * It is security guard at the gateway of the app - if you can't authenticate, you can't access any protected routes or API calls.
 * It remembers who you are (user info) and what you can do (role) and your badge (token) so you don't have to log in again on every page refresh.
 * It knows how to talk to the backend to log you in and log you out, and it makes sure your token is included in every API request so the backend knows who you are and what you can do.
 */

/* -------------------------------------------------------------------------- */
/*                                  CONTEXT                                   */
/* -------------------------------------------------------------------------- */

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;

  login: (payload: LoginRequestDTO) => Promise<void>;
  logout: () => void;

  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
}

export const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

/* -------------------------------------------------------------------------- */
/*                                PROVIDER                                    */
/* -------------------------------------------------------------------------- */

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  /* ----------------------------- USER STATE ----------------------------- */

  const [user, setUser] =
    useState<AuthUser | null>(() => {
      try {
        const raw =
          localStorage.getItem("auth_user");

        return raw
          ? (JSON.parse(raw) as AuthUser)
          : null;
      } catch {
        return null;
      }
    });

  /* ---------------------------- TOKEN STATE ---------------------------- */

  const [token, setToken] =
    useState<string | null>(() => {
      try {
        return localStorage.getItem(
          "auth_token"
        );
      } catch {
        return null;
      }
    });

  /* -------------------------------------------------------------------------- */
  /*                           SYNC TOKEN WITH AXIOS                           */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    setAuthToken(token ?? undefined);

    if (token) {
      localStorage.setItem(
        "auth_token",
        token
      );
    } else {
      localStorage.removeItem(
        "auth_token"
      );
    }
  }, [token]);

  /* -------------------------------------------------------------------------- */
  /*                                   LOGIN                                    */
  /* -------------------------------------------------------------------------- */

  const login = useCallback(
    async (
      payload: LoginRequestDTO
    ): Promise<void> => {
      const res: AuthResponseDTO =
        await apiLogin(payload);

      console.log("🔍 DEBUG: res.role from server:", {
        raw: res.role,
        type: typeof res.role,
      });

      const normalizedRole =
        normalizeRole(res.role);
      
      console.log("🔍 DEBUG: After normalizeRole:", {
        input: res.role,
        output: normalizedRole,
      });
      
      if (!normalizedRole) {
        throw new Error("Invalid user role from server");
      }

      const resolvedUser: AuthUser = {
        id: res.id,
        email: res.email,
        fullName: res.fullName,
        role: normalizedRole,
      };

      try {
        localStorage.setItem(
          "auth_user",
          JSON.stringify(resolvedUser)
        );

        localStorage.setItem(
          "auth_token",
          res.token
        );
      } catch {}

      setAuthToken(res.token);
      setUser(resolvedUser);
      setToken(res.token);
    },
    []
  );

  /* -------------------------------------------------------------------------- */
  /*                                  LOGOUT                                   */
  /* -------------------------------------------------------------------------- */

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(
        "auth_token"
      );
      localStorage.removeItem(
        "auth_user"
      );
    } catch {}

    setAuthToken(undefined);
    setToken(null);
    setUser(null);

    window.location.href = "/login";
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                 HELPERS                                   */
  /* -------------------------------------------------------------------------- */

  const isAuthenticated = !!token;

  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return (
        !!user &&
        user.role === role
      );
    },
    [user]
  );

  /* -------------------------------------------------------------------------- */
  /*                                 PROVIDER                                  */
  /* -------------------------------------------------------------------------- */

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};