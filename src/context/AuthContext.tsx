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

import { login as apiLogin, logout as apiLogout } from "@/api/authApi";
import { navigationApi } from "@/api/navigationApi";
import {
  setAccessToken,
  registerAuthLifecycleHandlers,
  refreshAccessToken,
} from "@/api/client";
import { normalizeRole } from "@/utils/auth";
import type { NavigationItemDTO } from "@/types/navigation";

const AUTH_USER_KEY = "auth_user";

/* -------------------------------------------------------------------------- */
/*                                 CONTEXT                                    */
/* -------------------------------------------------------------------------- */

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  navigation: NavigationItemDTO[];
  navigationLoading: boolean;

  login: (payload: LoginRequestDTO) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshNavigation: () => Promise<void>;

  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;

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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [navigation, setNavigation] = useState<NavigationItemDTO[]>([]);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const clearLocalSession = useCallback(() => {
    setUser(null);
    setToken(null);
    setNavigation([]);
    localStorage.removeItem(AUTH_USER_KEY);
    setAccessToken(null);
  }, []);

  const loadNavigation = useCallback(async () => {
    setNavigationLoading(true);
    try {
      const items = await navigationApi.getNavigation();
      setNavigation(items);
    } catch (err) {
      console.error("Navigation load failed:", err);
      setNavigation([]);
    } finally {
      setNavigationLoading(false);
    }
  }, []);

  useEffect(() => {
    registerAuthLifecycleHandlers({
      onTokenRefreshed: (newToken) => {
        setToken(newToken);
      },
      onSessionExpired: () => {
        clearLocalSession();
        window.location.replace("/login");
      },
    });
  }, [clearLocalSession]);

  useEffect(() => {
    setAccessToken(token);
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const storedUser = localStorage.getItem(AUTH_USER_KEY);

        if (!storedUser) {
          return;
        }

        const parsed = JSON.parse(storedUser) as AuthUser;
        setUser({
          ...parsed,
          permissions: parsed.permissions ?? [],
        });

        try {
          const refreshedToken = await refreshAccessToken();
          setToken(refreshedToken);
          await loadNavigation();
        } catch {
          clearLocalSession();
        }
      } catch (err) {
        console.error("Auth hydration failed:", err);
        clearLocalSession();
      } finally {
        setLoading(false);
      }
    };

    void hydrate();
  }, [clearLocalSession, loadNavigation]);

  const login = useCallback(
    async (payload: LoginRequestDTO): Promise<AuthUser> => {
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
        permissions: res.permissions ?? [],
      };

      setUser(resolvedUser);
      setToken(res.token);
      await loadNavigation();
      return resolvedUser;
    },
    [loadNavigation]
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      clearLocalSession();
      window.location.replace("/login");
    }
  }, [clearLocalSession]);

  const isAuthenticated = useMemo(() => {
    return !!token && !!user;
  }, [token, user]);

  const hasRole = useCallback(
    (role: UserRole) => {
      return user?.role === role;
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission: string) => {
      return user?.permissions?.includes(permission) ?? false;
    },
    [user]
  );

  const refreshNavigation = useCallback(async () => {
    if (token) {
      await loadNavigation();
    }
  }, [token, loadNavigation]);

  const value = useMemo(
    () => ({
      user,
      token,
      navigation,
      navigationLoading,
      login,
      logout,
      refreshNavigation,
      isAuthenticated,
      hasRole,
      hasPermission,
      loading,
    }),
    [
      user,
      token,
      navigation,
      navigationLoading,
      login,
      logout,
      refreshNavigation,
      isAuthenticated,
      hasRole,
      hasPermission,
      loading,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
