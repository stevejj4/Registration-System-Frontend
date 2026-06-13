import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { getAccessToken, setAccessToken, apiClient } from "@/api/client";
import { navigationApi } from "@/api/navigationApi";
import { API_BASE, mockAuthUser, mockLoginResponse } from "@/testing/mocks/handlers";
import { server } from "@/testing/mocks/server";

const AUTH_USER_KEY = "auth_user";

function AuthProbe() {
  const auth = useAuth();

  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="user-email">{auth.user?.email ?? ""}</span>
      <span data-testid="token">{auth.token ?? ""}</span>
      <span data-testid="navigation-count">{auth.navigation.length}</span>
      <button
        type="button"
        data-testid="login-btn"
        onClick={() =>
          void auth.login({
            email: "admin@example.com",
            password: "password123",
          })
        }
      >
        Login
      </button>
      <button type="button" data-testid="logout-btn" onClick={() => void auth.logout()}>
        Logout
      </button>
    </div>
  );
}

function renderAuthProvider() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>
  );
}

describe("AuthContext cookie auth flow", () => {
  const locationReplace = vi.fn();

  beforeEach(() => {
    setAccessToken(null);
    localStorage.clear();

    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...window.location,
        replace: locationReplace,
        href: "http://localhost:5173/",
      },
    });
  });

  afterEach(() => {
    setAccessToken(null);
    locationReplace.mockClear();
  });

  it("successful login populates user state, persists profile metadata, and sets memory token", async () => {
    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    await act(async () => {
      screen.getByTestId("login-btn").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    });

    expect(screen.getByTestId("user-email")).toHaveTextContent(mockAuthUser.email);
    expect(screen.getByTestId("token")).toHaveTextContent(mockLoginResponse.token);
    expect(getAccessToken()).toBe(mockLoginResponse.token);

    const storedProfile = JSON.parse(
      localStorage.getItem(AUTH_USER_KEY) ?? "{}"
    ) as typeof mockAuthUser;

    expect(storedProfile.email).toBe(mockAuthUser.email);
    expect(storedProfile.fullName).toBe(mockAuthUser.fullName);
    expect(storedProfile.role).toBe("ADMIN");
    expect(storedProfile).not.toHaveProperty("token");

    await waitFor(() => {
      expect(screen.getByTestId("navigation-count")).toHaveTextContent("2");
    });
  });

  it("silent hydration refreshes token when profile metadata exists in storage", async () => {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(mockAuthUser));

    let refreshCallCount = 0;

    server.use(
      http.post(`${API_BASE}/auth/refresh`, () => {
        refreshCallCount += 1;
        return HttpResponse.json({ token: "hydrated-access-token" });
      })
    );

    renderAuthProvider();

    expect(screen.getByTestId("loading")).toHaveTextContent("true");

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(refreshCallCount).toBe(1);
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("token")).toHaveTextContent("hydrated-access-token");
    expect(getAccessToken()).toBe("hydrated-access-token");
    expect(localStorage.getItem(AUTH_USER_KEY)).not.toBeNull();
  });

  it("logout triggers POST /auth/logout, clears local profile, and resets memory token", async () => {
    let logoutCallCount = 0;

    server.use(
      http.post(`${API_BASE}/auth/logout`, () => {
        logoutCallCount += 1;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    await act(async () => {
      screen.getByTestId("login-btn").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    });

    await act(async () => {
      screen.getByTestId("logout-btn").click();
    });

    await waitFor(() => {
      expect(logoutCallCount).toBe(1);
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("token")).toHaveTextContent("");
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull();
    expect(locationReplace).toHaveBeenCalledWith("/login");
  });

  it("401 interception refreshes once, queues concurrent calls, and retries successfully", async () => {
    let refreshCallCount = 0;
    let navigationCallCount = 0;

    server.use(
      http.post(`${API_BASE}/auth/refresh`, () => {
        refreshCallCount += 1;
        return HttpResponse.json({ token: "fresh-access-token" });
      }),
      http.get(`${API_BASE}/v1/me/navigation`, ({ request }) => {
        navigationCallCount += 1;
        const authorization = request.headers.get("Authorization");

        if (authorization === "Bearer expired-access-token") {
          return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        return HttpResponse.json([
          { title: "Members", icon: "clipboard-list", route: "/members" },
        ]);
      })
    );

    setAccessToken("expired-access-token");

    const [first, second] = await Promise.all([
      navigationApi.getNavigation(),
      navigationApi.getNavigation(),
    ]);

    expect(refreshCallCount).toBe(1);
    expect(navigationCallCount).toBeGreaterThanOrEqual(3);
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(getAccessToken()).toBe("fresh-access-token");
  });

  it("axios interceptor retries the original request after refresh", async () => {
    let refreshCallCount = 0;
    let protectedCallCount = 0;

    server.use(
      http.post(`${API_BASE}/auth/refresh`, () => {
        refreshCallCount += 1;
        return HttpResponse.json({ token: "retry-access-token" });
      }),
      http.get(`${API_BASE}/v1/me/navigation`, ({ request }) => {
        protectedCallCount += 1;
        const authorization = request.headers.get("Authorization");

        if (authorization === "Bearer stale-token") {
          return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        return HttpResponse.json([{ title: "Dashboard", icon: "layout-dashboard", route: "/dashboard" }]);
      })
    );

    setAccessToken("stale-token");

    const response = await apiClient.get("/v1/me/navigation");

    expect(refreshCallCount).toBe(1);
    expect(protectedCallCount).toBe(2);
    expect(response.status).toBe(200);
    expect(response.data).toEqual([
      { title: "Dashboard", icon: "layout-dashboard", route: "/dashboard" },
    ]);
    expect(getAccessToken()).toBe("retry-access-token");
  });
});
