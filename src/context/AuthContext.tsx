import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
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

/* -------------------------------------------------------------------------- */
/*                                 CONTEXT                                    */
/* -------------------------------------------------------------------------- */

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;

  login: (payload: LoginRequestDTO) => Promise<AuthUser>;
  logout: () => void;

  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;

  loading: boolean;
}

export const AuthContext =
  createContext<AuthContextType | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*                              PROVIDER                                      */
/* -------------------------------------------------------------------------- */

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {

  /* -------------------------- STATE -------------------------------------- */

  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* --------------------- HYDRATE AUTH ON START -------------------------- */
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("auth_user");
      const storedToken = localStorage.getItem("auth_token");

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      if (storedToken) {
        setToken(storedToken);
        setAuthToken(storedToken);
      }
    } catch (err) {
      console.error("Auth hydration failed:", err);
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_token");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ------------------------ TOKEN SYNC ----------------------------------- */
  useEffect(() => {
    if (token) {
      localStorage.setItem("auth_token", token);
      setAuthToken(token);
    } else {
      localStorage.removeItem("auth_token");
      setAuthToken(undefined);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("auth_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("auth_user");
    }
  }, [user]);

  /* ---------------------------- LOGIN ------------------------------------ */
  const login = useCallback(async (payload: LoginRequestDTO): Promise<AuthUser> => {
    const res: AuthResponseDTO = await apiLogin(payload);

    const normalizedRole = normalizeRole(res.role);

    if (!normalizedRole) {
      throw new Error("Invalid role from server");
    }

    const resolvedUser: AuthUser = {
      id: res.id,
      email: res.email,
      fullName: res.fullName,
      role: normalizedRole,
    };

    setUser(resolvedUser);
    setToken(res.token);
    return resolvedUser;
  }, []);

  /* ---------------------------- LOGOUT ----------------------------------- */
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");

    setAuthToken(undefined);

    // SPA-safe redirect
    window.location.replace("/login");
  }, []);

  /* ------------------------- DERIVED STATE ------------------------------ */
  const isAuthenticated = useMemo(() => {
    return !!token && !!user;
  }, [token, user]);

  const hasRole = useCallback(
    (role: UserRole) => {
      return user?.role === role;
    },
    [user]
  );

  /* ---------------------------- CONTEXT ---------------------------------- */
  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      isAuthenticated,
      hasRole,
      loading,
    }),
    [user, token, login, logout, isAuthenticated, hasRole, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};