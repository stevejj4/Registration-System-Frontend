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
import { navigationApi } from "@/api/navigationApi";
import { setAuthToken } from "@/api/client";
import { normalizeRole } from "@/utils/auth";
import type { NavigationItemDTO } from "@/types/navigation";

/* -------------------------------------------------------------------------- */
/*                                 CONTEXT                                    */
/* -------------------------------------------------------------------------- */

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  navigation: NavigationItemDTO[];
  navigationLoading: boolean;

  login: (payload: LoginRequestDTO) => Promise<AuthUser>;
  logout: () => void;
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

  /* -------------------------- STATE -------------------------------------- */

  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [navigation, setNavigation] = useState<NavigationItemDTO[]>([]);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const [loading, setLoading] = useState(true);

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

  /* --------------------- HYDRATE AUTH ON START -------------------------- */
  useEffect(() => {
    const hydrate = async () => {
      try {
        const storedUser = localStorage.getItem("auth_user");
        const storedToken = localStorage.getItem("auth_token");

        if (storedUser) {
          const parsed = JSON.parse(storedUser) as AuthUser;
          setUser({
            ...parsed,
            permissions: parsed.permissions ?? [],
          });
        }

        if (storedToken) {
          setToken(storedToken);
          setAuthToken(storedToken);
          await loadNavigation();
        }
      } catch (err) {
        console.error("Auth hydration failed:", err);
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_token");
      } finally {
        setLoading(false);
      }
    };

    void hydrate();
  }, [loadNavigation]);

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
      permissions: res.permissions ?? [],
    };

    setUser(resolvedUser);
    setToken(res.token);
    await loadNavigation();
    return resolvedUser;
  }, [loadNavigation]);

  /* ---------------------------- LOGOUT ----------------------------------- */
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setNavigation([]);

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

  /* ---------------------------- CONTEXT ---------------------------------- */
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