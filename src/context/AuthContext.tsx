/**
 * @fileoverview React authentication context and provider for the application shell.
 *
 * **Purpose:** Owns authenticated user identity, ephemeral access tokens, dynamic
 * navigation menu state, and role/permission helpers consumed by route guards and
 * layout components via `useAuth()`.
 *
 * **Architectural dependencies:**
 * - Delegates HTTP calls to `authApi` (login/logout) and `navigationApi` (sidebar).
 * - Synchronizes in-memory credentials through `setAccessToken`, `refreshAccessToken`,
 *   and `registerAuthLifecycleHandlers` from `src/api/client.ts`.
 * - Persists only non-sensitive profile metadata (`auth_user`) to `localStorage`;
 *   JWT strings remain volatile in React state and the Axios client module.
 * - Interacts with Spring Boot `/api/auth/login`, `/api/auth/refresh`, and
 *   `/api/auth/logout` indirectly through the API layer.
 *
 * **Lifecycle handling:** On mount, hydrates profile metadata from storage, silently
 * refreshes the access token via HttpOnly cookies, gates navigation loading until
 * `isAuthenticated` is true, and tears down state when logout or interceptor-driven
 * session expiry occurs.
 */

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
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

/** `localStorage` key for non-sensitive persisted user profile metadata. */
const AUTH_USER_KEY = "auth_user";

/* -------------------------------------------------------------------------- */
/*                                 CONTEXT                                    */
/* -------------------------------------------------------------------------- */

/**
 * Public contract exposed to consumers through `useAuth()`.
 */
interface AuthContextType {
  /** Authenticated user profile, or `null` when logged out. */
  user: AuthUser | null;
  /** Ephemeral JWT held in React state (mirrored to `client.ts`). */
  token: string | null;
  /** Role-scoped sidebar links from `GET /api/v1/me/navigation`. */
  navigation: NavigationItemDTO[];
  /** `true` while a navigation payload request is in flight. */
  navigationLoading: boolean;

  /** Authenticates credentials and establishes an in-memory session. */
  login: (payload: LoginRequestDTO) => Promise<AuthUser>;
  /** Invalidates the server session and clears local auth state. */
  logout: () => Promise<void>;
  /** Re-fetches navigation when the session is authenticated. */
  refreshNavigation: () => Promise<void>;

  /** `true` when both `user` and `token` are present. */
  isAuthenticated: boolean;
  /** Checks whether the active user holds a specific role. */
  hasRole: (role: UserRole) => boolean;
  /** Checks whether the active user holds a PBAC permission string. */
  hasPermission: (permission: string) => boolean;

  /** `true` until initial hydration (silent refresh) completes on startup. */
  loading: boolean;
}

/**
 * @summary React context carrying authentication and navigation state for the app tree.
 */
export const AuthContext =
  createContext<AuthContextType | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*                              PROVIDER                                      */
/* -------------------------------------------------------------------------- */

/**
 * @summary Supplies authentication state, session actions, and navigation data to descendants.
 * @param props.children - Application routes and layout components requiring auth awareness.
 * @returns JSX wrapping `AuthContext.Provider`.
 */
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [navigation, setNavigation] = useState<NavigationItemDTO[]>([]);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  /** Monotonic id used to ignore stale navigation responses after logout. */
  const navigationRequestIdRef = useRef(0);

  /**
   * @summary Clears React auth state, navigation, storage metadata, and the memory token.
   * @returns void
   */
  const clearLocalSession = useCallback(() => {
    setUser(null);
    setToken(null);
    setNavigation([]);
    localStorage.removeItem(AUTH_USER_KEY);
    setAccessToken(null);
    navigationRequestIdRef.current += 1;
  }, []);

  /**
   * @summary Fetches role-scoped sidebar links once the session is authenticated.
   * @returns Promise that resolves when navigation state has been updated.
   * @throws Does not throw; failures are logged and navigation is reset to `[]`.
   */
  const loadNavigation = useCallback(async () => {
    const requestId = navigationRequestIdRef.current + 1;
    navigationRequestIdRef.current = requestId;
    setNavigationLoading(true);

    try {
      const items = await navigationApi.getNavigation();

      if (navigationRequestIdRef.current === requestId) {
        setNavigation(items);
      }
    } catch (err) {
      console.error("Navigation load failed:", err);

      if (navigationRequestIdRef.current === requestId) {
        setNavigation([]);
      }
    } finally {
      if (navigationRequestIdRef.current === requestId) {
        setNavigationLoading(false);
      }
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
  }, [clearLocalSession]);

  const isAuthenticated = useMemo(() => {
    return !!token && !!user;
  }, [token, user]);

  useEffect(() => {
    if (loading || !isAuthenticated) {
      return;
    }

    void loadNavigation();
  }, [loading, isAuthenticated, loadNavigation]);

  /**
   * @summary Authenticates against `/api/auth/login` and establishes local session state.
   * @param payload - Email/password credentials submitted from the login form.
   * @returns Resolved `AuthUser` profile for the authenticated account.
   * @throws {Error} When the server returns an unrecognized role or login fails.
   */
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

      setAccessToken(res.token);
      setUser(resolvedUser);
      setToken(res.token);
      return resolvedUser;
    },
    []
  );

  /**
   * @summary Ends the session via `/api/auth/logout` and purges all local auth artifacts.
   * @returns Promise that resolves after cleanup and redirect to `/login`.
   * @throws Does not throw; logout API failures still trigger local session purge.
   */
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

  /**
   * @summary Determines whether the active user matches a required role.
   * @param role - Role enum value to compare against `user.role`.
   * @returns `true` when the signed-in user holds the role.
   */
  const hasRole = useCallback(
    (role: UserRole) => {
      return user?.role === role;
    },
    [user]
  );

  /**
   * @summary Determines whether the active user holds a PBAC permission string.
   * @param permission - Permission identifier returned by the auth API.
   * @returns `true` when the permission is present on the user profile.
   */
  const hasPermission = useCallback(
    (permission: string) => {
      return user?.permissions?.includes(permission) ?? false;
    },
    [user]
  );

  /**
   * @summary Manually reloads sidebar navigation for an authenticated session.
   * @returns Promise that resolves when `loadNavigation` completes.
   */
  const refreshNavigation = useCallback(async () => {
    if (isAuthenticated) {
      await loadNavigation();
    }
  }, [isAuthenticated, loadNavigation]);

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
